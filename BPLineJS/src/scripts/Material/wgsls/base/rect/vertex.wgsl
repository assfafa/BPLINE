
// 深度来自队列层级，而不是提交顺序。矩阵和样式数组不因倒序绘制而搬动。
struct DrawDepth {
    base: u32,
    count: u32,
    reverse: u32,
    _padding: u32,
};
@group(0) @binding(5) var<uniform> drawDepth: DrawDepth;

fn ResolveIndex(index: u32) -> u32 {
    return select(index, drawDepth.count - 1u - index, drawDepth.reverse != 0u);
}

fn GetDepth(index: u32) -> f32 {
    // 24 位整数除以 2^24，depth32float 可以精确表示；实际深度避开清空值 1。
    return 1.0 - f32(drawDepth.base + index + 1u) / 16777216.0;
}

struct VertexInput {
    // WebGPU 自动提供实例编号；普通 Mesh 只绘制一次，因此为 0。
    @builtin(instance_index) instanceIndex: u32,
    @location(0) position: vec2f,
    @location(1) uv: vec2f,
    // 当前为二维轮廓外法线，先接入顶点管线供后续边框与特效使用。
    @location(2) normal: vec2f,
    @location(3) miterScale: f32,
    // 关键点所属中心，其他类型填零。
    @location(4) center: vec2f,
    @location(5) vertexType: f32,
};

struct RenderCameraUniform {
    zoom: f32,
    dpr: f32,
    _padding0: f32,
    _padding1: f32,
};

struct MaterialUniform {
    solidColor: vec4f,
    sdfBorderColor: vec4f,
    edgeColor: vec4f,
    pointsColor: vec4f,
    wireframeColor: vec4f,
    // opacity、SDF width、align、pixelAligned。
    solid: vec4f,
    // opacity、实体 width、align、pixelAligned。
    edge: vec4f,
    // opacity、pixelAligned、补位、补位。
    points: vec4f,
    // opacity，其余为补位。
    wireframe: vec4f,
    // solid、wireframe、edge、points 开关。
    enabled: vec4f,
    // solid、edge、points 的纹理层号，普通 Mesh 均为 0。
    textureLayers: vec4f,
};

struct GeometryUniform {
    width: f32,
    height: f32,
    radius: f32,
    borderWidth: f32,
};

// 每个 Mesh 的世界矩阵。
@group(0) @binding(0) var<storage, read> modelMatrices: array<mat3x3<f32>>;
// 当前相机的视图矩阵。
@group(0) @binding(1) var<uniform> viewMatrix: mat3x3<f32>;
// 当前相机的正交投影矩阵。
@group(0) @binding(2) var<uniform> orthogonalMatrix: mat3x3<f32>;
// 当前 Render 的 DPR 与 Camera 缩放参数。
@group(0) @binding(3) var<uniform> renderCameraUniform: RenderCameraUniform;
// 当前 Geometry 的宽度、高度与圆角参数。
@group(0) @binding(4) var<uniform> geometryUniform: GeometryUniform;
// BaseMaterial 参数，顶点阶段后续使用边框宽度和对齐方式扩大承载顶点。
@group(1) @binding(0) var<storage, read> materialStyles: array<MaterialUniform>;

struct VertexOutput {
    @builtin(position) position: vec4f,
    @location(0) uv: vec2f,
    @location(1) localPosition: vec2f,
    @location(2) @interpolate(flat) vertexType: f32,
    // 原样传给片段阶段，禁止在三角面内插值。
    @location(3) @interpolate(flat) instanceIndex: u32,
};

