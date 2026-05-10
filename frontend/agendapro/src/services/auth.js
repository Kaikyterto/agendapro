// DICA: Se você tiver um arquivo .env, use: import.meta.env.VITE_API_URL
const API_URL = "https://sua-api-aqui.com";

/**

 * @param {Object} credentials
 */
export const loginService = async (credentials) => {
  try {
    const response = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Erro ao realizar login");
    }

    return data;
  } catch (error) {
    console.error("Auth Service Error:", error.message);
    throw error;
  }
};

export const isAuthenticated = () => {
  const token = localStorage.getItem("@AgendaPro:token");
  return !!token;
};
