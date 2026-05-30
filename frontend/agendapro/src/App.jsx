import { Routes, Route } from "react-router-dom";

import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import PaymentPage from "./pages/PaymentPage";

import HomePage from "./pages/HomePage";

import CompanyProductsPage from "./pages/CompanyProductsPage";
import CompanyBookingPage from "./pages/CompanyBookingPage";

import AdminHomePage from "./pages/AdminHomePage";
import AdminBookingPage from "./pages/AdminBookingPage";
import AdminProductsPage from "./pages/AdminProductsPage";
import AdminWorkersPage from "./pages/AdminWorkersPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";

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

      <Route path="/admin/:slug/produtos" element={<AdminProductsPage />} />

      <Route path="/admin/:slug/funcionarios" element={<AdminWorkersPage />} />

      <Route path="/admin/:slug/vendas" element={<AdminDashboardPage />} />

      {/* ============================================= */}
      {/* PUBLIC COMPANY */}
      {/* ============================================= */}

      <Route path="/:slug" element={<HomePage />} />

      <Route path="/:slug/produtos" element={<CompanyProductsPage />} />

      <Route path="/:slug/agendar" element={<CompanyBookingPage />} />
    </Routes>
  );
}
