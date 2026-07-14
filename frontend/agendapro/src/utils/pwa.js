export function setupPWA(company) {
  const manifest = {
    name: company.name,
    short_name: company.name,

    start_url: window.location.pathname,

    display: "standalone",

    background_color: company.colors?.secondary || "#ffffff",

    theme_color: company.colors?.primary || "#000000",

    icons: [
      {
        src: company.logo,
        sizes: "512x512",
        type: "image/png",
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
