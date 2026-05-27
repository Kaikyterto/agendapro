import { apiFetch } from "./api";

// =========================================================
// WORKERS
// =========================================================

export function getWorkers() {
  return apiFetch("/workers", {
    method: "GET",
    auth: true,
  });
}

export function createWorker(data) {
  return apiFetch("/workers", {
    method: "POST",
    auth: true,
    body: JSON.stringify(data),
  });
}

export function updateWorker(workerId, data) {
  return apiFetch(`/workers/${workerId}`, {
    method: "PATCH",
    auth: true,
    body: JSON.stringify(data),
  });
}

export function deleteWorker(workerId) {
  return apiFetch(`/workers/${workerId}`, {
    method: "DELETE",
    auth: true,
  });
}
