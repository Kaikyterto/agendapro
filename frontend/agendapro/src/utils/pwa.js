export function setupPWA(company = null) {
  const baseURL = window.location.origin;

  const isKromis =
    company?.name?.toLowerCase() === "kromis" ||
    company?.slug?.toLowerCase() === "kromis" ||
    !company;

  const manifest = {
    name: isKromis ? "Kromis" : company?.name || "Kromis",
    short_name: isKromis ? "Kromis" : company?.name || "Kromis",

    start_url: isKromis
      ? `${baseURL}/kromis`
      : company?.slug
      ? `${baseURL}/${company.slug}`
      : `${baseURL}/`,

    display: "standalone",

    background_color: company?.colors?.secondary || "#ffffff",

    theme_color: company?.colors?.primary || "#000000",

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

  console.log("MANIFEST:", manifest);
}
