import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

// Static entry points: the landing (index.html), the docs page (docs.html), and the
// contact page (contact.html). Real files → robust on any static host, no SPA fallback needed.
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, "index.html"),
        docs: resolve(import.meta.dirname, "docs.html"),
        contact: resolve(import.meta.dirname, "contact.html"),
        license: resolve(import.meta.dirname, "license.html"),
      },
    },
  },
});
