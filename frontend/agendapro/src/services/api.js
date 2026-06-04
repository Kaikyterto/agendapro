const API_URL = "https://agendapro-z63z.onrender.com/api";

export async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem("@AgendaPro:token");

  const url = new URL(`${API_URL}${endpoint}`);

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

  if (!response.ok) {
    throw (
      data || {
        message: "Erro na requisição",
      }
    );
  }

  return data;
}
