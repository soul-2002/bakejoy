// src/router/ProtectedRoute.tsx
import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext'; // مسیر صحیح به AuthContext شما
import { Box, CircularProgress, Typography } from '@mui/material'; // برای نمایش لودینگ

interface ProtectedRouteProps {
  adminOnly?: boolean; // پراپرتی برای تشخیص مسیرهای مخصوص ادمین
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ adminOnly = false }) => {
  const { isAuthenticated, isLoading, user, isUserAdmin } = useAuth(); // isUserAdmin را از AuthContext می‌گیریم
  const location = useLocation();
  
  // لاگ برای دیباگ وضعیت (می‌توانید پس از اطمینان از عملکرد صحیح، این لاگ‌ها را حذف یا کمتر کنید)
  console.log("ProtectedRoute Evaluation:", {
    pathname: location.pathname,
    isLoading,
    isAuthenticated,
    adminOnly,
    isUserActuallyAdmin: isUserAdmin, // مقدار isUserAdmin از context
    userObject: user // برای بررسی فیلدهایی مانند is_staff اگر لازم شد
  });

  // ۱. اگر در حال بررسی اولیه وضعیت احراز هویت هستیم (isLoading از AuthContext)
  if (isLoading) {
    console.log(`ProtectedRoute (${location.pathname}): Auth state is loading...`);
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" sx={{ backgroundColor: 'background.default' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2, color: 'text.secondary' }}>در حال بررسی دسترسی...</Typography>
      </Box>
    );
  }

  // ۲. اگر کاربر اصلاً احراز هویت نشده است
  if (!isAuthenticated) {
    // تعیین مسیر لاگین بر اساس اینکه آیا مسیر مخصوص ادمین است یا خیر
    const loginRedirectPath = adminOnly ? "/admin/login" : "/login";
    console.log(`ProtectedRoute (${location.pathname}): User NOT Authenticated. adminOnly: ${adminOnly}. Redirecting to ${loginRedirectPath}.`);
    // مسیر فعلی را در state پاس می‌دهیم تا پس از لاگین به اینجا برگردد
    return <Navigate to={loginRedirectPath} state={{ from: location }} replace />;
  }

  // ۳. اگر کاربر احراز هویت شده است، اما مسیر مخصوص ادمین است و کاربر ادمین نیست
  //    شرط isUserAdmin باید در AuthContext شما بر اساس فیلد مناسب در آبجکت user (مانند user.is_staff) محاسبه شود.
  if (adminOnly && !isUserAdmin) {
    console.log(`ProtectedRoute (${location.pathname}): User Authenticated BUT NOT an ADMIN. Redirecting to home. User admin status: ${isUserAdmin}`);
    // کاربر لاگین کرده اما ادمین نیست، او را به صفحه اصلی یا یک صفحه "عدم دسترسی" هدایت کنید
    return <Navigate to="/" replace />; 
    // یا به یک صفحه اختصاصی 403 Forbidden: return <Navigate to="/unauthorized" replace />;
  }

  // ۴. اگر کاربر احراز هویت شده و (اگر مسیر ادمین است، کاربر هم ادمین است)، اجازه دسترسی داده می‌شود
  console.log(`ProtectedRoute (${location.pathname}): Access GRANTED. Rendering Outlet. adminOnly: ${adminOnly}, isUserAdmin: ${isUserAdmin}`);
  return <Outlet />; // کامپوننت‌های Route فرزند (مانند AdminLayout یا ProfilePage) را رندر می‌کند
};

export default ProtectedRoute;