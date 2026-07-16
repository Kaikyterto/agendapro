const API_URL = import.meta.env.VITE_API_URL;

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

  // ==========================================
  // PAGAMENTO PENDENTE (403 CONTROLADO)
  // ==========================================
  if (response.status === 403 && data?.payment_pending === true) {
    return data;
  }

  // ==========================================
  // OUTROS ERROS
  // ==========================================
  if (!response.ok) {
    throw new Error(
      data?.error || data?.message || data?.msg || "Erro ao realizar login"
    );
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
// =========================================================
// REGISTER (Corrigido para enviar os dados de pagamento)
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
      logo: payload.logo,
      cardToken: payload.cardToken,
      installments: payload.installments,
      description: payload.description,
      docType: payload.docType,
      docNumber: payload.docNumber,
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
