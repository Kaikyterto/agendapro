import { apiFetch } from "./api";

// =========================================================
// CREATE APPOINTMENT
// =========================================================

export function createAppointment(data) {
  return apiFetch("/public/appointments", {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify(data),
  });
}

// =========================================================
// AVAILABLE SLOTS
// =========================================================

export function getCompanyAvailableSlotsByServiceAndWorker(
  slug,
  serviceId,
  workerId,
  date
) {
  const params = new URLSearchParams({
    date,
  });

  return apiFetch(
    `/public/company/${slug}/services/${serviceId}/workers/${workerId}/slots?${params.toString()}`
  );
}
