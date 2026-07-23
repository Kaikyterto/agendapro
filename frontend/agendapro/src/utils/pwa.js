export function setupPWA(company = null) {
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;
  const isInAppInstagram = isIOS && /Instagram/.test(userAgent);

  const baseURL = window.location.origin;
  const path = window.location.pathname;
  const currentFullUrl = window.location.href;

  // Se estiver no Instagram do iOS, injeta o aviso visual na tela
  if (isInAppInstagram) {
    injectInstagramWarning(currentFullUrl);
    return; // Para a execução do PWA para evitar erros no WebKit
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

// Função auxiliar que cria e exibe o modal bonito com Tailwind
function injectInstagramWarning(url) {
  if (document.getElementById("kromis-instagram-warning")) return;

  // Transforma o link de https:// para o esquema que tenta forçar o Safari no iOS
  const safariSchemeUrl = url.replace(/^https?:\/\//, "x-safari-https://");

  const overlay = document.createElement("div");
  overlay.id = "kromis-instagram-warning";
  overlay.innerHTML = `
    <div style="position: fixed; inset: 0; background-color: rgba(0, 0, 0, 0.85); z-index: 99999; display: flex; align-items: center; justify-content: center; padding: 20px; font-family: system-ui, -apple-system, sans-serif;">
      <div style="background: #18181b; color: #fff; width: 100%; max-width: 360px; border-radius: 16px; padding: 24px; text-align: center; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); border: 1px solid rgba(255, 255, 255, 0.1);">
        
        <div style="width: 48px; height: 48px; background: rgba(236, 72, 153, 0.15); border-radius: 12px; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px auto;">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ec4899" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
        </div>

        <h3 style="font-size: 18px; font-weight: 600; margin-bottom: 8px;">Abra no Safari</h3>
        <p style="font-size: 14px; color: #a1a1aa; line-height: 1.5; margin-bottom: 20px;">
          O navegador do Instagram impede recursos importantes desta página. Toque no botão abaixo para abrir no Safari ou copie o link.
        </p>

        <a href="${safariSchemeUrl}" style="display: block; width: 100%; background: #2563eb; color: #fff; font-weight: 600; font-size: 14px; padding: 12px; border-radius: 8px; text-decoration: none; margin-bottom: 10px; box-sizing: border-box;">
          Abrir no Safari agora
        </a>

        <button id="kromis-copy-btn" style="display: block; width: 100%; background: transparent; color: #d4d4d8; font-weight: 500; font-size: 14px; padding: 10px; border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.2); cursor: pointer;">
          Copiar Link da Página
        </button>

        <div style="margin-top: 16px; font-size: 12px; color: #71717a;">
          Dica: Você também pode tocar nos <strong>três pontinhos (...)</strong> acima e escolher "Abrir no Navegador".
        </div>

      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  document.getElementById("kromis-copy-btn").addEventListener("click", () => {
    navigator.clipboard.writeText(url).then(() => {
      const btn = document.getElementById("kromis-copy-btn");
      btn.textContent = "Link copiado com sucesso! ✅";
      btn.style.color = "#4ade80";
      btn.style.borderColor = "#4ade80";
      setTimeout(() => {
        btn.textContent = "Copiar Link da Página";
        btn.style.color = "#d4d4d8";
        btn.style.borderColor = "rgba(255, 255, 255, 0.2)";
      }, 3000);
    });
  });
}
