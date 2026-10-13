/// <reference types="@webgpu/types" preserve="true" />
import Camera from "./Camera";
import Color from "./Color";
import Editor, { EditorGroup, EditorKey } from "./Editor";
import NGonEditTool, { NGonEditToolKey } from "./Editor/NGonEditTool";
import PolyEditTool, { PolyEditToolKey } from "./Editor/PolyEditTool";
import RectEditTool, { RectEditToolKey } from "./Editor/RectEditTool";
import TextEditTool, { TextEditToolKey } from "./Editor/TextEditTool";
import Base2D from "./Geometry/Base2D";
import Geo from "./Geometry/Geo";
import NGon2D from "./Geometry/NGon2D";
import Poly2D from "./Geometry/Poly2D";
import Rect2D from "./Geometry/Rect2D";
import Group from "./Group";
import { HelperGrid, HelperGridCustomStyle } from "./Helper";
import { GETID } from "./ID";
import IMesh from "./IMesh";
import BaseMaterial from "./Material/baseMaterial";
import CompositeMaterial from "./Material/CompositeMaterial";
import Material from "./Material/Material";
import WGSLMaterial from "./Material/WGSLMaterial";
import Mesh from "./Mesh";
import ObjectNode from "./Object";
import Raws from "./Raws";
import Render from "./Render";
import Scene, { QuadTree } from "./Scene";
import Select from "./Select";
import BaseSelectTool from "./Select/BaseSelectTool";
import LineSelectTool from "./Select/LineSelectTool";
import NGonSelectTool from "./Select/NGonSelectTool";
import PointSelectTool from "./Select/PointSelectTool";
import PolySelectTool from "./Select/PolySelectTool";
import RectSelectTool from "./Select/RectSelectTool";
import TextSelectTool from "./Select/TextSelectTool";
import Style from "./Style";
import { Font, Text } from "./Text";
import Texture from "./Texture";

export type { CameraBuffersLike, CameraLike } from "./Camera";
export type { ColorSubscriber } from "./Color";
export { CameraControl } from "./Control";
export type {
    CameraControlChange, CameraControlOptions, CameraControlState, CameraPositionChange,
    CameraRotationChange, CameraZoomChange,
} from "./Control";
export type { EditorDocument, EditorGeometryData, EditorLoadOptions, EditorMaterialData, EditorMode, EditorNodeData, EditorOptions, EditorShape, EditorStyleData, EditorTextureData, EditSwitches } from "./Editor";
export type { NGonEditDocument, NGonEditMode, NGonEditOrigin, NGonEditRecord, NGonHandle } from "./Editor/NGonEditTool";
export type { PolyEditDocument, PolyEditMode, PolyEditOrigin, PolyEditRecord, PolyHandle } from "./Editor/PolyEditTool";
export type { RectEditDocument, RectEditMode, RectEditOrigin, RectEditRecord, RectEditStyleData, RectHandle, SelectionOperation } from "./Editor/RectEditTool";
export type { SnapOptions } from "./Editor/Snap";
export type { TextEditDocument, TextEditRecord } from "./Editor/TextEditTool";
export type { Base2DLike, Base2DOptions } from "./Geometry/Base2D";
export type {
    BorderAlign,
    GeoBuffersLike,
    GeoData, GeometrySubscriber, GeoPartDataLike,
} from "./Geometry/Geo";
export type { NGon2DLike, NGon2DOptions, NGonUVMode } from "./Geometry/NGon2D";
export type { Poly2DLike, Poly2DOptions } from "./Geometry/Poly2D";
export type { Rect2DLike, Rect2DOptions } from "./Geometry/Rect2D";
export type { AddObject, Geometry2d, Material2d } from "./global-types";
export type { GroupLike } from "./Group";
export type { HelperGridCustomColors, HelperGridMode, HorizontalRuler, VerticalRuler } from "./Helper";
export type { IMeshOptions } from "./IMesh";
export type { BaseMaterialLike } from "./Material/baseMaterial";
export type { CompositeMaterialLike } from "./Material/CompositeMaterial";
export type {
    MaterialBuffersLike,
    MaterialChange,
    MaterialChangeKind,
    MaterialLike,
    MaterialSubscriber,
    PixelAligned,
    ShadersLike,
} from "./Material/Material";
export type { ShaderValue, ShaderValueRecord } from "./Material/ShaderValues";
export type { WGSLMaterialLike } from "./Material/WGSLMaterial";
export type { MeshBoundingBox, MeshBoundingRect, MeshLike } from "./Mesh";
export type { ObjectNodeLike } from "./Object";
export { Raw } from "./Raws";
export type { RawChange, RawOptions, RawSubscriber } from "./Raws";
export {
    BufferManager,
    DepthManager, DestroyManager, DevelopmentValidator, DrawCallManager,
    InitCamera,
    InitScene,
    MatrixUpdate,
    PipelineManager,
    SamplerManager,
    TextureManager,
} from "./Render";
export type {
    BufferManagerLike,
    DepthTextureLike, DestroyManagerLike, DevelopmentValidatorLike, DrawCallManagerLike, GeometryBufferLike, GeometryBufferPartLike, GPUTextureResourceLike, MeshDepthBufferLike, MeshMatrixBufferLike,
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
export type { DrawList, GeometryList, MaterialList, QuadTreeEntry, SceneLike, TextureList } from "./Scene";
export type { SelectResult, SelectSortDirection } from "./Select";
export type { LineSelection } from "./Select/LineSelectTool";
export type { PointSelection } from "./Select/PointSelectTool";
export type { RectSelectionMode } from "./Select/RectSelectTool";
export type { TextSelection } from "./Select/TextSelectTool";
export { EdgeStyle, JoinStyle, PointsStyle, SolidStyle, STYLE_STRIDE, WireframeStyle, WriteStyleData } from "./Style";
export type { JoinType, PartSubscriber, StyleArea, StyleChange, StyleSubscriber } from "./Style";
export type { Text2DLike, Text2DOptions, TextGeometryFactory, TextWritingMode } from "./Text";
export type { TextureLike, TextureSource, TextureSubscriber } from "./Texture";
export { default as TextureLayers } from "./Texture/Layers";
export type { TextureResource } from "./Texture/Layers";
export {
    Base2D, BaseMaterial, BaseSelectTool, Camera,
    Color, CompositeMaterial, Editor,
    EditorGroup,
    EditorKey, Font, Geo, GETID,
    Group, HelperGrid,
    HelperGridCustomStyle, IMesh, LineSelectTool, Material,
    Mesh, NGon2D, NGonEditTool,
    NGonEditToolKey, NGonSelectTool, ObjectNode, PointSelectTool, Poly2D, PolyEditTool,
    PolyEditToolKey, PolySelectTool, QuadTree, Raws, Rect2D, RectEditTool,
    RectEditToolKey, RectSelectTool, Render,
    Scene, Select, Style, Text, TextEditTool,
    TextEditToolKey, TextSelectTool, Texture, WGSLMaterial,
};
