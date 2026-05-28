import { apiFetch } from "./api";

// =========================================================
// WORKERS
// =========================================================

export async function getWorkers() {
  return apiFetch("/workers", {
    method: "GET",
    auth: true,
  });
}

export async function createWorker(data) {
  return apiFetch("/workers", {
    method: "POST",
    auth: true,
    body: JSON.stringify(data),
  });
}

export async function updateWorker(workerId, data) {
  return apiFetch(`/workers/${workerId}`, {
    method: "PATCH",
    auth: true,
    body: JSON.stringify(data),
  });
}

export async function deleteWorker(workerId) {
  return apiFetch(`/workers/${workerId}`, {
    method: "DELETE",
    auth: true,
  });
}

// =========================================================
// SERVICES
// =========================================================

export async function getServices() {
  return apiFetch("/services", {
    method: "GET",
    auth: true,
  });
}
