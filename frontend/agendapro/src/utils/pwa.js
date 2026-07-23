export function setupPWA(company = null) {
  // Garante que o código só vai rodar quando a página estiver totalmente carregada no celular
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => executePWA(company));
  } else {
    executePWA(company);
  }
}

function executePWA(company) {
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;
  const isInAppInstagram = isIOS && /Instagram/.test(userAgent);

  const baseURL = window.location.origin;
  const path = window.location.pathname;
  const currentFullUrl = window.location.href;

  // Se estiver no Instagram do iOS, injeta o aviso visual na tela de forma segura
  if (isInAppInstagram) {
    injectInstagramWarning(currentFullUrl);
    return;
  }

  const isKromis = path === "/" || path === "";

  const manifest = {
    name: isKromis ? "Kromis" : company?.name || "Kromis",
    short_name: isKromis ? "Kromis" : company?.name || "Kromis",
    start_url: `${baseURL}${path}`,
    scope: isKromis ? "/" : `/${company?.slug || path.replace("/", "")}`,
    display: "standalone",
    background_color: isKromis
      ? "#ffffff"
      : company?.colors?.secondary || "#ffffff",
    theme_color: isKromis ? "#000000" : company?.colors?.primary || "#000000",
    icons: [
      {
        src: isKromis
          ? `${baseURL}/logo-kromis.png`
          : company?.logo || `${baseURL}/logo-kromis.png`,
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable",
      },
    ],
  };

  const manifestJSON = JSON.stringify(manifest);
  const manifestURL = `data:application/manifest+json;charset=utf-8,${encodeURIComponent(
    manifestJSON
  )}`;

  let link = document.querySelector('link[rel="manifest"]');

  if (!link) {
    link = document.createElement("link");
    link.rel = "manifest";
    document.head.appendChild(link);
  }

  link.href = manifestURL;
}

function injectInstagramWarning(url) {
  if (document.getElementById("kromis-instagram-warning-overlay")) return;

  // 1. Injetar o CSS no HEAD
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
        background-color: rgba(0, 0, 0, 0.95) !important;
        z-index: 2147483647 !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        padding: 20px !important;
        box-sizing: border-box !important;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
        backdrop-filter: blur(5px) !important;
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
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5) !important;
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

  // 2. Criar e Injetar o HTML diretamente após o carregamento seguro
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

      <a href="${url}" target="_blank" rel="noopener noreferrer" class="kromis-btn" id="kromis-open-btn">
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

  // 3. Ação do botão de copiar
  document.getElementById("kromis-copy-btn").addEventListener("click", () => {
    navigator.clipboard.writeText(url).then(() => {
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
}
