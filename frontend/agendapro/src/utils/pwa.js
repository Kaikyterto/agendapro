export function setupPWA(company = null) {
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

  const manifestURL = `data:application/manifest+json;charset=utf-8,${encodeURIComponent(
    JSON.stringify(manifest)
  )}`;

  let link = document.querySelector('link[rel="manifest"]');

  if (!link) {
    link = document.createElement("link");
    link.rel = "manifest";
    document.head.appendChild(link);
  }

  link.href = manifestURL;
}
