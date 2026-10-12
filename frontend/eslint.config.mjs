import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// eslint-config-next 16 ships flat configs, so they are spread in directly.
// (Wrapping them in FlatCompat, as this file used to, crashes with a circular-structure error.)
const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores(["node_modules/**", ".next/**", "out/**", "build/**", "dist/**", "next-env.d.ts"]),
  // Components from the earlier "mission control" build that no page imports any more.
  // They are kept out of the lint run until they are either deleted or brought back.
  globalIgnores([
    "src/components/DreamySolarSystem.tsx",
    "src/components/ImageSelector.tsx",
    "src/components/InteractiveFormula.tsx",
    "src/components/IntroOverlay.tsx",
    "src/components/MathFormula.tsx",
    "src/components/missions/**",
    "src/components/study/ConceptStepper.tsx",
    "src/components/study/StudyModuleCard.tsx",
    "src/components/study/VariableHighlighter.tsx",
    "src/lib/notes/**",
  ]),
  // Tool configuration files are CommonJS.
  { files: ["*.js"], rules: { "@typescript-eslint/no-require-imports": "off" } },
]);

export default eslintConfig;
