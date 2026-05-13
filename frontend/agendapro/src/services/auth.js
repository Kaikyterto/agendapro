import { apiFetch } from "./api";

// =========================================================
// LOGIN
// =========================================================
export const loginService = async (credentials) => {
  try {
    const data = await apiFetch("/auth/login", {
      method: "POST",

      body: JSON.stringify({
        email: credentials.email,
        password: credentials.password,
      }),
    });

    return data;
  } catch (error) {
    console.error("Auth Service Error:", error);

    // =====================================================
    // PAYMENT PENDING
    // =====================================================
    if (error.message) {
      try {
        const parsed = JSON.parse(error.message);

        if (parsed.payment_pending) {
          throw parsed;
        }
      } catch {
        // ignora parse
      }
    }

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
