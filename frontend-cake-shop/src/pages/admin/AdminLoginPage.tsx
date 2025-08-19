// src/pages/admin/AdminLoginPage.tsx
import React, { useState, useEffect } from 'react';
import { Link as RouterLink, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext'; // مسیر AuthContext شما


// ایمپورت آیکون‌های لازم از FontAwesome
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCookieBite,
  faUser,
  faEyeSlash,
  faEye,
  faExclamationCircle,
  faCheckCircle,
  faSyncAlt,
  faCircleNotch, // برای اسپینر لودینگ
} from '@fortawesome/free-solid-svg-icons';

const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams(); // برای خواندن query params مثل reset_success
  const { loginAdmin, isUserAdmin, isLoading: authIsLoading, user } = useAuth();
  const location = useLocation();
  // فرض بر اینکه loginAdmin و isAuthenticatedAdmin در AuthContext دارید

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  // const [captcha, setCaptcha] = useState(''); // اگر CAPTCHA را پیاده‌سازی می‌کنید

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  // const [showCaptcha, setShowCaptcha] = useState(false); // برای نمایش CAPTCHA پس از چند تلاش ناموفق
  const fromPath = (location.state as { from?: { pathname: string; } })?.from?.pathname || '/admin';
  const fromSearch = (location.state as { from?: { search?: string; } })?.from?.search || '';
  const fromHash = (location.state as { from?: { hash?: string; } })?.from?.hash || '';
  const redirectTo = `${fromPath}${fromSearch}${fromHash}`;
  console.log('Redirecting to full path:', redirectTo);


  // بررسی query param برای نمایش پیام موفقیت (مثلاً پس از ریست پسورد)
  useEffect(() => {
    if (searchParams.get('reset_success') === 'true') {
      setSuccessMessage('رمز عبور با موفقیت تغییر یافت. لطفاً وارد شوید.');
      // می‌توانید پارامتر را از URL پاک کنید تا با رفرش دوباره نمایش داده نشود
      // navigate('/admin/login', { replace: true });
    }
  }, [searchParams, navigate]);

  // اگر ادمین از قبل لاگین کرده، به داشبورد هدایت شود
  useEffect(() => {
    console.log("AdminLoginPage useEffect for redirect check. isUserAdmin:", isUserAdmin, "User from context:", user);
    if (isUserAdmin) { // یا یک شرط دقیق‌تر مانند (user && user.is_staff)
       if (!location.state?.from) { 
      console.log("AdminLoginPage: User is admin and no 'from' location, navigating to /admin");
      navigate('/admin', { replace: true });
    }
    }
  }, [isUserAdmin, user, navigate, location.state]); // user را هم به وابستگی‌ها اضافه کنید


  const handleLoginSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null); // پاک کردن پیام موفقیت قبلی
    console.log("Admin Login Attempt with:", { username, password }); // <--- لاگ برای بررسی مقادیر

    try {
      if (!loginAdmin) {
        throw new Error("تابع لاگین ادمین در دسترس نیست.");
      }
      // اینجا باید تابع loginAdmin شما با API بک‌اند ارتباط برقرار کند
      // و در صورت موفقیت، وضعیت احراز هویت ادمین را در AuthContext آپدیت نماید.
      await loginAdmin({ username: username, password: password });  // rememberMe را هم می‌توانید پاس دهید
      console.log(`Admin login successful, attempting to navigate to: ${redirectTo}`);

      navigate(redirectTo, { replace: true });
      // navigate('/admin'); // در useEffect بالا هندل می‌شود

    } catch (err: any) {
      console.error("Admin login failed:", err);
      setErrorMessage(err.message || 'نام کاربری یا رمز عبور نامعتبر است.');
      // منطق نمایش CAPTCHA پس از چند تلاش ناموفق را می‌توانید اینجا اضافه کنید
      // if (loginAttempts >= 3) setShowCaptcha(true);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      {/* این div برای پس‌زمینه گرادیانی یا تصویری است، استایل آن را در CSS خودتان تعریف کنید */}
      {/* <div className="login-container fixed inset-0 -z-10"></div> */}

      <div className="login-box bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden transition-all duration-300">
        {/* Header with Logo */}
        <div className="bg-white dark:bg-gray-800 px-6 sm:px-8 pt-8 pb-6 border-b border-gray-100 dark:border-gray-700">
          <div className="flex justify-center">
            <RouterLink to="/" className="logo flex items-center no-underline"> {/* لینک به صفحه اصلی سایت */}
              <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center mr-3">
                <FontAwesomeIcon icon={faCookieBite} className="text-white text-xl" />
              </div>
              <h1 className="text-2xl font-logo font-bold text-gray-800 dark:text-white">BAKEJÖY</h1>
            </RouterLink>
          </div>
          <h2 className="text-center text-lg font-medium text-gray-600 dark:text-gray-300 mt-3">
            پنل مدیریت حرفه‌ای قنادی
          </h2>
        </div>

        {/* Login Form */}
        <div className="px-6 sm:px-8 py-6">
          {errorMessage && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg mb-4 text-sm flex items-center">
              <FontAwesomeIcon icon={faExclamationCircle} className="ml-2" />
              <span>{errorMessage}</span>
            </div>
          )}
          {successMessage && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-500/30 text-green-700 dark:text-green-300 px-4 py-3 rounded-lg mb-4 text-sm flex items-center">
              <FontAwesomeIcon icon={faCheckCircle} className="ml-2" />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-5">
            {/* Username Field */}
            <div>
              <label htmlFor="admin-username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                نام کاربری یا ایمیل
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400 dark:text-gray-500">
                  <FontAwesomeIcon icon={faUser} />
                </div>
                <input
                  type="text"
                  id="admin-username"
                  name="username"
                  required
                  className="input-field block w-full pr-10 pl-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm 
                             bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                             focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-amber-400 focus:border-transparent"
                  placeholder="admin@example.com"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading}
                  autoFocus
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="admin-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                رمز عبور
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="password-toggle text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-400 focus:outline-none p-1" // افزودن پدینگ
                    aria-label={showPassword ? "مخفی کردن رمز" : "نمایش رمز"}
                  >
                    <FontAwesomeIcon icon={showPassword ? faEye : faEyeSlash} />
                  </button>
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  id="admin-password"
                  name="password"
                  required
                  className="input-field block w-full pr-10 pl-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm 
                             bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                             focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-amber-400 focus:border-transparent"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center">
                <input
                  id="remember"
                  name="remember"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700"
                />
                <label htmlFor="remember" className="mr-2 block text-gray-700 dark:text-gray-300">
                  مرا به خاطر بسپار
                </label>
              </div>
              <div>
                <RouterLink to="/admin/forgot-password" // مسیر فراموشی رمز عبور ادمین
                  className="font-medium text-primary hover:text-primary-dark dark:text-amber-400 dark:hover:text-amber-300">
                  رمز عبور را فراموش کرده‌اید؟
                </RouterLink>
              </div>
            </div>

            {/* CAPTCHA (منطق نمایش آن باید پیاده‌سازی شود) */}
            {/* {showCaptcha && (
              <div id="captcha-container">
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200">لطفاً کد امنیتی را وارد کنید</span>
                    <button type="button" className="text-xs text-primary hover:text-primary-dark">
                      <FontAwesomeIcon icon={faSyncAlt} className="ml-1" />
                      <span>تغییر تصویر</span>
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="bg-white p-2 border border-gray-300 rounded">
                      <img src="https://via.placeholder.com/150x50?text=CAPTCHA" alt="CAPTCHA" className="h-10" />
                    </div>
                    <input
                      type="text"
                      id="captcha"
                      name="captcha"
                      // required={showCaptcha} // اگر کپچا نمایش داده شد، الزامی شود
                      className="block w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none"
                      placeholder="کد امنیتی"
                      // value={captcha}
                      // onChange={(e) => setCaptcha(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </div>
            )} */}

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                id="login-btn"
                disabled={isLoading}
                className="login-btn w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm 
                           text-sm font-medium text-white bg-primary hover:bg-primary-dark 
                           focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary 
                           dark:focus:ring-offset-gray-800 transition-all duration-200 disabled:opacity-70"
              >
                {isLoading ? (
                  <>
                    <FontAwesomeIcon icon={faCircleNotch} className="animate-spin ml-2" />
                    <span>در حال ورود...</span>
                  </>
                ) : (
                  <span>ورود به پنل</span>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 dark:bg-gray-700/50 px-6 sm:px-8 py-4 border-t border-gray-100 dark:border-gray-700 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            © {new Date().getFullYear()} BAKEJÖY. تمامی حقوق محفوظ است.
            <span className="block mt-1">ورود به این پنل فقط برای مدیران مجاز است.</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;