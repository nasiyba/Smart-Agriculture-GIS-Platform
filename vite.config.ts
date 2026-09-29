import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteStaticCopy } from "vite-plugin-static-copy";

// ArcGIS Maps SDK for JavaScript ships its own worker/asset files that need
// to be copied into the build output rather than bundled.
export default defineConfig({
  base: '/Smart-Agriculture-GIS-Platform/',
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        {
          src: "node_modules/@arcgis/core/assets/*",
          dest: "arcgis-assets",
        },
      ],
    }),
  ],
  optimizeDeps: {
    esbuildOptions: {
      target: "esnext",
    },
  },
  build: {
    target: "esnext",
  },
});
