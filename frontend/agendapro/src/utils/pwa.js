export function setupPWA(company = null) {
  const baseURL = window.location.origin;

  const path = window.location.pathname;

  // Remove barras e pega o primeiro segmento da URL
  const slug = path.split("/").filter(Boolean)[0];

  // Se não existe slug, está na raiz "/"
  const isKromis = !slug;

  const manifest = {
    name: isKromis ? "Kromis" : company?.name || "Kromis",

    short_name: isKromis ? "Kromis" : company?.name || "Kromis",

    start_url: isKromis
      ? `${baseURL}/`
      : `${baseURL}/${company.slug}`,

    display: "standalone",

    background_color: isKromis
      ? "#ffffff"
      : company?.colors?.secondary || "#ffffff",

    theme_color: isKromis
      ? "#000000"
      : company?.colors?.primary || "#000000",

    icons: [
      {
        src: isKromis
          ? `${baseURL}/logo-kromis.png`
          : company?.logo || `${baseURL}/logo-kromis.png`,
        sizes: "1024x1024",
        type: "image/png",
        purpose: "any maskable",
      },
    ],
  };

  const manifestJSON = JSON.stringify(manifest);

  const blob = new Blob([manifestJSON], {
    type: "application/manifest+json",
  });

  const manifestURL = URL.createObjectURL(blob);

  let link = document.querySelector('link[rel="manifest"]');

  if (!link) {
    link = document.createElement("link");
    link.rel = "manifest";
    document.head.appendChild(link);
  }

  link.href = manifestURL;

  console.log("PWA MANIFEST:", manifest);
}
