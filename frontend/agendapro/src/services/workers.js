import { apiFetch } from "./api";

// =========================================================
// WORKERS
// =========================================================

export async function getWorkers() {
  return await apiFetch("/workers", {
    method: "GET",
    auth: true,
  });
}

export async function createWorker(data) {
  return await apiFetch("/workers", {
    method: "POST",
    auth: true,

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify(data),
  });
}

export async function updateWorker(workerId, data) {
  return await apiFetch(`/workers/${workerId}`, {
    method: "PATCH",
    auth: true,

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify(data),
  });
}

export async function deleteWorker(workerId) {
  return await apiFetch(`/workers/${workerId}`, {
    method: "DELETE",
    auth: true,
  });
}

// =========================================================
// SERVICES
// =========================================================

export async function getServices() {
  return await apiFetch("/services", {
    method: "GET",
    auth: true,
  });
}
