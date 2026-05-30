import { apiFetch } from "./api";

// =========================================================
// CREATE CHECKOUT / SALE
// =========================================================

export function createSale(data) {
  return apiFetch("/sales/checkout", {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify(data),
  });
}

// =========================================================
// LIST SALES
// =========================================================

export function getSales() {
  return apiFetch("/sales");
}

// =========================================================
// GET SALE BY ID
// =========================================================

export function getSaleById(saleId) {
  return apiFetch(`/sales/${saleId}`);
}

// =========================================================
// UPDATE SALE
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
// DELETE SALE
// =========================================================

export function deleteSale(saleId) {
  return apiFetch(`/sales/${saleId}`, {
    method: "DELETE",
  });
}

// =========================================================
// MERCADO PAGO WEBHOOK TEST (OPCIONAL FRONT DEBUG)
// =========================================================

export function sendMercadoPagoWebhook(data) {
  return apiFetch("/sales/webhook/mercadopago", {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify(data),
  });
}
