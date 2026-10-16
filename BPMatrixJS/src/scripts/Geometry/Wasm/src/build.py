"""Fetch verified MIT sources into the WSL bind mount and build the text WASM module."""
import hashlib
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tarfile
import urllib.request

directory = Path(__file__).resolve().parent
text_directory = directory / "text"
output_directory = directory.parent / "build/text"
output_directory.mkdir(parents=True, exist_ok=True)
package = directory.parents[4]
repository = package.parent
cache = repository / ".local/wasm-text"
cache.mkdir(parents=True, exist_ok=True)
dependencies = [
    ("harfbuzz", "harfbuzz/harfbuzz", "14.6.0", "eca8581e5ad8e21dbda31556c0363f764b1a754c9c1bb33ca7cd56ca1c07ddc9"),
    ("woff2", "google/woff2", "v1.0.2", "add272bb09e6384a4833ffca4896350fdb16e0ca22df68c0384773c67a175594"),
    ("brotli", "google/brotli", "v1.2.0", "816c96e8e8f193b40151dad7e8ff37b1221d019dbcb9c35cd3fadbfe6477dfec"),
    ("miniz", "richgel999/miniz", "3.1.2", "98468f8924934b723276680f85238b6c78bf1f8b49b4459cc9b7214a20e2e9fb"),
]

for name, repo, tag, checksum in dependencies:
    archive = cache / (name + ".tar.gz")
    # Retry an interrupted download without ever trusting an unverified archive.
    if not archive.exists() or hashlib.sha256(archive.read_bytes()).hexdigest() != checksum:
        temporary = archive.with_suffix(".download")
        urllib.request.urlretrieve("https://codeload.github.com/" + repo + "/tar.gz/refs/tags/" + tag, temporary)
        if hashlib.sha256(temporary.read_bytes()).hexdigest() == checksum:
            temporary.replace(archive)
        else:
            raise RuntimeError("Dependency checksum mismatch: " + name)
    source = cache / (name + "-" + tag.removeprefix("v"))
    if not source.is_dir():
        with tarfile.open(archive) as contents:
            contents.extractall(cache, filter="data")

if shutil.which("emcmake") is None:
    raise RuntimeError("Emscripten is required. Install the Dockerfile toolchain, then run npm run build:wasm.")

environment = dict(os.environ)
# Object files live in the bind mount; Debian's frozen system-library cache stays read-only.
object_directory = cache / "text-objects"
subprocess.run(["emcmake", "cmake", "-S", str(text_directory), "-B", str(object_directory), "-G", "Ninja",
    "-DCMAKE_BUILD_TYPE=Release", "-DDEPENDENCIES=" + str(cache), "-DOUTPUT=" + str(output_directory)],
    check=True, env=environment)
subprocess.run(["cmake", "--build", str(object_directory), "--parallel", "2"], check=True, env=environment)

# Public ESM imports keep their matching binary and attribution next to the generated loader.
if "--clean-lib" in sys.argv:
    library = package / "lib"
    # Only the fixed generated package output is removed, after native compilation succeeds.
    if library.is_dir() and library.resolve().parent == package.resolve():
        shutil.rmtree(library)
target = package / "lib/Geometry/Wasm/build/text"
target.mkdir(parents=True, exist_ok=True)
for name in ["TextWasm.js", "TextWasm.wasm", "TextWasm.d.ts"]:
    if name == "TextWasm.d.ts":
        shutil.copyfile(text_directory / "Module.d.ts", output_directory / name)
    shutil.copyfile(output_directory / name, target / name)
shutil.copyfile(directory.parent / "LICENSE", target.parent.parent / "LICENSE")
print("Text WASM built and copied to lib/Geometry/Wasm/build/text.")
