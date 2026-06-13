import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import jsdocPlugin from "eslint-plugin-jsdoc";
import vitest from "eslint-plugin-vitest";
import globals from "globals";

export default [
  {
    ignores: [
      "dist",
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
  {
    files: ["**/*.test.ts", "**/*.test.tsx", "**/*.spec.ts", "**/*.spec.tsx"],
    plugins: { vitest },
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "no-unused-vars": "off",
      "react-hooks/rules-of-hooks": "off",
      // ERRORS: These rules cause CI to fail if violated
      "vitest/no-focused-tests": "error", // Prevents test.only / it.only from being committed
      "vitest/no-disabled-tests": "warn", // Warns on test.skip, xtest, xit
      "vitest/expect-expect": "error", // Every test must contain at least one expect()
      "vitest/no-identical-title": "error", // No two tests in the same describe can have the same name
      "vitest/valid-describe-callback": "error", // describe() must use a function, not an arrow function with return
      "vitest/valid-expect": "error", // expect() must be called with an assertion method
      "vitest/no-conditional-expect": "warn", // expect() inside if/else is fragile

      // WARNINGS: Code style (will become errors in a future quarter)
      "vitest/prefer-to-be": "warn", // Prefer toBe over toEqual for primitives
      "vitest/prefer-to-have-length": "warn", // Prefer toHaveLength over .length === n
      "vitest/consistent-test-it": ["warn", { fn: "it" }], // Enforce 'it' over 'test' consistently
    },
  },
];
