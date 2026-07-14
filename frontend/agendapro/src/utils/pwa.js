export function setupPWA(company = null) {
  const isKromis =
    company?.name?.toLowerCase() === "kromis" ||
    company?.slug?.toLowerCase() === "kromis" ||
    !company;

  const manifest = {
    name: isKromis ? "Kromis" : company.name,
    short_name: isKromis ? "Kromis" : company.name,

    start_url: "/",

    display: "standalone",

    background_color: company?.colors?.secondary || "#ffffff",

    theme_color: company?.colors?.primary || "#000000",

    icons: [
      {
        src: isKromis ? "/kromis-logo.png" : company.logo,
        sizes: "1024x1024",
        type: "image/png",
        purpose: "any maskable",
      },
    ],
  };

  const blob = new Blob([JSON.stringify(manifest)], {
    type: "application/json",
  });

  const manifestURL = URL.createObjectURL(blob);

  let link = document.querySelector('link[rel="manifest"]');

  if (!link) {
    link = document.createElement("link");
    link.rel = "manifest";
    document.head.appendChild(link);
  }

  link.href = manifestURL;
}
