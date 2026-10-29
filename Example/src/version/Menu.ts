import { LoadVersions, SiteRoot, VersionURL } from "./navigation.ts";
import type { SiteVersion } from "./navigation.ts";

/** A small native version selector shared by the current React site and restored snapshots. */
export default class VersionMenu {
    private readonly _host: HTMLElement;
    private readonly _options: VersionMenuOptions;
    private readonly _controller = new AbortController();
    private readonly _select: HTMLSelectElement = document.createElement("select");
    private readonly _message: HTMLSpanElement = document.createElement("span");
    private readonly _root: URL;
    private _alive: boolean = true;

    /** @param host Empty selector slot. @param options Version and translated labels. @example new VersionMenu(host, options); @returns A selector that navigates between independent static sites. */
    public constructor(host: HTMLElement, options: VersionMenuOptions) {
        this._host = host;
        this._options = options;
        this._root = SiteRoot(new URL(window.location.href), options.version);
        this._select.setAttribute("aria-label", options.label);
        this._select.style.cssText = "width:clamp(70px,14vw,140px);height:30px;padding:0 5px;border:1px solid var(--border,#888);border-radius:5px;background:var(--background,Canvas);color:inherit;font:inherit;font-size:12px";
        this._message.setAttribute("role", "status");
        this._message.style.cssText = "position:absolute;top:100%;right:0;font-size:12px;background:var(--background,Canvas);color:inherit";
        this._host.style.cssText = "position:relative;display:flex;align-items:center;margin:0 6px";
        this.setVersions([{ version: options.version, matrixVersion: options.matrixVersion }]);
        this._host.append(this._select, this._message);
        this._select.addEventListener("change", this.handleChange);
        // Development shows the locally installed version; snapshots are served by the production preview.
        if (options.development === false) {
            void this.load();
        }
    }

    /** @param versions Registered snapshots in descending order. @example this.setVersions(versions); @returns No value; retain the active snapshot as selected. */
    private setVersions(versions: SiteVersion[]): void {
        this._select.replaceChildren();
        // Every version is one option regardless of how many pages or packages it contains.
        for (const item of versions) {
            const option = document.createElement("option");
            option.value = item.version;
            option.textContent = item.version;
            option.title = `bplinejs@${item.version} / bpmatrixjs@${item.matrixVersion}`;
            option.selected = item.version === this._options.version;
            this._select.append(option);
        }
    }

    /** @example await this.load(); @returns No value; read the shared registry without rebuilding archived sites. */
    private async load(): Promise<void> {
        try {
            const registry = await LoadVersions(this._root, this._controller.signal);
            // Late fetches must not repopulate an unmounted React slot.
            if (this._alive) {
                this.setVersions(registry.versions);
            }
        } catch {
            // A temporarily unavailable registry still leaves the current version visible.
            this._select.value = this._options.version;
        }
    }

    /** @example select.addEventListener("change", this.handleChange); @returns No value; run asynchronous route validation. */
    private readonly handleChange = (): void => {
        void this.navigate();
    };

    /** @example await this.navigate(); @returns No value; navigate only after the selected snapshot is available. */
    private async navigate(): Promise<void> {
        const version = this._select.value;
        // Selecting the current entry does not reload the scene or discard editor state.
        if (version !== this._options.version) {
            this._select.disabled = true;
            this._message.textContent = "";
            try {
                const destination = await VersionURL(this._root, version, new URL(window.location.href), this._controller.signal);
                // Destroy can happen while checking an archived version's route list.
                if (this._alive) {
                    window.location.assign(destination.href);
                }
            } catch {
                // Failed navigation restores the active option and reports a translated status.
                if (this._alive) {
                    this._select.value = this._options.version;
                    this._select.disabled = false;
                    this._message.textContent = this._options.error;
                }
            }
        }
    }

    /** @example menu.destroy(); @returns No value; cancel pending requests and detach the selector. */
    public destroy(): void {
        this._alive = false;
        this._controller.abort();
        this._select.removeEventListener("change", this.handleChange);
        this._host.replaceChildren();
    }
}

export interface VersionMenuOptions {
    version: string;
    matrixVersion: string;
    label: string;
    error: string;
    development: boolean;
}
