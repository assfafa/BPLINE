import ReferencePage from "@/pages/docs/reference/index.tsx";
import { rectConfig } from "../toolConfigs.tsx";

/** @example <RectSelectToolPage /> @returns RectSelectTool API reference. */
const RectSelectToolPage = () => {
    return <ReferencePage config={rectConfig} />;
};

export default RectSelectToolPage;
