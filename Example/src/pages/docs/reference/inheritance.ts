import type { ReferenceLink } from "./types.ts";

interface PublicClass {
    label: string;
    path: string;
    parent?: string;
}

export interface ClassRelations {
    parent?: ReferenceLink;
    children: ReferenceLink[];
}

/** Public class inheritance within the documented BPLineJS API. */
const publicClasses: readonly PublicClass[] = [
    { label: "ObjectNode", path: "/docs/bpline/object" },
    { label: "Camera", path: "/docs/bpline/camera", parent: "/docs/bpline/object" },
    { label: "Group", path: "/docs/bpline/group", parent: "/docs/bpline/object" },
    { label: "Mesh", path: "/docs/bpline/mesh", parent: "/docs/bpline/group" },
    { label: "IMesh", path: "/docs/bpline/imesh", parent: "/docs/bpline/mesh" },
    { label: "Scene", path: "/docs/bpline/scene", parent: "/docs/bpline/group" },
    { label: "Geo", path: "/docs/bpline/geometry" },
    { label: "Base2D", path: "/docs/bpline/geometry/base2d", parent: "/docs/bpline/geometry" },
    { label: "Rect2D", path: "/docs/bpline/geometry/rect2d", parent: "/docs/bpline/geometry" },
    { label: "Poly2D", path: "/docs/bpline/geometry/poly2d", parent: "/docs/bpline/geometry" },
    { label: "NGon2D", path: "/docs/bpline/geometry/ngon2d", parent: "/docs/bpline/geometry" },
    { label: "Text", path: "/docs/bpline/geometry/text", parent: "/docs/bpline/geometry" },
    { label: "Material", path: "/docs/bpline/material" },
    { label: "BaseMaterial", path: "/docs/bpline/material/base-material", parent: "/docs/bpline/material" },
    { label: "CompositeMaterial", path: "/docs/bpline/material/composite-material", parent: "/docs/bpline/material" },
    { label: "WGSLMaterial", path: "/docs/bpline/material/wgsl-material", parent: "/docs/bpline/material" },
];

/**
 * Find documented base and derived classes for a route.
 * @param path Current documentation route.
 * @example
 * getClassRelations("/docs/bpline/mesh");
 * @returns Linked inheritance relations, or undefined for unrelated pages.
 */
export const getClassRelations = (path: string): ClassRelations | undefined => {
    let current: PublicClass | undefined;
    let parent: ReferenceLink | undefined;
    const children: ReferenceLink[] = [];

    // Find the current public class before resolving links to its relatives.
    for (const item of publicClasses) {
        // Match this route to its public class entry.
        if (item.path === path) {
            current = item;
        }
    }

    if (current) {
        // The parent link points to a documented class, not an internal helper.
        if (current.parent) {
            // Look up the parent label from its documented route.
            for (const item of publicClasses) {
                // Only the declared base class supplies the parent link.
                if (item.path === current.parent) {
                    parent = { label: item.label, to: item.path };
                }
            }
        }

        // Derive child links from the same parent declarations to keep both directions in sync.
        for (const item of publicClasses) {
            // Link only direct subclasses of the current class.
            if (item.parent === path) {
                children.push({ label: item.label, to: item.path });
            }
        }

        // Omit the section when no documented inheritance edge exists.
        if (parent || children.length > 0) {
            return { parent, children };
        }
    }

    return undefined;
};
