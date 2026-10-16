import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repository = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const check = process.argv.includes("--check");
const requested = process.argv.filter((value, index) => index > 1 && value !== "--check");
let packages = ["BPLineJS", "BPMatrixJS"];
// 明确指定包时只处理该包，npm 的单包命令不会写入另一个包。
if (requested.length > 0) {
    packages = requested;
}
const require = createRequire(join(PackageRootPath(packages[0]), "package.json"));
const ts = require("typescript");
const excluded = new Set(["node_modules", "lib", "dist"]);
const sourceExtensions = new Set([".ts", ".js", ".mjs", ".cjs"]);
const nativePurposes = new Map([
    ["Bridge.cpp", "C ABI 入口；字体句柄所有权、异常转错误字符串、结果内存和缓存统计。"],
    ["Font.hpp", "原生 Font 字段、构造/销毁、shape/glyph/clear 接口和字形 LRU 缓存。"],
    ["FontBytes.cpp", "解码 TTF/OTF/WOFF/WOFF2，校验字节范围，构造字体与 UTF-16 字形排版。"],
    ["Geometry.hpp", "双精度点、轮廓、三角面结构及 nonzero 剖分接口。"],
    ["Glyph.cpp", "HarfBuzz 原生路径回调、贝塞尔细分、字形网格缓存和内存上限。"],
    ["Tessellation.cpp", "交点与重叠分段、nonzero 填充带、全部可见外轮廓和孔洞追踪。"],
    ["Text.cpp", "多行排版、字距/行距/对齐、重叠字形合并、居中与批量几何输出。"],
    ["CMakeLists.txt", "固定原生源文件与编译选项，生成 Emscripten 模块和独立 WASM。"],
    ["build.py", "按 SHA-256 校验下载依赖，在项目缓存编译，将运行产物复制到 lib。"],
]);

