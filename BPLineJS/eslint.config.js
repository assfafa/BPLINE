import js from "@eslint/js";
import stylistic from "@stylistic/eslint-plugin";
import globals from "globals";
import tseslint from "typescript-eslint";
import readability from "../eslint/readability.mjs";

const typedConfigs = [
    ...tseslint.configs.strictTypeChecked,
    ...tseslint.configs.stylisticTypeChecked,
].map((config) => ({
    ...config,
    files: ["**/*.ts"],
}));

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
