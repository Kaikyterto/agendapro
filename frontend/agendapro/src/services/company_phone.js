import { apiFetch } from "./api";

// =========================================================
// COMPANY PHONES (PÚBLICO - PARA O CLIENTE DA LOJA)
// =========================================================

export async function getPublicCompanyPhones(slug) {
  return await apiFetch(`/public/company/${slug}/phones`, {
    method: "GET",
    auth: false,
  });
}

// =========================================================
// COMPANY PHONES (ADMIN)
// =========================================================

export async function getCompanyPhones() {
  return await apiFetch("/company-phones", {
    method: "GET",
    auth: true,
  });
}

export async function createCompanyPhone(data) {
  return await apiFetch("/company-phones", {
    method: "POST",
    auth: true,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
}

export async function updateCompanyPhone(phoneId, data) {
  return await apiFetch(`/company-phones/${phoneId}`, {
    method: "PATCH",
    auth: true,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
}

export async function deleteCompanyPhone(phoneId) {
  return await apiFetch(`/company-phones/${phoneId}`, {
    method: "DELETE",
    auth: true,
  });
}