const sections = new Map([
    ["Geometry/Wasm", ["文字原生计算 Text WASM", "C++ 字体解码、HarfBuzz 排版、曲线采样、nonzero 三角化与有界缓存。", "文字 字体 原生 编译 缓存 孔洞", "text font wasm native build cache winding holes", "build:wasm 在 build 生成加载器和 WASM；src 保存 C++。依赖与对象缓存位于根目录 .local/wasm-text。只使用 MIT 依赖，LICENSE 随包复制。注册必须 await，几何创建同步。"]],
    ["Camera", ["相机 Camera", "正交视口、坐标投影、缩放和相机版本。", "相机 视口 投影 缩放 旋转", "camera viewport projection zoom rotation", "zoomVersion 只记录实际缩放变化；变换与投影按版本同步，Y 正方向向上。"]],
    ["Color", ["颜色 Color", "归一化 RGBA、十六进制转换和颜色订阅。", "颜色 色值 透明度 订阅", "color rgba hex opacity subscription", "修改颜色必须通过 setter 或方法提交；订阅按消费者和字段区分。"]],
    ["Control", ["相机控制 Control", "鼠标、单指、双指操作和相机惯性。", "控制器 拖动 缩放 旋转 惯性 单指 双指 回调", "controller drag zoom rotation inertia touch callback", "drag 是平移总开关，leftDrag/rightDrag/oFDrag/tFDrag 分开控制；通知使用局部变换，新值和旧值是独立快照。"]],
    ["Editor", ["编辑器 Editor", "集合分派、图元编辑、快捷键、历史及文档回显。", "编辑器 选择 新建 拖动 缩放 旋转 撤销 重做 保存 加载 嵌套", "editor selection creation drag resize rotation undo redo save load nesting", "集合统一选择、历史、组变换和辅助层；独立工具保留独立入口。内部框 noSelect，实体材质独立复制。"]],
    ["Editor/RectEditTool", ["矩形编辑器 RectEditTool", "参数化矩形的手柄编辑、组变换、吸附与历史。", "矩形 编辑器 圆角 边角 尺寸 组缩放", "rectangle editor rounded corner handle resize group scale", "index 保留字段、构造与交互入口；motion、resize、groupTransform 通过实时 hooks 共享状态，不能复制旧配置。独立组缩放保护矩形形状。"]],
    ["Editor/NGonEditTool", ["正多边形编辑器 NGonEditTool", "内外圈编辑、正多边形边数和创建方向。", "正多边形 等边形 圆环 半径 内圈 外圈", "ngon regular polygon annulus radius inner outer", "默认中心起笔；Shift 临时采用角点起笔。10 边及以上不参与顶点吸附；自动曲线精度不改变正多边形边数。"]],
    ["Editor/PolyEditTool", ["多边形编辑器 PolyEditTool", "逐点绘制、沿边插点、顶点拖动及自由组缩放。", "多边形 折线 顶点 插点 自交 开放 闭合", "polygon polyline vertex insert self-intersection open closed", "只编辑单轮廓 Poly2D，不定义独立孔轮廓；新建逐点单击，右键提交。开放路径关闭填充，保留原始节点顺序。"]],
    ["Editor/TextEditTool", ["文字编辑器 TextEditTool", "排版矩形编辑、文字光标输入、选区与独立输入历史。", "文字 字体 光标 选区 输入 字距 行距", "text font caret selection input letter-spacing line-spacing", "命中、吸附和编辑手柄使用排版包围盒，不扫描字形三角面；空文字退出输入后删除。文字输入保留原生剪贴板与撤销快捷键。"]],
    ["Editor/Collection", ["集合编辑内部模块 Collection", "跨类型历史、层级、组变换、被动 Base 编辑和资源文档。", "集合 层级 分组 降级 文档 资源 序列化", "collection hierarchy group downgrade document resource serialization", "普通实体可按 nest 决定互相嵌套，空 Group 始终可接收；变换和父级变更合并为一笔历史。异形降级后撤销恢复原类型。"]],
    ["Editor/Snap", ["吸附 Snap", "顶点、边线、交点、细格及旋转候选的屏幕距离比较。", "吸附 顶点 边线 交点 网格 旋转 步进", "snap vertex edge intersection grid rotation step", "总开关默认关闭，四个分项默认开启；距离以 CSS 屏幕像素比较，步进与吸附按更近的候选决定。"]],
    ["Editor/History", ["编辑记录 History", "选择身份、剪贴板克隆和快照条目读取。", "历史 快照 选择 编号 克隆", "history snapshot selection id clone", "历史比较用户输入和基准精度，不能把临时选择样式或自动精度当作用户编辑。"]],
    ["Editor/Styles", ["编辑默认样式 Editor Styles", "独立绘制模板与黄色边框/关键点模板。", "编辑器 默认 样式 模板 黄色 边框", "editor default style template yellow border", "工厂每次返回独立 Style；Rect 显示边中点，NGon/Poly 只显示原始顶点。模板在字段初始化，构造只做场景接入。"]],
    ["Editor/cursors", ["编辑光标 Cursors", "Phosphor SVG 光标、方向投影和旋转缓存。", "光标 鼠标 图标 法线 屏幕方向", "cursor mouse icon normal screen direction", "缩放光标按屏幕空间法线定向；SVG 与许可说明保留，选中框由 Mesh 绘制。"]],
    ["Geometry", ["几何 Geometry", "填充、边框、关键点和线框的 CPU 生成。", "几何 三角面 顶点 边框 圆角 轮廓 精度", "geometry triangle vertex border rounded contour precision", "矩形中心为局部零点；生成结果版本变化后重建。填充、边框、关键点和原生线框保持各自分区与拓扑。"]],
    ["Geometry/Rect", ["矩形生成 Rect", "矩形与圆角轮廓、UV、周长、边框和标记点。", "矩形 圆角 分段 周长 边框 关键点", "rectangle rounded segments perimeter border marker", "入口在上级 Rect.ts；geometry 提供公开生成函数，perimeter 维护轮廓与偏移计算，types 维护数据契约。所有辅助几何传递同一精度。"]],
    ["Geometry/NGon", ["正多边形生成 NGon", "等边形、圆盘近似和内外圈拓扑。", "正多边形 圆盘 圆环 内圈 极坐标", "ngon regular polygon disk annulus polar", "入口在上级 NGon.ts；孔环通过对应边拼接，不能用中心扇形填满内圈。两边退化为开放直径，没有填充面。"]],
    ["Geometry/Poly", ["多边形生成 Poly", "凹多边形、自交轮廓、开放路径和描边连接。", "多边形 凹 自交 五角星 环绕 填充 描边", "polygon concave self-intersection pentagram winding fill stroke", "普通凹轮廓使用耳切，自交轮廓按非零环绕分解；原始边线与关键点不使用新增的填充分割点。单轮廓不定义 evenodd 或独立孔接口。"]],
    ["Geometry/Text", ["字体几何 Text", "字体注册、布局、曲线离散及带孔字形剖分。", "字体 文字 字形 排版 字距 行距 三角化", "font text glyph layout spacing triangulation", "字体名称先注册；轮廓按字形真实包围盒居中，细分精度变化不改变排版中心。孔轮廓由文字专用剖分处理。"]],
    ["Group", ["场景分组 Group", "节点添加删除、任意层级和场景通知。", "分组 层级 父子 节点", "group hierarchy parent child node", "修改层级通过 add/remove；保持世界姿态时先做父级坐标换算，避免循环嵌套。"]],
    ["Helper", ["辅助显示 Helper", "背景网格、标尺与缩放适配。", "辅助 网格 标尺 尺子 主题", "helper grid ruler scale theme", "屏幕辅助 Shader 绕过普通世界包围盒裁剪；网格与标尺各有独立 Mesh 和材质。"]],
    ["IMesh", ["实例批次 IMesh", "管理或冻结实例记录、连续缓冲和整批包围盒。", "实例 批次 冻结 连续缓冲 包围盒", "instance batch frozen buffer bounding box", "稳定 ID 与数组槽位分开；raw=false 不保留可变输入引用。整批共用一个包围盒和一个几何模板。"]],
    ["Material", ["材质 Material", "标准材质、自定义 WGSL、具名传值和管线身份。", "材质 着色器 管线 纹理 绑定 传值", "material shader pipeline texture binding values", "GPU 资源属于 Render；材质 key 与数值版本分开。纹理替换更新绑定，数值更新不能无故重建管线。"]],
    ["Material/wgsls", ["WGSL 着色器 WGSL", "标准图元和原生线框的顶点、片元阶段。", "着色器 顶点 片元 深度 精度 纹理", "wgsl shader vertex fragment depth precision texture", "与 CPU 打包布局同步：矩阵列补齐、样式 44 floats、纹理数组绑定和实例深度秩。修改阶段接口时同步全部图元。"]],
    ["Math", ["数学 Math", "Vec2、Mat3、版本和按字段订阅。", "数学 向量 矩阵 坐标 版本 订阅", "math vector matrix coordinate version subscription", "每次数学修改原子提交并通知一次；Mat3 按列主序存储，GPUData 每列补齐到四项。不要在数学层引入 Render 或 GPU。"]],
    ["Mesh", ["实体 Mesh", "几何与材质资源、变换、实例打包和包围盒。", "实体 模型 变换 包围盒 精度 固定尺寸", "mesh model transform bounding precision ignoreZoom", "逻辑 boundingBox 不受相机影响，getRenderBoundingBox 使用显示矩阵。autoPrecision 默认关闭，编辑器为实体开启；precisionMax 默认 100。"]],
    ["Object", ["对象节点 ObjectNode", "局部 TRS、显式矩阵和世界变换缓存。", "对象 节点 位置 旋转 缩放 世界矩阵", "object node position rotation scale world matrix", "输入变化按字段订阅；世界矩阵只处理需要的祖先。显式局部矩阵持续有效，直到 TRS 输入改变。"]],
    ["Raws", ["实例记录 Raws", "稳定编号的单条 Raw 与记录集合。", "实例 记录 编号 样式 冻结", "raw instance record id style frozen", "Raw 只覆盖实例外观，不覆盖共享几何拓扑或材质固定管线状态；删除时解除订阅。"]],
    ["Render", ["渲染 Render", "资源准备、GPU 上传、绘制提交和开发诊断。", "渲染 GPU 缓冲 管线 绑定 深度 筛选 精度", "render webgpu buffer pipeline bind depth culling precision", "warmup 只准备，render 才提交。缓存属于单个 Render；筛选只改变提交子集，资源和深度前缀仍按完整 drawList 管理。"]],
    ["Scene", ["场景 Scene", "资源归属列表、视口筛选和世界四叉树。", "场景 视口 包围盒 四叉树 区域 筛选", "scene viewport bounding quadtree region culling", "box/quad 互斥；四叉树根来自 Scene 世界包围盒，相机只查询。实体变化更新索引，相机平移或旋转保留普通实体树。"]],
    ["Select", ["选择 Select", "集合点选、框选、边线和顶点命中。", "选择器 点选 框选 边线 顶点 排序", "select picker selector edge point sorting", "使用完整场景搜索，noSelect 跳过辅助实体；命中按显示矩阵处理 ignoreZoom。点选和框选开关独立。"]],
    ["Style", ["样式 Style", "实体面、线框、边框、关键点和连接的订阅链。", "样式 颜色 边框 关键点 连接 复制", "style color border points join copy", "Geometry 只响应生成相关字段，Material 响应外观和绑定；Style 不持有 GPU。copy/clone 深复制颜色与分区，纹理资源保持引用。"]],
    ["Text", ["文字 Text", "静态字体表、排版几何和光标布局。", "文字 字体 注册 字号 字距 行距 基线", "text font register size spacing baseline caret", "通过 Font.register 注册名称后创建 Text；字符索引用 UTF-16，字素簇和换行由排版流程处理。包围盒中心为局部零点。"]],
    ["Texture", ["纹理 Texture", "图片、视频、Canvas、来源变更和实例纹理层。", "纹理 图片 视频 画布 来源 图层", "texture image video canvas source layers", "source DOM 可由用户控制播放和跳转；GPU 上传属于 Render。视频逐帧传图像，不把纹理内容更新误作管线结构变化。"]],
    ["Utils", ["通用算法 Utils", "纯数值、平面几何、事件坐标和计时工具。", "工具 通用算法 相交 投影 距离 环绕 精度", "utils algorithm intersection projection distance winding precision", "通用算法不依赖 Mesh/Scene/Editor；编辑器负责屏幕容差和业务开关，数学工具负责坐标与几何计算。"]],
    ["Examples", ["本地案例 Examples", "开发验证入口、交互案例和测试资源。", "案例 示例 验证 调试", "example demo validation debugging", "Examples/index.ts 切换本地入口；不创建额外 HTML，案例及字体图片不进入 npm 库。"]],
    ["tests", ["回归测试 Tests", "数学、几何、字体与边界行为的 Node 检查。", "测试 回归 验证 夹具", "test regression validation fixture", "测试以生成数组、拓扑、面积和订阅行为为依据；fixtures 保持确定输入。"]],
    ["releases", ["发布记录 Releases", "对应 npm 版本的变更说明。", "发布 版本 beta 变更", "release version beta changes", "发布前核对本地 CHANGES.md；发布完成及文档同步后清理本地记录。"]],
]);

