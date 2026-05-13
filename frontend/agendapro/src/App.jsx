import { Routes, Route } from "react-router-dom";

import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import PaymentPage from "./pages/PaymentPage";

import HomePage from "./pages/HomePage";

import CompanyProductsPage from "./pages/CompanyProductsPage";
import CompanyBookingPage from "./pages/CompanyBookingPage";

import AdminHomePage from "./pages/AdminHomePage";
import AdminBookingPage from "./pages/AdminBookingPage";

export default function App() {
  return (
    <Routes>
      {/* ============================================= */}
      {/* AUTH */}
      {/* ============================================= */}
      <Route path="/" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/payment" element={<PaymentPage />} />

      {/* ============================================= */}
      {/* ADMIN (MULTI-TENANT COM SLUG) */}
      {/* ============================================= */}
      <Route path="/admin/:slug" element={<AdminHomePage />} />
      <Route path="/admin/:slug/agendamentos" element={<AdminBookingPage />} />

      {/* ============================================= */}
      {/* PUBLIC COMPANY */}
      {/* ============================================= */}
      <Route path="/:slug" element={<HomePage />} />
      <Route path="/:slug/produtos" element={<CompanyProductsPage />} />
      <Route path="/:slug/agendar" element={<CompanyBookingPage />} />
    </Routes>
  );
}
