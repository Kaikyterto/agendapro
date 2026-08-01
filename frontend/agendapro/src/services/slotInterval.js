import { apiFetch } from "./api";

// =========================================================
// INTERVALO DE SLOTS DA EMPRESA
// =========================================================

export function getCompanySlotInterval() {
  return apiFetch("/slot-interval", {
    method: "GET",
    auth: true,
  });
}

export function updateCompanySlotInterval(data) {
  return apiFetch("/slot-interval", {
    method: "PATCH",
    auth: true,
    body: JSON.stringify(data),
  });
}
