const API_URL_AUTH = "https://agendapro-z63z.onrender.com/auth";

// =========================================================
// LOGIN
// =========================================================
export const loginService = async (credentials) => {
  try {
    const response = await fetch(`${API_URL_AUTH}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: credentials.email,
        password: credentials.password,
      }),
    });

    // =====================================================
    // LEITURA ÚNICA DA RESPONSE (CORRETO)
    // =====================================================
    const contentType = response.headers.get("content-type");

    let data;

    if (contentType?.includes("application/json")) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    // =====================================================
    // ERROR HANDLING
    // =====================================================
    if (!response.ok) {
      const message =
        data?.message ||
        data?.error ||
        data?.msg ||
        data ||
        "Erro ao realizar login";

      throw new Error(message);
    }

    return data;
  } catch (error) {
    console.error("Auth Service Error:", error);
    throw error;
  }
};

// =========================================================
// AUTH CHECK
// =========================================================
export const isAuthenticated = () => {
  return !!localStorage.getItem("@AgendaPro:token");
};

// =========================================================
// LOGOUT
// =========================================================
export const logout = () => {
  localStorage.removeItem("@AgendaPro:token");
  localStorage.removeItem("@AgendaPro:user");
};
