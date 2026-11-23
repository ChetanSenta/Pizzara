import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigationType,
} from "react-router-dom";
import { lazy, Suspense, useEffect } from "react";
import { ToastProvider } from "./context/ToastContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
const Login = lazy(() => import("./pages/auth/Login"));
const Register = lazy(() => import("./pages/auth/Register"));
const VerifyEmail = lazy(() => import("./pages/auth/VerifyEmail"));
const ForgotPassword = lazy(() => import("./pages/auth/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/auth/ResetPassword"));
const Dashboard = lazy(() => import("./pages/user/Dashboard"));
const BuildPizza = lazy(() => import("./pages/user/BuildPizza"));
const Checkout = lazy(() => import("./pages/user/Checkout"));
const MyOrders = lazy(() => import("./pages/user/MyOrders"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const Inventory = lazy(() => import("./pages/admin/Inventory"));
const Orders = lazy(() => import("./pages/admin/Orders"));
const Landing = lazy(() => import("./pages/Landing"));
import Footer from "./components/Footer";
import ErrorBoundary from "./components/ErrorBoundary";
const NotFound = lazy(() => import("./pages/NotFound"));
import { CartProvider } from "./context/CartContext";
import CartDrawer from "./components/CartDrawer";
import PageSkeleton from "./components/PageSkeleton";

const AppRoutes = () => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const navigationType = useNavigationType();
  useEffect(() => {
    if (navigationType !== "POP") window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [location.key, navigationType]);

  useEffect(() => {
    const titles = {
      '/': 'Pizzara — Fresh Pizza Delivered',
      '/login': 'Sign in | Pizzara',
      '/register': 'Create account | Pizzara',
      '/dashboard': 'Menu | Pizzara',
      '/build-pizza': 'Build a pizza | Pizzara',
      '/checkout': 'Checkout | Pizzara',
      '/my-orders': 'My orders | Pizzara',
      '/admin': 'Admin dashboard | Pizzara',
      '/admin/inventory': 'Inventory | Pizzara',
      '/admin/orders': 'Orders | Pizzara',
    };
    document.title = titles[location.pathname] || 'Pizzara';
  }, [location.pathname]);

  if (loading) {
    return <PageSkeleton cards={4} />;
  }

  return (
    <>
      <Navbar />
      <CartDrawer />
      <ErrorBoundary key={location.pathname}>
        <Suspense fallback={<PageSkeleton />}>
          <Routes>
            {/* Public */}
            <Route
              path="/"
              element={
                user ? (
                  <Navigate to={user.role === "admin" ? "/admin" : "/dashboard"} />
                ) : (
                  <Landing />
                )
              }
            />
            <Route
              path="/login"
              element={
                user ? (
                  <Navigate to={user.role === "admin" ? "/admin" : "/dashboard"} />
                ) : (
                  <Login />
                )
              }
            />
            <Route
              path="/register"
              element={user ? <Navigate to="/dashboard" /> : <Register />}
            />
            <Route path="/verify-email/:token" element={<VerifyEmail />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />

            {/* User */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/build-pizza"
              element={
                <ProtectedRoute>
                  <BuildPizza />
                </ProtectedRoute>
              }
            />
            <Route
              path="/checkout"
              element={
                <ProtectedRoute>
                  <Checkout />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-orders"
              element={
                <ProtectedRoute>
                  <MyOrders />
                </ProtectedRoute>
              }
            />

            {/* Admin */}
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/inventory"
              element={
                <AdminRoute>
                  <Inventory />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/orders"
              element={
                <AdminRoute>
                  <Orders />
                </AdminRoute>
              }
            />

            {/* Default */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
      <Footer />
    </>
  );
};

const App = () => (
  <Router>
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <CartProvider>
            <AppRoutes />
          </CartProvider>
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  </Router>
);

export default App;