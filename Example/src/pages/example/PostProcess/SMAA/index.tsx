import type { JSX } from "react";
import ExamplePage from "../../reference/ExamplePage.tsx";
import ShapePreview from "../../reference/ShapePreview.tsx";
import { shortCode, fullCode } from "./config.ts";
import { mountScene } from "./scene.ts";

/** @param props Preview mode. @example <Preview advanced /> @returns A mounted SMAA preview. */
const Preview = ({ advanced }: { advanced: boolean }): JSX.Element => {
    return <ShapePreview advanced={advanced} controlsId="post-smaa-controls" mountScene={mountScene} />;
};

/** @example <Page /> @returns Complete standalone examples and live SMAA previews. */
const Page = (): JSX.Element => {
    return <ExamplePage title="SMAA" shortCode={shortCode} fullCode={fullCode} Preview={Preview} />;
};

export default Page;
