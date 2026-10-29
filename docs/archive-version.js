import { i as e, n as t, r as n, t as r } from "./site-navigation.js";
//#region src/version/Menu.ts
var i = class {
	_host;
	_options;
	_controller = new AbortController();
	_select = document.createElement("select");
	_message = document.createElement("span");
	_root;
	_alive = !0;
	constructor(e, t) {
		this._host = e, this._options = t, this._root = n(new URL(window.location.href), t.version), this._select.setAttribute("aria-label", t.label), this._select.style.cssText = "width:clamp(70px,14vw,140px);height:30px;padding:0 5px;border:1px solid var(--border,#888);border-radius:5px;background:var(--background,Canvas);color:inherit;font:inherit;font-size:12px", this._message.setAttribute("role", "status"), this._message.style.cssText = "position:absolute;top:100%;right:0;font-size:12px;background:var(--background,Canvas);color:inherit", this._host.style.cssText = "position:relative;display:flex;align-items:center;margin:0 6px", this.setVersions([{
			version: t.version,
			matrixVersion: t.matrixVersion
		}]), this._host.append(this._select, this._message), this._select.addEventListener("change", this.handleChange), t.development === !1 && this.load();
	}
	setVersions(e) {
		this._select.replaceChildren();
		for (let t of e) {
			let e = document.createElement("option");
			e.value = t.version, e.textContent = t.version, e.title = `bplinejs@${t.version} / bpmatrixjs@${t.matrixVersion}`, e.selected = t.version === this._options.version, this._select.append(e);
		}
	}
	async load() {
		try {
			let e = await t(this._root, this._controller.signal);
			this._alive && this.setVersions(e.versions);
		} catch {
			this._select.value = this._options.version;
		}
	}
	handleChange = () => {
		this.navigate();
	};
	async navigate() {
		let t = this._select.value;
		if (t !== this._options.version) {
			this._select.disabled = !0, this._message.textContent = "";
			try {
				let n = await e(this._root, t, new URL(window.location.href), this._controller.signal);
				this._alive && window.location.assign(n.href);
			} catch {
				this._alive && (this._select.value = this._options.version, this._select.disabled = !1, this._message.textContent = this._options.error);
			}
		}
	}
	destroy() {
		this._alive = !1, this._controller.abort(), this._select.removeEventListener("change", this.handleChange), this._host.replaceChildren();
	}
}, a = () => {
	let e = document.querySelector("meta[name=\"bplinejs-version\"]")?.content, t = document.querySelector("meta[name=\"bpmatrixjs-version\"]")?.content, n = document.querySelector("header nav");
	if (n && r(e) && r(t)) {
		let r = document.createElement("div");
		n.insertBefore(r, n.lastElementChild), new i(r, {
			version: e,
			matrixVersion: t,
			development: !1,
			label: "版本 / Version",
			error: "无法加载此版本 / Unable to load this version"
		}), o.disconnect();
	}
}, o = new MutationObserver(a);
o.observe(document.body, {
	childList: !0,
	subtree: !0
}), a();
//#endregion
