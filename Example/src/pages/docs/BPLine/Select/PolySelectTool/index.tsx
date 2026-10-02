import ReferencePage from "@/pages/docs/reference/index.tsx";
import { polyConfig } from "../toolConfigs.tsx";

/** @example <PolySelectToolPage /> @returns PolySelectTool API reference. */
const PolySelectToolPage = () => {
    return <ReferencePage config={polyConfig} />;
};

export default PolySelectToolPage;
