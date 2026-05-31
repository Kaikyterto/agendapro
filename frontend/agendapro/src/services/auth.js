const API_URL = "https://agendapro-z63z.onrender.com";

// =========================================================
// LOGIN
// =========================================================
export const loginService = async (credentials) => {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify({
      email: credentials.email.trim(),
      password: credentials.password,
    }),
  });

  const data = await parseResponse(response);

  if (!response.ok) {
    throw new Error(
      data?.error || data?.message || data?.msg || "Erro ao realizar login"
    );
  }

  // salva token (IMPORTANTE)
  if (data?.access_token) {
    localStorage.setItem("@AgendaPro:token", data.access_token);
  }

  if (data?.user) {
    localStorage.setItem("@AgendaPro:user", JSON.stringify(data.user));
  }

  if (data?.company) {
    localStorage.setItem("@AgendaPro:company", JSON.stringify(data.company));
  }

  return data;
};

// =========================================================
// REGISTER
// =========================================================
export const registerService = async (payload) => {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify({
      name: payload.name,
      company_name: payload.companyName,
      email: payload.email.trim(),
      password: payload.password,
    }),
  });

  const data = await parseResponse(response);

  if (!response.ok) {
    throw new Error(
      data?.error || data?.message || data?.msg || "Erro ao criar conta"
    );
  }

  return data;
};

// =========================================================
// PARSE RESPONSE (ROBUSTO)
// =========================================================
const parseResponse = async (response) => {
  const contentType = response.headers.get("content-type");

  if (contentType?.includes("application/json")) {
    return await response.json();
  }

  return await response.text();
};

// =========================================================
// AUTH CHECK
// =========================================================
export const isAuthenticated = () => {
  return Boolean(localStorage.getItem("@AgendaPro:token"));
};

// =========================================================
// LOGOUT
// =========================================================
export const logout = () => {
  localStorage.removeItem("@AgendaPro:token");
  localStorage.removeItem("@AgendaPro:user");
  localStorage.removeItem("@AgendaPro:company");
};
