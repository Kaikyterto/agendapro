export function setupPWA(company = null) {
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;
  const isInAppInstagram = isIOS && /Instagram/.test(userAgent);

  // Se estiver no Instagram do iPhone, o WebKit bloqueia PWA.
  // Aqui você pode disparar um aviso visual para o usuário abrir no Safari.
  if (isInAppInstagram) {
    console.warn(
      "Usuário acessando via Instagram no iOS. PWA restrito pelo in-app browser."
    );

    // Opcional: Você pode disparar um evento ou alterar o estado da UI para
    // mostrar um banner dizendo: "Toque nos três pontinhos (...) acima e escolha 'Abrir no Navegador'"
    return;
  }

  const baseURL = window.location.origin;
  const path = window.location.pathname;

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
