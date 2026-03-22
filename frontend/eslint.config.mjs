import js from "@eslint/js";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import jsdocPlugin from "eslint-plugin-jsdoc";
import globals from "globals";

export default [
  { ignores: ["dist", "src/__tests__/**"] },
  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parser: tsParser
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      jsdoc: jsdocPlugin
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      // JSDoc enforcement for frontend components and functions
      "jsdoc/require-jsdoc": ["warn", {
        require: {
          FunctionDeclaration: true,
          MethodDefinition: true,
          ClassDeclaration: true,
          ArrowFunctionExpression: false,
          FunctionExpression: false
        },
        publicOnly: false,
        contexts: [
          "ExportDefaultDeclaration > ArrowFunctionExpression",
          "ExportNamedDeclaration > VariableDeclaration > VariableDeclarator > ArrowFunctionExpression"
        ]
      }],
      "jsdoc/require-description": "warn",
      "jsdoc/require-param": "warn",
      "jsdoc/require-param-description": "warn",
      "jsdoc/require-returns": "warn",
      "jsdoc/check-alignment": "warn",
      "jsdoc/check-param-names": "warn",
      "@typescript-eslint/no-explicit-any": "warn"
    }
  }
];
