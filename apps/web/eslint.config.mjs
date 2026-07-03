import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [".next/**", "out/**", "build/**", "next-env.d.ts"],
  },
  {
    rules: {
      // Loosely-typed dynamic API payloads (reports, comparisons, dashboard
      // aggregates) intentionally use `any` rather than duplicating backend
      // response shapes that don't have a stable frontend contract.
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
];

export default eslintConfig;
