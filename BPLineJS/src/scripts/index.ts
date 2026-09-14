/// <reference types="@webgpu/types" preserve="true" />

import Camera from "./Camera";
import Color from "./Color";
import Style from "./Style";
import Geo from "./Geometry/Geo";
import Rect2d from "./Geometry/Rect2d";
import Poly2D from "./Geometry/Poly2D";
import Group from "./Group";
import IMesh from "./IMesh";
import BaseMaterial from "./Material/baseMaterial";
import Material from "./Material/Material";
import Mesh from "./Mesh";
import ObjectNode from "./Object";
import Render from "./Render";
import Scene from "./Scene";
import Raws from "./Raws";
import Texture from "./Texture";
import { GETID } from "./ID";

export {
    BaseMaterial,
    Camera,
    Color,
    Style,
    Geo,
    GETID,
    Group,
    IMesh,
    Material,
    Mesh,
    ObjectNode,
    Rect2d,
    Poly2D,
    Render,
    Scene,
    Raws,
    Texture,
};
export {
    BufferManager,
    DepthManager,
    DevelopmentValidator,
    DestroyManager,
    DrawCallManager,
    InitCamera,
    InitScene,
    MatrixUpdate,
    PipelineManager,
    SamplerManager,
    TextureManager,
} from "./Render";

export type { CameraBuffersLike, CameraLike } from "./Camera";
export type { BorderAlign, GeoBuffersLike, GeoData, GeoPartDataLike, GeometrySubscriber } from "./Geometry/Geo";
export type { Rect2dLike, Rect2dOptions } from "./Geometry/Rect2d";
export type { Poly2DLike, Poly2DOptions } from "./Geometry/Poly2D";
export { JoinStyle } from "./Style";
export type { JoinType } from "./Style";
export type { GroupLike } from "./Group";
export type { BaseMaterialLike } from "./Material/baseMaterial";
export type { MaterialBuffersLike, MaterialChange, MaterialChangeKind, MaterialLike, MaterialSubscriber, PixelAligned, ShadersLike } from "./Material/Material";
export type { MeshLike } from "./Mesh";
export type { AddObject, Geometry2d, Material2d } from "./global-types";
export type { ObjectNodeLike } from "./Object";
export type {
    BufferManagerLike,
    DepthTextureLike,
    MeshDepthBufferLike,
    DevelopmentValidatorLike,
    DestroyManagerLike,
    DrawCallManagerLike,
    GeometryBufferPartLike,
    GeometryBufferLike,
    GPUTextureResourceLike,
    MeshMatrixBufferLike,
    MeshStyleBufferLike,
    PipelineBuffersLike,
    PipelineLike,
    PipelineManagerLike,
    PipelineTemplateLike,
    RenderLike,
    RenderMode,
    SamplerManagerLike,
    SceneResourcesLike,
    TextureManagerLike,
} from "./Render";
export type { DrawList, GeometryList, MaterialList, SceneLike, TextureList } from "./Scene";
export type { TextureLike, TextureSource, TextureSubscriber } from "./Texture";

export { SolidStyle, WireframeStyle, EdgeStyle, PointsStyle, WriteStyleData, STYLE_STRIDE } from "./Style";
export type { ColorSubscriber } from "./Color";
export type { StyleArea, StyleChange, StyleSubscriber, PartSubscriber } from "./Style";
export { Raw } from "./Raws";
export type { RawOptions, RawChange, RawSubscriber } from "./Raws";
export type { IMeshOptions } from "./IMesh";
export { default as TextureLayers } from "./Texture/Layers";
export type { TextureResource } from "./Texture/Layers";
