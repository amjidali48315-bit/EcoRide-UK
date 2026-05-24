import { lazy, Suspense, Component, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AdminProvider, useAdmin } from './context/AdminContext';
import { CustomerProvider } from './context/CustomerContext';
import { DriverProvider, useDriver } from './context/DriverContext';

import Navbar        from './components/Navbar';
import Footer        from './components/Footer';
import ChatWidget    from './components/ChatWidget';
import CookieBanner  from './components/CookieBanner';
import AdminLayout  from './pages/admin/AdminLayout';
import DriverLayout from './pages/driver/DriverLayout';

const HomePage          = lazy(() => import('./pages/HomePage'));
const ProductsPage      = lazy(() => import('./pages/ProductsPage'));
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage'));
const CheckoutPage      = lazy(() => import('./pages/CheckoutPage'));
const CartPage          = lazy(() => import('./pages/CartPage'));
const CartCheckoutPage  = lazy(() => import('./pages/CartCheckoutPage'));
const MyOrdersPage      = lazy(() => import('./pages/MyOrdersPage'));
const CustomerAuthPage  = lazy(() => import('./pages/CustomerAuthPage'));
const ContactPage       = lazy(() => import('./pages/ContactPage'));

const AdminLogin     = lazy(() => import('./pages/admin/AdminLogin'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminProducts  = lazy(() => import('./pages/admin/AdminProducts'));
const AdminOrders    = lazy(() => import('./pages/admin/AdminOrders'));
const AdminCustomers = lazy(() => import('./pages/admin/AdminCustomers'));
const AdminDrivers   = lazy(() => import('./pages/admin/AdminDrivers'));
const AdminStock     = lazy(() => import('./pages/admin/AdminStock'));
const AdminSettings  = lazy(() => import('./pages/admin/AdminSettings'));
const AdminVideos    = lazy(() => import('./pages/admin/AdminVideos'));
const AdminPayments  = lazy(() => import('./pages/admin/AdminPayments'));
const AdminReviews   = lazy(() => import('./pages/admin/AdminReviews'));
const AdminContacts  = lazy(() => import('./pages/admin/AdminContacts'));
const AdminCities    = lazy(() => import('./pages/admin/AdminCities'));
const AdminChat      = lazy(() => import('./pages/admin/AdminChat'));
const AdminManagement = lazy(() => import('./pages/admin/AdminManagement'));

const DriverLoginPage = lazy(() => import('./pages/driver/DriverLoginPage'));
const DriverDashboard = lazy(() => import('./pages/driver/DriverDashboard'));
const DriverOrders    = lazy(() => import('./pages/driver/DriverOrders'));
const DriverEarnings  = lazy(() => import('./pages/driver/DriverEarnings'));
const DriverPayments  = lazy(() => import('./pages/driver/DriverPayments'));
const DriverLocation  = lazy(() => import('./pages/driver/DriverLocation'));

const spinCss = '@keyframes _spin{to{transform:rotate(360deg)}}';
const spinDiv = { width: 36, height: 36, border: '3px solid #2a2a4a', borderTopColor: '#2ecc71', borderRadius: '50%', animation: '_spin 0.7s linear infinite' };

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function FullSpinner() {
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#0d0d1a', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
      <div style={spinDiv} /><style>{spinCss}</style>
    </div>
  );
}

function ContentSpinner() {
  return (
    <div style={{ minHeight: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={spinDiv} /><style>{spinCss}</style>
    </div>
  );
}

class ErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(e) { return { error: e }; }
  componentDidCatch(e) { console.error('[Page Error]', e); }
  render() {
    if (this.state.error) return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <div style={{ color: '#e74c3c', fontWeight: 700, marginBottom: 8 }}>Page failed to load</div>
        <div style={{ color: '#888', fontSize: '0.85rem', marginBottom: 20 }}>{this.state.error.message}</div>
        <button onClick={() => { this.setState({ error: null }); window.location.reload(); }}
          style={{ background: '#2ecc71', border: 'none', color: '#000', padding: '10px 24px', borderRadius: 8, cursor: 'pointer', fontWeight: 700 }}>
          Reload
        </button>
      </div>
    );
    return this.props.children;
  }
}

function ProtectedAdmin({ children }) {
  const { admin, loading } = useAdmin();
  if (loading) return <FullSpinner />;
  return admin ? children : <Navigate to="/admin/login" replace />;
}

function ProtectedDriver({ children }) {
  const { driver, loading } = useDriver();
  if (loading) return <FullSpinner />;
  return driver ? children : <Navigate to="/driver" replace />;
}

function PublicLayout({ children }) {
  return (
    <>
      <Navbar />
      <ErrorBoundary>
        <Suspense fallback={<ContentSpinner />}>{children}</Suspense>
      </ErrorBoundary>
      <Footer />
      <ChatWidget />
      <CookieBanner />
    </>
  );
}

export default function App() {
  return (
    <AdminProvider>
      <CustomerProvider>
        <DriverProvider>
          <BrowserRouter>
            <ScrollToTop />
            <Routes>
              <Route path="/"              element={<PublicLayout><HomePage /></PublicLayout>} />
              <Route path="/products"      element={<PublicLayout><ProductsPage /></PublicLayout>} />
              <Route path="/products/:id"  element={<PublicLayout><ProductDetailPage /></PublicLayout>} />
              <Route path="/checkout/:id"  element={<PublicLayout><CheckoutPage /></PublicLayout>} />
              <Route path="/cart"          element={<PublicLayout><CartPage /></PublicLayout>} />
              <Route path="/checkout-cart" element={<PublicLayout><CartCheckoutPage /></PublicLayout>} />
              <Route path="/my-orders"     element={<PublicLayout><MyOrdersPage /></PublicLayout>} />
              <Route path="/login"         element={<PublicLayout><CustomerAuthPage /></PublicLayout>} />
              <Route path="/contact"       element={<PublicLayout><ContactPage /></PublicLayout>} />

              <Route path="/driver">
                <Route index element={<Suspense fallback={<FullSpinner />}><DriverLoginPage /></Suspense>} />
                <Route element={<ProtectedDriver><DriverLayout /></ProtectedDriver>}>
                  <Route path="dashboard" element={<DriverDashboard />} />
                  <Route path="orders"    element={<DriverOrders />} />
                  <Route path="earnings"  element={<DriverEarnings />} />
                  <Route path="payments"  element={<DriverPayments />} />
                  <Route path="location"  element={<DriverLocation />} />
                </Route>
              </Route>

              <Route path="/admin/login" element={<Suspense fallback={<FullSpinner />}><AdminLogin /></Suspense>} />
              <Route path="/admin" element={<ProtectedAdmin><AdminLayout /></ProtectedAdmin>}>
                <Route index           element={<AdminDashboard />} />
                <Route path="orders"   element={<AdminOrders />} />
                <Route path="drivers"  element={<AdminDrivers />} />
                <Route path="products" element={<AdminProducts />} />
                <Route path="customers"element={<AdminCustomers />} />
                <Route path="stock"    element={<AdminStock />} />
                <Route path="settings" element={<AdminSettings />} />
                <Route path="videos"   element={<AdminVideos />} />
                <Route path="payments" element={<AdminPayments />} />
                <Route path="reviews"  element={<AdminReviews />} />
                <Route path="contacts" element={<AdminContacts />} />
                <Route path="chat"     element={<AdminChat />} />
                <Route path="cities"   element={<AdminCities />} />
                <Route path="admins"   element={<AdminManagement />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </DriverProvider>
      </CustomerProvider>
    </AdminProvider>
  );
}