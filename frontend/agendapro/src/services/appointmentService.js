import { apiFetch } from "./api";

export function createAppointment(data) {
  return apiFetch("/public/appointments", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
export function getCompanyAvailableSlots(slug) {
  return apiFetch(`/public/company/${slug}/slots`);
}

export function getCompanyAvailableSlotsByServiceAndWorker(
  slug,
  serviceId,
  workerId
) {
  return apiFetch(
    `/public/company/${slug}/services/${serviceId}/workers/${workerId}/slots`
  );
}
