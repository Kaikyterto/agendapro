import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { registerSW } from "virtual:pwa-register";

import App from "./App";
import "./index.css";

// ===============================
// REGISTRA O PWA APENAS FORA DO
// INSTAGRAM NO IOS
// ===============================
const ua = navigator.userAgent;

const isIOS =
  /iPad|iPhone|iPod/.test(ua) ||
  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

const isInstagram = /Instagram/i.test(ua);

if (!(isIOS && isInstagram)) {
  registerSW({
    onNeedRefresh() {
      console.log("Nova versão do Kromis disponível");
    },

    onOfflineReady() {
      console.log("Kromis pronto para funcionar offline");
    },
  });
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
