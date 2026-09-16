import type { ObjectNodeLike } from "./Object/index";
import type { Rect2DLike } from "./Geometry/Rect2D";
import type { Poly2DLike } from "./Geometry/Poly2D";
import type { NGon2DLike } from "./Geometry/NGon2D";
import type { BaseMaterialLike } from "./Material/baseMaterial";

type AddObject = ObjectNodeLike;

type Geometry2d = Rect2DLike | Poly2DLike | NGon2DLike;

type Material2d = BaseMaterialLike;

export type { AddObject, Geometry2d, Material2d };
