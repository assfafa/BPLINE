import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router/dom";
import "./tailwind.css";
import { LocaleProvider } from "./locale/provider.tsx";
import { ThemeProvider } from "./theme/provider.tsx";
import { router } from "./router/index.ts";

const container: HTMLElement | null = document.getElementById("root");

// 页面必须提供挂载节点，缺失时明确报错而不是使用非空断言绕过类型检查。
if (container !== null) {
    createRoot(container).render(
        <StrictMode>
            <LocaleProvider>
                <ThemeProvider>
                    <RouterProvider router={router} />
                </ThemeProvider>
            </LocaleProvider>
        </StrictMode>,
    );
} else {
    throw new Error("Missing #root element for the Example application.");
}
