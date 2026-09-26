import { useEffect, useState } from "react";
import type { JSX } from "react";
import ShikiHighlighter, {
    createHighlighterCore,
    createJavaScriptRegexEngine,
} from "react-shiki/core";
import { useTheme } from "@/theme/context.ts";

interface CodeBlockProps {
    code: string;
}

const highlighterPromise = createHighlighterCore({
    themes: [
        import("@shikijs/themes/github-light"),
        import("@shikijs/themes/github-dark"),
    ],
    langs: [import("@shikijs/langs/typescript")],
    engine: createJavaScriptRegexEngine({ forgiving: true }),
});

type CodeHighlighter = Awaited<typeof highlighterPromise>;

/**
 * Highlight TypeScript examples with only the grammars and themes used here.
 * @param props Source code to display.
 * @example
 * <CodeBlock code={source} />
 * @returns Scrollable highlighted code block.
 */
const CodeBlock = ({ code }: CodeBlockProps): JSX.Element => {
    const { theme } = useTheme();
    const [highlighter, setHighlighter] = useState<CodeHighlighter | null>(null);
    let highlightTheme = "github-light";
    let content: JSX.Element = <pre className="min-h-full p-4"><code>{code.trim()}</code></pre>;

    /**
     * Share the prepared highlighter and ignore resolution after unmount.
     * @example
     * useEffect(attachHighlighter, []);
     * @returns Cleanup for the pending highlighter result.
     */
    const attachHighlighter = (): (() => void) => {
        let mounted = true;

        /**
         * Make the loaded grammar available to this code block.
         * @param loaded Prepared TypeScript highlighter.
         * @example
         * void highlighterPromise.then(useLoadedHighlighter);
         * @returns No value.
         */
        const useLoadedHighlighter = (loaded: CodeHighlighter): void => {
            // Pages may change before the async grammar finishes loading.
            if (mounted) {
                setHighlighter(loaded);
            }
        };

        /**
         * Keep readable plain code if syntax highlighting cannot load.
         * @param error Grammar or theme load failure.
         * @example
         * void highlighterPromise.then(useLoadedHighlighter, reportLoadError);
         * @returns No value.
         */
        const reportLoadError = (error: unknown): void => {
            console.warn("Code highlighting is unavailable.", error);
        };

        void highlighterPromise.then(useLoadedHighlighter, reportLoadError);

        /**
         * Stop updating a code block that has left the route.
         * @example
         * return detachHighlighter;
         * @returns No value.
         */
        const detachHighlighter = (): void => {
            mounted = false;
        };

        return detachHighlighter;
    };

    useEffect(attachHighlighter, []);

    // The code theme must match the page's active scheme.
    if (theme === "dark") {
        highlightTheme = "github-dark";
    }

    // Plain code remains visible until the small grammar bundle is ready.
    if (highlighter) {
        content = (
            <ShikiHighlighter highlighter={highlighter} language="typescript" theme={highlightTheme}>
                {code.trim()}
            </ShikiHighlighter>
        );
    }

    return <div className="min-h-0 flex-1 overflow-auto text-sm [&_pre]:min-h-full [&_pre]:p-4">{content}</div>;
};

export default CodeBlock;
