import type { JSX } from "react";
import ReferencePage from "@/pages/docs/reference/index.tsx";
import { config } from "./config.tsx";

/**
 * Show the BPMatrixJS font geometry API.
 * @example
 * <MatrixTextPage />
 * @returns Translated text reference page.
 */
const MatrixTextPage = (): JSX.Element => {
    return <ReferencePage config={config} />;
};

export default MatrixTextPage;
