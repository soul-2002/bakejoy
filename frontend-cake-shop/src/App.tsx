// src/App.tsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme'; // تم MUI شما
import './index.css';

// Layouts
import MainLayout from './layouts/MainLayout';
import AdminLayout from './layouts/AdminLayout';

// Pages (مشتری)
import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import LoginPage from './pages/LoginPage';
import CartPage from './pages/CartPage';
import ProfilePage from './pages/ProfilePage';
import OrderHistoryPage from './pages/profile/OrderHistoryPage.tsx';

import PaymentSuccessPage from './pages/PaymentSuccessPage';
import PaymentFailurePage from './pages/PaymentFailurePage';
import NotFoundPage from './pages/NotFoundPage';

// Admin Pages
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminOrderListPage from './pages/admin/orders/AdminOrderListPage';
import AdminOrderDetailPage from './pages/admin/orders/AdminOrderDetailPage';
import AdminProductListPage from './pages/admin/products/AdminProductListPage';
import AdminProductFormPage from './pages/admin/products/AdminProductForm';
import AdminCategoryListPage from './pages/admin/products/AdminCategoryListPage';
import AdminCategoryFormPage from './pages/admin/products/AdminCategoryForm';
import AdminFlavorListPage from './pages/admin/products/AdminFlavorListPage';
import AdminFlavorFormPage from './pages/admin/products/AdminFlavorForm';
import AdminSizeListPage from './pages/admin/products/AdminSizeListPage';
import AdminSizeFormPage from './pages/admin/products/AdminSizeForm';
// --- کامپوننت جدید برای صفحه تنظیمات پیامک ---

import AdminSmsPanelPage from './pages/admin/AdminSmsPanelPage.tsx';

import UserProfileLayout from './components/layouts/UserProfileLayout';
import UserDashboardPage from './pages/profile/UserDashboardPage.tsx';
import UserOrderDetailPage from './pages/profile/UserOrderDetailPage';
import UserProfilePage from './pages/profile/UserProfilePage';
import UserAddressesPage from './pages/profile/UserAddressesPage';
import RegisterPage from './pages/RegisterPage';
import PartySuppliesPage from './pages/PartySuppliesPage';

// Protected Route
import ProtectedRoute from './router/ProtectedRoute';

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Routes>
        {/* مسیرهای عمومی و مشتریان */}
        <Route path="/" element={<MainLayout />}>
          <Route index element={<HomePage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="products/:slug" element={<ProductDetailPage />} />
          <Route path="supplies" element={<PartySuppliesPage />} />

          <Route path="payment/success" element={<PaymentSuccessPage />} />
          <Route path="payment/failure" element={<PaymentFailurePage />} />

          {/* مسیرهای محافظت شده مشتریان */}
          <Route element={<ProtectedRoute />}>
            <Route path="cart" element={<CartPage />} />
            <Route path="/profile" element={<UserProfileLayout />}>
              <Route index element={<UserDashboardPage />} />
              <Route path="orders" element={<OrderHistoryPage />} />
              {/* --- 2. استفاده از کامپوننت جدید در مسیر صحیح --- */}
              <Route path="orders/:orderId" element={<UserOrderDetailPage />} />
              <Route path="edit-info" element={<UserProfilePage />} />
              <Route path="addresses" element={<UserAddressesPage />} />
            </Route>

          </Route>
        </Route>

        {/* صفحات لاگین (بدون Layout) */}
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />

        {/* مسیرهای محافظت شده پنل ادمین */}
        <Route element={<ProtectedRoute adminOnly={true} />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboardPage />} />

            <Route path="orders" element={<AdminOrderListPage />} />
            <Route path="orders/:orderId" element={<AdminOrderDetailPage />} />

            <Route path="products" element={<AdminProductListPage />} />
            <Route path="products/new" element={<AdminProductFormPage />} />
            <Route path="products/edit/:productId" element={<AdminProductFormPage />} />

            <Route path="categories" element={<AdminCategoryListPage />} />
            <Route path="categories/new" element={<AdminCategoryFormPage />} />
            <Route path="categories/edit/:categoryId" element={<AdminCategoryFormPage />} />

            <Route path="flavors" element={<AdminFlavorListPage />} />
            <Route path="flavors/new" element={<AdminFlavorFormPage />} />
            <Route path="flavors/edit/:flavorId" element={<AdminFlavorFormPage />} />

            <Route path="sizes" element={<AdminSizeListPage />} />
            <Route path="sizes/new" element={<AdminSizeFormPage />} />
            <Route path="sizes/edit/:sizeId" element={<AdminSizeFormPage />} />

            {/* --- مسیر جدید برای تنظیمات پیامک --- */}
            {/* این مسیر صفحه جدید شما را در پنل ادمین نمایش می‌دهد */}
            <Route path="notification-settings/sms-templates" element={<AdminSmsPanelPage />} />


          </Route>
        </Route>

        {/* مسیر 404 (باید در انتها باشد) */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </ThemeProvider>
  );
}

export default App;
