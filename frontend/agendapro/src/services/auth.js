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

    let data;

    try {
      data = await response.json();
    } catch {
      data = null;
    }

    // =====================================================
    // ERROR
    // =====================================================
    if (!response.ok) {
      let errorMessage = "Erro ao realizar login";

      try {
        const errorData = await response.json();

        errorMessage =
          errorData?.message ||
          errorData?.error ||
          errorData?.msg ||
          errorMessage;
      } catch (e) {
        // resposta não era JSON
        errorMessage = (await response.text()) || errorMessage;
      }

      throw new Error(errorMessage);
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
  const token = localStorage.getItem("@AgendaPro:token");

  return !!token;
};

// =========================================================
// LOGOUT
// =========================================================
export const logout = () => {
  localStorage.removeItem("@AgendaPro:token");

  localStorage.removeItem("@AgendaPro:user");
};
