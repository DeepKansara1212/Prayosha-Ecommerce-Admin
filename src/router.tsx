import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { useAdminAuthStore } from "./store/adminAuthStore";
import AdminLayout from "./components/layout/AdminLayout";

import AdminLoginPage from "./pages/auth/AdminLoginPage";
import DashboardPage from "./pages/dashboard/DashboardPage";
import ProductsPage from "./pages/products/ProductsPage";
import ProductFormPage from "./pages/products/ProductFormPage";
import CategoriesPage from "./pages/categories/CategoriesPage";
import OrdersPage from "./pages/orders/OrdersPage";
import OrderDetailPage from "./pages/orders/OrderDetailPage";
import CustomersPage from "./pages/customers/CustomersPage";
import ReviewsPage from "./pages/reviews/ReviewsPage";
import CouponsPage from "./pages/coupons/CouponsPage";
import SettingsPage from "./pages/settings/SettingsPage";
import BlogsPage from "./pages/blog/BlogsPage";
import HeroBannersPage from "./pages/banners/HeroBannersPage";
import RashisPage from "./pages/astrology/RashisPage";
import PurposesPage from "./pages/astrology/PurposesPage";
import RashiProductMappingsPage from "./pages/astrology/RashiProductMappingsPage";
import CalculatorLeadsPage from "./pages/astrology/CalculatorLeadsPage";

function ProtectedAdminRoute() {
  const admin  = useAdminAuthStore((state) => state.admin);
  const logout = useAdminAuthStore((state) => state.logout);
  if (!admin) return <Navigate to="/admin/login" replace />;
  if (admin.role !== 'admin') {
    logout();
    return <Navigate to="/admin/login" replace />;
  }
  return <Outlet />;
}

export default function AppRouter() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/admin/login" element={<AdminLoginPage />} />

      {/* Protected — all /admin/* except login */}
      <Route element={<ProtectedAdminRoute />}>
        <Route
          path="/admin"
          element={<Navigate to="/admin/dashboard" replace />}
        />

        <Route element={<AdminLayout />}>
          <Route path="/admin/dashboard" element={<DashboardPage />} />
          <Route path="/admin/products" element={<ProductsPage />} />
          <Route path="/admin/products/new" element={<ProductFormPage />} />
          <Route
            path="/admin/products/:id/edit"
            element={<ProductFormPage />}
          />
          <Route path="/admin/categories" element={<CategoriesPage />} />
          <Route path="/admin/orders" element={<OrdersPage />} />
          <Route path="/admin/orders/:id" element={<OrderDetailPage />} />
          <Route path="/admin/customers" element={<CustomersPage />} />
          <Route path="/admin/reviews" element={<ReviewsPage />} />
          <Route path="/admin/coupons" element={<CouponsPage />} />
          <Route path="/admin/astrology/rashis" element={<RashisPage />} />
          <Route path="/admin/astrology/purposes" element={<PurposesPage />} />
          <Route path="/admin/astrology/rashi-mappings" element={<RashiProductMappingsPage />} />
          <Route path="/admin/astrology/leads" element={<CalculatorLeadsPage />} />
          <Route path="/admin/settings" element={<SettingsPage />} />
          <Route path="/admin/blogs" element={<BlogsPage />} />
          <Route path="/admin/banners" element={<HeroBannersPage />} />
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/admin/login" replace />} />
    </Routes>
  );
}
