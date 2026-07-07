import { apiFetch } from "./api";

// =========================================================
// PUBLIC CHECKOUT (CLIENTE FINAL)
// =========================================================

export function createSale(data) {
  return apiFetch("/public/sales/checkout", {
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

// =========================================================
// ADMIN - SALES HISTORY
// =========================================================

export function getSalesHistory(companyId) {
  return apiFetch("/sales/history", {
    method: "GET",
    auth: true,
    params: {
      company_id: companyId,
    },
  });
}

// =========================================================
// ADMIN - SALE HISTORY DETAILS
// =========================================================

export function getSaleHistoryById(saleId) {
  return apiFetch(`/sales/${saleId}`, {
    method: "GET",
    auth: true,
  });
}
