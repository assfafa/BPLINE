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
    } else if (owner.parent?.type === "MethodDefinition" || owner.parent?.type === "PropertyDefinition") {
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
