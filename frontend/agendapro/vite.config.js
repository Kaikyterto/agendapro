import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),

    VitePWA({
      registerType: "autoUpdate",

      manifest: false,

      injectRegister: false,

      strategies: "injectManifest",

      srcDir: "src",
      filename: "sw.js",
    }),
  ],
});
