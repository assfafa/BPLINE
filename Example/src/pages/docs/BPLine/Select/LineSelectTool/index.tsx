import ReferencePage from "@/pages/docs/reference/index.tsx";
import { lineConfig } from "../toolConfigs.tsx";

/** @example <LineSelectToolPage /> @returns LineSelectTool API reference. */
const LineSelectToolPage = () => {
    return <ReferencePage config={lineConfig} />;
};

export default LineSelectToolPage;
