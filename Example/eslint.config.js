import js from "@eslint/js";
import stylistic from "@stylistic/eslint-plugin";
import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import readability from "../eslint/readability.mjs";

export default defineConfig([
    globalIgnores(["dist/**", "lib/**", "node_modules/**", "eslint.config.js"]),
    {
        files: ["**/*.{ts,tsx}"],
        extends: [
            js.configs.recommended,
            tseslint.configs.strictTypeChecked,
            tseslint.configs.stylisticTypeChecked,
        ],
        languageOptions: {
            globals: globals.browser,
            parserOptions: {
                projectService: true,
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
            "readability/control-comment": "error",
            "@stylistic/max-statements-per-line": ["error", { max: 1 }],
            "one-var": ["error", "never"],
            "no-sequences": "error",
            "no-cond-assign": ["error", "always"],
            // 正常处理放在正向分支，不通过否定条件提前退出函数或循环。
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
    {
        files: ["**/*.{ts,tsx}"],
        extends: [reactHooks.configs.flat.recommended, reactRefresh.configs.vite],
    },
    {
        // shadcn add 命令生成的组件保持上游格式，升级或重新生成时不要求手工重写。
        files: ["src/components/ui/**/*.{ts,tsx}"],
        rules: {
            "readability/function-documentation": "off",
            "readability/control-comment": "off",
            "@stylistic/max-statements-per-line": "off",
            "@stylistic/brace-style": "off",
            "@stylistic/indent": "off",
            "@stylistic/semi": "off",
            "@stylistic/quotes": "off",
            "@stylistic/comma-dangle": "off",
            "@stylistic/object-curly-spacing": "off",
            "@stylistic/member-delimiter-style": "off",
            "react-refresh/only-export-components": "off",
        },
    },
]);
