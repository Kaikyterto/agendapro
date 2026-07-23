import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";

import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import PaymentPage from "./pages/PaymentPage";

import HomePage from "./pages/HomePage";

import CompanyProductsPage from "./pages/CompanyProductsPage";
import CompanyBookingPage from "./pages/CompanyBookingPage";

import AdminHomePage from "./pages/AdminHomePage";
import AdminBookingPage from "./pages/AdminBookingPage";
import AdminProductsPage from "./pages/AdminProductsPage";
import AdminWorkersPage from "./pages/AdminWorkersPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import AdminSettingsPage from "./pages/AdminSettingsPage";
import AdminServicesPage from "./pages/AdminServicesPage";
import AdminDesignPage from "./pages/AdminDesignPage";
import AdminSalesHistoryPage from "./pages/AdminSalesHistoryPage";

function initInstagramWarningGuard() {
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;
  const isInAppInstagram = isIOS && /Instagram/.test(userAgent);

  if (!isInAppInstagram) return;

  const currentFullUrl = window.location.href;

  const styleId = "kromis-instagram-styles";
  if (!document.getElementById(styleId)) {
    const styleSheet = document.createElement("style");
    styleSheet.id = styleId;
    styleSheet.textContent = `
      #kromis-instagram-warning-overlay {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        background-color: rgba(0, 0, 0, 0.98) !important;
        z-index: 2147483647 !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        padding: 20px !important;
        box-sizing: border-box !important;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
        margin: 0 !important;
      }
      #kromis-instagram-warning-box {
        background: #18181b !important;
        color: #fff !important;
        width: 100% !important;
        max-width: 360px !important;
        border-radius: 16px !important;
        padding: 24px !important;
        text-align: center !important;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.8) !important;
        border: 1px solid rgba(255, 255, 255, 0.15) !important;
      }
      #kromis-instagram-warning-icon-box {
        width: 48px !important;
        height: 48px !important;
        background: rgba(236, 72, 153, 0.15) !important;
        border-radius: 12px !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        margin: 0 auto 16px auto !important;
      }
      #kromis-instagram-warning-overlay h3 {
        font-size: 18px !important;
        font-weight: 700 !important;
        margin: 0 0 8px 0 !important;
        color: #fff !important;
      }
      #kromis-instagram-warning-overlay p {
        font-size: 14px !important;
        color: #a1a1aa !important;
        line-height: 1.5 !important;
        margin: 0 0 20px 0 !important;
      }
      .kromis-btn {
        display: block !important;
        width: 100% !important;
        font-weight: 600 !important;
        font-size: 14px !important;
        padding: 12px 16px !important;
        border-radius: 8px !important;
        text-decoration: none !important;
        margin-bottom: 10px !important;
        box-sizing: border-box !important;
        text-align: center !important;
        cursor: pointer !important;
        border: none !important;
      }
      #kromis-open-btn {
        background: #2563eb !important;
        color: #fff !important;
      }
      #kromis-copy-btn {
        background: transparent !important;
        color: #d4d4d8 !important;
        border: 1px solid rgba(255, 255, 255, 0.2) !important;
      }
      #kromis-tip {
        margin-top: 16px !important;
        font-size: 12px !important;
        color: #71717a !important;
      }
    `;
    document.head.appendChild(styleSheet);
  }

  const renderModal = () => {
    if (document.getElementById("kromis-instagram-warning-overlay")) return;

    const overlay = document.createElement("div");
    overlay.id = "kromis-instagram-warning-overlay";
    overlay.innerHTML = `
      <div id="kromis-instagram-warning-box">
        <div id="kromis-instagram-warning-icon-box">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ec4899" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
        </div>

        <h3>Abra no Safari</h3>
        <p>
          O navegador do Instagram bloqueia esta página. Toque no botão abaixo para abrir no Safari ou copie o link.
        </p>

        <a href="${currentFullUrl}" target="_blank" rel="noopener noreferrer" class="kromis-btn" id="kromis-open-btn">
          Abrir no Navegador Externo
        </a>

        <button id="kromis-copy-btn" class="kromis-btn">
          Copiar Link da Página
        </button>

        <div id="kromis-tip">
          Dica: Você também pode tocar nos <strong>três pontinhos (...)</strong> acima e escolher "Abrir no Navegador".
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    document
      .getElementById("kromis-copy-btn")
      ?.addEventListener("click", () => {
        navigator.clipboard.writeText(currentFullUrl).then(() => {
          const btn = document.getElementById("kromis-copy-btn");
          const originalText = btn.textContent;
          btn.textContent = "Link copiado com sucesso! ✅";
          btn.style.color = "#4ade80";
          btn.style.borderColor = "#4ade80";
          setTimeout(() => {
            btn.textContent = originalText;
            btn.style.color = "#d4d4d8";
            btn.style.borderColor = "rgba(255, 255, 255, 0.2)";
          }, 3000);
        });
      });
  };

  if (document.body) renderModal();

  const observer = new MutationObserver(() => {
    if (!document.getElementById("kromis-instagram-warning-overlay")) {
      renderModal();
    }
  });

  if (document.body) {
    observer.observe(document.body, { childList: true, subtree: true });
  }
}

export default function App() {
  useEffect(() => {
    initInstagramWarningGuard();
  }, []);

  return (
    <Routes>
      {/* ============================================= */}
      {/* AUTH & INSTITUTIONAL (ROTAS ESTÁTICAS PRIMEIRO) */}
      {/* ============================================= */}
      <Route path="/" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/payment" element={<PaymentPage />} />

      {/* ============================================= */}
      {/* ADMIN (MULTI-TENANT COM SLUG) */}
      {/* ============================================= */}
      <Route path="/admin/:slug" element={<AdminHomePage />} />
      <Route path="/admin/:slug/agendamentos" element={<AdminBookingPage />} />
      <Route path="/admin/:slug/produtos" element={<AdminProductsPage />} />
      <Route path="/admin/:slug/servicos" element={<AdminServicesPage />} />
      <Route path="/admin/:slug/funcionarios" element={<AdminWorkersPage />} />
      <Route path="/admin/:slug/vendas" element={<AdminDashboardPage />} />
      <Route path="/admin/:slug/design" element={<AdminDesignPage />} />
      <Route
        path="/admin/:slug/historico"
        element={<AdminSalesHistoryPage />}
      />
      <Route
        path="/admin/:slug/configuracoes"
        element={<AdminSettingsPage />}
      />

      <Route path="/:slug" element={<HomePage />} />
      <Route path="/:slug/produtos" element={<CompanyProductsPage />} />
      <Route path="/:slug/agendar" element={<CompanyBookingPage />} />
    </Routes>
  );
}
