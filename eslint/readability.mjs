/**
 * 找到函数注释应当附着的声明节点。
 * @param node ESLint 提供的函数节点
 * @example
 * GetOwner(functionNode);
 * @returns 变量、成员或导出声明节点。
 */
const GetOwner = (node) => {
    let owner = node;
    // 变量函数与类成员的注释放在声明前，不要求插入参数表达式内部。
    if (owner.parent?.type === "VariableDeclarator") {
        owner = owner.parent.parent;
    } else if (owner.parent?.type === "MethodDefinition" || owner.parent?.type === "PropertyDefinition" || owner.parent?.type === "Property") {
        owner = owner.parent;
    }
    // 导出声明的注释位于 export 之前。
    if (owner.parent?.type === "ExportNamedDeclaration" || owner.parent?.type === "ExportDefaultDeclaration") {
        owner = owner.parent;
    }
    return owner;
};

/**
 * 取得函数声明之前最近的 JSDoc。
 * @param source 当前文件的 SourceCode
 * @param node 需要检查的函数节点
 * @example
 * GetDocumentation(context.sourceCode, functionNode);
 * @returns JSDoc 注释；未提供时为 undefined。
 */
const GetDocumentation = (source, node) => {
    const comments = source.getCommentsBefore(GetOwner(node));
    /**
     * 区分 JSDoc 与普通行注释。
     * @param comment 候选注释
     * @example
     * IsDocumentation(comment);
     * @returns 是否为 JSDoc 块。
     */
    const IsDocumentation = (comment) => comment.type === "Block" && comment.value.startsWith("*");
    return comments.findLast(IsDocumentation);
};

