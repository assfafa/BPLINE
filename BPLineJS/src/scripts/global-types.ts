import type { ObjectNodeLike } from "./Object/index";
import type { Rect2dLike } from "./Geometry/Rect2d";
import type { Poly2DLike } from "./Geometry/Poly2D";
import type { BaseMaterialLike } from "./Material/baseMaterial";

type AddObject = ObjectNodeLike;

type Geometry2d = Rect2dLike | Poly2DLike;

type Material2d = BaseMaterialLike;

export type { AddObject, Geometry2d, Material2d };
