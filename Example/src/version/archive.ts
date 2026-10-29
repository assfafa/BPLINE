import VersionMenu from "./Menu.ts";
import { IsVersion } from "./navigation.ts";

/** @example observer.observe(document.body, { childList: true, subtree: true }); @returns Attach a selector once the historical React header exists. */
const MountArchiveMenu = (): void => {
    const version = document.querySelector<HTMLMetaElement>("meta[name=\"bplinejs-version\"]")?.content;
    const matrixVersion = document.querySelector<HTMLMetaElement>("meta[name=\"bpmatrixjs-version\"]")?.content;
    const navigation = document.querySelector<HTMLElement>("header nav");
    // Historical JavaScript remains untouched; only its existing header receives an extra control.
    if (navigation && IsVersion(version) && IsVersion(matrixVersion)) {
        const host = document.createElement("div");
        navigation.insertBefore(host, navigation.lastElementChild);
        new VersionMenu(host, { version, matrixVersion, development: false, label: "版本 / Version", error: "无法加载此版本 / Unable to load this version" });
        observer.disconnect();
    }
};

const observer = new MutationObserver(MountArchiveMenu);
observer.observe(document.body, { childList: true, subtree: true });
MountArchiveMenu();
