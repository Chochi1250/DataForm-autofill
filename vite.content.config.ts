import { resolve } from "node:path";
import { defineConfig } from "vite";

// Chrome MV3 content scripts are classic scripts, not ES modules. Building this
// entry separately as a single IIFE keeps all of its dependencies in one file.
export default defineConfig(({ mode }) => ({
  build: {
    outDir: mode === "firefox" ? "dist-firefox" : "dist",
    emptyOutDir: false,
    lib: {
      entry: resolve(__dirname, "src/content/content.ts"),
      formats: ["iife"],
      name: "JobFormContent",
      fileName: () => "content/content.js",
    },
  },
}));
