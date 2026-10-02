import { createElement } from "react";
import type { ComponentType } from "react";
import { createHashRouter, Navigate } from "react-router";
import type { RouteObject } from "react-router";
import Menu from "@/menu/index.tsx";
import { useLocale } from "@/locale/context.ts";
import { translator } from "@/locale/index.ts";
import { lineDocumentation, matrixDocumentation } from "@/pages/docs/catalog.ts";
import type { DocumentationItem } from "@/pages/docs/catalog.ts";

interface DocumentationModule {
    default: ComponentType;
}
const documentationPages = import.meta.glob<DocumentationModule>("/src/pages/docs/**/index.tsx");

/**
 * Create a lazy loader for one public documentation page.
 * @param source Source path registered in the documentation catalog.
 * @example
 * loadDocumentationPage("/src/pages/docs/Geometry/index.tsx");
 * @returns React Router route loader.
 */
const loadDocumentationPage = (source: string): (() => Promise<{ Component: ComponentType }>) => {
    /**
     * Import the page only when its route is visited.
     * @example
     * await loadPage();
     * @returns Route component.
     */
    const loadPage = async (): Promise<{ Component: ComponentType }> => {
        const importPage = documentationPages[source];
        const module = await importPage();
        return { Component: module.default };
    };

    return loadPage;
};

/**
 * Convert visible public documentation into hash routes.
 * @param items Documentation items at the current menu level.
 * @example
 * collectDocumentationRoutes(matrixDocumentation);
 * @returns Flat route list, including third-level pages.
 */
const collectDocumentationRoutes = (items: readonly DocumentationItem[]): RouteObject[] => {
    const routes: RouteObject[] = [];

    // Every visible page has one route; category labels have no destination.
    for (const item of items) {
        // A catalog item without a source is a visual category only.
        if (item.path && item.source) {
            routes.push({ path: item.path.slice(1), lazy: loadDocumentationPage(item.source) });
        }

        // Include public children below their second-level category.
        // Nested pages also need independent browser routes.
        if (item.children) {
            routes.push(...collectDocumentationRoutes(item.children));
        }
    }

    return routes;
};

/**
 * Load BPLineJS and the live rectangle previews only for the example route.
 * @example
 * await loadRectanglePage();
 * @returns Rectangle route component.
 */
const loadRectanglePage = async () => {
    const page = await import("@/pages/example/BasicMesh/Rectangle/index.tsx");
    return { Component: page.default };
};

/**
 * Load the Poly2D example only when selected.
 * @example
 * await loadPolygonPage();
 * @returns Polygon route component.
 */
const loadPolygonPage = async () => {
    const page = await import("@/pages/example/BasicMesh/Polygon/index.tsx");
    return { Component: page.default };
};

/**
 * Load the NGon2D example only when selected.
 * @example
 * await loadNGonPage();
 * @returns Regular polygon route component.
 */
const loadNGonPage = async () => {
    const page = await import("@/pages/example/BasicMesh/NGon/index.tsx");
    return { Component: page.default };
};

/**
 * Load the font-backed text example only when selected.
 * @example
 * await loadTextPage();
 * @returns Text route component.
 */
const loadTextPage = async () => {
    const page = await import("@/pages/example/BasicMesh/Text/index.tsx");
    return { Component: page.default };
};

/**
 * Load the custom material example only when selected.
 * @example
 * await loadCustomMaterialPage();
 * @returns Custom material route component.
 */
const loadCustomMaterialPage = async () => {
    const page = await import("@/pages/example/Material/Custom/index.tsx");
    return { Component: page.default };
};

/**
 * Load the instanced mesh example on demand.
 * @example
 * await loadInstancePage();
 * @returns Instanced mesh route component.
 */
const loadInstancePage = async () => {
    const page = await import("@/pages/example/Instancing/IMesh/index.tsx");
    return { Component: page.default };
};

/**
 * Load the texture example on demand.
 * @example
 * await loadTexturePage();
 * @returns Texture route component.
 */
const loadTexturePage = async () => {
    const page = await import("@/pages/example/Texture/Image/index.tsx");
    return { Component: page.default };
};

/**
 * Load the camera control example on demand.
 * @example
 * await loadCameraControlPage();
 * @returns Camera control route component.
 */
const loadCameraControlPage = async () => {
    const page = await import("@/pages/example/Control/CameraControl/index.tsx");
    return { Component: page.default };
};

/**
 * Load the unified selection example on demand.
 * @example
 * await loadSelectPage();
 * @returns Selection route component.
 */
const loadSelectPage = async () => {
    const page = await import("@/pages/example/Select/index.tsx");
    return { Component: page.default };
};

/**
 * Show a translated status while the first lazy route loads.
 * @example
 * <InitialRouteFallback />
 * @returns Initial route loading status.
 */
const InitialRouteFallback = () => {
    const { language } = useLocale();
    const message = translator.translate(language, "menu.loading");

    return createElement(
        "div",
        {
            className: "flex h-dvh items-center justify-center bg-background text-foreground",
            role: "status",
        },
        message,
    );
};

/** Keep all public example routes inside the URL hash for static hosting. */
export const router = createHashRouter([
    {
        path: "/",
        element: createElement(Menu),
        HydrateFallback: InitialRouteFallback,
        children: [
            {
                index: true,
                element: createElement(Navigate, { to: "/docs/math", replace: true }),
            },
            {
                path: "docs",
                element: createElement(Navigate, { to: "/docs/math", replace: true }),
            },
            ...collectDocumentationRoutes(matrixDocumentation),
            ...collectDocumentationRoutes(lineDocumentation),
            {
                path: "docs/bpline/geometry/geo",
                element: createElement(Navigate, { to: "/docs/bpline/geometry", replace: true }),
            },
            {
                path: "docs/bpline/material/material",
                element: createElement(Navigate, { to: "/docs/bpline/material", replace: true }),
            },
            {
                path: "docs/bpline/style/style",
                element: createElement(Navigate, { to: "/docs/bpline/style", replace: true }),
            },
            {
                path: "example",
                element: createElement(Navigate, { to: "/example/basic-mesh/rectangle", replace: true }),
            },
            {
                path: "example/basic-mesh/rectangle",
                lazy: loadRectanglePage,
            },
            {
                path: "example/basic-mesh/polygon",
                lazy: loadPolygonPage,
            },
            {
                path: "example/basic-mesh/ngon",
                lazy: loadNGonPage,
            },
            {
                path: "example/basic-mesh/text",
                lazy: loadTextPage,
            },
            {
                path: "example/material/custom",
                lazy: loadCustomMaterialPage,
            },
            {
                path: "example/instancing/imesh",
                lazy: loadInstancePage,
            },
            {
                path: "example/texture/image",
                lazy: loadTexturePage,
            },
            {
                path: "example/control/camera",
                lazy: loadCameraControlPage,
            },
            {
                path: "example/select",
                lazy: loadSelectPage,
            },
        ],
    },
]);
