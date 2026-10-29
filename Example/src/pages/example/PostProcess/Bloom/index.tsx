import type { JSX } from "react";
import ExamplePage from "../../reference/ExamplePage.tsx";
import ShapePreview from "../../reference/ShapePreview.tsx";
import { shortCode, fullCode } from "./config.ts";
import { mountScene } from "./scene.ts";

/** @param props Preview mode. @example <Preview advanced /> @returns A mounted Bloom preview. */
const Preview = ({ advanced }: { advanced: boolean }): JSX.Element => {
    return <ShapePreview advanced={advanced} controlsId="post-bloom-controls" mountScene={mountScene} />;
};

/** @example <Page /> @returns Complete standalone examples and live Bloom previews. */
const Page = (): JSX.Element => {
    return <ExamplePage title="Bloom" shortCode={shortCode} fullCode={fullCode} Preview={Preview} />;
};

export default Page;
