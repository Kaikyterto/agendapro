// src/services/auth.js (Refatorado para usar apiFetch)
import { apiFetch } from "./api"; // IMPORTAÇÃO OBRIGATÓRIA

// =========================================================
// LOGIN
// =========================================================
export const loginService = async (credentials) => {
  // Agora usa o apiFetch centralizado
  const data = await apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email: credentials.email.trim(),
      password: credentials.password,
    }),
  });

  // O apiFetch já joga erro se (!response.ok), então 'data' aqui é seguro

  // ==========================================
  // PAGAMENTO PENDENTE (403 CONTROLADO)
  // ==========================================
  // Esta lógica precisa ser ajustada no backend para retornar 'payment_pending: true'
  // dentro do corpo da resposta 200/400 se o backend decidir usar 200 para pendente.
  // Se o backend usar 403, o apiFetch lançará o erro acima.
  if (data?.payment_pending === true) {
    return data;
  }

  // ==========================================
  // LOGIN OK
  // ==========================================
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
  // Agora usa o apiFetch centralizado
  const data = await apiFetch("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      name: payload.name,
      company_name: payload.companyName,
      email: payload.email.trim(),
      password: payload.password,
      logo: payload.logo,
    }),
  });

  return data;
};

// =========================================================
// CONSULTAR STATUS DA ASSINATURA (Para Polling do Pix da Plataforma)
// =========================================================
export const getSubscriptionStatus = (companyId) => {
  // Aponta para a rota que criamos no backend: /payments/status/<int:company_id>
  // O endpoint deve ser relativo à baseURL '/api'
  return apiFetch(`/payments/status/${companyId}`, {
    method: "GET",
    auth: true, // Requer autenticação
  });
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
