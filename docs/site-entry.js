import { i as e, n as t } from "./site-navigation.js";
(async () => {
	let n = new URL(window.location.href), r = new URL(".", n);
	try {
		let i = await t(r), a = await e(r, i.latest, n);
		window.location.replace(a.href);
	} catch {
		let e = document.querySelector("a[data-latest]");
		if (e) {
			let t = new URL(e.href);
			n.hash.length > 1 && (t.hash = n.hash), t.search = n.search, window.location.replace(t.href);
		}
	}
})();
//#endregion
