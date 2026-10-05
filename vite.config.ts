import { copyFileSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig, type Plugin } from "vite";

function copyManifest(mode: string): Plugin {
  return {
    name: "copy-extension-manifest",
    writeBundle(options) {
      const manifest = mode === "firefox" ? "manifest.firefox.json" : "manifest.json";
      copyFileSync(resolve(__dirname, manifest), resolve(options.dir ?? "dist", "manifest.json"));
    },
  };
}

export default defineConfig(({ mode }) => ({
  plugins: [copyManifest(mode)],
  build: {
    outDir: mode === "firefox" ? "dist-firefox" : "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, "popup.html"),
        options: resolve(__dirname, "options.html"),
        "background/background": resolve(__dirname, "src/background/background.ts"),
        "content/content": resolve(__dirname, "src/content/content.ts"),
      },
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: "assets/[name].js",
        assetFileNames: "assets/[name][extname]",
      },
    },
  },
}));
