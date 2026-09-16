import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import eslintConfigPrettier from "eslint-config-prettier";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  eslintConfigPrettier,
  // Data modules must not depend on route or UI implementations.
  {
    files: ["lib/features/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              regex: "^(?:@/|(?:\\.\\./)+)(?:app|components|features)(?:/|$)",
              message:
                "Keep domain data in lib/features; route and UI modules depend on this layer, never the reverse.",
            },
          ],
        },
      ],
    },
  },
  // App/components: prefer shared post barrel over deep module paths.
  {
    files: ["app/**/*.{ts,tsx}", "components/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              regex: "^@/lib/features/post/(post-api|post-contracts)$",
              message: "Import post data from @/lib/features/post instead of deep module paths.",
            },
          ],
        },
      ],
    },
  },
  // Feature UI: no app-route deps, and prefer shared post barrel.
  {
    files: ["features/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              regex: "^(?:@/|(?:\\.\\./)+)app(?:/|$)",
              message: "Feature modules must not import app routes or page shells.",
            },
            {
              regex: "^@/lib/features/post/(post-api|post-contracts)$",
              message: "Import post data from @/lib/features/post instead of deep module paths.",
            },
          ],
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    ".heroui-docs/**",
    ".reference/**",
    "components/icons.tsx",
  ]),
]);

export default eslintConfig;
