import { apiFetch } from "./api";

export function getCompanyBySlug(slug) {
  return apiFetch(`/public/company/${slug}`);
}

export function getCompanyServices(slug) {
  return apiFetch(`/public/company/${slug}/services`);
}

export function getCompanyProducts(slug) {
  return apiFetch(`/public/company/${slug}/products`);
}