export default {
    rules: {
        "field-defaults": {
            meta: {
                type: "suggestion",
                schema: [],
                messages: { declaration: "直接默认值应放在 class 字段声明上；构造函数保留传参赋值和初始化操作。" },
            },
            /** @param context 当前规则上下文 @example // 启用 readability/field-defaults。 @returns 类访问器，仅检查无参数依赖的直接常量赋值。 */
            create(context) {
                /** @param value 赋值表达式 @example IsDirectDefault(assignment.right); @returns 是否为直接常量或空容器。 */
                const IsDirectDefault = (value) => {
                    // 仅判断没有外部依赖的值，不推断函数调用或依赖前序字段的表达式。
                    if (value.type === "Literal") {
                        return true;
                    } else if (value.type === "UnaryExpression" && value.operator === "-" && value.argument.type === "Literal") {
                        return true;
                    } else if (value.type === "ArrayExpression" && value.elements.length === 0) {
                        return true;
                    } else if (value.type === "ObjectExpression" && value.properties.length === 0) {
                        return true;
                    } else if (value.type === "NewExpression" && value.arguments.length === 0 &&
                        value.callee.type === "Identifier" && ["Map", "Set", "AbortController"].includes(value.callee.name)) {
                        return true;
                    } else {
                        return false;
                    }
                };
                /** @param node 当前类 @example CheckDefaults(cameraClass); @returns 无返回值，报告构造体顶层的直接字段默认值。 */
                const CheckDefaults = (node) => {
                    const constructor = node.body.body.find(IsConstructor);
                    // 条件分支和循环中的初始化可能依赖参数，仅检查构造体的直接语句。
                    for (const statement of constructor?.value.body?.body ?? []) {
                        // 方法调用及对子对象的设置属于绑定过程，不误判为字段声明。
                        if (statement.type === "ExpressionStatement" && statement.expression.type === "AssignmentExpression") {
                            const assignment = statement.expression;
                            const target = assignment.left;
                            // 只限制 this.field = constant；复合运算与索引写入仍属于初始化逻辑。
                            if (assignment.operator === "=" && target.type === "MemberExpression" &&
                                target.object.type === "ThisExpression" && target.computed === false && IsDirectDefault(assignment.right)) {
                                context.report({ node: statement, messageId: "declaration" });
                            }
                        }
                    }
                };
                /** @param member 候选成员 @example IsConstructor(member); @returns 是否为显式构造函数。 */
                const IsConstructor = (member) => member.kind === "constructor";
                return { ClassDeclaration: CheckDefaults };
            },
        },
        "class-layout": {
            meta: {
                type: "suggestion",
                schema: [],
                messages: {
                    before: "主类应紧跟 imports；接口、类型、辅助函数和导出放在 class 后面。",
                    primary: "默认导出的主类应排在本文件的其他 class 前面。",
                    fields: "字段声明应在构造函数与其他方法前，便于直接查看变量和默认值。",
                    constructor: "构造函数应在字段声明之后、其他方法之前。",
                },
            },
            /** @param context 当前规则上下文 @example // 启用 readability/class-layout。 @returns 顶层声明与类成员访问器。 */
            create(context) {
                /** @param node 当前程序 @example CheckProgram(program); @returns 无返回值，检查主类之前是否只有导入。 */
                const CheckProgram = (node) => {
                    const classes = node.body.filter(IsClass);
                    // 没有类的桶文件或函数模块继续采用类型、函数、导出的普通布局。
                    if (classes.length > 0) {
                        const first = classes[0];
                        // 前置声明会把主类挤到后面，禁止类型和内部辅助代码占据文件开头。
                        for (const declaration of node.body) {
                            // 主类之前只允许 import，注释不占用程序语句。
                            if (declaration.range[0] < first.range[0] && declaration.type !== "ImportDeclaration") {
                                context.report({ node: declaration, messageId: "before" });
                            }
                        }
                        const exported = node.body.find(IsDefaultExport);
                        // 命名的默认导出应优先展示；同文件辅助类放在主类之后。
                        if (exported?.declaration?.type === "Identifier" && first.id?.name !== exported.declaration.name &&
                            classes.some(MatchesDefaultClass(exported.declaration.name))) {
                            context.report({ node: first, messageId: "primary" });
                        }
                    }
                };
                /** @param node 候选声明 @example IsClass(declaration); @returns 是否为顶层类。 */
                const IsClass = (node) => node.type === "ClassDeclaration";
                /** @param node 候选声明 @example IsDefaultExport(declaration); @returns 是否为默认导出。 */
                const IsDefaultExport = (node) => node.type === "ExportDefaultDeclaration";
                /** @param name 默认导出的名称 @example const match = MatchesDefaultClass("Camera"); @returns 检查命名类的回调。 */
                const MatchesDefaultClass = (name) => {
                    /** @param node 候选类 @example match(classDeclaration); @returns 是否为默认导出对应的类。 */
                    const Matches = (node) => node.id?.name === name;
                    return Matches;
                };
                /** @param node 当前类 @example CheckClass(cameraClass); @returns 无返回值，核对字段和构造函数位置。 */
                const CheckClass = (node) => {
                    let hasConstructor = false;
                    let hasMethod = false;
                    // 字段先完整展示；构造过程随后展示；其余方法保持原有调用组织。
                    for (const member of node.body.body) {
                        // 箭头属性仍是字段，不因其值为函数而被移到方法区。
                        if (member.type === "PropertyDefinition" || member.type === "TSAbstractPropertyDefinition") {
                            // 已进入构造或方法区后再声明字段会隐藏其初始值。
                            if (hasConstructor || hasMethod) {
                                context.report({ node: member, messageId: "fields" });
                            }
                        } else if (member.kind === "constructor") {
                            // 构造函数不能被其他方法压到文件中间。
                            if (hasMethod) {
                                context.report({ node: member, messageId: "constructor" });
                            }
                            hasConstructor = true;
                        } else {
                            hasMethod = true;
                        }
                    }
                };
                return { Program: CheckProgram, ClassDeclaration: CheckClass };
            },
        },
        "function-documentation": {
            meta: {
                type: "suggestion",
                schema: [],
                messages: {
                    missing: "函数需要 JSDoc，说明用途、每个参数、@example 和 @returns。",
                    tag: "函数 JSDoc 缺少 {{tag}}。无参函数不需要虚构 @param。",
                },
            },
            /**
             * 注册函数注释检查器。
             * @param context 当前 ESLint 规则上下文
             * @example
             * // 在配置中启用 readability/function-documentation。
             * @returns 函数及接口方法节点的访问器。
             */
            create(context) {
                const source = context.sourceCode;
                /**
                 * 检查函数必需标签，参数名称必须与声明一致。
                 * @param node 当前函数节点
                 * @example
                 * Check(functionNode);
                 * @returns 无返回值；问题通过 context.report 报告。
                 */
                const Check = (node) => {
                    const comment = GetDocumentation(source, node);
                    // 缺少整段注释时只报告一次，不叠加所有缺失标签。
                    if (comment === undefined) {
                        context.report({ node, messageId: "missing" });
                    } else {
                        // @return 和 @returns 都接受，但标签后必须有说明。
                        for (const tag of ["example", "returns?"]) {
                            // 缺失标签和空标签都不能作为完整的函数说明。
                            if (new RegExp("@" + tag + "\\b\\s+\\S").test(comment.value) === false) {
                                context.report({ node, messageId: "tag", data: { tag: "@" + tag.replace("?", "") } });
                            }
                        }
                        // 逐个核对真实参数，无参函数不要求虚构 @param。
                        for (const parameter of node.params ?? node.parameters ?? []) {
                            let argument = parameter;
                            // 构造参数属性需要先取出其中的参数声明。
                            if (argument.type === "TSParameterProperty") {
                                argument = argument.parameter;
                            }
                            // 默认值不改变参数在 JSDoc 中使用的名称。
                            if (argument.type === "AssignmentPattern") {
                                argument = argument.left;
                            }
                            // 剩余参数按其标识符匹配，而不是把省略号当作名称。
                            if (argument.type === "RestElement") {
                                argument = argument.argument;
                            }
                            // 解构参数可在说明中描述整体结构，普通参数必须逐项匹配。
                            if (argument.type === "Identifier") {
                                const pattern = new RegExp("@param\\s+(?:\\{[^}]*\\}\\s+)?\\[?" + argument.name + "(?:[\\s=\\]])");
                                // 只报告当前遗漏的参数，保留已有的其他说明。
                                if (pattern.test(comment.value) === false) {
                                    context.report({ node, messageId: "tag", data: { tag: "@param " + argument.name } });
                                }
                            }
                        }
                    }
                };
                return {
                    FunctionDeclaration: Check,
                    FunctionExpression: Check,
                    ArrowFunctionExpression: Check,
                    TSDeclareFunction: Check,
                    TSMethodSignature: Check,
                    TSEmptyBodyFunctionExpression: Check,
                };
            },
        },
        "control-comment": {
            meta: {
                type: "suggestion",
                schema: [],
                messages: { missing: "请用 // 注释说明这个判断或循环的处理意图、边界或原因。" },
            },
            /**
             * 注册条件和循环的行注释检查器。
             * @param context 当前 ESLint 规则上下文
             * @example
             * // 在配置中启用 readability/control-comment。
             * @returns 控制流节点的访问器。
             */
            create(context) {
                const source = context.sourceCode;
                /**
                 * 接受紧邻判断的说明，或分支块内第一行的说明。
                 * @param node 当前条件或循环节点
                 * @example
                 * Check(ifNode);
                 * @returns 无返回值；问题通过 context.report 报告。
                 */
                const Check = (node) => {
                    const comments = source.getCommentsBefore(node);
                    const previous = comments.at(-1);
                    const body = node.consequent ?? node.body;
                    let startsWithComment = false;
                    // else if 的说明可放在对应块首，不强行拆散 else if 结构。
                    if (body?.type === "BlockStatement") {
                        const openingBrace = source.getFirstToken(body);
                        const first = source.getTokenAfter(openingBrace, { includeComments: true });
                        startsWithComment = first?.type === "Line";
                    }
                    // 远处的其他说明不能替代当前分支注释。
                    if (previous?.type === "Line" && previous.loc.end.line >= node.loc.start.line - 1) {
                        return;
                    } else if (startsWithComment) {
                        return;
                    } else {
                        context.report({ node, messageId: "missing" });
                    }
                };
                return {
                    IfStatement: Check,
                    ForStatement: Check,
                    ForOfStatement: Check,
                    ForInStatement: Check,
                    WhileStatement: Check,
                    DoWhileStatement: Check,
                    SwitchStatement: Check,
                };
            },
        },
    },
};
