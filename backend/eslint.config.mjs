import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import jsdocPlugin from "eslint-plugin-jsdoc";

export default [
  {
    files: ["src/**/*.ts"],
    ignores: ["src/__tests__/**", "src/index.d.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: { project: "./tsconfig.json" }
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
      jsdoc: jsdocPlugin
    },
    rules: {
      // JSDoc comment enforcement
      "jsdoc/require-jsdoc": ["warn", {
        require: {
          FunctionDeclaration: true,
          MethodDefinition: true,
          ClassDeclaration: true,
          ArrowFunctionExpression: false,
          FunctionExpression: true
        },
        publicOnly: false,
        checkConstructors: true
      }],
      "jsdoc/require-description": ["warn", { descriptionStyle: "body" }],
      "jsdoc/require-param": "warn",
      "jsdoc/require-param-description": "warn",
      "jsdoc/require-returns": "warn",
      "jsdoc/require-returns-description": "warn",
      "jsdoc/valid-types": "warn",
      "jsdoc/check-alignment": "warn",
      "jsdoc/check-param-names": "warn",
      // General TS rules
      "@typescript-eslint/no-explicit-any": "warn"
    }
  }
];
