const API_URL = "https://agendapro-z63z.onrender.com/api";

export async function apiFetch(endpoint, options = {}) {
  const res = await fetch(`${API_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",

      ...options.headers,
    },

    ...options,
  });

  // =======================================================
  // TENTA PEGAR JSON
  // =======================================================
  let data;

  try {
    data = await res.json();
  } catch {
    data = null;
  }

  // =======================================================
  // ERROR
  // =======================================================
  if (!res.ok) {
    throw (
      data || {
        message: "Erro na requisição",
      }
    );
  }

  // =======================================================
  // SUCCESS
  // =======================================================
  return data;
}
