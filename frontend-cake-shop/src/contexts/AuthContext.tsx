// src/contexts/AuthContext.tsx
import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import apiClient, { AuthTokens, getCurrentUser, LoginCredentials, login as apiLogin } from '../services/api'; // LoginCredentials را هم اگر لازم است ایمپورت کنید
import { User } from '../types';
// اینترفیس برای داده‌های ورودی فرم لاگین ادمین (اگر متفاوت است)
// interface AdminLoginCredentials extends LoginCredentials {
//   // فیلدهای اضافی اگر لازم است
// }

interface AuthContextType {
  isAuthenticated: boolean; // آیا کاربر لاگین کرده است (عمومی)
  isLoading: boolean;
  user: User | null;
  accessToken: string | null;
  isUserAdmin: boolean; // <--- جدید: آیا کاربر فعلی ادمین است؟
  login: (tokens: AuthTokens) => Promise<void>; // برای لاگین عمومی (مشتری)
  loginAdmin: (credentials: LoginCredentials) => Promise<void>; // <--- جدید: برای لاگین ادمین
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [accessToken, setAccessToken] = useState<string | null>(() => localStorage.getItem('accessToken'));
  const [refreshToken, setRefreshToken] = useState<string | null>(() => localStorage.getItem('refreshToken'));
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const isAuthenticated = !!user && !!accessToken; // کاربر لاگین است اگر هم user و هم accessToken معتبر باشند

  // --- VVVV تشخیص ادمین بودن کاربر VVVV ---
  // این شرط را بر اساس فیلد واقعی که از بک‌اند برای نقش ادمین می‌گیرید، تنظیم کنید
  const isUserAdmin = !!user && (user.is_staff === true); // مثال: اگر فیلد is_staff دارید
  // یا مثلاً: const isUserAdmin = !!user && user.role === 'ADMIN';
  // --- ^^^^ --------------------------- ^^^^ ---


