import ReferencePage from "@/pages/docs/reference/index.tsx";
import { ngonConfig } from "../toolConfigs.tsx";

/** @example <NGonSelectToolPage /> @returns NGonSelectTool API reference. */
const NGonSelectToolPage = () => {
    return <ReferencePage config={ngonConfig} />;
};

export default NGonSelectToolPage;
