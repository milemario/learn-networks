import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  base: "/learn-networks/",
  plugins: [react()],
  resolve: {
    alias: { "@": root },
  },
  build: {
    outDir: "dist-github",
    emptyOutDir: true,
  },
});