  const checkUserAuth = useCallback(async () => {
    console.log("AuthContext: checkUserAuth called.");
    const currentToken = localStorage.getItem('accessToken');
    // فقط اگر توکن در localStorage بود، isLoading را برای state توکن هم true کن
    // وگرنه اگر توکن نیست، از همان ابتدا isAuthenticated false و isLoading هم سریع false می‌شود.
    if (currentToken && !accessToken) {
        setAccessToken(currentToken); // همگام سازی اولیه state توکن
    }


    if (!currentToken) {
      console.log("AuthContext: No token in localStorage.");
      setUser(null);
      setAccessToken(null); // اطمینان از پاک بودن state توکن
      setRefreshToken(null);
      delete apiClient.defaults.headers.common['Authorization'];
      setIsLoading(false);
      return;
    }

    console.log("AuthContext: Token found in localStorage, attempting to fetch user...");
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${currentToken}`;

    try {
      const userData = await getCurrentUser(currentToken); // currentToken را پاس می‌دهیم
      console.log("AuthContext: User fetched successfully:", userData);
      setUser(userData);
    } catch (error: any) {
      console.error("AuthContext: Failed to fetch user (token might be invalid/expired):", error.response?.data || error.message);
      setUser(null);
      setAccessToken(null);
      setRefreshToken(null);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      delete apiClient.defaults.headers.common['Authorization'];
    } finally {
      setIsLoading(false);
      console.log("AuthContext: Auth check finished. isLoading set to false.");
    }
  }, [accessToken]); // accessToken به وابستگی اضافه شد تا اگر از بیرون تغییر کرد، چک مجدد انجام شود

  useEffect(() => {
    console.log("AuthContext: Initial auth check effect running.");
    // setIsLoading(true); // در ابتدای checkUserAuth انجام می‌شود اگر توکن هست
    checkUserAuth();
  }, [checkUserAuth]);

  const login = async (tokens: AuthTokens) => {
    console.log("AuthContext: login (general) called.");
    setIsLoading(true);
    localStorage.setItem('accessToken', tokens.access);
    if (tokens.refresh) localStorage.setItem('refreshToken', tokens.refresh);
    setAccessToken(tokens.access);
    if (tokens.refresh) setRefreshToken(tokens.refresh);
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${tokens.access}`;
    try {
      console.log("AuthContext: Fetching user data after login...");
      const userData = await getCurrentUser(tokens.access);
      setUser(userData);
      console.log("AuthContext: Login successful, user set:", userData);
    } catch (error) {
      console.error("AuthContext: Failed to fetch user after login:", error);
      await logout(); // استفاده از await اگر logout هم async است
    } finally {
      setIsLoading(false);
      console.log("AuthContext: Login process finished.");
    }
  };

  // اگر تابع loginAdmin شما دقیقاً مشابه login است و فقط می‌خواهید
  // در ProtectedRoute چک کنید که آیا user.is_staff است یا نه،
  // شاید نیازی به تابع loginAdmin جداگانه نباشد و صفحه AdminLoginPage.tsx
  // بتواند از همین تابع login عمومی استفاده کند.
  // اما اگر اندپوینت لاگین ادمین متفاوت است یا منطق خاصی دارد، تابع loginAdmin را پیاده‌سازی کنید:
  const loginAdmin = async (credentials: LoginCredentials) => {
    console.log("AuthContext: loginAdmin function called with credentials:", credentials);
    setIsLoading(true);
    setAccessToken(null); // پاک کردن توکن قبلی قبل از تلاش برای لاگین جدید
    setUser(null);      // پاک کردن کاربر قبلی

    let receivedTokens: AuthTokens | null = null; // تعریف متغیر در ابتدای اسکوپ

    try {
      // ۱. فراخوانی API بک‌اند برای لاگین ادمین (با استفاده از تابع apiLogin عمومی یا یک تابع مخصوص ادمین)
      // فرض می‌کنیم apiLogin از ../services/api برای لاگین ادمین هم استفاده می‌شود
      // و اندپوینت آن (/auth/token/) نقش کاربر را بررسی نمی‌کند و فقط توکن می‌دهد.
      console.log("AuthContext (loginAdmin): Attempting to get tokens via apiLogin...");
      receivedTokens = await apiLogin({ username: credentials.username, password: credentials.password });
      console.log("AuthContext (loginAdmin): Tokens received:", receivedTokens);

      if (!receivedTokens || !receivedTokens.access) {
        throw new Error("توکن معتبری پس از لاگین دریافت نشد.");
      }

      // ۲. تنظیم توکن‌ها و واکشی اطلاعات کاربر (با استفاده از توکن جدید)
      //    این بخش می‌تواند شبیه به تابع login عمومی باشد یا منطق خاص خود را داشته باشد.
      localStorage.setItem('accessToken', receivedTokens.access);
      if (receivedTokens.refresh) localStorage.setItem('refreshToken', receivedTokens.refresh);
      
      setAccessToken(receivedTokens.access);
      if (receivedTokens.refresh) setRefreshToken(receivedTokens.refresh);
      
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${receivedTokens.access}`;
      
      console.log("AuthContext (loginAdmin): Fetching user data with new admin token...");
      const adminUserData = await getCurrentUser(receivedTokens.access);
      console.log("AuthContext (loginAdmin): Admin user data fetched:", adminUserData);

      // ۳. بررسی اینکه آیا کاربر واکشی شده واقعاً ادمین است
      if (!adminUserData || !adminUserData.is_staff) { // شرط ادمین بودن خودتان (مثلاً is_staff)
        await logout(); // اگر ادمین نبود، لاگ‌اوت کن و توکن‌های جدید را هم پاک کن
        throw new Error("این حساب کاربری دسترسی ادمین ندارد.");
      }
      
      setUser(adminUserData); // تنظیم کاربر ادمین در state
      console.log("AuthContext: Admin login successful, user set and verified as admin:", adminUserData);

    } catch (error: any) {
      console.error("AuthContext: Error in loginAdmin:", error);
      await logout(); // پاکسازی کامل در صورت بروز هرگونه خطا
      // خطا را دوباره throw کنید تا در AdminLoginPage نمایش داده شود
      if (error.response && error.response.data && error.response.data.detail) {
        throw new Error(error.response.data.detail);
      } else if (error.message) {
        throw new Error(error.message);
      } else {
        throw new Error("خطای نامشخص در ورود ادمین.");
      }
    } finally {
      setIsLoading(false);
      console.log("AuthContext (loginAdmin): Admin login process finished.");
    }
  };


  const logout = async () => { // بهتر است async باشد اگر کارهای بیشتری در آینده انجام دهد
    console.log("AuthContext: logout called.");
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
    delete apiClient.defaults.headers.common['Authorization'];
    setIsLoading(false); // اطمینان از اینکه پس از لاگ‌اوت، لودینگ متوقف می‌شود
    console.log("AuthContext: User logged out, states cleared.");
  };

  const value: AuthContextType = {
    isAuthenticated,
    isLoading,
    user,
    accessToken,
    isUserAdmin,
    login,
    loginAdmin: loginAdmin, // <--- تابع لاگین ادمین را اضافه کنید (اگر پیاده‌سازی کردید)
    // اگر از همان تابع login برای ادمین هم استفاده می‌کنید، loginAdmin لازم نیست در context باشد،
    // و صفحه AdminLoginPage.tsx می‌تواند از تابع login عمومی استفاده کند.
    // اما اگر لاگین ادمین اندپوینت متفاوتی دارد، loginAdmin را اینجا export کنید.
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};