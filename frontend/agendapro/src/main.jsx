import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { registerSW } from "virtual:pwa-register";

import App from "./App";
import "./index.css";

// ===============================
// DETECTA NAVEGADORES INTEGRADOS
// ===============================
const userAgent = navigator.userAgent;

const isInAppBrowser = /Instagram|FBAN|FBAV/i.test(userAgent);

// ===============================
// PWA SERVICE WORKER
// ===============================
if (!isInAppBrowser) {
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
