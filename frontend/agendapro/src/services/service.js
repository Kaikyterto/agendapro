import { apiFetch } from "./api";

// =========================================================
// SERVICES
// =========================================================

export async function getServices() {
  return await apiFetch("/services", {
    method: "GET",
    auth: true,
  });
}

export async function createService(data) {
  return await apiFetch("/services", {
    method: "POST",
    auth: true,

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify(data),
  });
}

export async function updateService(serviceId, data) {
  return await apiFetch(`/services/${serviceId}`, {
    method: "PATCH",
    auth: true,

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify(data),
  });
}

export async function deleteService(serviceId) {
  return await apiFetch(`/services/${serviceId}`, {
    method: "DELETE",
    auth: true,
  });
}
