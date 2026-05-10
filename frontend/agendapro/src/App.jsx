import { Routes, Route } from "react-router-dom";

import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import CompanyProductsPage from "./pages/CompanyProductsPage";
import CompanyBookingPage from "./pages/CompanyBookingPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />

      <Route path="/:slug" element={<HomePage />} />

      <Route path="/:slug/produtos" element={<CompanyProductsPage />} />
      <Route path="/:slug/agendar" element={<CompanyBookingPage />} />
    </Routes>
  );
}
