import axios from 'axios';
import { SalesChartDataItem, User, TopProductListItem, Flavor, FlavorFormData, Category, Size, Cake, PaginatedResponse,ProductFormData, // تایپ داده‌های فرم برای ایجاد
  UpdateProductFormData,SMSTemplate,Product,Order}from '../types'; // User را ایمپورت کنید
// تایپ‌های فرم شما
import type { PasswordFormData,ProfileFormData } from '../schemas/userProfileSchemas';
import type { Address, AddressFormData } from '../schemas/addressSchema';

export interface GetAdminApiParams { // یک اینترفیس عمومی برای پارامترهای لیست
  limit?: number;
  offset?: number;
  ordering?: string;
  search?: string;
  is_active?: boolean; // مثال برای فیلتر
  // ... سایر پارامترهای مشترک
}
// آدرس پایه API بک‌اند شما
// نکته: در یک برنامه واقعی، این آدرس باید از متغیرهای محیطی خوانده شود
// (مثلاً process.env.REACT_APP_API_URL یا import.meta.env.VITE_API_URL در Vite)
const API_BASE_URL = 'http://127.0.0.1:8000/api/v1/';

// ساخت یک نمونه Axios با تنظیمات پیش‌فرض
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  // headers: {
  //   'Content-Type': 'application/json',
  //   'Accept': 'application/json',
  // }
});
apiClient.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem('accessToken'); // خواندن توکن از localStorage
    if (accessToken) {
      config.headers['Authorization'] = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
apiClient.interceptors.response.use(
  (response) => {
    // اگر پاسخ موفقیت‌آمیز بود، فقط آن را برگردان
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const refreshToken = localStorage.getItem('refreshToken');

    // اگر خطای 401 (Unauthorized) رخ داد و این اولین تلاش برای این درخواست نبود
    // و توکن بازنشانی هم وجود داشت
    if (error.response?.status === 401 && !originalRequest._retry && refreshToken) {
      originalRequest._retry = true; // علامت‌گذاری درخواست برای جلوگیری از حلقه بی‌نهایت

      console.log("Access token expired. Trying to refresh token...");
      
      try {
        // ارسال درخواست به اندپوینت رفرش توکن
        const refreshResponse = await apiClient.post('/auth/token/refresh/', {
          refresh: refreshToken,
        });

        const newAccessToken = refreshResponse.data.access;
        console.log("Token refreshed successfully. New access token:", newAccessToken);

        // ذخیره توکن دسترسی جدید
        localStorage.setItem('accessToken', newAccessToken);
        
        // آپدیت هدر Authorization برای درخواست اصلی که خطا داده بود
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
        originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;

        // ارسال مجدد درخواست اصلی با توکن جدید
        return apiClient(originalRequest);

      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);
        // اگر رفرش توکن هم با خطا مواجه شد (مثلاً توکن بازنشانی هم منقضی شده بود)،
        // کاربر را از سیستم خارج کن.
        // این بخش را باید به AuthContext خود متصل کنید تا logout را صدا بزند.
        // مثلاً: window.dispatchEvent(new Event('logout-event'));
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login'; // یا هر مسیر دیگری
        return Promise.reject(refreshError);
      }
    }

    // برای سایر خطاها، فقط خطا را برگردان
    return Promise.reject(error);
  }
);

interface CartItemUpdatePayload {
  quantity: number;
}

interface PaymentInitiationResponse {
  payment_url: string; // لینک هدایت به درگاه پرداخت زرین‌پال
}

export const downloadAdminOrdersCSV = async (
  accessToken: string,
  params: GetAdminOrdersParams // همان پارامترهای فیلتری که برای getAdminOrders استفاده می‌کنید
): Promise<Blob> => { // تابع یک Blob برمی‌گرداند که محتوای فایل CSV است
  console.log("API Call: downloadAdminOrdersCSV with params:", params);
  try {
    // اندپوینت export-csv (مطابق با url_path در بک‌اند)
    const response = await apiClient.get('/admin/orders/export-csv/', { // <-- آدرس API با url_path='export-csv'
      headers: { Authorization: `Bearer ${accessToken}` },
      params: params, // ارسال پارامترهای فیلتر
      responseType: 'blob', // مهم: به Axios (یا fetch) می‌گوییم که پاسخ یک فایل باینری (Blob) است
    });
    console.log("API Response: downloadAdminOrdersCSV successful");
    return response.data; // response.data در اینجا یک Blob خواهد بود
  } catch (error: any) {
    console.error('API Error: downloadAdminOrdersCSV failed:', error.response?.data || error.message, error);
    // اگر پاسخ خطا، JSON است، می‌توانید آن را بخوانید، در غیر این صورت خطا را پرتاب کنید
    if (error.response && error.response.data && typeof error.response.data.text === 'function') {
      const errorText = await error.response.data.text();
      throw new Error(JSON.parse(errorText).detail || 'Failed to download CSV');
    }
    throw error;
  }
};

/**
 * لیست تمام سفارشات را برای ادمین دریافت می‌کند.
 * @param accessToken توکن دسترسی کاربر ادمین
 * @returns Promise حاوی آرایه‌ای از سفارشات
 */
export const getAdminOrders = async (
  accessToken: string,
  params?: GetAdminOrdersParams
): Promise<PaginatedResponse<Order> | Order[]> => {
  // URL جدید بر اساس ساختار شما
  const orderListUrl = '/admin/orders/list/'; // <--- URL جدید را اینجا قرار دهید (بدون /api/v1/ اولیه اگر در apiClient.defaults.baseURL است)
  console.log(`API Call: getAdminOrders to <span class="math-inline">\{apiClient\.defaults\.baseURL \|\| ''\}</span>{orderListUrl} with params:`, params);
  try {
    const response = await apiClient.get<PaginatedResponse<Order> | Order[]>(
      orderListUrl,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: params
      }
    );
    console.log("API Response from getAdminOrders:", response.data);
    return response.data;
  } catch (error: any) {
    console.error('API Error: getAdminOrders failed:', error.response?.data || error.message);
    throw error; // خطا را پرتاب کن تا کامپوننت مدیریت کند
  }
};

/**
 * جزئیات یک سفارش خاص را برای ادمین دریافت می‌کند.
 * @param orderId ID سفارش مورد نظر
 * @param accessToken توکن دسترسی کاربر ادمین
 * @returns Promise حاوی جزئیات سفارش
 */
/**
 * جزئیات یک سفارش خاص را برای ادمین از سرور دریافت می‌کند.
 * @param accessToken توکن دسترسی ادمین
 * @param orderId شناسه سفارش
 * @returns Promise حاوی آبجکت سفارش
 */