/** @param name 包目录名 @returns 允许的包根路径。 @example PackageRootPath("BPLineJS"); */
function PackageRootPath(name) {
    if (name === "BPLineJS" || name === "BPMatrixJS") {
        return join(repository, name);
    } else {
        throw new Error("Directory guides only support BPLineJS and BPMatrixJS.");
    }
}

/** @param root 包根 @param directory 当前目录 @returns 维护目录列表。 @example Directories(root, root); */
const Directories = (root, directory) => {
    const result = [directory];
    // 只扫描维护目录，生成产物和依赖目录由打包流程处理。
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
        if (entry.isDirectory() && !entry.name.startsWith(".") && !excluded.has(entry.name) &&
            !(entry.name === "build" && directory.replaceAll("\\", "/").endsWith("/Geometry/Wasm"))) {
            result.push(...Directories(root, join(directory, entry.name)));
        }
    }
    return result;
};

/** @param path 目录在包内的路径 @returns 该目录最接近的职责说明。 @example Description("src/scripts/Camera"); */
const Description = (path) => {
    let key = path.replace(/^\//, "").replace(/^src\/scripts\/?/, "");
    // 子目录继承最近的职责，具体文件和符号由解析器单独列出。
    while (key.length > 0) {
        if (sections.has(key)) {
            return sections.get(key);
        } else {
            const slash = key.lastIndexOf("/");
            if (slash >= 0) {
                key = key.slice(0, slash);
            } else {
                key = "";
            }
        }
    }
    return ["包与入口 Package", "包入口、源码目录、构建配置与导出路径。", "项目 包 入口 构建 导出", "package entry source build exports", "源码按 imports、class（字段/构造/方法）、类型、辅助函数、exports 排列；独立默认值写在字段声明上，构造函数保留参数赋值和初始化绑定。"];
};

/** @param value 原始表格文字 @returns 单行 Markdown 表格内容。 @example Cell("Vec2 | null"); */
const Cell = (value) => String(value).replaceAll("|", "\\|").replace(/\s+/g, " ").trim();

/** @param node AST 声明 @returns JSDoc 中的用途说明。 @example Documentation(classNode); */
const Documentation = (node) => {
    const parts = [];
    // 保留作者描述，不用名称模板替换实际语义。
    for (const doc of node.jsDoc ?? []) {
        if (typeof doc.comment === "string") {
            parts.push(doc.comment);
        }
    }
    // 简短访问器常把用途写在 @returns 中，不能把这些说明丢掉。
    if (parts.length === 0) {
        for (const doc of node.jsDoc ?? []) {
            for (const tag of doc.tags ?? []) {
                if ((tag.tagName.text === "returns" || tag.tagName.text === "return") && typeof tag.comment === "string") {
                    parts.push(tag.comment);
                }
            }
        }
    }
    return parts.join(" ").replace(/```[\s\S]*?```/g, "").trim();
};

/** @param node AST 声明 @returns 作者提供的首个调用案例。 @example Example(constructorNode); */
const Example = (node) => {
    // 只取源码已有的例子，避免生成不可调用的伪示例。
    for (const doc of node.jsDoc ?? []) {
        for (const tag of doc.tags ?? []) {
            if (tag.tagName.text === "example" && typeof tag.comment === "string") {
                return tag.comment.replace(/^```(?:ts|typescript|js)?\s*/, "").replace(/\s*```$/, "").trim();
            }
        }
    }
    return "";
};

/** @param file 源文件路径 @returns TypeScript AST。 @example Parse("src/scripts/Camera/index.ts"); */
const Parse = (file) => ts.createSourceFile(file, readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true);

/** @param member 类成员 @param source 当前 AST @returns 字段或函数的简洁签名。 @example Signature(method, source); */
const Signature = (member, source) => {
    let text = member.getText(source);
    if (member.body) {
        text = text.slice(0, member.body.getStart(source) - member.getStart(source));
    } else if (member.initializer) {
        text = text.slice(0, member.initializer.getStart(source) - member.getStart(source));
    }
    return text.replace(/^(?:public|private|protected)\s+/, "").replace(/\s*=\s*$/, "").trim();
};

/** @param node AST 声明 @returns 是否属于内部实现成员。 @example IsPrivate(field); */
const IsPrivate = (node) => node.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.PrivateKeyword) === true;

