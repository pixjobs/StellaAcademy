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
    ignores: [
      // Default ignores
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "dist/**", // Also good to ignore the worker's build output
      "next-env.d.ts",

      // --- THIS IS THE CRITICAL FIX ---
      // Tell ESLint (and therefore `next build`) to completely
      // ignore the worker-specific code. The `**` ensures it
      // matches all subdirectories and files.
      "src/workers/**",
    ],
  },
];

export default eslintConfig;