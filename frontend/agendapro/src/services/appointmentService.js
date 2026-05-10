import { apiFetch } from "./api";

export function createAppointment(data) {
  return apiFetch("/appointments", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
export function getCompanyAvailableSlots(slug) {
  return apiFetch(`/public/company/${slug}/slots`);
}