/** @param field 字段声明 @param declaration 所属类 @param source 当前 AST @returns 优先使用作者说明、对应访问器或构造参数的字段作用。 @example FieldDescription(field, cameraClass, source); */
const FieldDescription = (field, declaration, source) => {
    const own = Documentation(field);
    if (own.length > 0) {
        return own;
    } else {
        const name = field.name.getText(source);
        const publicName = name.replace(/^_/, "");
        const accessor = declaration.members.find((member) =>
            (ts.isGetAccessorDeclaration(member) || ts.isSetAccessorDeclaration(member)) && member.name.getText(source) === publicName);
        const accessorDescription = accessor && Documentation(accessor);
        if (accessorDescription) {
            return accessorDescription + "（" + publicName + " 的内部状态）。";
        } else {
            const ctor = declaration.members.find(ts.isConstructorDeclaration);
            let parameterName;
            // 仅跟踪直接参数赋值；复杂表达式仍保留真实使用者列表。
            for (const statement of ctor?.body?.statements ?? []) {
                if (ts.isExpressionStatement(statement) && ts.isBinaryExpression(statement.expression)) {
                    const assignment = statement.expression;
                    if (assignment.left.getText(source) === "this." + name && ts.isIdentifier(assignment.right)) {
                        parameterName = assignment.right.text;
                    }
                }
            }
            if (parameterName) {
                for (const doc of ctor?.jsDoc ?? []) {
                    for (const tag of doc.tags ?? []) {
                        if (tag.tagName.text === "param" && tag.name?.getText(source) === parameterName && typeof tag.comment === "string") {
                            return tag.comment + "（构造参数引用）。";
                        }
                    }
                }
            }
            const users = [];
            // 列出实际访问该字段的方法，避免空说明或根据变量名猜测含义。
            for (const member of declaration.members) {
                if (member.body && member.body.getText(source).includes("this." + name)) {
                    let label = "constructor";
                    if (member.name) {
                        label = member.name.getText(source);
                    }
                    if (!users.includes(label)) {
                        users.push(label);
                    }
                }
            }
            if (users.length > 0) {
                return "状态由 " + users.slice(0, 4).map((name) => "`" + name + "`").join("、") + " 读取或维护；完整处理见对应函数。";
            } else {
                return "类字段；默认值及类型见本行，使用者由外部接口或继承实现提供。";
            }
        }
    }
};

