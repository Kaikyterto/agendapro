import { apiFetch } from "./api";

// =========================================================
// PUBLIC CHECKOUT (CLIENTE FINAL)
// =========================================================

export function createSale(slug, data) {
  return apiFetch(`/public/sales/checkout?slug=${slug}`, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify(data),
  });
}

// =========================================================
// ADMIN - LIST SALES
// =========================================================

export function getSales() {
  return apiFetch("/sales");
}

// =========================================================
// ADMIN - GET SALE BY ID
// =========================================================

export function getSaleById(saleId) {
  return apiFetch(`/sales/${saleId}`);
}

// =========================================================
// ADMIN - UPDATE SALE
// =========================================================

export function updateSale(saleId, data) {
  return apiFetch(`/sales/${saleId}`, {
    method: "PATCH",

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify(data),
  });
}

// =========================================================
// ADMIN - DELETE SALE
// =========================================================

export function deleteSale(saleId) {
  return apiFetch(`/sales/${saleId}`, {
    method: "DELETE",
  });
}
