export const BASE_URL = import.meta.env.VITE_API_URL;
export const API_URL = `${BASE_URL}/api`;

export async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem("@AgendaPro:token");

  // Se bypassApiPrefix for true, bate na raiz do servidor. Senão, usa /api.
  const baseUrlToUse = options.bypassApiPrefix ? BASE_URL : API_URL;
  const url = new URL(`${baseUrlToUse}${endpoint}`);

  if (options.params) {
    Object.entries(options.params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, value);
      }
    });
  }

  const response = await fetch(url.toString(), {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...(options.auth && token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {}),
      ...(options.headers || {}),
    },
    body: options.body,
  });

  let data = null;

  try {
    data = await response.json();
  } catch {}

  // Token expirado ou inválido
  if (response.status === 401) {
    localStorage.removeItem("@AgendaPro:token");
    localStorage.removeItem("@AgendaPro:user");

    // Evita loop caso já esteja na tela de login
    if (window.location.pathname !== "/") {
      window.location.replace("/");
    }

    throw (
      data || {
        message: "Sessão expirada. Faça login novamente.",
      }
    );
  }

  if (!response.ok) {
    throw (
      data || {
        message: "Erro na requisição",
      }
    );
  }

  return data;
}