/** @param source 当前 AST @returns 文件的类、函数、类型与导出概览。 @example Summarize(source); */
const Summarize = (source) => {
    const classes = source.statements.filter(ts.isClassDeclaration);
    const functions = [];
    const types = [];
    const exports = [];
    // 顶层符号与内部函数分开列出，不把每个局部回调误当公共 API。
    for (const node of source.statements) {
        if (ts.isVariableStatement(node)) {
            for (const declaration of node.declarationList.declarations) {
                if (declaration.initializer && (ts.isArrowFunction(declaration.initializer) || ts.isFunctionExpression(declaration.initializer))) {
                    functions.push({ name: declaration.name.getText(source), description: Documentation(node), example: Example(node) });
                }
            }
        } else if (ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node)) {
            types.push(node.name.text);
        } else if (ts.isExportDeclaration(node) || ts.isExportAssignment(node)) {
            exports.push(node.getText(source));
        }
    }
    return { classes, functions, types, exports };
};

/** @param source 当前 AST @returns 入口的类变量、构造、方法与调用例子。 @example DescribeSource(source); */
const DescribeSource = (source) => {
    const sections = [];
    const summary = Summarize(source);
    // 类的表格沿用源码顺序，便于与 fields/constructor/methods 一一对应。
    for (const declaration of summary.classes) {
        sections.push("### " + declaration.name.text + "\n\n" + (Documentation(declaration) || "本文件的类实现。"));
        const fields = declaration.members.filter(ts.isPropertyDeclaration);
        if (fields.length > 0) {
            sections.push("\n#### 变量与默认值\n\n| 字段 | 类型 / 默认值 | 用途 |\n| --- | --- | --- |");
            for (const field of fields) {
                let kind = "公开";
                if (IsPrivate(field)) {
                    kind = "内部";
                }
                const defaultValue = field.initializer?.getText(source) ?? "由构造参数或初始化过程赋值";
                const type = field.type?.getText(source) ?? "按初始化值推断";
                sections.push("| `" + Cell(field.name.getText(source)) + "`（" + kind + "） | `" + Cell(type) + "`；`" + Cell(defaultValue) + "` | " + Cell(FieldDescription(field, declaration, source)) + " |");
            }
        }
        const ctor = declaration.members.find(ts.isConstructorDeclaration);
        sections.push("\n#### 构造与案例\n");
        if (ctor) {
            sections.push("```ts\n" + Signature(ctor, source) + "\n```\n\n" + Documentation(ctor));
            const example = Example(ctor);
            if (example.length > 0) {
                sections.push("\n```ts\n" + example + "\n```");
            }
        } else {
            sections.push("无显式构造函数，按字段默认值创建；父类如有构造逻辑会依语言规则执行。");
        }
        const methods = declaration.members.filter((member) => ts.isMethodDeclaration(member) || ts.isGetAccessorDeclaration(member) || ts.isSetAccessorDeclaration(member));
        if (methods.length > 0) {
            sections.push("\n#### 函数与访问器\n\n| 签名 | 作用 |\n| --- | --- |");
            for (const method of methods) {
                let label = "";
                if (IsPrivate(method)) {
                    label = "（内部）";
                }
                sections.push("| `" + Cell(Signature(method, source)) + "` " + label + " | " + Cell(Documentation(method)) + " |");
            }
        }
    }
    if (summary.functions.length > 0) {
        sections.push("\n### 顶层函数\n\n| 名称 | 用途 |\n| --- | --- |");
        for (const fn of summary.functions) {
            sections.push("| `" + fn.name + "` | " + Cell(fn.description) + " |");
        }
        const example = summary.functions.find((fn) => fn.example.length > 0)?.example;
        if (example) {
            sections.push("\n```ts\n" + example + "\n```");
        }
    }
    if (summary.types.length > 0) {
        sections.push("\n### 类型索引\n\n" + summary.types.map((name) => "`" + name + "`").join("、"));
    }
    if (summary.exports.length > 0) {
        sections.push("\n### 导出关系\n\n```ts\n" + summary.exports.join("\n") + "\n```");
    }
    return sections.join("\n");
};

