import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { Suspense, lazy } from "react";
import { useAdminAuthStore } from "./store/adminAuthStore";
import AdminLayout from "./components/layout/AdminLayout";

const AdminLoginPage = lazy(() => import("./pages/auth/AdminLoginPage"));
const DashboardPage = lazy(() => import("./pages/dashboard/DashboardPage"));
const ProductsPage = lazy(() => import("./pages/products/ProductsPage"));
const ProductFormPage = lazy(() => import("./pages/products/ProductFormPage"));
const CategoriesPage = lazy(() => import("./pages/categories/CategoriesPage"));
const OrdersPage = lazy(() => import("./pages/orders/OrdersPage"));
const OrderDetailPage = lazy(() => import("./pages/orders/OrderDetailPage"));
const CustomersPage = lazy(() => import("./pages/customers/CustomersPage"));
const ReviewsPage = lazy(() => import("./pages/reviews/ReviewsPage"));
const CouponsPage = lazy(() => import("./pages/coupons/CouponsPage"));
const SettingsPage = lazy(() => import("./pages/settings/SettingsPage"));
const ShippingProvidersPage = lazy(() => import("./pages/settings/ShippingProvidersPage"));
const BlogsPage = lazy(() => import("./pages/blog/BlogsPage"));
const HeroBannersPage = lazy(() => import("./pages/banners/HeroBannersPage"));
const RashisPage = lazy(() => import("./pages/astrology/RashisPage"));
const PurposesPage = lazy(() => import("./pages/astrology/PurposesPage"));
const RashiProductMappingsPage = lazy(() => import("./pages/astrology/RashiProductMappingsPage"));
const CalculatorLeadsPage = lazy(() => import("./pages/astrology/CalculatorLeadsPage"));

function LoadingAdminRoute() {
  return (
    <div style={{
      minHeight: '40vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Jost, sans-serif',
      fontSize: 12,
      letterSpacing: '0.15em',
      textTransform: 'uppercase',
      color: '#6B6057',
    }}>
      Loading…
    </div>
  );
}

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
    <Suspense fallback={<LoadingAdminRoute />}>
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
            <Route path="/admin/shipping-providers" element={<ShippingProvidersPage />} />
            <Route path="/admin/blogs" element={<BlogsPage />} />
            <Route path="/admin/banners" element={<HeroBannersPage />} />
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/admin/login" replace />} />
      </Routes>
    </Suspense>
  );
}
