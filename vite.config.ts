import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// GitHub Pages serves from /<repo>/. The repo name is "Matter-".
const base = process.env.VITE_BASE_PATH ?? "/Matter-/";

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["apple-touch-icon.png", "favicon.ico"],
      manifest: {
        name: "Matter Code Vault",
        short_name: "Matter Codes",
        description: "Store and organise Matter setup codes for your smart-home devices.",
        theme_color: "#0f172a",
        background_color: "#0f172a",
        display: "standalone",
        start_url: base,
        scope: base,
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" },
          {
            src: "icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
    }),
  ],
});