/** @param name 文件名 @returns 非 TypeScript 文件的作用。 @example FilePurpose("fragment.wgsl"); */
const FilePurpose = (name) => {
    if (nativePurposes.has(name)) {
        return nativePurposes.get(name);
    } else if (name.endsWith(".wgsl")) {
        return "WGSL 阶段源码；由对应材质/Helper 以 ?raw 引入。";
    } else if (name.endsWith(".svg")) {
        return "矢量光标资源，通过模块 URL 引入；方向由编辑器投影计算。";
    } else if (name.endsWith(".woff2") || name.endsWith(".ttf")) {
        return "本地字体验证资源，保持原始二进制。";
    } else if (name === "package.json") {
        return "npm 版本、依赖、脚本、files 与 exports 的发布契约。";
    } else if (name.startsWith("tsconfig")) {
        return "TypeScript 检查/声明生成范围和编译选项。";
    } else if (name.startsWith("vite")) {
        return "应用或 ESM 库构建入口、资源处理与输出规则。";
    } else if (name.startsWith("eslint")) {
        return "严格类型、可读性、类布局与格式检查配置。";
    } else if (name === "AGENTS.md") {
        return "工作约定；agent.md 是目录/API 索引，两者职责不同。";
    } else if (name.includes("LICENSE")) {
        return "对应代码或资源的许可说明，打包时保持要求的声明。";
    } else {
        return "本目录维护的配置、资源或验证文件。";
    }
};

