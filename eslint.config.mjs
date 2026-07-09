import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // react-hooks/purity and react-hooks/immutability (added for React
  // Compiler readiness) assume plain React DOM components. React Three
  // Fiber's whole animation model is the documented exception: `useFrame`
  // is expected to mutate refs/camera/materials directly every frame
  // instead of going through setState (that's the point — it avoids a
  // React re-render per frame), and one-off randomized seed data in a
  // `useMemo(..., [])` is a standard, safe R3F pattern despite calling
  // `Math.random()`. Scoped to the R3F scene files only.
  // `components/scene/**` is the home page's global R3F canvas (SceneCanvas,
  // SceneBackground, VolumetricCard — replaces the old WaveBackground.tsx),
  // same reasoning as `components/dwh/**`.
  {
    files: ["components/dwh/**/*.tsx", "components/scene/**/*.tsx"],
    rules: {
      "react-hooks/purity": "off",
      "react-hooks/immutability": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
