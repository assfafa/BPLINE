//#region src/version/navigation.ts
var e = (e) => typeof e == "string" && /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(e), t = (e, t) => {
	let n = new URL(".", e);
	return n.pathname.endsWith(`/${t}/`) ? new URL("../", n) : n;
}, n = async (t, n) => {
	let r = await fetch(new URL("versions.json", t), {
		cache: "no-cache",
		signal: n
	});
	if (r.ok) {
		let t = await r.json();
		if (typeof t == "object" && t) {
			let n = t;
			if (e(n.latest) && Array.isArray(n.versions)) {
				let t = [];
				for (let r of n.versions) if (typeof r == "object" && r) {
					let n = r;
					e(n.version) && e(n.matrixVersion) && t.push({
						version: n.version,
						matrixVersion: n.matrixVersion
					});
				}
				if (t.some((e) => e.version === n.latest)) return {
					latest: n.latest,
					versions: t
				};
			}
		}
		throw TypeError("Invalid site version registry.");
	}
	throw Error("Unable to load site versions.");
}, r = async (t, n, r, i) => {
	if (e(n)) {
		let e = new URL(`${n}/`, t), a = await fetch(new URL("site.json", e), { signal: i });
		if (a.ok) {
			let t = await a.json();
			if (typeof t == "object" && t) {
				let i = t;
				if (i.version === n && Array.isArray(i.routes)) {
					let t = r.hash.slice(1), n = t.split(/[?]/, 1)[0];
					return e.search = r.search, e.hash = i.routes.includes(n) ? t : n.startsWith("/example") ? "/example/basic-mesh/rectangle" : "/docs/bpline", e;
				}
			}
		}
		throw Error("Unable to load the selected site version.");
	}
	throw TypeError("Invalid site version.");
};
//#endregion
export { r as i, n, t as r, e as t };
