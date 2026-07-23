// Função auxiliar que cria e exibe o modal bonito com CSS Puro (sem depender do Tailwind na injeção)
function injectInstagramWarning(url) {
  if (document.getElementById("kromis-instagram-warning")) return;

  const overlay = document.createElement("div");
  overlay.id = "kromis-instagram-warning";

  // Estilos CSS puros e robustos embutidos para garantir a aparência
  const styles = `
    #kromis-instagram-warning-overlay {
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      width: 100% !important;
      height: 100% !important;
      background-color: rgba(0, 0, 0, 0.9) !important; /* Fundo bem escuro e semi-transparente */
      z-index: 9999999 !important; /* Garante que fique acima de tudo */
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      padding: 20px !important;
      box-sizing: border-box !important;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
      backdrop-filter: blur(5px) !important; /* Efeito de desfoque no fundo */
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
      animation: kromis-pop-in 0.3s ease-out;
    }

    @keyframes kromis-pop-in {
      0% { transform: scale(0.95); opacity: 0; }
      100% { transform: scale(1); opacity: 1; }
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

    #kromis-instagram-warning h3 {
      font-size: 18px !important;
      font-weight: 700 !important;
      margin: 0 0 8px 0 !important;
      line-height: 1.2 !important;
    }

    #kromis-instagram-warning p {
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
      transition: background-color 0.2s !important;
    }

    #kromis-open-btn {
      background: #2563eb !important;
      color: #fff !important;
    }
    #kromis-open-btn:active { background: #1d4ed8 !important; }

    #kromis-copy-btn {
      background: transparent !important;
      color: #d4d4d8 !important;
      border: 1px solid rgba(255, 255, 255, 0.2) !important;
    }
    #kromis-copy-btn:active { background: rgba(255, 255, 255, 0.1) !important; }

    #kromis-tip {
      margin-top: 16px !important;
      font-size: 12px !important;
      color: #71717a !important;
    }
  `;

  // Insere o <style> e o HTML
  overlay.innerHTML = `
    <style>${styles}</style>
    <div id="kromis-instagram-warning-overlay">
      <div id="kromis-instagram-warning-box">
        
        <div id="kromis-instagram-warning-icon-box">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ec4899" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
        </div>

        <h3>Abra no Safari</h3>
        <p>
          O navegador do Instagram bloqueia esta página. Toque no botão abaixo para abrir no Safari ou copie o link.
        </p>

        <!-- Link padrão https:// (seguro, não quebra em desktops de teste) -->
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
    </div>
  `;

  document.body.appendChild(overlay);

  // Lógica do botão de copiar
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