// 实体面保留原有矩形 SDF 承载区域扩展逻辑。
fn TransformSolid(input: VertexInput, resolvedIndex: u32, modelMatrix: mat3x3<f32>, materialUniform: MaterialUniform) -> VertexOutput {
    var output: VertexOutput;
    output.instanceIndex = resolvedIndex;
    // Camera 视口已使用乘过 DPR 的画布尺寸，borderWidth 直接按画布像素处理。
    // 除以 Zoom 后，边框在相机缩放时仍保持固定的屏幕像素宽度。
    let safeZoom = max(abs(renderCameraUniform.zoom), 0.000001);
    let borderZoomScale = mix(1.0 / safeZoom, 1.0, materialUniform.solid.w);
    let outward = materialUniform.solid.y
        * materialUniform.solid.z
        * borderZoomScale;
    let safeWidth = max(abs(geometryUniform.width), 0.000001);
    let safeHeight = max(abs(geometryUniform.height), 0.000001);
    let hasRectSize = geometryUniform.width > 0.0 && geometryUniform.height > 0.0;
    let scaleX = select(1.0, 1.0 + outward * 2.0 / safeWidth, hasRectSize);
    let scaleY = select(1.0, 1.0 + outward * 2.0 / safeHeight, hasRectSize);
    let borderScaleMatrix = mat3x3f(
        scaleX, 0.0, 0.0,
        0.0, scaleY, 0.0,
        0.0, 0.0, 1.0,
    );
    let localPosition = borderScaleMatrix * vec3f(input.position, 1.0);
    let worldPosition = modelMatrix * localPosition;
    let viewPosition = viewMatrix * worldPosition;
    let clipPosition = orthogonalMatrix * viewPosition;

    output.position = vec4f(clipPosition.xy, GetDepth(resolvedIndex), 1.0);
    output.uv = input.uv;
    // 片元阶段使用放大后的局部坐标计算原矩形内外边界。
    output.localPosition = localPosition.xy;

    return output;
}

// 宽边框使用逆转置变换法线，避免非等比缩放影响屏幕宽度。
fn getViewNormal(localNormal: vec2f, modelViewMatrix: mat3x3<f32>) -> vec2f {
    let a = modelViewMatrix[0].x;
    let b = modelViewMatrix[0].y;
    let c = modelViewMatrix[1].x;
    let d = modelViewMatrix[1].y;
    let determinant = a * d - b * c;
    let determinantSign = select(-1.0, 1.0, determinant >= 0.0);
    let transformedNormal = vec2f(
        d * localNormal.x - b * localNormal.y,
        -c * localNormal.x + a * localNormal.y,
    ) * determinantSign;
    let normalLength = length(transformedNormal);
    let safeNormalLength = max(normalLength, 0.000001);

    return transformedNormal / safeNormalLength;
}

@vertex
fn main(input: VertexInput) -> VertexOutput {
    // 保留入口 builtin 原值；用独立编号读取矩阵、样式并传给片段阶段。
    let resolvedIndex = ResolveIndex(input.instanceIndex);
    let modelMatrix = modelMatrices[resolvedIndex];
    let materialUniform = materialStyles[resolvedIndex];
    if (input.vertexType == 0.0 && materialUniform.enabled.x != 0.0) {
        return TransformSolid(input, resolvedIndex, modelMatrix, materialUniform);
    }

    var output: VertexOutput;
    output.instanceIndex = resolvedIndex;
    output.vertexType = input.vertexType;
    output.uv = input.uv;
    // 同一个三角面的三个顶点类型一致，关闭某类时让整面退化到裁剪区外。
    if ((input.vertexType == 0.0 && materialUniform.enabled.x == 0.0)
        || (input.vertexType == 0.5 && materialUniform.enabled.z == 0.0)
        || (input.vertexType == 1.0 && materialUniform.enabled.w == 0.0)) {
        output.position = vec4f(2.0, 2.0, 0.0, 1.0);
        return output;
    }

    let modelViewMatrix = viewMatrix * modelMatrix;
    let safeZoom = max(abs(renderCameraUniform.zoom), 0.000001);
    let pixelAligned = select(materialUniform.points.y, materialUniform.edge.w, input.vertexType == 0.5);
    let zoomScale = mix(1.0 / safeZoom, 1.0, pixelAligned);
    var viewPosition: vec3f;
    if (input.vertexType == 0.5) {
        viewPosition = modelViewMatrix * vec3f(input.position, 1.0);
        let viewNormal = getViewNormal(input.normal, modelViewMatrix);
        let sideOffset = mix(-(1.0 - materialUniform.edge.z), materialUniform.edge.z, input.uv.y);
        let offset = geometryUniform.borderWidth * input.miterScale * sideOffset * zoomScale;
        viewPosition.x += viewNormal.x * offset;
        viewPosition.y += viewNormal.y * offset;
        output.uv.x *= mix(safeZoom, 1.0, materialUniform.edge.w);
    } else {
        // 点型中心跟随模型，局部偏移独立缩放，保持屏幕朝向和原有像素单位。
        viewPosition = modelViewMatrix * vec3f(input.center, 1.0);
        let offset = (input.position - input.center) * zoomScale;
        viewPosition.x += offset.x;
        viewPosition.y += offset.y;
    }
    let clipPosition = orthogonalMatrix * viewPosition;
    output.position = vec4f(clipPosition.xy, GetDepth(resolvedIndex), 1.0);
    return output;
}
