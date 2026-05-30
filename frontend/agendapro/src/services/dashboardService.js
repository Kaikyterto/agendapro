import { apiFetch } from "./api";

// =========================================================
// OVERVIEW
// =========================================================

export const getDashboardOverview = async () => {
  return apiFetch("/dashboard/overview", {
    method: "GET",
    auth: true,
  });
};

// =========================================================
// REVENUE CHART
// =========================================================

export const getRevenueChart = async () => {
  return apiFetch("/dashboard/revenue-chart", {
    method: "GET",
    auth: true,
  });
};

// =========================================================
// TOP SERVICES
// =========================================================

export const getTopServices = async () => {
  return apiFetch("/dashboard/top-services", {
    method: "GET",
    auth: true,
  });
};

// =========================================================
// TOP WORKERS
// =========================================================

export const getTopWorkers = async () => {
  return apiFetch("/dashboard/top-workers", {
    method: "GET",
    auth: true,
  });
};

// =========================================================
// TOP PRODUCTS
// =========================================================

export const getTopProducts = async () => {
  return apiFetch("/dashboard/top-products", {
    method: "GET",
    auth: true,
  });
};

// =========================================================
// OCCUPANCY
// =========================================================

export const getOccupancy = async () => {
  return apiFetch("/dashboard/occupancy", {
    method: "GET",
    auth: true,
  });
};

// =========================================================
// FORECAST
// =========================================================

export const getForecast = async () => {
  return apiFetch("/dashboard/forecast", {
    method: "GET",
    auth: true,
  });
};

// =========================================================
// AI INSIGHTS
// =========================================================

export const getInsights = async () => {
  return apiFetch("/dashboard/insights", {
    method: "GET",
    auth: true,
  });
};
