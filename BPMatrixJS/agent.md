# 包与入口 Package

目录：`bpmatrixjs/.`

## 1. 文件结构与作用

包入口、源码目录、构建配置与导出路径。

| 文件 / 子目录 | 作用 |
| --- | --- |
| `eslint.config.js` | 严格类型、可读性、类布局与格式检查配置。 |
| `index.html` | 本目录维护的配置、资源或验证文件。 |
| `package-lock.json` | 本目录维护的配置、资源或验证文件。 |
| `package.json` | npm 版本、依赖、脚本、files 与 exports 的发布契约。 |
| `README.md` | 本目录维护的配置、资源或验证文件。 |
| `releases/` | 对应 npm 版本的变更说明。 详见该目录的 agent.md。 |
| `src/` | 包入口、源码目录、构建配置与导出路径。 详见该目录的 agent.md。 |
| `tests/` | 数学、几何、字体与边界行为的 Node 检查。 详见该目录的 agent.md。 |
| `tsconfig.eslint.json` | TypeScript 检查/声明生成范围和编译选项。 |
| `tsconfig.json` | TypeScript 检查/声明生成范围和编译选项。 |
| `tsconfig.lib.json` | TypeScript 检查/声明生成范围和编译选项。 |
| `vite.config.ts` | 应用或 ESM 库构建入口、资源处理与输出规则。 |

## 2. index 入口、案例与类接口

本目录是 npm 包根。源码入口为 `src/scripts/index.ts`，安装后的入口为 `lib/index.js`，声明入口为 `lib/index.d.ts`。

```sh
npm run check
npm run build:lib
npm run pack:check
```

## 3. 其他源码文件

### 文件：eslint.config.js


### 导出关系

```ts
export default tseslint.config(
    {
        ignores: ["dist/**", "lib/**", "node_modules/**", "eslint.config.js"],
    },
    js.configs.recommended,
    ...typedConfigs,
    {
        files: ["**/*.ts"],
        languageOptions: {
            ecmaVersion: "latest",
            sourceType: "module",
            globals: globals.browser,
            parserOptions: {
                project: "./tsconfig.eslint.json",
                tsconfigRootDir: import.meta.dirname,
            },
        },
        plugins: {
            "@stylistic": stylistic,
            readability,
        },
        rules: {
            "no-ternary": "error",
            "curly": ["error", "all"],
            "no-negated-condition": "off",
            "no-else-return": "off",
            "readability/function-documentation": "error",
            "readability/class-layout": "error",
            "readability/field-defaults": "error",
            "readability/control-comment": "error",
            "@stylistic/max-statements-per-line": ["error", { max: 1 }],
            "one-var": ["error", "never"],
            "no-sequences": "error",
            "no-cond-assign": ["error", "always"],
            // 否定条件不要作为提前退出的守卫，使用正向 if 和 else 分支。
            "no-restricted-syntax": [
                "error",
                {
                    selector: "IfStatement:matches([test.operator='!'], [test.operator='!='], [test.operator='!==']) > :matches(ReturnStatement, BreakStatement, ContinueStatement).consequent",
                    message: "请使用正向 if 条件，在 else 中 return、break 或 continue，不要通过否定条件提前退出。",
                },
                {
                    selector: "IfStatement:matches([test.operator='!'], [test.operator='!='], [test.operator='!==']) > BlockStatement.consequent > :matches(ReturnStatement, BreakStatement, ContinueStatement)",
                    message: "请使用正向 if 条件，在 else 中 return、break 或 continue，不要通过否定条件提前退出。",
                },
            ],
            "@stylistic/brace-style": ["error", "1tbs", { allowSingleLine: false }],
            "@stylistic/indent": ["error", 4],
            "@stylistic/semi": ["error", "always"],
            "@stylistic/quotes": ["error", "double"],
            "@stylistic/comma-dangle": ["error", "always-multiline"],
            "@stylistic/object-curly-spacing": ["error", "always"],
            "@stylistic/member-delimiter-style": [
                "error",
                {
                    multiline: {
                        delimiter: "semi",
                        requireLast: true,
                    },
                    singleline: {
                        delimiter: "semi",
                        requireLast: false,
                    },
                    multilineDetection: "brackets",
                },
            ],
            "@typescript-eslint/no-extraneous-class": "off",
            "@typescript-eslint/no-inferrable-types": "off",
            "@typescript-eslint/no-confusing-void-expression": "off",
            "@typescript-eslint/no-unnecessary-boolean-literal-compare": "off",
        },
    },
);
```

### 文件：vite.config.ts


### 导出关系

```ts
export default defineConfig({
    resolve: {
        alias: {
            "@": fileURLToPath(new URL("./src", import.meta.url)),
        },
    },
    server: {
        host: "0.0.0.0",
        port: 12111,
        strictPort: true,
        https,
        fs: {
            deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**", "**/.certs/**", "**/*.{key,csr,p12,pfx}"],
        },
    },
});
```

## 4. 注意事项

- 源码按 imports、class（字段/构造/方法）、类型、辅助函数、exports 排列；独立默认值写在字段声明上，构造函数保留参数赋值和初始化绑定。
- agent.md 的符号与默认值由源码生成；修改后执行 `npm run guides`，检查时执行 `npm run guides:check`。人工补充请写在 agent-notes 标记之间，重新生成会保留。
- 库构建把 src/scripts 的目录说明复制到 lib 同名目录；TS 对应 JS/声明，WGSL 作为导入资源编译。Examples 说明只保留在源码，不进入 npm。

<!-- agent-notes:start -->
暂无额外目录约定。
<!-- agent-notes:end -->

## 5. 中英文搜索关键词

```xml
<keywords language="zh">项目 包 入口 构建 导出</keywords>
<keywords language="en">package entry source build exports</keywords>
```
