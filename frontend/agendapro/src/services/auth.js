const API_URL_AUTH = "https://agendapro-z63z.onrender.com/auth";

// =========================================================
// LOGIN
// =========================================================
export const loginService = async (credentials) => {
  const response = await fetch(`${API_URL_AUTH}/login`, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify({
      email: credentials.email.trim(),
      password: credentials.password,
    }),
  });

  const contentType = response.headers.get("content-type");

  let data;

  if (contentType?.includes("application/json")) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    throw new Error(
      data?.message ||
        data?.error ||
        data?.msg ||
        data ||
        "Erro ao realizar login"
    );
  }

  return data;
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
