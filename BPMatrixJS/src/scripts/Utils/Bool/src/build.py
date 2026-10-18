"""Build the pinned Rust Boolean engine; all toolchain/object caches stay on the WSL mount."""
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tarfile
import urllib.request
import urllib.error

source = Path(__file__).resolve().parent
directory = source.parent
package = source.parents[4]
cache = package.parent / ".local/wasm-bool"
toolchain = cache / "toolchain"
cache.mkdir(parents=True, exist_ok=True)
rust_version = "1.88.0"

# Install only the compiler, Cargo and the two standard libraries, without docs or IDE tools.
if not (toolchain / "lib/rustlib/wasm32-unknown-unknown/lib").is_dir():
    components = [
        "rustc-" + rust_version + "-x86_64-unknown-linux-gnu",
        "cargo-" + rust_version + "-x86_64-unknown-linux-gnu",
        "rust-std-" + rust_version + "-x86_64-unknown-linux-gnu",
        "rust-std-" + rust_version + "-wasm32-unknown-unknown",
    ]
    for component in components:
        archive = cache / (component + ".tar.xz")
        url = "https://static.rust-lang.org/dist/" + archive.name
        checksum = urllib.request.urlopen(url + ".sha256").read().decode().split()[0]
        if not archive.exists() or hashlib.sha256(archive.read_bytes()).hexdigest() != checksum:
            temporary = archive.with_suffix(".download")
            urllib.request.urlretrieve(url, temporary)
            if hashlib.sha256(temporary.read_bytes()).hexdigest() == checksum:
                temporary.replace(archive)
            else:
                raise RuntimeError("Rust checksum mismatch: " + component)
        with tarfile.open(archive) as contents:
            contents.extractall(cache, filter="data")
        subprocess.run(["sh", str(cache / component / "install.sh"),
                        "--prefix=" + str(toolchain), "--disable-ldconfig"], check=True)
        shutil.rmtree(cache / component)

environment = dict(os.environ)
environment["PATH"] = str(toolchain / "bin") + os.pathsep + environment["PATH"]
environment["CARGO_HOME"] = str(cache / "cargo")
environment["CARGO_TARGET_DIR"] = str(cache / "objects")
environment["RUSTFLAGS"] = "-C link-arg=--max-memory=536870912"
command = [str(toolchain / "bin/cargo")]
if "--update-lock" in sys.argv:
    subprocess.run(command + ["generate-lockfile", "--manifest-path", str(source / "Cargo.toml")],
                   check=True, env=environment)
subprocess.run(command + ["build", "--locked", "--release", "--target", "wasm32-unknown-unknown",
                         "--manifest-path", str(source / "Cargo.toml")], check=True, env=environment)

# Check every resolved runtime dependency and retain each complete license in the local LICENSE.
metadata = json.loads(subprocess.check_output(command + ["metadata", "--locked", "--format-version", "1",
    "--manifest-path", str(source / "Cargo.toml")], env=environment))
licenses = ["BPMatrixJS Boolean WASM dependencies\nSelected license: MIT for each crate below.\n"]
for dependency in sorted(metadata["packages"], key=lambda item: item["name"]):
    if dependency["name"] != "bp_bool":
        declared = dependency["license"]
        if declared not in ["MIT", "MIT OR Apache-2.0", "Apache-2.0 OR MIT"]:
            raise RuntimeError("Unexpected dependency license: " + dependency["name"] + " " + str(declared))
        root = Path(dependency["manifest_path"]).parent
        candidates = [root / "LICENSE-MIT", root / "LICENSE", root / "LICENSE.txt"]
        license_file = next((item for item in candidates if item.is_file()), None)
        # Some crate archives omit the workspace-root license; retrieve it from the exact source revision.
        if license_file is None:
            revision = json.loads((root / ".cargo_vcs_info.json").read_text())["git"]["sha1"]
            license_file = cache / (dependency["name"] + "-" + revision + "-LICENSE")
            if not license_file.is_file():
                repo = dependency["repository"].removeprefix("https://github.com/").removesuffix(".git")
                prefix = "https://raw.githubusercontent.com/" + repo + "/" + revision + "/"
                try:
                    urllib.request.urlretrieve(prefix + "LICENSE-MIT", license_file)
                except urllib.error.HTTPError as error:
                    if error.code == 404:
                        urllib.request.urlretrieve(prefix + "LICENSE", license_file)
                    else:
                        raise
        licenses.append("\n" + dependency["name"] + " " + dependency["version"] + "\n" +
                        str(dependency["repository"]) + "\n\n" + license_file.read_text())
(directory / "LICENSE").write_text("\n".join(licenses), encoding="utf-8")

output = directory / "build"
output.mkdir(parents=True, exist_ok=True)
shutil.copyfile(cache / "objects/wasm32-unknown-unknown/release/bp_bool.wasm", output / "BoolWasm.wasm")
digest = hashlib.sha256((output / "BoolWasm.wasm").read_bytes()).hexdigest()
(output / "Version.js").write_text('export const BoolWasmVersion = "' + digest + '";\n', encoding="utf-8")
(output / "Version.d.ts").write_text("export declare const BoolWasmVersion: string;\n", encoding="utf-8")
target = package / "lib/Utils/Bool/build"
target.mkdir(parents=True, exist_ok=True)
for name in ["BoolWasm.wasm", "Version.js", "Version.d.ts"]:
    shutil.copyfile(output / name, target / name)
shutil.copyfile(directory / "LICENSE", target.parent / "LICENSE")
print("Boolean WASM built and copied to lib/Utils/Bool/build.")
