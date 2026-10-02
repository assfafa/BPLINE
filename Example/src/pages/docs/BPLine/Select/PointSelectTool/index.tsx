import ReferencePage from "@/pages/docs/reference/index.tsx";
import { pointConfig } from "../toolConfigs.tsx";

/** @example <PointSelectToolPage /> @returns PointSelectTool API reference. */
const PointSelectToolPage = () => {
    return <ReferencePage config={pointConfig} />;
};

export default PointSelectToolPage;
