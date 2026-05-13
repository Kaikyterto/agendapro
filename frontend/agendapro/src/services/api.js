const API_URL = "https://agendapro-z63z.onrender.com/api";

export async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem("@AgendaPro:token");

  const res = await fetch(`${API_URL}${endpoint}`, {
    method: options.method || "GET",

    headers: {
      "Content-Type": "application/json",

      // envia token SOMENTE se existir e se for necessário
      ...(options.auth && token ? { Authorization: `Bearer ${token}` } : {}),

      ...options.headers,
    },

    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  let data;

  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    throw data || { message: "Erro na requisição" };
  }

  return data;
}
