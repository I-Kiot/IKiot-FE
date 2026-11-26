import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    settings: {
      'import/resolver': {
        typescript: {},
        node: {
          paths: ['src'],
          extensions: ['.js', '.jsx', '.ts', '.tsx']
        }
      }
    }
  },
  // Ghi đè danh sách bỏ qua mặc định của eslint-config-next.
  globalIgnores([
    // Danh sách bỏ qua mặc định của eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
