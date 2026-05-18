import { apiFetch } from "./api";

// =========================================================
// PRODUTOS
// =========================================================

export function getProducts() {
  return apiFetch("/products", {
    method: "GET",
    auth: true,
  });
}

export function createProduct(data) {
  return apiFetch("/products", {
    method: "POST",
    auth: true,
    body: JSON.stringify(data),
  });
}

export function updateProduct(productId, data) {
  return apiFetch(`/products/${productId}`, {
    method: "PATCH",
    auth: true,
    body: JSON.stringify(data),
  });
}

export function deleteProduct(productId) {
  return apiFetch(`/products/${productId}`, {
    method: "DELETE",
    auth: true,
  });
}

// =========================================================
// DASHBOARD
// =========================================================

export function getProductsDashboard() {
  return apiFetch("/products/dashboard", {
    method: "GET",
    auth: true,
  });
}
