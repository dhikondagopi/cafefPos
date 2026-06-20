import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Layouts
import AdminLayout from './components/layout/AdminLayout';
import POSLayout from './components/layout/POSLayout';
import KitchenLayout from './components/layout/KitchenLayout';

// Auth Pages
import AuthPage from './pages/auth/AuthPage';
import LandingPage from './pages/LandingPage';

// Admin Pages
import Dashboard from './pages/admin/Dashboard';
import Categories from './pages/admin/Categories';
import Products from './pages/admin/Products';
import Floors from './pages/admin/Floors';
import Tables from './pages/admin/Tables';
import Users from './pages/admin/Users';
import Coupons from './pages/admin/Coupons';
import PaymentMethods from './pages/admin/PaymentMethods';
import Reports from './pages/admin/Reports';

// POS Pages
import OpenSession from './pages/pos/OpenSession';
import TablePopup from './pages/pos/TablePopup';
import POSOrder from './pages/pos/POSOrder';
import Orders from './pages/pos/Orders';
import Customers from './pages/pos/Customers';
import Receipt from './pages/pos/Receipt';

// Common shared views
import Bookings from './pages/bookings/Bookings';
import KitchenDisplay from './pages/kitchen/KitchenDisplay';

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Landing Page */}
          <Route path="/" element={<LandingPage />} />

          {/* Auth Gateways */}
          <Route path="/login" element={<AuthPage mode="login" />} />
          <Route path="/signup" element={<AuthPage mode="signup" />} />

          {/* POS Drawer Initialization Gate (Standalone, no header) */}
          <Route 
            path="/pos/open-session" 
            element={
              <ProtectedRoute allowedRoles={['employee', 'admin']}>
                <OpenSession />
              </ProtectedRoute>
            } 
          />

          {/* Admin Management Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="categories" element={<Categories />} />
            <Route path="products" element={<Products />} />
            <Route path="floors" element={<Floors />} />
            <Route path="tables" element={<Tables />} />
            <Route path="users" element={<Users />} />
            <Route path="coupons" element={<Coupons />} />
            <Route path="payment-methods" element={<PaymentMethods />} />
            <Route path="bookings" element={<Bookings />} />
            <Route path="reports" element={<Reports />} />
          </Route>

          {/* POS Terminal Routes */}
          <Route
            path="/pos"
            element={
              <ProtectedRoute allowedRoles={['employee', 'admin']}>
                <POSLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<TablePopup />} />
            <Route path="order/:tableId" element={<POSOrder />} />
            <Route path="orders" element={<Orders />} />
            <Route path="customers" element={<Customers />} />
            <Route path="bookings" element={<Bookings />} />
            <Route path="receipt/:orderId" element={<Receipt />} />
          </Route>

          {/* Kitchen Display Dashboard */}
          <Route
            path="/kitchen"
            element={
              <ProtectedRoute allowedRoles={['kitchen', 'admin']}>
                <KitchenLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<KitchenDisplay />} />
          </Route>

          {/* Root Redirection fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
};

export default App;
