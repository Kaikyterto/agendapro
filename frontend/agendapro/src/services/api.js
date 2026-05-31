const API_URL = "https://agendapro-z63z.onrender.com/api";

export async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem("@AgendaPro:token");

  const response = await fetch(`${API_URL}${endpoint}`, {
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
  } catch {
    // resposta sem json
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
