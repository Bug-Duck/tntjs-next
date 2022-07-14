import typescript from "@rollup/plugin-typescript";
import { terser } from "rollup-plugin-terser";

/**
 * @type {import('rollup').RollupOptions}
 */
const config = {
  input: "./src/index.ts",
  output: {
    file: "./dist/tnt.min.js",
    format: "iife",
    name: "TNT",
    sourcemap: true,
  },
  watch: {
    exclude: ["*.html"],
  },
  plugins: [typescript(), terser()],
};

export default config;
