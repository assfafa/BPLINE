import ReferencePage from "@/pages/docs/reference/index.tsx";
import { baseConfig } from "../toolConfigs.tsx";

/** @example <BaseSelectToolPage /> @returns BaseSelectTool API reference. */
const BaseSelectToolPage = () => {
    return <ReferencePage config={baseConfig} />;
};

export default BaseSelectToolPage;
