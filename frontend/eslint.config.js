import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import jsdocPlugin from "eslint-plugin-jsdoc";
import globals from "globals";

export default [
  {
    ignores: [
      "dist",
      "src/__tests__/**",
      "src/**/*.d.ts",
      "coverage/**",
      "src/setupTests.ts",
    ],
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parser: tsParser,
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      jsdoc: jsdocPlugin,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": "off",
      "@typescript-eslint/no-explicit-any": "error",
      "react-hooks/set-state-in-effect": "off",
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      // JSDoc enforcement for frontend components and functions
      "jsdoc/require-jsdoc": "off",
      "jsdoc/require-description": "off",
      "jsdoc/require-param": "off",
      "jsdoc/require-param-description": "off",
      "jsdoc/require-returns": "off",
      "jsdoc/check-alignment": "warn",
      "jsdoc/check-param-names": "warn",
      "no-restricted-syntax": [
        "warn",
        {
          selector:
            "JSXAttribute[name.name='sx'] JSXProperty[value.type='Literal'][value.value=/^#[0-9a-fA-F]{3,8}$/]",
          message:
            "Do not use hardcoded hex colors in sx props. Use useTokens() or cssVariables instead.",
        },
        {
          selector:
            "JSXAttribute[value.type='Literal'][value.value=/^#[0-9a-fA-F]{3,8}$/]",
          message:
            "Do not use hardcoded hex colors in JSX. Use useTokens() or cssVariables instead.",
        },
      ],
    },
  },
];