/** @param root 包根 @param directory 当前目录 @param notes 人工维护的持久注意事项 @returns 完整目录说明。 @example BuildGuide(root, directory, "补充规则"); */
const BuildGuide = (root, directory, notes) => {
    const path = relative(root, directory).replaceAll("\\", "/");
    const metadata = Description(path);
    const entries = readdirSync(directory, { withFileTypes: true }).filter((entry) => entry.name !== "agent.md" && !entry.name.startsWith(".") && !excluded.has(entry.name) &&
        !(entry.name === "build" && path === "src/scripts/Geometry/Wasm"));
    entries.sort((left, right) => left.name.localeCompare(right.name, "en"));
    const name = JSON.parse(readFileSync(join(root, "package.json"), "utf8")).name;
    const lines = ["# " + metadata[0], "", "目录：`" + name + "/" + (path || ".") + "`", "", "## 1. 文件结构与作用", "", metadata[1], "", "| 文件 / 子目录 | 作用 |", "| --- | --- |"];
    // 结构只包含维护文件；可复用目录通过其自己的 agent.md 继续索引。
    for (const entry of entries) {
        if (entry.isDirectory()) {
            lines.push("| `" + entry.name + "/` | " + Cell(Description(path + "/" + entry.name)[1]) + " 详见该目录的 agent.md。 |");
        } else {
            let purpose = FilePurpose(entry.name);
            if (entry.name.endsWith(".ts")) {
                const parsed = Parse(join(directory, entry.name));
                const summary = Summarize(parsed);
                purpose = summary.classes.map(Documentation).filter(Boolean).join("；");
                if (purpose.length === 0) {
                    purpose = summary.functions.map((fn) => fn.description).filter(Boolean).slice(0, 3).join("；");
                }
                if (purpose.length === 0) {
                    purpose = FilePurpose(entry.name);
                    // 普通源码没有配置专属说明时，保留类型与桶入口提示。
                    if (purpose === "本目录维护的配置、资源或验证文件。") {
                        purpose = "类型、桶导出或模块入口；具体符号见下面的文件索引。";
                    }
                }
            }
            lines.push("| `" + entry.name + "` | " + Cell(purpose) + " |");
        }
    }
    lines.push("", "## 2. index 入口、案例与类接口", "");
    const index = entries.find((entry) => entry.name === "index.ts");
    if (index) {
        lines.push(DescribeSource(Parse(join(directory, index.name))));
    } else if (path.length === 0) {
        lines.push("本目录是 npm 包根。源码入口为 `src/scripts/index.ts`，安装后的入口为 `lib/index.js`，声明入口为 `lib/index.d.ts`。", "", "```sh", "npm run check", "npm run build:lib", "npm run pack:check", "```");
    } else {
        lines.push("本目录没有 index.ts；由上级入口或对应调用模块引入，不为目录说明额外创建空桶文件。");
    }
    lines.push("", "## 3. 其他源码文件", "");
    // 与入口分开说明其余 TS 文件，但仍完整列出类和顶层函数。
    for (const entry of entries) {
        const file = join(directory, entry.name);
        const extension = entry.name.slice(entry.name.lastIndexOf("."));
        if (entry.isFile() && entry.name !== "index.ts" && sourceExtensions.has(extension)) {
            lines.push("### 文件：" + entry.name, "", DescribeSource(Parse(file)), "");
        }
    }
    lines.push("## 4. 注意事项", "", "- " + metadata[4], "- agent.md 的符号与默认值由源码生成；修改后执行 `npm run guides`，检查时执行 `npm run guides:check`。人工补充请写在 agent-notes 标记之间，重新生成会保留。", "- 库构建把 src/scripts 的目录说明复制到 lib 同名目录；TS 对应 JS/声明，WGSL 作为导入资源编译。Examples 说明只保留在源码，不进入 npm。", "", "<!-- agent-notes:start -->", notes, "<!-- agent-notes:end -->", "", "## 5. 中英文搜索关键词", "", "```xml", '<keywords language="zh">' + metadata[2] + "</keywords>", '<keywords language="en">' + metadata[3] + "</keywords>", "```", "");
    return lines.join("\n");
};

const differences = [];
let generated = 0;
// 包之间的根路径明确，不扫描 Example 网站或用户工作区的其他项目。
for (const name of packages) {
    const root = PackageRootPath(name);
    for (const directory of Directories(root, root)) {
        const file = join(directory, "agent.md");
        let actual = "";
        try {
            actual = readFileSync(file, "utf8");
        } catch (error) {
            // 首次生成缺失文件是正常情况，权限和解析错误继续交给调用方。
            if (error.code === "ENOENT") {
                actual = "";
            } else {
                throw error;
            }
        }
        const customNotes = actual.match(/<!-- agent-notes:start -->\n([\s\S]*?)\n<!-- agent-notes:end -->/);
        let notes = "暂无额外目录约定。";
        if (customNotes) {
            notes = customNotes[1];
        }
        const expected = BuildGuide(root, directory, notes);
        if (actual !== expected) {
            if (check) {
                differences.push(relative(repository, file));
            } else {
                writeFileSync(file, expected);
            }
        }
        generated++;
    }
}
if (differences.length > 0) {
    throw new Error("Directory guides are out of date:\n" + differences.join("\n"));
} else {
    console.log("Directory guides: " + String(generated) + " checked/generated.");
}
