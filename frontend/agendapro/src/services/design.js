import { apiFetch } from "./api";

// =========================================================
// GET DESIGN SETTINGS
// =========================================================
export function getDesignSettings() {
  return apiFetch("/design", {
    method: "GET",
    auth: true,
  });
}

// =========================================================
// UPDATE DESIGN SETTINGS
// =========================================================
export function updateDesignSettings(data) {
  return apiFetch("/design", {
    method: "PATCH",
    auth: true,

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify(data),
  });
}
