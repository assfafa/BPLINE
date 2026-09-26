export type MenuSection = "docs" | "example";

/**
 * Select the initial menu group for a directly loaded route.
 * @param pathname Current router pathname.
 * @example
 * sectionFromPath("/example/basic-mesh/rectangle");
 * @returns Menu group containing the route.
 */
export const sectionFromPath = (pathname: string): MenuSection => {
    // Only example routes use the example group; every other route starts in docs.
    if (pathname.startsWith("/example")) {
        return "example";
    } else {
        return "docs";
    }
};