export const getAdminOrderDetail = async (accessToken: string, orderId: string | number): Promise<Order> => {
  console.log(`API Call: getAdminOrderDetail for ID: ${orderId}`);
  try {
    // اندپوینت جزئیات سفارش در بک‌اند (مطابق با urls.py و AdminOrderViewSet)
    // معمولاً چیزی شبیه به /api/v1/admin/orders/{orderId}/
    const response = await apiClient.get<Order>(`/admin/orders/list/${orderId}/`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    console.log("API Response: getAdminOrderDetail successful:", response.data);
    return response.data;
  } catch (error: any) {
    console.error(`API Error: getAdminOrderDetail for ID ${orderId} failed:`, error.response?.data || error.message, error);
    throw error; // خطا را پرتاب می‌کنیم تا در کامپوننت مدیریت شود
  }
};

/**
 * فایل PDF لیست سفارشات ادمین را از سرور دانلود می‌کند.
 * @param accessToken توکن دسترسی ادمین
 * @param params پارامترهای فیلتر (مشابه getAdminOrders)
 * @returns Promise حاوی Blob داده‌های فایل PDF
 */
export const downloadAdminOrdersPDF = async (
  accessToken: string,
  params: GetAdminOrdersParams // همان پارامترهایی که برای فیلتر لیست سفارشات استفاده می‌کنید
): Promise<Blob> => {
  console.log("API Call: downloadAdminOrdersPDF with params:", params);
  try {
    // اندپوینت export-pdf (مطابق با url_path در AdminOrderViewSet بک‌اند)
    // مطمئن شوید این URL دقیقاً با چیزی که در urls.py بک‌اند تعریف کرده‌اید، مطابقت دارد.
    const response = await apiClient.get('/admin/orders/export-pdf/', { // <--- آدرس API برای PDF
      headers: { Authorization: `Bearer ${accessToken}` },
      params: params, // ارسال پارامترهای فیلتر فعلی
      responseType: 'blob', // بسیار مهم: به کلاینت HTTP می‌گوید که پاسخ یک فایل باینری (Blob) است
    });
    console.log("API Response: downloadAdminOrdersPDF successful. Content-Type:", response.headers['content-type']);
    return response.data; // response.data در اینجا یک Blob خواهد بود
  } catch (error: any) {
    console.error('API Error: downloadAdminOrdersPDF failed. Full error object:', error);
    if (error.response) {
      // سرور با یک کد وضعیت خطا پاسخ داده است
      if (error.response.status === 404) {
        throw new Error("اندپوینت دانلود PDF یافت نشد (خطای ۴۰۴). لطفاً آدرس API و تنظیمات URL در بک‌اند را بررسی کنید.");
      }
      // اگر پاسخ خطا از نوع Blob است و مثلاً HTML (صفحه خطای سرور)
      if (error.response.data instanceof Blob) {
        try {
          const errorText = await error.response.data.text();
          // اگر پاسخ خطا JSON بود، می‌توانید آن را parse کنید
          // if (error.response.headers['content-type']?.includes('application/json')) {
          //   const errorJson = JSON.parse(errorText);
          //   throw new Error(errorJson.detail || `خطا در دانلود PDF از سرور (کد: ${error.response.status})`);
          // }
          // در غیر این صورت، ممکن است HTML یا متن ساده باشد
          console.error("Server error response (text):", errorText.substring(0, 500)); // نمایش بخشی از متن خطا
          throw new Error(`خطا در دانلود PDF از سرور (کد: ${error.response.status}). جزئیات در کنسول موجود است.`);
        } catch (parseError) {
          // اگر خواندن Blob به صورت متن هم خطا داد
          throw new Error(`خطا در دانلود PDF از سرور (کد: ${error.response.status}) و پردازش پاسخ خطا.`);
        }
      } else if (typeof error.response.data === 'object' && error.response.data !== null && error.response.data.detail) {
        // اگر پاسخ خطا JSON استاندارد DRF بود
        throw new Error(error.response.data.detail);
      }
      // یک پیام خطای عمومی‌تر
      throw new Error(`خطا در دانلود PDF از سرور (کد: ${error.response.status})`);
    } else if (error.request) {
      // درخواست ارسال شده اما پاسخی دریافت نشده
      throw new Error("خطا در برقراری ارتباط با سرور برای دانلود PDF. لطفاً اتصال اینترنت خود را بررسی کنید.");
    } else {
      // خطای دیگری در هنگام آماده‌سازی درخواست
      throw new Error(`خطا در آماده‌سازی درخواست دانلود PDF: ${error.message}`);
    }
  }
};
/**
 * وضعیت یک سفارش خاص را توسط ادمین آپدیت می‌کند.
 * @param orderId ID سفارش مورد نظر
 * @param newStatus کد وضعیت جدید (مانند 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED')
 * @param accessToken توکن دسترسی کاربر ادمین
 * @returns Promise حاوی سفارش آپدیت شده
 */
export const updateAdminOrderStatus = async (
  orderId: number | string,
  newStatus: string,
  accessToken: string
): Promise<Order> => { // پاسخ معمولاً سفارش آپدیت شده است
  console.log(`API Call: updateAdminOrderStatus for order ${orderId} to status ${newStatus}`);
  // بدنه درخواست شامل وضعیت جدید است (مطابق با سریالایزر ورودی در بک‌اند)
  const payload = { status: newStatus };
  try {
    // اندپوینت آپدیت وضعیت توسط ادمین (که با @action ساختیم)
    const response = await apiClient.patch<Order>(`/admin/orders/list/${orderId}/update-status/`, payload, { // <-- آدرس API ادمین
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    console.log("API Response: updateAdminOrderStatus successful:", response.data);
    return response.data;
  } catch (error: any) {
    console.error(`API Error: updateAdminOrderStatus for order ${orderId} failed:`, error.response?.data || error.message);
    // می‌توانید خطاهای خاص‌تری را اینجا مدیریت کنید یا فقط خطا را پرتاب کنید
    throw error;
  }
};

// -------- تعریف اینترفیس‌ها برای تایپ‌دهی داده‌های دریافتی --------
// (اینها باید با فیلدهای Serializer شما در بک‌اند مطابقت داشته باشند)
export const getCurrentUser = async (accessToken: string): Promise<User> => {
  const response = await apiClient.get<User>('auth/me/', {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  return response.data;
};

export const getUserAddresses = async (accessToken: string): Promise<Address[]> => {
  console.log("API Call: getUserAddresses");
  try {
    const response = await apiClient.get<Address[]>('auth/addresses/', { // <-- اندپوینت آدرس‌ها
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    console.log("API Response: getUserAddresses successful:", response.data);
    return response.data;
  } catch (error: any) {
    console.error('API Error: getUserAddresses failed:', error.response?.data || error.message);
    throw error;
  }
};

// --- اینترفیس برای داده‌های آپدیت سفارش ---
interface OrderUpdateData {
  address_id: number;
  delivery_datetime: string; // فرمت ISO یا فرمتی که بک‌اند می‌پذیرد
  notes?: string; // اختیاری
}


// --- تابع برای آپدیت سفارش (افزودن آدرس و زمان) ---
/**
* اطلاعات آدرس و زمان تحویل سفارش (سبد خرید) را آپدیت می‌کند.
* @param orderId ID سفارش (سبد خرید)
* @param data داده‌های آپدیت شامل address_id و delivery_datetime
* @param accessToken توکن دسترسی کاربر
* @returns Promise حاوی داده‌های سفارش آپدیت شده
*/
export const updateOrderDetails = async (
  orderId: number,
  data: OrderUpdateData,
  accessToken: string
): Promise<Order> => {
  console.log(`API Call: updateOrderDetails for order ${orderId}`, data);
  try {
    // !! مسیر اندپوینت جزئیات سفارش شما !!
    const response = await apiClient.patch<Order>(
      `/orders/${orderId}/`, // <-- استفاده از PATCH
      data,
      {
        headers: { Authorization: `Bearer ${accessToken}` }
      }
    );
    console.log("API Response: updateOrderDetails successful:", response.data);
    return response.data;
  } catch (error: any) {
    console.error(`API Error: updateOrderDetails for order ${orderId} failed:`, error.response?.data || error.message);
    throw error;
  }
};
// -------- توابع برای فراخوانی API های محصولات --------

export const getCategories = async (): Promise<Category[]> => {
  try {
    const response = await apiClient.get('/products/categories/');
    return response.data; // DRF معمولا لیست اصلی را در data می‌گذارد
  } catch (error) {
    console.error("Error fetching categories:", error);
    // می‌توانید خطا را بهتر مدیریت کنید یا دوباره throw کنید
    throw error;
  }
};

/**
 * لیست محصولات (کیک‌ها) را از API دریافت می‌کند.
 * @param params - یک آبجکت اختیاری برای پارامترهای کوئری (مانند limit, category_id).
 * @returns {Promise<any>} - پاسخ API (می‌توانید any را با تایپ دقیق‌تر جایگزین کنید)
 */
export const getProducts = async (params?: { [key: string]: any }): Promise<any> => {
  try {
    const response = await apiClient.get('/products/cakes/', {
      params: params // <-- پارامترها در اینجا به درخواست اضافه می‌شوند
    });
    // اگر پاسخ شما صفحه‌بندی شده است، باید response.data را برگردانید
    // اگر مستقیم آرایه است، response.data هم صحیح است.
    return response.data;
  } catch (error) {
    console.error("Error fetching products:", error);
    throw error;
  }
};
export const getProductBySlug = async (slug: string): Promise<Cake> => {
  try {
    // توجه: URL جزئیات بر اساس slug است
    const response = await apiClient.get(`/products/cakes/${slug}/`);
    console.log('API Call: getProductBySlug with data:', response.data);
    return response.data;
  } catch (error) {
    console.error(`Error fetching product with slug ${slug}:`, error);
    throw error;
  }
};

export interface AuthTokens {
  access: string;
  refresh: string;
}

// اینترفیس برای داده‌های ارسالی به تابع login
interface LoginCredentials {
  username: string;
  password: string;
}

// تابع برای ارسال درخواست لاگین و دریافت توکن‌ها
export const login = async (credentials: LoginCredentials): Promise<AuthTokens> => {
  console.log("--- DEBUG: Inside apiLogin function ---"); // <--- لاگ جدید ۱
  try {
    console.log("--- DEBUG: Calling apiClient.post to /auth/token/ with data:", credentials); // <--- لاگ جدید ۲
    const response = await apiClient.post<AuthTokens>('/auth/token/', credentials);
    console.log("--- DEBUG: apiClient.post successful, response status:", response.status); // <--- لاگ جدید ۳
    return response.data;
  } catch (error: any) {
    // لاگ خطا رو کامل‌تر می‌کنیم
    console.error("!!! DEBUG: Login API error inside apiLogin catch block:", error); // <--- لاگ جدید ۴ (خطا رو کامل لاگ کن)
    if (error.response) {
      // اگر پاسخ خطا از سرور داشتیم
      console.error("!!! DEBUG: Server responded with:", error.response.status, error.response.data);
      if (error.response.status === 401) {
        throw new Error("نام کاربری یا رمز عبور اشتباه است.");
      } else {
        // سایر خطاهای سرور
        throw new Error(error.response.data?.detail || "خطا در سمت سرور.");
      }
    } else if (error.request) {
      // اگر درخواست ارسال شد ولی پاسخی دریافت نشد
      console.error("!!! DEBUG: No response received:", error.request);
      throw new Error("پاسخی از سرور دریافت نشد. شبکه را بررسی کنید.");
    } else {
      // خطای دیگری در تنظیم یا ارسال درخواست
      console.error('!!! DEBUG: Error setting up request:', error.message);
      throw new Error("خطا در ارسال درخواست.");
    }
    // throw new Error("خطا در برقراری ارتباط با سرور."); // این خط کلی بود، خطاهای دقیق‌تر بالا جایگزین شد
  }
};

export interface RegistrationData {
  username: string;
  email: string;
  password: string;
  password2: string;
  phone?: string;
  first_name?: string;
  last_name?: string;
}

// اینترفیس برای پاسخ موفقیت آمیز از API ثبت‌نام
// (شامل اطلاعات کاربر جدید، بدون پسورد)
export interface RegisteredUser {
  id: number;
  username: string;
  email: string;
  phone?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  // فیلدهای دیگری که سریالایزر شما برمی‌گرداند
}
import { RegisterFormData } from '../schemas/registerSchema'; 


// تابع برای ارسال درخواست ثبت‌نام
export const registerUser = async (userData: RegisterFormData): Promise<RegisteredUser> => {
  console.log("API Call: Registering user with data:", userData);
  try {
    const response = await apiClient.post<RegisteredUser>('/auth/register/', userData);
    console.log("API Response: Registration successful:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("API Error: Registration failed:", error.response?.data || error.message);
    
    // مدیریت خطای عالی شما در اینجا قرار می‌گیرد
    if (error.response?.data) {
      const errors = error.response.data;
      // تبدیل خطاهای ولیدیشن بک‌اند به یک رشته قابل نمایش
      const errorMessages = Object.keys(errors)
        .map(key => `${key}: ${Array.isArray(errors[key]) ? errors[key].join(', ') : errors[key]}`)
        .join(' \n');
      throw new Error(errorMessages || "خطا در ثبت‌نام. لطفاً اطلاعات را بررسی کنید.");
    }
    throw new Error("یک خطای پیش‌بینی نشده رخ داد.");
  }
};
export interface OrderItemInputData {
  productId: number;
  quantity: number;
  flavor_id?: number; // ID طعم انتخابی (اگر وجود دارد)
  size_variant?: number;   // ID اندازه انتخابی (اگر وجود دارد)
  notes?: string;     // یادداشت‌های سفارشی
}
// --- ---



export interface AddToCartPayload {
  product_id: number;
  product_type: 'cake' | 'partysupply'; // نوع محصول را مشخص می‌کند
  quantity: number;
  flavor_id?: number | null;
  size_variant_id?: number | null;
  notes?: string;
}

export const addItemToCart = async (
  itemData: AddToTOCartPayload,
  accessToken: string
): Promise<Order> => { 
  
  // payload را بر اساس داده‌های ورودی می‌سازیم
  const payload = {
    product_id: itemData.product_id,
    product_type: itemData.product_type,
    quantity: itemData.quantity,
    flavor: itemData.flavor_id,
    size_variant: itemData.size_variant_id,
    notes: itemData.notes,
  };

  try {
    // درخواست به ViewSet.create ارسال می‌شود
    const response = await apiClient.post<Order>('/orders/', payload, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    return response.data; 
  } catch (error: any) {
    console.error('API Error: addItemToCart failed:', error.response?.data);
    throw error;
  }
};
/**
 * یک سفارش جدید (یا آیتم سفارش) در بک‌اند ایجاد می‌کند.
 * @param orderData داده‌های آیتم سفارش شامل productId, quantity و غیره
 * @param accessToken توکن دسترسی کاربر برای احراز هویت
 * @returns Promise حاوی داده‌های سفارش ایجاد شده در صورت موفقیت
 * @throws Error در صورت بروز خطا در درخواست API
 */
// اطمینان از export پیش‌فرض apiClient
export const createOrder = async (
  orderData: OrderItemInputData,
  accessToken: string
): Promise<Order> => { // فرض می‌کنیم API کل سفارش ایجاد شده را برمی‌گرداند
  console.log('API Call: createOrder with data:', orderData);

  // <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
  // !! مهم: ساختار payload باید دقیقاً با انتظار سریالایزر بک‌اند مطابقت داشته باشد !!
  //    نام فیلدها (product, flavor, size, customization_notes) را در صورت نیاز تغییر دهید.
  const payload = {
    product: orderData.productId, // فرض: بک‌اند فیلد 'product' را برای ID محصول انتظار دارد
    quantity: orderData.quantity,
    flavor: orderData.flavor_id, // فرض: بک‌اند فیلد 'flavor' را برای ID طعم انتظار دارد
    size: orderData.size_id,     // فرض: بک‌اند فیلد 'size' را برای ID اندازه انتظار دارد
    customization_notes: orderData.notes // فرض: بک‌اند فیلد 'customization_notes' را انتظار دارد
  };
  // فقط فیلدهای دارای مقدار را ارسال می‌کنیم (اختیاری - بک‌اند باید null/undefined را مدیریت کند)
  // Object.keys(payload).forEach(key => (payload[key] === undefined || payload[key] === null || payload[key] === '') && delete payload[key]);
  // <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<


  try {
    const response = await apiClient.post<Order>( // مشخص کردن نوع پاسخ مورد انتظار
      'orders/', // <-- اندپوینت ایجاد سفارش شما
      payload,           // داده‌هایی که ارسال می‌شوند
      {
        headers: {
          // ارسال توکن در هدر Authorization
          Authorization: `Bearer ${accessToken}`
        }
      }
    );
    console.log('API Response: createOrder successful:', response.data);
    return response.data; // برگرداندن داده‌های پاسخ (سفارش ایجاد شده)
  } catch (error: any) {
    console.error('API Error: createOrder failed:', error.response?.data || error.message);
    // پرتاب مجدد خطا تا کامپوننت فراخواننده آن را بگیرد و مدیریت کند
    // می‌توانید خطا را در اینجا پردازش بیشتری هم بکنید اگر لازم است
    throw error;
  }
};

/**
 * یک سفارش قدیمی را مجدداً سفارش می‌دهد و آیتم‌های آن را به سبد خرید اضافه می‌کند.
 * @param orderId - شناسه سفارشی که باید مجدداً سفارش داده شود.
 * @param accessToken - توکن احراز هویت کاربر.
 * @returns {Promise<Order>} - آبجکت آپدیت شده سبد خرید را برمی‌گرداند.
 */
export const reorder = async (
  orderId: number | string,
  accessToken: string
): Promise<Order> => {
  console.log(`API Call: Reordering order ${orderId}`);
  try {
    const response = await apiClient.post<Order>(
      `/orders/${orderId}/reorder/`,
      null, // این درخواست بدنه (body) نیاز ندارد
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    console.log("API Response: Reorder successful", response.data);
    return response.data;
  } catch (error: any) {
    console.error(`API Error: Reorder for order ${orderId} failed:`, error.response?.data || error.message);
    throw error; // خطا را پرتاب کن تا کامپوننت آن را مدیریت کند
  }
};


export const getCart = async (accessToken: string): Promise<Order> => {
  console.log("API Call: getCart");
  try {
    // !! مهم: مسیر را مطابق با baseURL تنظیم کنید !!
    // اگر baseURL شامل /api/v1 است: '/cart/'
    // اگر baseURL شامل /api/v1 نیست: '/api/v1/cart/'
    const response = await apiClient.get<Order>(
      'cart/', // <-- مسیر API سبد خرید
      {
        headers: { Authorization: `Bearer ${accessToken}` }
      }
    );
    console.log("API Response: getCart successful:", response.data);
    return response.data;
  } catch (error: any) {
    console.error('API Error: getCart failed:', error.response?.data || error.message);
    // پرتاب خطا تا کامپوننت آن را بگیرد
    throw error;
  }
};

/**
 * فرآیند پرداخت برای یک سفارش مشخص را با فراخوانی اکشن 'pay' در بک‌اند آغاز می‌کند.
 * @param orderId ID سفارش (که باید در وضعیت PENDING_PAYMENT باشد)
 * @param accessToken توکن دسترسی کاربر
 * @returns Promise حاوی آبجکتی با کلید payment_url
 * @throws Error اگر درخواست API ناموفق باشد
 */
export const initiatePayment = async (
  orderId: number,
  accessToken: string
): Promise<PaymentInitiationResponse> => {
  console.log(`API Call: initiatePayment for order ${orderId}`);
  try {
    // اندپوینت شما POST /api/v1/orders/{orderId}/pay/ بود
    // مسیر نسبی آن می‌شود /orders/{orderId}/pay/
    const response = await apiClient.post<PaymentInitiationResponse>(
      `/orders/${orderId}/pay/`,
      {}, // بدنه درخواست خالی است چون ID در URL است
      {
        headers: { Authorization: `Bearer ${accessToken}` }
      }
    );
    console.log("API Response: initiatePayment successful:", response.data);
    // بررسی اینکه آیا payment_url در پاسخ وجود دارد
    if (!response.data || !response.data.payment_url) {
      console.error("API Error: Payment URL not found in the response from initiatePayment");
      throw new Error("Payment URL not received from server.");
    }
    return response.data; // آبجکت حاوی payment_url را برمی‌گرداند
  } catch (error: any) {
    console.error(`API Error: initiatePayment for order ${orderId} failed:`, error.response?.data || error.message);
    // خطا را پرتاب کن تا در کامپوننت مدیریت شود
    throw error;
  }
};

/**
 * تعداد یک آیتم خاص در سبد خرید کاربر را آپدیت می‌کند.
 * @param itemId ID آیتم سفارش (OrderItem)
 * @param quantity تعداد جدید
 * @param accessToken توکن دسترسی کاربر
 * @returns Promise حاوی داده‌های آیتم آپدیت شده (یا پاسخ خالی اگر بک‌اند چیزی برنگرداند)
 */
export const updateCartItemQuantity = async (
  itemId: number,
  quantity: number,
  accessToken: string
): Promise<OrderItem | void> => { // نوع بازگشتی ممکن است void یا OrderItem باشد
  console.log(`API Call: updateCartItemQuantity for item ${itemId} to quantity ${quantity}`);
  const payload: CartItemUpdatePayload = { quantity };
  try {
    // اندپوینت: PATCH /api/v1/orders/cart/items/{itemId}/
    const response = await apiClient.patch<OrderItem>( // فرض می‌کنیم آیتم آپدیت شده را برمی‌گرداند
      `orders/cart/items/${itemId}/`, // <<-- مسیر آپدیت آیتم
      payload,
      {
        headers: { Authorization: `Bearer ${accessToken}` }
      }
    );
    console.log("API Response: updateCartItemQuantity successful:", response.data);
    return response.data; // یا اگر پاسخی ندارد، return;
  } catch (error: any) {
    console.error(`API Error: updateCartItemQuantity for item ${itemId} failed:`, error.response?.data || error.message);
    throw error;
  }
};

/**
* یک آیتم خاص را از سبد خرید کاربر حذف می‌کند.
* @param itemId ID آیتم سفارش (OrderItem)
* @param accessToken توکن دسترسی کاربر
* @returns Promise<void> چون DELETE معمولا پاسخی ندارد
*/
export const removeCartItem = async (
  itemId: number,
  accessToken: string
): Promise<void> => {
  console.log(`API Call: removeCartItem for item ${itemId}`);
  try {
    // اندپوینت: DELETE /api/v1/orders/cart/items/{itemId}/
    await apiClient.delete(
      `/orders/cart/items/${itemId}/`, // <<-- مسیر حذف آیتم
      {
        headers: { Authorization: `Bearer ${accessToken}` }
      }
    );
    console.log("API Response: removeCartItem successful (No Content)");
    // DELETE معمولا پاسخی ندارد (204 No Content)
  } catch (error: any) {
    console.error(`API Error: removeCartItem for item ${itemId} failed:`, error.response?.data || error.message);
    throw error;
  }
};

/**
 * جزئیات یک سفارش خاص را بر اساس ID آن از سرور دریافت می‌کند.
 * @param orderId ID سفارش مورد نظر
 * @param accessToken توکن دسترسی کاربر
 * @returns Promise حاوی جزئیات سفارش
 */
export const getOrderById = async (
  orderId: number | string, // می‌تواند عدد یا رشته باشد (از URL می‌آید)
  accessToken: string
): Promise<Order> => { // از تایپ Order یا OrderDetails استفاده کنید
  console.log(`API Call: getOrderById for order ${orderId}`);
  try {
    const response = await apiClient.get<Order>(
      `/orders/${orderId}/`, // <-- اندپوینت جزئیات سفارش
      {
        headers: { Authorization: `Bearer ${accessToken}` }
      }
    );
    console.log("API Response: getOrderById successful:", response.data);
    return response.data;
  } catch (error: any) {
    console.error(`API Error: getOrderById for order ${orderId} failed:`, error.response?.data || error.message);
    throw error; // خطا را پرتاب کن تا کامپوننت مدیریت کند
  }
};
export const findOrCreateTags = async (accessToken: string, tagNames: string[]): Promise<number[]> => {
  if (tagNames.length === 0) {
    return []; // اگر تگی وجود ندارد، درخواست نفرست
  }
  const response = await apiClient.post('admin/products/tags/find-or-create/', { names: tagNames }, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  return response.data.tag_ids; // آرایه‌ای از اعداد را برمی‌گرداند
};
export const getAdminTags = async (accessToken: string): Promise<Tag[]> => {
  // از متد GET استفاده می‌کند و داده‌ای ارسال نمی‌کند
  const response = await apiClient.get('admin/products/tags/', {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  // لیست کاملی از آبجکت‌های تگ را برمی‌گرداند
  // مثال خروجی: [{id: 1, name: 'کیک'}, {id: 2, name: 'شکلاتی'}, ...]
  return response.data.results || response.data; 
};
/**
 * لیست تمام محصولات (کیک ها) را برای ادمین دریافت می‌کند.
 * @param accessToken توکن دسترسی ادمین
 * @returns Promise حاوی آرایه‌ای از محصولات (Cake)
 */
export const getAdminProducts = async (accessToken: string): Promise<Cake[]> => {
  console.log("API Call: getAdminProducts");
  try {
    // اندپوینت لیست کیک های ادمین
    const response = await apiClient.get<Cake[]>('/admin/products/cakes/', { // <-- آدرس API ادمین
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    console.log("API Response: getAdminProducts successful:", response.data);
    // TODO: Handle pagination if needed (e.g., response.data.results)
    return response.data;
  } catch (error: any) {
    console.error('API Error: getAdminProducts failed:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * جزئیات یک محصول (کیک) خاص را برای ادمین دریافت می‌کند.
 * @param productId ID محصول مورد نظر
 * @param accessToken توکن دسترسی ادمین
 * @returns Promise حاوی جزئیات محصول (Cake)
 */
export const getAdminProductDetail = async (productId: number | string, accessToken: string): Promise<Cake> => {
  console.log(`API Call: getAdminProductDetail for product ${productId}`);
  try {
    // اندپوینت جزئیات کیک ادمین
    const response = await apiClient.get<Cake>(`/admin/products/cakes/${productId}/`, { // <-- آدرس API ادمین
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    console.log("API Response: getAdminProductDetail successful:", response.data);
    return response.data;
  } catch (error: any) {
    console.error(`API Error: getAdminProductDetail for product ${productId} failed:`, error.response?.data || error.message);
    throw error;
  }
};

// تعریف یک اینترفیس یا تایپ برای داده‌های ارسالی هنگام ایجاد/ویرایش محصول
// این باید شامل تمام فیلدهایی باشد که ادمین می‌تواند تنظیم کند
export interface AdminProductPayload {
  name: string;
  slug?: string; // اسلاگ ممکن است خودکار ساخته شود یا دستی وارد شود
  description?: string;
  category_id: number; // ارسال ID دسته‌بندی
  base_price: number | string; // ارسال قیمت به صورت عدد یا رشته
  price_type: string; // کد نوع قیمت (مثل FIXED یا PER_KG)
  is_active?: boolean;
  // فیلدهای ManyToMany به صورت آرایه‌ای از ID ها ارسال می‌شوند
  flavor_ids?: number[];
  size_ids?: number[];
  // فیلد تصویر جداگانه مدیریت می‌شود (FormData)
  image?: File | null | string; // می‌تواند فایل جدید، null (برای حذف)، یا URL فعلی (در آپدیت) باشد
}


/**
 * یک محصول (کیک) جدید توسط ادمین ایجاد می‌کند.
 * از FormData برای ارسال داده‌ها (به خاطر احتمال وجود فایل تصویر) استفاده می‌شود.
 * @param productData داده‌های محصول جدید (بدون تصویر)
 * @param imageFile فایل تصویر (اختیاری)
 * @param accessToken توکن دسترسی ادمین
 * @returns Promise حاوی محصول ایجاد شده (Cake)
 */
/**
 * یک محصول (کیک) جدید توسط ادمین ایجاد می‌کند.
 * @param accessToken توکن دسترسی ادمین
 * @param productData آبجکت داده‌های متنی، عددی، و غیر فایلی از فرم
 * @param mainImageFile فایل تصویر اصلی (اختیاری)
 * @param galleryImageFiles فایل‌های گالری جدید (اختیاری)
 */
export const createAdminProduct = async (
  accessToken: string,
  productData: ProductFormData,
  mainImageFile: File | null,
  galleryImageFiles: FileList | null
): Promise<Cake> => {
  // URL اندپوینت برای ایجاد محصول. مطمئن شوید با urls.py شما مطابقت دارد.
  const url = '/admin/products/cakes/'; // یا /admin/products/cakes/

  console.log("API Call: createAdminProduct with data:", productData, "Main Image:", mainImageFile?.name, "Gallery Count:", galleryImageFiles?.length);

  const formData = new FormData();

  // --- اضافه کردن فیلدهای متنی، عددی، و بولین به FormData ---
  formData.append('name', productData.name);
  if (productData.slug) formData.append('slug', productData.slug);
  if (productData.short_description) formData.append('short_description', productData.short_description);
  if (productData.description) formData.append('description', productData.description);
  formData.append('is_active', String(productData.is_active));
  if (productData.is_featured !== undefined) formData.append('is_featured', String(productData.is_featured));

  // --- قیمت‌گذاری ---
  formData.append('base_price', String(productData.base_price));
  formData.append('price_type', productData.price_type);
  if (productData.sale_price !== null && productData.sale_price !== undefined) {
    formData.append('sale_price', String(productData.sale_price));
  }
  formData.append('schedule_sale_enabled', String(productData.schedule_sale_enabled || false));
  if (productData.sale_start_date) formData.append('sale_start_date', productData.sale_start_date); // ارسال رشته YYYY-MM-DD
  if (productData.sale_end_date) formData.append('sale_end_date', productData.sale_end_date);

  // --- اطلاعات تکمیلی و سئو ---
  if (productData.ingredients_text) formData.append('ingredients_text', productData.ingredients_text);
  if (productData.nutrition_info_text) formData.append('nutrition_info_text', productData.nutrition_info_text);
  if (productData.allergen_info_text) formData.append('allergen_info_text', productData.allergen_info_text);
  if (productData.meta_title) formData.append('meta_title', productData.meta_title);
  if (productData.meta_description) formData.append('meta_description', productData.meta_description);
  if (productData.meta_keywords) formData.append('meta_keywords', productData.meta_keywords);
  
  // --- اضافه کردن آرایه‌های ID (روابط) ---
  if (productData.category_id) formData.append('category_id', String(productData.category_id));
  productData.flavor_ids?.forEach(id => formData.append('flavor_ids', String(id)));
  // اگر از ManyToManyField ساده برای اندازه‌ها استفاده می‌کنید:
  productData.size_ids?.forEach(id => formData.append('size_ids', String(id)));
  // اگر از مدل واسط CakeSizeVariant استفاده می‌کنید:
  if (productData.size_variants && productData.size_variants.length > 0) {
    formData.append('size_variants_json', JSON.stringify(productData.size_variants));
  }

  // --- اضافه کردن فایل تصویر اصلی ---
  if (mainImageFile instanceof File) {
    formData.append('image', mainImageFile, mainImageFile.name); // نام کلید باید 'image' باشد (مطابق با مدل)
  }

  // --- اضافه کردن فایل‌های گالری جدید ---
  if (galleryImageFiles && galleryImageFiles.length > 0) {
    for (let i = 0; i < galleryImageFiles.length; i++) {
      formData.append('gallery_images_upload', galleryImageFiles[i], galleryImageFiles[i].name); // کلید write_only
    }
  }
  
  // برای دیباگ نهایی FormData
  // for (let pair of formData.entries()) { console.log(pair[0] + ': ' + pair[1]); }

  try {
    const response = await apiClient.post<Cake>(url, formData, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    return response.data;
  } catch (error: any) {
    console.error('API Error: createAdminProduct failed:', error.response?.data || error.message);
    throw error.response?.data || { detail: error.message || "خطای ناشناخته" };
  }
};

/**
 * یک محصول (کیک) موجود را توسط ادمین به‌روزرسانی می‌کند.
 */
export const updateAdminProduct = async (
  accessToken: string,
  productId: number | string,
  productData: UpdateProductFormData,
  mainImageFile: File | null | undefined,
  galleryImageFiles: FileList | null,
  galleryImagesToRemoveIds?: (number | string)[]
): Promise<Cake> => {
  const url = `/admin/products/cakes/${productId}/`; // URL صحیح شما
  
  const formData = new FormData();
  console.log(`API Call: updateAdminProduct for product ${productId}`, { productData, mainImageFile, galleryImageFiles, galleryImagesToRemoveIds });

  // اضافه کردن تمام فیلدهای غیر فایلی از productData به FormData
  // سریالایزر بک‌اند با PATCH فقط فیلدهای ارسالی را آپدیت می‌کند
  (Object.keys(productData) as Array<keyof UpdateProductFormData>).forEach(key => {
    // از اضافه کردن فیلدهای خاص (فایل، آرایه‌ها) در این حلقه خودداری کنید
    if (key !== 'main_image' && key !== 'gallery_images' && 
        key !== 'category_ids' && key !== 'flavor_ids' && key !== 'size_ids' && 
        key !== 'size_variants' && key !== 'gallery_images_to_remove_ids' && key !== 'remove_main_image') {
      const value = productData[key];
      if (value !== undefined) { // فقط فیلدهایی که برای آپدیت ارسال شده‌اند
        formData.append(key, value === null ? '' : String(value));
      }
    }
  });

  // اضافه کردن آرایه‌های ID (اگر برای آپدیت ارسال شده‌اند)
  if (productData.category_id !== undefined) formData.append('category_id', String(productData.category_id));
  if (productData.flavor_ids !== undefined) productData.flavor_ids.forEach(id => formData.append('flavor_ids', String(id)));
  if (productData.size_ids !== undefined) productData.size_ids.forEach(id => formData.append('size_ids', String(id)));
  if (productData.size_variants !== undefined) {
    formData.append('size_variants_json', JSON.stringify(productData.size_variants));
  }

  // مدیریت فایل تصویر اصلی
  if (mainImageFile instanceof File) { // اگر فایل جدیدی آپلود شده
    formData.append('image', mainImageFile, mainImageFile.name);
  } else if (productData.remove_main_image === true) { // اگر دستور حذف آمده
    formData.append('remove_main_image', 'true'); // ارسال سیگنال حذف به سریالایزر
  }
  // اگر mainImageFile برابر undefined و remove_main_image هم false است، چیزی ارسال نمی‌شود و تصویر تغییر نمی‌کند.

  // مدیریت فایل‌های گالری
  if (galleryImageFiles && galleryImageFiles.length > 0) {
    for (let i = 0; i < galleryImageFiles.length; i++) {
      formData.append('gallery_images_upload', galleryImageFiles[i], galleryImageFiles[i].name);
    }
  }
  if (galleryImagesToRemoveIds && galleryImagesToRemoveIds.length > 0) {
    galleryImagesToRemoveIds.forEach(id => formData.append('gallery_images_to_remove_ids', String(id)));
  }

  try {
    // برای آپدیت با فایل‌ها، بهتر است از POST با هدر X-HTTP-Method-Override: PATCH استفاده شود
    // یا یک اکشن سفارشی در بک‌اند بسازید. اما بسیاری از بک‌اندها PATCH با multipart/form-data را می‌پذیرند.
    // اگر apiClient.patch با FormData مشکل دارد، از apiClient.post استفاده کنید و در بک‌اند آن را مدیریت کنید.
    const response = await apiClient.patch<Cake>(url, formData, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    return response.data;
  } catch (error: any) {
    console.error(`API Error: updateAdminProduct for product ${productId} failed:`, error.response?.data || error.message);
    throw error.response?.data || { detail: error.message || "خطای ناشناخته" };
  }
};

/**
 * یک محصول (کیک) خاص را توسط ادمین حذف می‌کند.
 * @param productId ID محصول مورد نظر
 * @param accessToken توکن دسترسی ادمین
 * @returns Promise<void> چون پاسخی ندارد
 */
export const deleteAdminProduct = async (productId: number | string, accessToken: string): Promise<void> => {
  console.log(`API Call: deleteAdminProduct for product ${productId}`);
  try {
    // اندپوینت حذف کیک ادمین
    await apiClient.delete(`/admin/products/cakes/${productId}/`, { // <-- آدرس API ادمین
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    console.log("API Response: deleteAdminProduct successful (No Content)");
  } catch (error: any) {
    console.error(`API Error: deleteAdminProduct for product ${productId} failed:`, error.response?.data || error.message);
    throw error;
  }
};

/**
 * لیست تمام طعم‌های موجود را برای نمایش عمومی دریافت می‌کند.
 */
export const getFlavors = async (): Promise<Flavor[]> => {
  try {
    // ۱. آدرس به اندپوینت عمومی تغییر کرد
    const response = await apiClient.get('/products/flavors/');
    
    // ۲. اگر پاسخ شما صفحه‌بندی شده است، results را برگردانید
    return response.data.results || response.data;
  } catch (error: any) {
    console.error('API Error: getFlavors failed:', error);
    throw error;
  }
};

/**
 * لیست تمام اندازه‌های موجود را (برای استفاده در فرم ادمین) دریافت می‌کند.
 * @param accessToken توکن دسترسی ادمین (اگر اندپوینت نیاز به احراز هویت دارد)
 * @returns Promise حاوی آرایه‌ای از اندازه‌ها (Size)
 */
export const getSizes = async (accessToken?: string): Promise<Size[]> => {
  console.log("API Call: getSizes");
  try {
    // اندپوینت لیست اندازه‌ها (ممکن است عمومی باشد یا مخصوص ادمین)
    // اگر عمومی است: '/products/sizes/'
    // اگر مخصوص ادمین است: '/admin/products/sizes/'
    const config = accessToken ? { headers: { Authorization: `Bearer ${accessToken}` } } : {};
    const response = await apiClient.get<Size[]>('/admin/products/sizes/', config); // <-- مسیر اندپوینت را چک کنید
    console.log("API Response: getSizes successful:", response.data);
    // TODO: Handle pagination if needed
    return response.data;
  } catch (error: any) {
    console.error('API Error: getSizes failed:', error.response?.data || error.message);
    throw error;
  }
};

export const getAdminCategories = async (accessToken: string): Promise<Category[]> => {
  console.log("API Call: getAdminCategories");
  try {
    const response = await apiClient.get<Category[]>('/admin/products/categories/', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    // TODO: Handle pagination if needed
    return response.data;
  } catch (error: any) {
    console.error('API Error: getAdminCategories failed:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * چندین محصول را به صورت گروهی توسط ادمین حذف می‌کند.
 * @param accessToken توکن دسترسی کاربر ادمین.
 * @param productIds آرایه‌ای از شناسه‌های محصولات برای حذف.
 * @returns Promise حاوی یک آبجکت با پیام جزئیات یا void.
 */
export const deleteAdminProductsBulk = async (
  accessToken: string,
  productIds: (number | string)[] // آرایه‌ای از ID ها
): Promise<{ detail: string } | void> => { // بک‌اند شما ممکن است یک پیام detail برگرداند
  const url = '/admin/products/cakes/bulk-delete/'; // URL اکشن بک‌اند شما (مسیر را با ساختار خودتان تطبیق دهید)
  console.log(`API Call: Bulk DELETE products to ${apiClient.defaults.baseURL || ''}${url} with IDs:`, productIds);
  try {
    const response = await apiClient.post<{ detail: string }>( // استفاده از POST برای ارسال بدنه با ID ها
      url,
      { ids: productIds }, // ارسال ID ها در یک آبجکت با کلید 'ids' (مطابق با بک‌اند)
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': undefined,
          // 'Content-Type': 'application/json',
        },
      }
    );
    console.log("API Response from deleteAdminProductsBulk:", response.data);
    return response.data; // یا اگر بک‌اند 204 برمی‌گرداند، اینجا void خواهد بود
  } catch (error: any) {
    const errorDetail = error.response?.data || { detail: error.message || "خطای ناشناخته در حذف گروهی محصولات" };
    console.error('API Error: deleteAdminProductsBulk failed:', errorDetail);
    throw errorDetail; // خطا را برای مدیریت در کامپوننت پرتاب کنید
  }
};

/**
 * وضعیت is_active چندین محصول را به صورت گروهی توسط ادمین آپدیت می‌کند.
 * @param accessToken توکن دسترسی کاربر ادمین.
 * @param productIds آرایه‌ای از شناسه‌های محصولات برای آپدیت.
 * @param isActive وضعیت جدید is_active (true برای فعال، false برای غیرفعال).
 * @returns Promise حاوی یک آبجکت با پیام جزئیات یا void.
 */
export const updateAdminProductStatusBulk = async (
  accessToken: string,
  productIds: (number | string)[],
  isActive: boolean // وضعیت جدید
): Promise<{ detail: string } | void> => {
  const url = '/admin/products/cakes/bulk-update-status/'; // URL اکشن بک‌اند شما
  const payload = {
    ids: productIds,
    is_active: isActive, // ارسال وضعیت جدید
  };
  console.log(`API Call: Bulk UPDATE product status to ${apiClient.defaults.baseURL || ''}${url} with payload:`, payload);
  try {
    const response = await apiClient.post<{ detail: string }>(url, payload, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': undefined
        // 'Content-Type': 'application/json',
      },
    });
    console.log("API Response from updateAdminProductStatusBulk:", response.data);
    return response.data;
  } catch (error: any) {
    const errorDetail = error.response?.data || { detail: error.message || "خطای ناشناخته در آپدیت گروهی وضعیت محصولات" };
    console.error('API Error: updateAdminProductStatusBulk failed:', errorDetail);
    throw errorDetail;
  }
};

export const getAdminCategoryDetail = async (
  accessToken: string,
  categoryId: string | number // این باید ID عددی باشد
): Promise<Category> => {
  // اطمینان از اینکه categoryId یک مقدار معتبر برای URL است
  if (!categoryId || isNaN(Number(categoryId))) { // بررسی اینکه آیا عدد است یا رشته عددی
    const errorMsg = `Invalid categoryId provided for getAdminCategoryDetail: ${categoryId}`;
    console.error(errorMsg);
    return Promise.reject(new Error(errorMsg));
  }

  const url = `/admin/products/categories/${categoryId}/`; // <--- URL صحیح با ID و اسلش انتهایی
  // نکته: مطمئن شوید که پیشوند /api/v1/ در apiClient.defaults.baseURL شما وجود دارد
  // و پیشوند /admin/panel/ که قبلاً برای orders داشتید، اینجا /admin/products/ است.
  // اگر پیشوند کلی شما برای همه اینها /admin/panel/ است، پس باید باشد:
  // const url = `/admin/panel/categories/${categoryId}/`;

  console.log(`API Call: getAdminCategoryDetail to <span class="math-inline">\{apiClient\.defaults\.baseURL \|\| ''\}</span>{url}`);
  try {
    const response = await apiClient.get<Category>(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    console.log("API Response from getAdminCategoryDetail:", response.data);
    return response.data;
  } catch (error: any) {
    console.error(`API Error: getAdminCategoryDetail for ID ${categoryId} failed:`, error.response?.data || error.message);
    throw error;
  }
};

// تایپ برای داده‌های ارسالی فرم دسته‌بندی
export interface AdminCategoryPayload {
  name: string;
  description?: string;
  // slug معمولا خودکار ساخته می‌شود و ارسال نمی‌شود
}

export interface CategoryFormData {
  name: string;
  description?: string | null; // <-- اجازه null
  is_active: boolean;
  slug?: string;
}

export const createAdminCategory = async (
  accessToken: string,
  categoryData: CategoryFormData,
  imageFile: File | null
): Promise<Category> => {
  const url = '/admin/products/categories/'; // URL صحیح شما
  const formData = new FormData();
  console.log("--- createAdminCategory: Building FormData ---");
  console.log("categoryData received:", categoryData);
  console.log("imageFile received:", imageFile);

  // Name (الزامی و همیشه رشته)
  formData.append('name', categoryData.name);

  // Slug (اختیاری، اگر وجود دارد و رشته است)
  if (typeof categoryData.slug === 'string' && categoryData.slug.trim() !== '') {
    formData.append('slug', categoryData.slug);
  }

  // Description (اختیاری)
  // اگر description وجود دارد و null نیست، آن را اضافه کن.
  // اگر می‌خواهید null یا undefined به عنوان رشته خالی ارسال شود، می‌توانید این کار را هم بکنید.
  if (categoryData.description !== undefined && categoryData.description !== null) {
    formData.append('description', categoryData.description);
  } else {
    // اگر بک‌اند انتظار دارد که فیلد description حتی اگر خالی است ارسال شود،
    // می‌توانید یک رشته خالی بفرستید:
    // formData.append('description', ''); 
    // یا اگر ارسال نشدن فیلد به معنای null/خالی بودن است، این بخش را کامنت کنید.
    // بستگی به تنظیمات default و blank=True, null=True در مدل جنگو شما دارد.
    // برای شروع، اگر null یا undefined است، اصلاً ارسالش نکنیم.
  }

  // is_active (همیشه به رشته تبدیل شود)
  formData.append('is_active', String(categoryData.is_active));

  // Image (فقط اگر فایل معتبری وجود دارد)
  if (imageFile instanceof File) { // بررسی دقیق‌تر که imageFile یک File باشد
    formData.append('image', imageFile, imageFile.name);
    console.log("Appended to FormData - image:", imageFile.name, imageFile.size, imageFile.type);

  }

  console.log(`API Call: createAdminCategory to ${apiClient.defaults.baseURL || ''}${url}`);
  // برای دیباگ محتوای FormData:
  // for (let pair of formData.entries()) {
  //   console.log(pair[0] + ': ' + (pair[1] instanceof File ? `File(${pair[1].name}, ${pair[1].size} bytes)` : pair[1]));
  // }

  try {
    const response = await apiClient.post<Category>(url, formData, {
      headers: { Authorization: `Bearer ${accessToken}` }
      // Content-Type توسط Axios برای FormData به طور خودکار تنظیم می‌شود
    });
    console.log("API Response from createAdminCategory:", response.data);
    return response.data;
  } catch (error: any) {
    console.error('API Error: createAdminCategory failed:', error.response?.data || error.message);
    const apiError = error.response?.data || { detail: error.message || "خطای ناشناخته در ایجاد دسته‌بندی" };
    throw apiError; // خطا را برای مدیریت در کامپوننت پرتاب کنید
  }
};

// برای آپدیت، می‌توانیم از Partial برای همه فیلدها استفاده کنیم
// یا یک تایپ مشخص‌تر برای فیلدهایی که واقعاً از فرم می‌آیند
export interface UpdateCategoryFormData {
  name?: string;
  slug?: string;
  description?: string | null;
  is_active?: boolean;
  // image نیازی نیست اینجا باشد، جداگانه پاس داده می‌شود
  // remove_image?: boolean; // برای دستور حذف تصویر
}

export const updateAdminCategory = async (
  accessToken: string,
  categoryId: number | string,
  categoryData: UpdateCategoryFormData,
  imageFile: File | null
): Promise<Category> => {
  const url = `admin/products/categories/${categoryId}/`; // URL صحیح شما

  const formData = new FormData();

  // Name (معمولاً در ویرایش هم ارسال می‌شود اگر تغییر کرده)
  if (categoryData.name !== undefined) {
    formData.append('name', categoryData.name);
  }

  // Slug (اگر قابل ویرایش است و تغییر کرده)
  if (categoryData.slug !== undefined) {
    formData.append('slug', categoryData.slug);
  }

  // Description
  if (categoryData.description !== undefined) {
    // اگر description برابر null است، یک رشته خالی ارسال می‌کنیم (بک‌اند باید این را مدیریت کند)
    // یا اگر null به معنی "بدون تغییر" است، اصلاً این فیلد را append نکنید.
    // فرض می‌کنیم اگر description در categoryData هست، باید ارسال شود.
    formData.append('description', categoryData.description === null ? '' : categoryData.description);
  }

  // is_active
  if (categoryData.is_active !== undefined) {
    formData.append('is_active', String(categoryData.is_active));
  }

  // Image
  if (imageFile instanceof File) { // فقط اگر یک فایل معتبر جدید وجود دارد
    formData.append('image', imageFile, imageFile.name);
  } else if (categoryData.hasOwnProperty('remove_image') && categoryData.remove_image === true) {
    // اگر صریحاً درخواست حذف تصویر آمده (و imageFile جدیدی نیست)
    // بک‌اند باید بتواند image='' یا یک سیگنال دیگر را به عنوان حذف تصویر تفسیر کند.
    formData.append('image', ''); // ارسال رشته خالی برای حذف تصویر (بسته به بک‌اند)
  }
  // اگر نه imageFile جدیدی هست و نه remove_image، فیلد image به FormData اضافه نمی‌شود.
  // بک‌اند نباید تصویر موجود را تغییر دهد.

  console.log(`API Call: PATCH to ${apiClient.defaults.baseURL || ''}${url} for category ${categoryId}`);
  // برای دیباگ FormData:
  // for (let pair of formData.entries()) {
  //   console.log(`FormData - ${pair[0]}: ${pair[1] instanceof File ? `File(${pair[1].name})` : pair[1]}`);
  // }

  try {
    const response = await apiClient.patch<Category>(url, formData, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        // Content-Type برای FormData توسط Axios خودکار تنظیم می‌شود
      },
    });
    console.log("API Response from updateAdminCategory:", response.data);
    return response.data;
  } catch (error: any) {
    console.error(`API Error: updateAdminCategory for ID ${categoryId} failed:`, error.response?.data || error.message);
    const apiError = error.response?.data || { detail: error.message || `خطای ناشناخته در ویرایش دسته‌بندی ${categoryId}` };
    throw apiError;
  }
};


export const deleteAdminCategory = async (
  accessToken: string,         // آرگومان اول: توکن دسترسی
  categoryId: number | string  // آرگومان دوم: شناسه دسته‌بندی
): Promise<void> => {
  console.log(`API Call: deleteAdminCategory for category ${categoryId}`);
  try {
    await apiClient.delete(`/admin/products/categories/${categoryId}/`, { // URL شما
      headers: { Authorization: `Bearer ${accessToken}` }
    });
  } catch (error: any) {
    console.error(`API Error: deleteAdminCategory failed:`, error.response?.data || error.message);
    throw error;
  }
};

// --- توابع برای مدیریت طعم‌ها توسط ادمین ---

export const getAdminFlavors = async (
  accessToken: string,
  params?: GetAdminApiParams // <--- اضافه کردن پارامتر برای صفحه‌بندی، فیلتر، جستجو
): Promise<PaginatedResponse<Flavor> | Flavor[]> => { // <--- تایپ بازگشتی می‌تواند شامل PaginatedResponse باشد
  console.log("API Call: getAdminFlavors with params:", params);
  try {
    const response = await apiClient.get<PaginatedResponse<Flavor> | Flavor[]>('/admin/products/flavors/', { // <-- آدرس API ادمین
      headers: { Authorization: `Bearer ${accessToken}` },
      params: params // <--- ارسال پارامترها
    });
    console.log("API Response from getAdminFlavors:", response.data);
    return response.data;
  } catch (error: any) {
    console.error('API Error: getAdminFlavors failed:', error.response?.data || error.message);
    throw error;
  }
};

export const createAdminFlavor = async (accessToken: string, flavorData: Omit<Flavor, 'id'>): Promise<Flavor> => {
  console.log("API Call: createAdminFlavor with data:", flavorData);
  try {
    // طعم‌ها معمولا فایل ندارند، پس JSON می‌فرستیم
    const response = await apiClient.post<Flavor>('/admin/products/flavors/', flavorData, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json' // JSON payload
      }
    });
    return response.data;
  } catch (error: any) {
    console.error('API Error: createAdminFlavor failed:', error.response?.data || error.message);
    if (error.response && error.response.data) { throw error.response.data; }
    throw error;
  }
};

export const updateAdminFlavor = async (
  accessToken: string,         // آرگومان اول
  flavorId: number | string,   // آرگومان دوم: ID طعم
  flavorData: Partial<FlavorFormData> // آرگومان سوم: داده‌های فرم
): Promise<Flavor> => {
  console.log(`API Call: updateAdminFlavor for flavor ${flavorId} with data:`, flavorData);
  try {
    const response = await apiClient.patch<Flavor>(`/admin/products/flavors/${flavorId}/`, flavorData, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error: any) {
    console.error(`API Error: updateAdminFlavor failed:`, error.response?.data || error.message);
    if (error.response && error.response.data) { throw error.response.data; }
    throw error;
  }
};

export const deleteAdminFlavor = async (flavorId: number | string, accessToken: string): Promise<void> => {
  console.log(`API Call: deleteAdminFlavor for flavor ${flavorId}`);
  try {
    await apiClient.delete(`/admin/products/flavors/${flavorId}/`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
  } catch (error: any) {
    console.error(`API Error: deleteAdminFlavor failed:`, error.response?.data || error.message);
    throw error;
  }
};


// --- توابع برای مدیریت اندازه‌ها توسط ادمین ---

/**
 * لیست تمام اندازه‌ها را برای ادمین واکشی می‌کند (با پشتیبانی از صفحه‌بندی، فیلتر و جستجو).
 */


/**
 * یک اندازه خاص را توسط ادمین حذف می‌کند.
 */

/**
 * جزئیات یک طعم خاص را برای ادمین دریافت می‌کند.
 * @param flavorId ID طعم مورد نظر
 * @param accessToken توکن دسترسی ادمین
 * @returns Promise حاوی جزئیات طعم (Flavor)
 */
export const getAdminFlavorDetail = async (
  accessToken: string,
  flavorId: number | string
): Promise<Flavor> => {
  const url = `/admin/products/flavors/${flavorId}/`; // <-- اسلش انتهایی مهم است
  console.log(`API Call: getAdminFlavorDetail for ID ${flavorId} to <span class="math-inline">\{apiClient\.defaults\.baseURL \|\| ''\}</span>{url}`);
  try {
    const response = await apiClient.get<Flavor>(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    console.log("API Response from getAdminFlavorDetail:", response.data);
    return response.data;
  } catch (error: any) {
    console.error(`API Error: getAdminFlavorDetail for ID ${flavorId} failed:`, error.response?.data || error.message);
    throw error;
  }
};

/**
 * لیست تمام اندازه‌ها را برای ادمین واکشی می‌کند (با پشتیبانی از صفحه‌بندی، فیلتر و جستجو).
 */
export const getAdminSizes = async (
  accessToken: string,
  params?: GetAdminApiParams
): Promise<PaginatedResponse<Size> | Size[]> => {
  const url = '/admin/products/sizes/'; // <-- URL اندپوینت لیست اندازه‌ها (با اسلش انتهایی)
  // این را با پیشوند واقعی خود (مثلاً /admin/products/sizes/) جایگزین کنید
  console.log(`API Call: getAdminSizes to ${apiClient.defaults.baseURL || ''}${url} with params:`, params);
  try {
    const response = await apiClient.get<PaginatedResponse<Size> | Size[]>(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: params, // ارسال پارامترهای limit, offset, ordering, search, is_active و غیره
    });
    console.log("API Response from getAdminSizes:", response.data);
    return response.data;
  } catch (error: any) {
    const errorDetail = error.response?.data || error.message;
    console.error('API Error: getAdminSizes failed:', errorDetail);
    throw error.response?.data || error; // بهتر است خطای کامل‌تری throw شود
  }
};

/**
 * جزئیات یک اندازه خاص را برای ادمین واکشی می‌کند.
 */
export const getAdminSizeDetail = async (
  accessToken: string,
  sizeId: number | string
): Promise<Size> => {
  // اطمینان از اینکه sizeId یک مقدار معتبر برای URL است
  if (!sizeId || (typeof sizeId === 'string' && sizeId.trim() === '') || (typeof sizeId === 'number' && isNaN(sizeId))) {
    const errorMsg = `Invalid sizeId provided for getAdminSizeDetail: ${sizeId}`;
    console.error(errorMsg);
    return Promise.reject(new Error(errorMsg));
  }
  const url = `/admin/products/sizes/${sizeId}/`; // <-- URL با شناسه و اسلش انتهایی
  console.log(`API Call: GET to ${apiClient.defaults.baseURL || ''}${url} for size details`);
  try {
    const response = await apiClient.get<Size>(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    console.log("API Response from getAdminSizeDetail:", response.data);
    return response.data;
  } catch (error: any) {
    const errorDetail = error.response?.data || error.message;
    console.error(`API Error: getAdminSizeDetail for ID ${sizeId} failed:`, errorDetail);
    throw error.response?.data || error;
  }
};

/**
 * یک اندازه جدید توسط ادمین ایجاد می‌کند.
 */
export const createAdminSize = async (
  accessToken: string,
  sizeData: SizeFormData // داده‌های فرم برای ایجاد
): Promise<Size> => {
  const url = '/admin/products/sizes/'; // URL برای POST (با اسلش انتهایی)

  // تبدیل رشته‌های عددی به عدد قبل از ارسال
  // و مدیریت مقادیر null/undefined برای فیلدهای اختیاری
  const dataToSend: any = {
    name: sizeData.name,
    is_active: sizeData.is_active === undefined ? true : sizeData.is_active, // پیش‌فرض true اگر تعریف نشده
  };

  if (sizeData.description !== undefined && sizeData.description !== null) {
    dataToSend.description = sizeData.description;
  } else {
    dataToSend.description = null; // یا رشته خالی "" اگر بک‌اند null را نمی‌پذیرد
  }

  if (sizeData.estimated_weight_kg !== undefined && sizeData.estimated_weight_kg !== null && String(sizeData.estimated_weight_kg).trim() !== '') {
    const weight = parseFloat(String(sizeData.estimated_weight_kg));
    if (!isNaN(weight)) dataToSend.estimated_weight_kg = weight;
    else dataToSend.estimated_weight_kg = null; // یا خطا بدهید اگر ورودی نامعتبر است
  } else {
    dataToSend.estimated_weight_kg = null;
  }

  if (sizeData.price_modifier !== undefined && sizeData.price_modifier !== null && String(sizeData.price_modifier).trim() !== '') {
    const modifier = parseFloat(String(sizeData.price_modifier));
    if (!isNaN(modifier)) dataToSend.price_modifier = modifier;
    else dataToSend.price_modifier = 0.00; // یا null یا خطا
  } else {
    dataToSend.price_modifier = 0.00; // پیش‌فرض
  }

  if (sizeData.serving_suggestion !== undefined && sizeData.serving_suggestion !== null) {
    dataToSend.serving_suggestion = sizeData.serving_suggestion;
  } else {
    dataToSend.serving_suggestion = null; // یا رشته خالی ""
  }

  console.log(`API Call: POST to ${apiClient.defaults.baseURL || ''}${url} with data:`, dataToSend);
  try {
    const response = await apiClient.post<Size>(url, dataToSend, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });
    console.log("API Response from createAdminSize:", response.data);
    return response.data;
  } catch (error: any) {
    const apiError = error.response?.data || { detail: error.message || "خطای ناشناخته در ایجاد اندازه" };
    console.error('API Error: createAdminSize failed:', apiError);
    throw apiError;
  }
};

/**
 * یک اندازه موجود را توسط ادمین ویرایش می‌کند.
 * از متد PATCH برای آپدیت ناقص استفاده می‌شود.
 */
export const updateAdminSize = async (
  accessToken: string,
  sizeId: number | string,
  sizeData: Partial<SizeFormData> // Partial چون همه فیلدها ممکن است ارسال نشوند
): Promise<Size> => {
  // اطمینان از اینکه sizeId یک مقدار معتبر برای URL است
  if (!sizeId || (typeof sizeId === 'string' && sizeId.trim() === '') || (typeof sizeId === 'number' && isNaN(sizeId))) {
    // ... (مدیریت خطای sizeId نامعتبر) ...
    return Promise.reject(new Error(`Invalid sizeId: ${sizeId}`));
  }
  const url = `/admin/products/sizes/${sizeId}/`; // URL با شناسه و اسلش انتهایی

  // آماده‌سازی داده‌ها برای ارسال، فقط فیلدهایی که در sizeData وجود دارند
  // و تبدیل رشته‌های عددی به عدد
  const dataToSend: any = {};
  if (sizeData.name !== undefined) dataToSend.name = sizeData.name;
  if (sizeData.is_active !== undefined) dataToSend.is_active = sizeData.is_active;

  if (sizeData.description !== undefined) {
    dataToSend.description = sizeData.description === null ? null : sizeData.description; // ارسال null اگر null است، در غیر اینصورت رشته
  }
  if (sizeData.estimated_weight_kg !== undefined) {
    if (sizeData.estimated_weight_kg === null || String(sizeData.estimated_weight_kg).trim() === '') {
      dataToSend.estimated_weight_kg = null;
    } else {
      const weight = parseFloat(String(sizeData.estimated_weight_kg));
      if (!isNaN(weight)) dataToSend.estimated_weight_kg = weight;
      // else: اگر نامعتبر بود، ارسال نکنید یا خطا بدهید (بسته به اعتبارسنجی فرم)
    }
  }
  if (sizeData.price_modifier !== undefined) {
    if (sizeData.price_modifier === null || String(sizeData.price_modifier).trim() === '') {
      dataToSend.price_modifier = null; // یا 0.00 اگر null مجاز نیست
    } else {
      const modifier = parseFloat(String(sizeData.price_modifier));
      if (!isNaN(modifier)) dataToSend.price_modifier = modifier;
      // else: ...
    }
  }
  if (sizeData.serving_suggestion !== undefined) {
    dataToSend.serving_suggestion = sizeData.serving_suggestion === null ? null : sizeData.serving_suggestion;
  }

  console.log(`API Call: PATCH to ${apiClient.defaults.baseURL || ''}${url} for size ${sizeId} with data:`, dataToSend);
  try {
    const response = await apiClient.patch<Size>(url, dataToSend, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });
    console.log("API Response from updateAdminSize:", response.data);
    return response.data;
  } catch (error: any) {
    const apiError = error.response?.data || { detail: error.message || `خطای ناشناخته در ویرایش اندازه ${sizeId}` };
    console.error(`API Error: updateAdminSize for ID ${sizeId} failed:`, apiError);
    throw apiError;
  }
};

/**
 * یک اندازه خاص را توسط ادمین حذف می‌کند.
 */
export const deleteAdminSize = async (
  accessToken: string,
  sizeId: number | string
): Promise<void> => {
  // اطمینان از اینکه sizeId یک مقدار معتبر برای URL است
  if (!sizeId || (typeof sizeId === 'string' && sizeId.trim() === '') || (typeof sizeId === 'number' && isNaN(sizeId))) {
    // ... (مدیریت خطای sizeId نامعتبر) ...
    return Promise.reject(new Error(`Invalid sizeId: ${sizeId}`));
  }
  const url = `/admin/products/sizes/${sizeId}/`; // URL با شناسه و اسلش انتهایی

  console.log(`API Call: DELETE to ${apiClient.defaults.baseURL || ''}${url} for size ${sizeId}`);
  try {
    await apiClient.delete(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    console.log(`Size ${sizeId} deleted successfully.`);
  } catch (error: any) {
    const errorDetail = error.response?.data || error.message;
    console.error(`API Error: deleteAdminSize for ID ${sizeId} failed:`, errorDetail);
    throw error.response?.data || error;
  }
};



/**
 * آمار داشبورد ادمین را از سرور دریافت می‌کند.
 * @param accessToken توکن دسترسی ادمین
 * @returns Promise حاوی آبجکت آمار داشبورد
 */
export const getAdminDashboardStats = async (accessToken: string): Promise<AdminDashboardStats> => {
  console.log("API Call: getAdminDashboardStats");
  try {
    // اندپوینت آمار داشبورد ادمین (مطابق با urls.py)
    const response = await apiClient.get<AdminDashboardStats>('/admin/orders/dashboard-stats/', { // <-- آدرس API
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    console.log("API Response: getAdminDashboardStats successful:", response.data);
    return response.data;
  } catch (error: any) {
    console.error('API Error: getAdminDashboardStats failed:', error.response?.data || error.message, error);
    // فعلا خطا را پرتاب می‌کنیم تا در کامپوننت مدیریت شود
    // توجه: انتظار داریم این درخواست فعلا 404 یا 500 برگرداند
    throw error;
  }
};


// اکسپورت کردن نمونه Axios برای استفاده‌های احتمالی دیگر
export const getProductReviews = async (cakeSlug: string): Promise<Review[]> => {
  console.log(`API Call: getProductReviews for slug ${cakeSlug}`);
  try {
    const response = await apiClient.get<Review[]>(`/products/cakes/${cakeSlug}/reviews/`);
    console.log("API Response: getProductReviews successful:", response.data);
    return response.data; // یا response.data.results اگر Pagination دارید
  } catch (error: any) {
    console.error(`API Error: getProductReviews for ${cakeSlug} failed:`, error.response?.data || error.message);
    throw error;
  }
};

interface ReviewPayload {
  rating: number;
  comment?: string;
}

export const submitReview = async (
  cakeSlug: string,
  reviewData: ReviewPayload,
  accessToken: string
): Promise<Review> => { // معمولا نظر جدید ایجاد شده را برمی‌گرداند
  console.log(`API Call: submitReview for slug ${cakeSlug} with data:`, reviewData);
  try {
    // اندپوینت شما: POST /api/v1/products/cakes/{cake_slug}/reviews/
    const response = await apiClient.post<Review>(
      `/products/cakes/${cakeSlug}/reviews/`,
      reviewData,
      {
        headers: { Authorization: `Bearer ${accessToken}` }
      }
    );
    console.log("API Response: submitReview successful:", response.data);
    return response.data;
  } catch (error: any) {
    console.error(`API Error: submitReview for ${cakeSlug} failed:`, error.response?.data || error.message);
    // خطا را پرتاب کن تا در کامپوننت مدیریت شود
    throw error;
  }
};

/**
 * محصولات پیشنهادی/مشابه را بر اساس اسلاگ محصول فعلی دریافت می‌کند.
 * @param slug اسلاگ محصول فعلی
 * @returns Promise حاوی آرایه‌ای از محصولات پیشنهادی (Cake)
 */
export const getSuggestedProductsBySlug = async (slug: string): Promise<Cake[]> => {
  console.log(`API Call: getSuggestedProductsBySlug for slug ${slug}`);
  try {
    // مسیر اندپوینت محصولات پیشنهادی شما در بک‌اند
    // این مسیر ممکن است چیزی شبیه /products/cakes/${slug}/suggested/ یا /products/cakes/${slug}/related/ باشد
    // لطفاً این مسیر را با API واقعی خودتان تطبیق دهید.
    const response = await apiClient.get<Cake[]>(`/products/cakes/${slug}/suggested/`);
    console.log("API Response: getSuggestedProductsBySlug successful:", response.data);
    return response.data; // فرض بر اینکه API آرایه‌ای از محصولات (Cake) را برمی‌گرداند
  } catch (error: any) {
    console.error(`API Error: getSuggestedProductsBySlug for ${slug} failed:`, error.response?.data || error.message);
    throw error; // خطا را پرتاب کن تا کامپوننت مدیریت کند
  }
};

interface OrderItemNotePayload {
  notes: string | null; // اجازه می‌دهیم یادداشت null هم ارسال شود برای پاک کردن
}

/**
 * یادداشت یک آیتم خاص در سبد خرید کاربر را آپدیت می‌کند.
 * @param itemId ID آیتم سفارش (OrderItem)
 * @param payload آبجکتی شامل { notes: "متن جدید" }
 * @param accessToken توکن دسترسی کاربر
 * @returns Promise حاوی داده‌های آیتم آپدیت شده
 */
export const updateOrderItemNote = async (
  itemId: number,
  payload: { notes: string | null },
  accessToken: string
): Promise<OrderItem> => {
  console.log(`API Call: updateOrderItemNote for item ${itemId} with payload:`, payload);
  try {
    const response = await apiClient.patch<OrderItem>( // <--- apiClient نمونه‌ای از axios است
      `/orders/cart/items/${itemId}/`,
      payload, // بدنه درخواست (داده‌ها) - این پارامتر دوم است
      { // <--- این پارامتر سوم، آبجکت config است
        headers: { Authorization: `Bearer ${accessToken}` }
        // اگر گزینه‌های دیگری مانند validateStatus اینجا به اشتباه عدد گرفته باشند، خطا رخ می‌دهد
      }
    );
    console.log("API Response: updateOrderItemNote successful:", response.data);
    return response.data;
  } catch (error: any) {
    console.error(`API Error: updateOrderItemNote for item ${itemId} failed:`, error.response?.data || error.message);
    // خطایی که شما می‌بینید از اینجا throw نمی‌شود، بلکه قبل از رسیدن به catch در خود axios رخ داده
    throw error;
  }
};

export const getAdminTopProducts = async (
  accessToken: string,
  limit: number = 5 // مقدار پیش‌فرض برای limit
): Promise<TopProductListItem[]> => {
  const url = '/admin/orders/top-selling-products/'; // URL صحیحی که در بک‌اند تعریف کردید
  console.log(`API Call: getAdminTopProducts to ${apiClient.defaults.baseURL || ''}${url} with params: { limit: ${limit} }`);
  try {
    const response = await apiClient.get<TopProductListItem[]>(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: { limit } // ارسال پارامتر limit
    });
    console.log("API Response from getAdminTopProducts:", response.data);
    return response.data || []; // اگر response.data تعریف نشده بود، آرایه خالی برگردان
  } catch (error: any) {
    console.error('API Error: getAdminTopProducts failed:', error.response?.data || error.message);
    throw error;
  }
};

export const getAdminSalesChartData = async (
  accessToken: string,
  period: '7d' | '30d' | string = '7d' // پارامتر دوره زمانی
): Promise<SalesChartDataItem[]> => {
  const url = '/admin/orders/sales-chart-data/'; // URL صحیحی که در بک‌اند تعریف کردید
  console.log(`API Call: getAdminSalesChartData to ${apiClient.defaults.baseURL || ''}${url} with params: { period: "${period}" }`);
  try {
    const response = await apiClient.get<SalesChartDataItem[]>(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: { period }
    });
    console.log("API Response from getAdminSalesChartData:", response.data);
    return response.data || [];
  } catch (error: any) {
    console.error('API Error: getAdminSalesChartData failed:', error.response?.data || error.message);
    throw error;
  }
};

export interface BulkUpdateStatusResponse {
  detail: string;
  updated_count?: number;
  failed_ids?: number[]; // اگر بک‌اند شما ID های ناموفق را برمی‌گرداند
}

/**
 * وضعیت چندین سفارش را به صورت گروهی در بک‌اند به‌روز می‌کند.
 * @param accessToken توکن دسترسی ادمین
 * @param orderIds آرایه‌ای از ID های سفارشات برای به‌روزرسانی
 * @param newStatus کلید وضعیت جدید (مثلاً 'PROCESSING')
 * @returns Promise حاوی پاسخ از سرور
 */
export const bulkUpdateOrderStatusApi = async (
  accessToken: string,
  orderIds: number[],
  newStatus: string
): Promise<BulkUpdateStatusResponse> => { // یا Promise<any> اگر ساختار پاسخ دقیق نیست
  console.log(`API Call: bulkUpdateOrderStatus for IDs: ${orderIds.join(', ')} to status: ${newStatus}`);
  try {
    const response = await apiClient.post<BulkUpdateStatusResponse>(
      '/admin/orders/list/bulk-update-status/', // <--- مطمئن شوید این URL با بک‌اند شما مطابقت دارد
      {
        order_ids: orderIds, // نام فیلد باید با چیزی که بک‌اند انتظار دارد یکی باشد
        status: newStatus,   // نام فیلد باید با چیزی که بک‌اند انتظار دارد یکی باشد
      },
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    console.log("API Response: bulkUpdateOrderStatus successful:", response.data);
    return response.data;
  } catch (error: any) {
    console.error('API Error: bulkUpdateOrderStatus failed:', error.response?.data || error.message, error);
    // یک خطای معنی‌دارتر برای نمایش به کاربر throw کنید
    throw new Error(
      error.response?.data?.detail || // پیام خطای خاص از بک‌اند (اگر وجود دارد)
      error.message ||               // پیام خطای عمومی‌تر از Axios/Fetch
      'خطا در هنگام به‌روزرسانی گروهی وضعیت سفارشات. لطفاً دوباره امتحان کنید.'
    );
  }
};

export interface BulkDeleteResponse {
  detail: string;
  deleted_count?: number; // بک‌اند شما 'updated_count' را برمی‌گرداند که اینجا 'deleted_count' در نظر می‌گیریم
  errors?: string[];
}

/**
 * سفارشات انتخاب شده را به صورت گروهی "حذف نرم" می‌کند (فیلد is_deleted آنها را true می‌کند).
 * @param accessToken توکن دسترسی ادمین
 * @param orderIds آرایه‌ای از ID های سفارشات برای حذف نرم
 * @returns Promise حاوی پاسخ از سرور
 */
export const bulkSoftDeleteOrdersApi = async (
  accessToken: string,
  orderIds: number[]
): Promise<BulkDeleteResponse> => {
  console.log(`API Call: bulkSoftDeleteOrders for IDs: ${orderIds.join(', ')}`);
  try {
    // اندپوینت بک‌اند برای حذف نرم گروهی
    // مطمئن شوید این URL دقیقاً با چیزی که در urls.py بک‌اند برای اکشن bulk_delete_orders تعریف کرده‌اید، مطابقت دارد.
    const response = await apiClient.post<BulkDeleteResponse>(
      '/admin/orders/list/bulk-delete-orders/', // URL اندپوینت بک‌اند
      {
        order_ids: orderIds // بدنه درخواست شامل ID ها
      },
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    console.log("API Response: bulkSoftDeleteOrders successful:", response.data);
    return response.data;
  } catch (error: any) {
    console.error('API Error: bulkSoftDeleteOrders failed:', error.response?.data || error.message, error);
    throw new Error(
      error.response?.data?.detail ||
      error.message ||
      'خطا در هنگام حذف گروهی سفارشات.'
    );
  }
};

/**
 * لیست یادداشت‌های داخلی یک سفارش خاص را از سرور دریافت می‌کند.
 * @param accessToken توکن دسترسی ادمین
 * @param orderId شناسه سفارش
 * @returns Promise حاوی آرایه‌ای از یادداشت‌های داخلی
 */
export const getInternalOrderNotes = async (
  accessToken: string,
  orderId: number | string // orderId می‌تواند از useParams بیاید که رشته است
): Promise<InternalNote[]> => {
  // مسیر API بک‌اند شما برای دریافت یادداشت‌های یک سفارش خاص
  // این مسیر باید با url_path اکشن list_internal_notes در AdminOrderViewSet شما مطابقت داشته باشد
  // که به صورت /api/v1/admin/orders/{order_pk}/internal-notes/ خواهد بود.
  // ما API_BASE_URL را داریم، پس بقیه مسیر را به آن اضافه می‌کنیم.
  const url = `admin/orders/list/${orderId}/internal-notes/`;
  console.log(`API Call: getInternalOrderNotes for Order ID: ${orderId} - URL: ${API_BASE_URL}${url}`);

  try {
    const response = await apiClient.get<InternalNote[]>(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    console.log("API Response: getInternalOrderNotes successful:", response.data);
    return response.data;
  } catch (error: any) {
    console.error(`API Error: getInternalOrderNotes for Order ID ${orderId} failed:`, error.response?.data || error.message, error);
    throw new Error(
      error.response?.data?.detail ||
      error.message ||
      'خطا در دریافت یادداشت‌های داخلی سفارش.'
    );
  }
};

/**
 * یک یادداشت داخلی جدید برای یک سفارش خاص به سرور اضافه می‌کند.
 * @param accessToken توکن دسترسی ادمین
 * @param orderId شناسه سفارش
 * @param noteText متن یادداشت جدید
 * @returns Promise حاوی آبجکت یادداشت داخلی ایجاد شده
 */
export const addInternalOrderNote = async (
  accessToken: string,
  orderId: number | string,
  noteText: string
): Promise<InternalNote> => {
  // مسیر API بک‌اند شما برای افزودن یادداشت به یک سفارش خاص
  // این مسیر باید با url_path اکشن add_internal_note در AdminOrderViewSet شما مطابقت داشته باشد
  // که به صورت /api/v1/admin/orders/{order_pk}/add-internal-note/ خواهد بود.
  const url = `admin/orders/list/${orderId}/add-internal-note/`;
  console.log(`API Call: addInternalOrderNote for Order ID: ${orderId} - URL: ${API_BASE_URL}${url}`);

  try {
    const response = await apiClient.post<InternalNote>(
      url,
      { note_text: noteText }, // بدنه درخواست شامل متن یادداشت
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    console.log("API Response: addInternalOrderNote successful:", response.data);
    return response.data;
  } catch (error: any) {
    console.error(`API Error: addInternalOrderNote for Order ID ${orderId} failed:`, error.response?.data || error.message, error);
    throw new Error(
      error.response?.data?.detail || // اگر بک‌اند جزئیات خطا را در detail برمی‌گرداند
      (error.response?.data?.note_text && Array.isArray(error.response.data.note_text) ? error.response.data.note_text.join(', ') : null) || // اگر خطای اعتبارسنجی برای note_text بود
      error.message ||
      'خطا در ثبت یادداشت داخلی جدید.'
    );
  }
};

/**
 * تاریخچه تغییرات وضعیت یک سفارش خاص را برای ادمین از سرور دریافت می‌کند.
 * @param accessToken توکن دسترسی ادمین
 * @param orderId شناسه سفارش
 * @returns Promise حاوی آرایه‌ای از لاگ‌های وضعیت سفارش
 */
export const getAdminOrderStatusHistory = async (
  accessToken: string,
  orderId: number | string
): Promise<OrderStatusLog[]> => {
  // مسیر API بک‌اند شما برای دریافت تاریخچه وضعیت یک سفارش خاص
  // این مسیر باید با url_path اکشن status_history در AdminOrderViewSet شما مطابقت داشته باشد
  // که به صورت /api/v1/admin/orders/{order_pk}/status-history/ خواهد بود.
  const url = `admin/orders/list/${orderId}/status-history/`;
  console.log(`API Call: getAdminOrderStatusHistory for Order ID: ${orderId} - URL: ${API_BASE_URL}${url}`);

  try {
    const response = await apiClient.get<OrderStatusLog[]>(url, { // <--- OrderStatusLog[] به عنوان نوع پاسخ
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    console.log("API Response: getAdminOrderStatusHistory successful:", response.data);
    return response.data;
  } catch (error: any) {
    console.error(`API Error: getAdminOrderStatusHistory for Order ID ${orderId} failed:`, error.response?.data || error.message, error);
    throw new Error(
      error.response?.data?.detail ||
      error.message ||
      'خطا در دریافت تاریخچه وضعیت سفارش.'
    );
  }
};

export const downloadAdminOrderInvoicePDF = async (
  accessToken: string,
  orderId: number | string
): Promise<Blob> => {
  const url = `admin/orders/list/${orderId}/generate-invoice-pdf/`;
  console.log(`API Call: downloadAdminOrderInvoicePDF for Order ID: ${orderId}`);
  try {
    const response = await apiClient.get(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
      responseType: 'blob',
    });
    return response.data;
  } catch (error: any) {
    // ... (مدیریت خطای مشابه توابع دانلود دیگر) ...
    console.error(`API Error: downloadAdminOrderInvoicePDF for Order ID ${orderId} failed:`, error);
    throw new Error(error.response?.data?.detail || error.message || 'خطا در دانلود فاکتور PDF.');
  }
};

/**
 * این تابع لیست تمام قالب‌های پیامک را از سرور دریافت می‌کند
 * @param accessToken توکن احراز هویت کاربر
 * @returns {Promise<PaginatedResponse<SMSTemplate>>} لیستی از قالب‌های پیامک
 */
export const getAdminSmsTemplates = async (accessToken: string): Promise<PaginatedResponse<SMSTemplate>> => {
    // اصلاح شده: آدرس URL مطابق با router.register در urls.py است
    const response = await apiClient.get('/admin/orders/sms-templates/', {
        headers: { Authorization: `Bearer ${accessToken}` },
    });
    return response.data;
};

/**
 * این تابع یک قالب پیامک موجود را آپدیت می‌کند
 * @param accessToken توکن احراز هویت کاربر
 * @param templateId شناسه قالب
 * @param data داده‌هایی که باید آپدیت شوند
 * @returns {Promise<SMSTemplate>} آبجکت قالب آپدیت شده
 */
export const updateAdminSmsTemplate = async (
    accessToken: string,
    templateKey: string, // شناسه اکنون همیشه یک رشته است
    data: Partial<Pick<SMSTemplate, 'message_template'>>
): Promise<SMSTemplate> => {
    // URL اکنون با شناسه متنی به درستی ساخته می‌شود
    const response = await apiClient.patch(`admin/orders/sms-templates/${templateKey}/`, data, {
        headers: { Authorization: `Bearer ${accessToken}` },
    });
    return response.data;
};


//================================================================
// SMS LOGS & STATS FUNCTIONS (توابع جدید برای گزارش‌ها و آمار)
//================================================================

/**
 * دریافت لیست گزارش‌های پیامک‌های ارسالی با قابلیت فیلتر و صفحه‌بندی
 * @param accessToken - توکن دسترسی ادمین
 * @param params - پارامترهای کوئری برای فیلتر و صفحه‌بندی (مثال: { page: 1, status: 'failed' })
 */
export const getAdminSmsLogs = async (
    accessToken: string,
    params?: Record<string, any>
): Promise<PaginatedResponse<SmsLog>> => {
    // اصلاح شده: آدرس URL مطابق با router.register در urls.py است
    const response = await apiClient.get('/admin/orders/sms-logs/', {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: params, // ارسال فیلترها به عنوان query string
    });
    return response.data;
};

/**
 * دریافت آمار کلی پیامک‌ها با قابلیت فیلتر
 * @param accessToken - توکن دسترسی ادمین
 * @param params - پارامترهای کوئری برای فیلتر (معمولاً همان فیلترهای لاگ‌ها)
 */
export const getAdminSmsStats = async (
    accessToken: string,
    params?: Record<string, any>
): Promise<SmsStats> => {
    // نکته: این مسیر باید در بک‌اند شما وجود داشته باشد
    const response = await apiClient.get('/admin/orders/sms-stats/', {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: params,
    });
    return response.data;
};

export const getSmsCreditBalance = async (accessToken: string): Promise<{credit: number}> => {
    // آدرس این API مطابق با چیزی است که در urls.py تعریف کردیم
    const response = await apiClient.get('admin/orders/sms-credit-balance/', {
        headers: { Authorization: `Bearer ${accessToken}` },
    });
    return response.data;
};
/**
 * لیست سفارشات کاربر لاگین کرده را واکشی می‌کند.
 * این اندپوینت باید در بک‌اند شما برای کاربران عادی (غیر ادمین) در دسترس باشد.
 */
export const getUserOrders = async (
  accessToken: string,
  params?: GetAdminApiParams // برای صفحه‌بندی و مرتب‌سازی
): Promise<PaginatedResponse<Order>> => {
  // اندپوینت سفارشات کاربر ممکن است با اندپوینت ادمین متفاوت باشد
  const url = '/orders/'; // فرض بر اینکه اندپوینت سفارشات کاربر /api/v1/orders/ است
  console.log(`API Call: getUserOrders with params:`, params);
  try {
    const response = await apiClient.get<PaginatedResponse<Order>>(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: params,
    });
    return response.data;
  } catch (error: any) {
    console.error('API Error: getUserOrders failed:', error.response?.data || error.message);
    throw error.response?.data || error;
  }
};


/**
 * لیست علاقه‌مندی‌های کاربر لاگین کرده را واکشی می‌کند.
 */
export const getUserWishlist = async (
  accessToken: string,
  params?: GetAdminApiParams
): Promise<PaginatedResponse<Product>> => { // فرض می‌کنیم آیتم‌های علاقه‌مندی همان مدل محصول هستند
  const url = '/products/wishlist/'; // <-- شما باید این اندپوینت را در بک‌اند خود بسازید
  console.log(`API Call: getUserWishlist with params:`, params);
  try {
    const response = await apiClient.get<PaginatedResponse<Product>>(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: params,
    });
    return response.data;
  } catch (error: any) {
    console.error('API Error: getUserWishlist failed:', error.response?.data || error.message);
    throw error;
  }
};
/**
 * یک محصول را به لیست علاقه‌مندی‌های کاربر اضافه می‌کند.
 */
export const addToWishlist = async (
  productType: 'cakes' | 'supplies',
   accessToken: string,
  productSlug: string
  
): Promise<any> => {
  // ۲. URL را به صورت داینامیک می‌سازیم
  const url = `/products/${productType}/${productSlug}/add_to_wishlist/`;
  try {
    const response = await apiClient.post(url, {}, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    return response.data;
  } catch (error: any) {
    console.error(`API Error: addToWishlist failed for ${productType} ${productSlug}:`, error);
    throw error;
  }
};
/**
 * یک محصول را از لیست علاقه‌مندی‌های کاربر حذف می‌کند.
 */
export const removeFromWishlist = async (
  productType: 'cakes' | 'supplies',
  accessToken: string, 
  productSlug: string // <-- تغییر از productId به productSlug
): Promise<void> => {
 const url = `/products/${productType}/${productSlug}/remove-from-wishlist/`; // <-- استفاده از اسلاگ در URL
  try {
    await apiClient.post(url, {}, { // یا delete اگر متد بک‌اند را تغییر دادید
      headers: { Authorization: `Bearer ${accessToken}` }
    });
  } catch (error: any) {
    console.error(`API Error: removeFromWishlist for ${productType} ${productSlug} failed:`, error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

export const getUserProfile = async (accessToken: string): Promise<User> => {
  const response = await apiClient.get<User>('/users/me/', {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  return response.data;
};
export const updateUserProfile = async (data: ProfileFormData, accessToken: string): Promise<User> => {
  const response = await apiClient.patch<User>('/users/me/', data, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  return response.data;
};
export const changePassword = async (data: PasswordFormData, accessToken: string): Promise<void> => {
  // در این درخواست، پاسخ خاصی دریافت نمی‌کنیم، فقط وضعیت موفقیت‌آمیز بودن
  await apiClient.put('/users/change-password/', data, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
};
export const getAddresses = async (accessToken: string): Promise<Address[]> => {
    const response = await apiClient.get<Address[]>('/users/addresses/', {
        headers: { Authorization: `Bearer ${accessToken}` }
    });
    return response.data;
};

// ۲. افزودن آدرس جدید
export const addAddress = async (data: AddressFormData, accessToken: string): Promise<Address> => {
    const response = await apiClient.post<Address>('/users/addresses/', data, {
        headers: { Authorization: `Bearer ${accessToken}` }
    });
    return response.data;
};

// ۳. ویرایش آدرس موجود
export const updateAddress = async (id: number, data: AddressFormData, accessToken: string): Promise<Address> => {
    const response = await apiClient.patch<Address>(`/users/addresses/${id}/`, data, {
        headers: { Authorization: `Bearer ${accessToken}` }
    });
    return response.data;
};

// ۴. حذف آدرس
export const deleteAddress = async (id: number, accessToken: string): Promise<void> => {
    await apiClient.delete(`/users/addresses/${id}/`, {
        headers: { Authorization: `Bearer ${accessToken}` }
    });
};

// ۵. تنظیم به عنوان پیش‌فرض
export const setDefaultAddress = async (id: number, accessToken: string): Promise<void> => {
    await apiClient.post(`/users/addresses/${id}/set-default/`, null, {
        headers: { Authorization: `Bearer ${accessToken}` }
    });
};

interface Location {
  id: number;
  name: string;
}

/**
 * لیست تمام استان‌ها را از API دریافت می‌کند.
 * @param accessToken - توکن احراز هویت کاربر
 * @returns {Promise<Location[]>} - آرایه‌ای از آبجکت‌های استان
 */
export const getProvinces = async (accessToken: string): Promise<Location[]> => {
  try {
    const response = await apiClient.get<Location[]>('/users/provinces/', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return response.data;
  } catch (error) {
    console.error("API Error: Could not fetch provinces.", error);
    throw error;
  }
};

/**
 * لیست شهرهای مربوط به یک استان خاص را دریافت می‌کند.
 * @param provinceId - شناسه (ID) استانی که شهرهایش مورد نیاز است.
 * @param accessToken - توکن احراز هویت کاربر.
 * @returns {Promise<Location[]>} - آرایه‌ای از آبجکت‌های شهر
 */
export const getCities = async (provinceId: string | number, accessToken: string): Promise<Location[]> => {
  // اگر استانی انتخاب نشده، درخواست ارسال نکن و یک آرایه خالی برگردان
  if (!provinceId) {
    return [];
  }
  
  try {
    const response = await apiClient.get<Location[]>('/users/cities/', {
      // با استفاده از params، کوئری به صورت خودکار به URL اضافه می‌شود
      // e.g., /locations/cities/?province_id=5
      params: {
        province_id: provinceId,
      },
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return response.data;
  } catch (error) {
    console.error(`API Error: Could not fetch cities for province ${provinceId}.`, error);
    throw error;
  }
};
export const retryPayment = async (orderId: string | number, accessToken: string): Promise<{ payment_url: string }> => {
  const response = await apiClient.post<{ payment_url: string }>(`/orders/${orderId}/pay/`, null, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  return response.data;
};

// برای گرفتن لیست محصولات بر اساس فیلترها
export const getSupplies = async (params: any, accessToken?: string | null): Promise<any> => {
  // اگر توکن وجود داشت، هدر را اضافه کن
  const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
  
  const response = await apiClient.get('/products/supplies/', { params, headers });
  return response.data;
};

export const getSupplyFilterOptions = async (accessToken?: string | null): Promise<SupplyFilterOptions> => {
  const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
  const response = await apiClient.get('/products/supplies/filters/', { headers });
  return response.data;
};

export default apiClient;
