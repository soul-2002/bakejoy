// src/types.ts
import { IconProp } from '@fortawesome/fontawesome-svg-core';



export interface NotificationTemplate {
  id: string;
  title: string;
  content: string;
  isActive: boolean;
}

// برای هر ردیف در جدول گزارش پیامک‌ها
/**
 * اینترفیس برای قالب‌های پیامک که از API دریافت می‌شود.
 * نام فیلدها باید دقیقاً با خروجی سریالایزر در بک‌اند یکی باشد.
 */
export interface SMSTemplate {
  event_trigger: string;          // شناسه رویداد، مثال: 'PROCESSING'
  event_trigger_display: string;  // نام خوانای رویداد، مثال: 'در حال پردازش'
  description: string | null;     // توضیحات قالب
  message_template: string;       // متن کامل قالب پیامک
  is_active: boolean;             // وضعیت فعال/غیرفعال بودن
}

/**
 * اینترفیس برای هر ردیف در جدول گزارش پیامک‌ها
 */
export type SmsStatus = 'success' | 'failed' | 'pending';

export interface SmsLog {
  id: number;
  order_id: string;
  sent_at: string; // تاریخ به صورت رشته ISO
  phone_number: string;
  content: string;
  status: SmsStatus;
}

/**
 * اینترفیس برای ویجت‌های آمار
 */
export interface SmsStats {
  total: number;
  successful: number;
  failed: number;
  pending: number;
}

/**
 * یک اینترفیس ژنریک برای پاسخ‌های صفحه‌بندی شده از API.
 * این ساختار معمولاً توسط Django REST Framework PageNumberPagination یا LimitOffsetPagination برگردانده می‌شود.
 * @template T نوع آیتم‌های موجود در آرایه results.
 */
export interface PaginatedResponse<T> {
  count: number;         // تعداد کل آیتم‌ها در دیتابیس (نه فقط در این صفحه).
  next: string | null;   // URL کامل برای درخواست صفحه بعدی، یا null اگر صفحه آخر است.
  previous: string | null; // URL کامل برای درخواست صفحه قبلی، یا null اگر صفحه اول است.
  results: T[];          // آرایه‌ای از آیتم‌های صفحه فعلی.
}
// اینترفیس پایه برای محصول
export interface Product {
  id: number;
  name: string;
  slug: string; // مهم برای آدرس‌دهی در URL
  description: string;
  price: string; // یا number، بسته به API شما
  image?: string; // آدرس تصویر (اختیاری)
  stock: number; // موجودی
  // فیلدهای دیگری که ممکن است لازم داشته باشید
  // category?: string;
  // created_at?: string;
  // updated_at?: string;

  // --- فیلدهای جدید برای گزینه‌های سفارش ---
  // اینها باید از API شما بیایند. اگر API هنوز آماده نیست،
  // می‌توانید آنها را به صورت آپشنال (?) تعریف کنید.
  available_flavors?: string[];
  available_sizes?: string[];
  // --- ---
}
export interface UserSummary { // یا نام دیگری مانند BasicUserForNote
  id: number;
  username: string;
  first_name?: string | null;
  last_name?: string | null;
  // اگر فیلدهای دیگری مانند avatar از UserForNoteSerializer ارسال می‌شود، اینجا اضافه کنید
  // avatar?: string | null; 
}
export interface OrderStatusLog {
  id: number;
  timestamp: string;        // تاریخ و زمان تغییر (رشته ISO)
  new_status: string;       // کلید وضعیت جدید (مثلاً 'PROCESSING')
  new_status_display: string; // لیبل فارسی وضعیت جدید
  changed_by_username: string | null; // نام کاربری کسی که تغییر را اعمال کرده (از source='changed_by.username')
  // یا changed_by: UserSummary | null; اگر آبجکت کامل کاربر را برمی‌گردانید
  notes?: string | null;      // توضیحات اضافی
}
/**
 * اینترفیس برای یک یادداشت داخلی سفارش.
 * این باید با خروجی InternalOrderNoteSerializer شما در بک‌اند مطابقت داشته باشد.
 */
export interface InternalNote {
  id: number;
  order: number; // ID سفارش مرتبط (سریالایزر بک‌اند این را read_only کرده بود)
  user: UserSummary | null; // اطلاعات کاربر ثبت کننده یادداشت (می‌تواند null باشد)
  note_text: string; // متن یادداشت
  created_at: string; // تاریخ و زمان ایجاد (به صورت رشته ISO 8601)
}

export interface User {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string; // اگر فیلد شماره تلفن این است
  // ... سایر فیلدهای موجود ...
  is_staff?: boolean; // <--- فیلد پیشنهادی برای تشخیص ادمین (رایج در جنگو)
  avatar?: string;
  date_joined?: string; // تاریخ عضویت (اختیاری)
  // یا isAdmin?: boolean;
  // یا role?: 'customer' | 'admin';
}
export interface Address {
  id: number;
  province_name: string;
  city_name: string;
  street_address: string;
  postal_code: string;
  // ... سایر فیلدها ...
  // یک فیلد ترکیبی برای نمایش راحت‌تر (می‌توانید در فرانت‌اند بسازید)
  full_address?: string;
}

interface BaseProduct {
  id: number;
  name: string;
  slug: string;
  image: string;
  price: string;
}

// تایپ برای جزئیات طعم و سایز (مخصوص کیک)
interface ProductOption {
  id: number;
  name: string;
}

// اینترفیس برای محصول از نوع کیک در سبد خرید
interface CartProductCake extends BaseProduct {
  product_type: 'cake'; // فیلد تشخیص‌دهنده
  flavor: ProductOption | null;
  size: ProductOption | null;
}

// اینترفیس برای محصول از نوع لوازم جشن در سبد خرید
interface CartProductSupply extends BaseProduct {
  product_type: 'partysupply'; // فیلد تشخیص‌دهنده
}


// --- اینترفیس نهایی و صحیح OrderItem ---
export interface OrderItem {
  id: number;
  // فیلد product حالا می‌تواند یکی از دو نوع بالا باشد
  product: CartProductCake | CartProductSupply;
  quantity: number;
  notes?: string | null;
  price_at_order: string;
  total_price: string; // این پراپرتی در بک‌اند ساخته می‌شود
}


// اینترفیس Order را به‌روز کنید (مخصوصا فیلد items)
export interface Order {
  id: number | null;
  order_number: number | null; // می‌تواند null باشد برای نمایش سبد خالی
  user?: User | number | string; // ID یا نام کاربری
  status: string; // 'CART', 'PENDING_PAYMENT', etc.
  status_display?: string; // متن وضعیت مثل 'Cart'
  total_price: string; // یا number
  created_at?: string | null;
  updated_at?: string | null;
  items: OrderItem[]; // <<--- حالا از OrderItem به‌روز شده استفاده می‌کند
  notes?: string | null;
  address?: Address[] | null; // TODO: Define Address interface if needed
  delivery_datetime?: string | null;
  delivery_datetime_read?: string | null; // زمان تحویل (مطابق با سریالایزر)
  transactions?: Transaction[] | null; // لیست تراکنش‌ها
  tracking_code?: string | null;
  shipping_method ?: string | null; // روش ارسال (مثلاً 'standard', 'express')
  status_logs: OrderStatusLog[];
  // سایر فیلدهای لازم...
}
export interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}
// نوع داده برای توکن‌های JWT که از API دریافت می‌شود
export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface ProductMini {
  id: number;
  name: string;
  slug?: string;
  base_price?: string; // یا number
  image?: string | null;

}

export interface Flavor {
  id: number;
  name: string;
  description?: string | null;
  is_active: boolean;
  products_using_count?: number;
}
export interface FlavorFormData {
  name: string;
  description?: string | null;
  is_active?: boolean;
}

export interface Size {
  id: number;
  name: string;
  description?: string | null;
  estimated_weight_kg?: string | null; // یا number
  serving_suggestion?: string | null;
  is_active: boolean;
}
export interface SizeFormData { // برای فرم افزودن/ویرایش اندازه
  name: string;
  description?: string | null;
  estimated_weight_kg?: string; // ورودی فرم معمولاً رشته است
  price_modifier?: string;    // ورودی فرم معمولاً رشته است
  is_active?: boolean;        // در فرم ایجاد، معمولاً پیش‌فرض true دارد
}

export interface Transaction {
  id: number;
  // وضعیت‌ها را دقیقاً مطابق با choices بک‌اند تعریف کنید
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  status_display?: string;
  amount: string; // یا number (احتمالا به ریال)
  ref_id: string | null; // کد رهگیری نهایی زرین‌پال
  gateway_reference_id?: string | null; // همان Authority
  gateway_response?: string | null; // پاسخ کامل درگاه (می‌تواند JSON باشد)
  created_at: string;
  updated_at: string;
  payment_method?: string | null; // کلید روش پرداخت
  payment_method_display?: string | null;
}

export interface Category {
  id: number;
  name: string;
  slug: string; // اسلاگ معمولاً در بک‌اند اجباری است و بر اساس نام ساخته می‌شود، پس در خواندن همیشه وجود دارد.
  description?: string | null; // توضیحات می‌تواند اختیاری و یا null باشد.
  image?: string | null;       // URL تصویر دسته‌بندی، می‌تواند اختیاری و یا null باشد.
  is_active: boolean;         // وضعیت فعال یا غیرفعال بودن دسته‌بندی.
  products_count?: number;     // (اختیاری) تعداد محصولاتی که به این دسته‌بندی تعلق دارند. این معمولاً از API و با annotate در بک‌اند می‌آید.
  created_at?: string;         // (اختیاری) تاریخ ایجاد، اگر در لیست یا جزئیات نمایش می‌دهید.
  updated_at?: string;         // (اختیاری) تاریخ آخرین به‌روزرسانی.
}

// اینترفیس برای داده‌هایی که هنگام "ایجاد" یک دسته‌بندی جدید ارسال می‌شوند
// معمولاً id, slug, created_at, updated_at توسط بک‌اند تولید می‌شوند
export interface NewCategoryData {
  name: string;
  slug?: string; // ممکن است بخواهید کاربر اسلاگ را وارد کند یا بک‌اند آن را بسازد. اگر بک‌اند می‌سازد، این اختیاری است.
  description?: string | null;
  is_active?: boolean; // معمولاً پیش‌فرض true دارد.
  image?: File | null; // برای آپلود فایل از طریق فرم، از نوع File استفاده می‌شود.
}

// اینترفیس برای داده‌هایی که هنگام "ویرایش" یک دسته‌بندی ارسال می‌شوند
// همه فیلدها اختیاری هستند چون کاربر ممکن است فقط یک بخش را تغییر دهد (برای درخواست PATCH)
export interface UpdateCategoryData {
  name?: string;
  slug?: string;
  description?: string | null;
  is_active?: boolean;
  image?: File | null | string; // می‌تواند فایل جدید، null برای حذف، یا رشته (URL قبلی) برای عدم تغییر باشد.
  // یا یک فیلد جداگانه مثل remove_image: boolean برای حذف تصویر.
}
export interface ProductImage {
  id: number;
  image: string; // URL تصویر
  alt_text?: string | null;
}
export interface ProductFormValues {
  name: string;
  slug?: string; // اختیاری، اگر می‌خواهید کاربر آن را وارد کند
  description?: string | null;
  base_price: string; // یا number
  image?: File | null; // برای آپلود تصویر اصلی
  gallery_images?: File[]; // آرایه‌ای از فایل‌ها برای گالری تصاویر
  category: number | null; // ID دسته‌بندی
  available_flavors?: number[]; // آرایه‌ای از ID های طعم‌ها
  available_sizes?: number[]; // آرایه‌ای از ID های اندازه‌ها
  price_type?: string; // اگر نیاز به انتخاب نوع قیمت دارید (مثلاً 'fixed' یا 'variable')
}

interface Tag {
  id: number;
  name: string;
}
export interface Cake { // یا Product
  id: number;
  name: string;
  slug: string; // از read_only_fields سریالایزر می‌آید، پس همیشه در پاسخ هست
  is_wishlisted: boolean | null;
  short_description?: string | null;
  description?: string | null; // اگر این فیلد را در مدل و سریالایزر دارید (به جای description تنها)
  // description?: string | null; // اگر فقط یک فیلد description دارید، این را نگه دارید

  image?: string | null;       // URL تصویر اصلی
  images?: ProductImage[]; // گالری تصاویر (از فیلد images که read_only است و ProductImageSerializer دارد)

  category: Category[] | null; // از فیلد category که read_only است و CategorySerializer دارد

  available_flavors: Flavor[];    // از فیلد available_flavors که read_only است و FlavorSerializer دارد
  available_sizes: Size[];
  size_variants: ProductSizeVariant[];       // از فیلد available_sizes که read_only است و SizeSerializer دارد
  // هر آبجکت Size در اینجا باید شامل price_modifier و estimated_weight_kg باشد

  // اگر از مدل واسط CakeSizeVariant استفاده می‌کنید، به جای available_sizes، این را خواهید داشت:
  // size_variants?: ProductSizeVariant[]; 

  base_price: number; // یا string، بسته به خروجی سریالایزر
  price_type: 'FIXED' | 'PER_KG' | 'PER_SERVING'; // یا هر مقداری که در PriceTypeChoices مدل دارید

  sale_price?: number | null; // یا string
  schedule_sale_enabled?: boolean; // این معمولاً از مدل نمی‌آید، مگر اینکه در مدل ذخیره شود
  sale_start_date?: string | null; // رشته تاریخ ISO
  sale_end_date?: string | null;   // رشته تاریخ ISO

  is_active: boolean;
  is_featured?: boolean;

  ingredients_text?: string | null;
  nutrition_info_text?: string | null;
  allergen_info_text?: string | null;

  tags: number[];          // آرایه شناسه‌ها (برای نوشتن)
  tags_details: Tag[];     // آرایه آبجکت‌های کامل (برای خواندن)

  // اطلاعات سئو
  meta_title?: string | null;
  meta_description?: string | null;
  meta_keywords?: string | null;

  // فیلدهای محاسبه‌شده یا خودکار
  average_rating?: number | null;
  review_count?: number;
  created_at: string; // رشته تاریخ ISO
  updated_at: string; // رشته تاریخ ISO
  rating: number | null;
}

export interface AdminDashboardStats {
  todays_orders_count: number;
  delivered_orders_count: number;
  cancelled_orders_count: number;
  pending_orders_count: number;
  processing_orders_count: number;
  total_orders_count: number;
  total_users_count: number;
  active_products_count: number;
  total_revenue_month: string; // یا number اگر Decimal به number تبدیل می‌شود
  today_revenue: string;       // یا number
  // فیلدهای دیگری که ممکن است اضافه کرده باشید
}


export interface ValueData {
  id: number | string;
  title: string;
  description: string;
  icon: React.ReactNode; // اجازه می‌دهد JSX مربوط به SVG را مستقیماً پاس دهیم
}

export interface StepData {
  id: number;
  stepNumber: number;
  title: string;
  description: string;
}

export interface TestimonialData {
  id: number | string;
  name: string;
  imageUrl: string;
  rating: number; // عدد بین 1 تا 5
  quote: string; // متن نظر
}
export interface BlogPostData {
  id: number | string;
  slug?: string; // برای لینک دهی
  imageUrl: string;
  imageAlt: string;
  category: string; // دسته‌بندی پست
  title: string;
  excerpt: string; // خلاصه پست
}
export interface UserReview {
  id: number;
  username: string;
  first_name?: string | null; // این فیلدها بستگی به UserReviewSerializer شما دارد
  last_name?: string | null;
  // می‌توانید فیلدهای دیگری مثل آواتار را هم اضافه کنید اگر لازم است
}

// اینترفیس اصلی برای داده‌های یک نظر
export interface Review {
  id: number;
  user: UserReview;       // اطلاعات کاربر نظر دهنده (Nested)
  rating: number;         // امتیاز (عدد ۱ تا ۵)
  comment: string | null; // متن نظر (می‌تواند خالی باشد)
  created_at: string;     // تاریخ ثبت نظر (به صورت رشته ISO)
  // فیلد product معمولاً در لیست نظرات یک محصول خاص لازم نیست،
  // اما اگر API شما آن را برمی‌گرداند، می‌توانید اضافه کنید:
  // product?: number; // ID محصول
}

export interface NavItemProps {
  label: string;
  href: string;
  icon: IconProp; // <--- به جای رشته، خود آبجکت آیکون را می‌گیرد
  exact?: boolean; // برای NavLink، اگر تطابق دقیق مسیر لازم است
  badge?: string;  // برای نمایش نشان (مثلاً تعداد سفارشات جدید)
  subItems?: NavItemProps[]; // برای زیرمنوها (فعلاً در HTML شما نبود، اما قابل اضافه شدن است)
}

export interface NavSectionProps {
  title?: string; // عنوان بخش (اختیاری، چون اولین بخش شما عنوان نداشت)
  items: NavItemProps[];
}
export interface TopProductListItem { // Partial<Product> اگر همه فیلدهای Product را ندارید
  id: number;
  name: string;
  sales_count?: number; // تعداد فروش
  total_revenue?: string | number; // درآمد حاصل از این محصول
  category_icon?: any; // آیکون بر اساس دسته‌بندی یا نوع محصول
  category_icon_bg?: string;
  category_icon_color?: string;
}

export interface SalesChartDataItem {
  date: string; // فرمت: "YYYY-MM-DD"
  total_sales: number;
}

interface ProductImagesSectionProps {
  formMethods: UseFormReturn<ProductFormValues>; // ProductFormValues باید شامل main_image و gallery_images باشد
  currentMainImageUrl?: string | null; // URL تصویر اصلی موجود (برای حالت ویرایش)
  currentGalleryImageUrls?: string[]; // آرایه‌ای از URL های تصاویر گالری موجود (برای حالت ویرایش)
}
export interface ProductSizeVariant {
  id: number; // ID خود رکورد CakeSizeVariant
  size: Size[]; // آبجکت کامل اندازه
  price_modifier: string | number; // یا فقط number
  estimated_weight_kg_override: string | number | null;
  sku_variant: string | null;
  stock_quantity: number | null;
  is_active_for_product: boolean;
}

export interface SizeVariantFormData {
  id?: number; // برای ویرایش
  size: number; // فقط ID اندازه
  price_modifier: string; // از input type="text" می‌آید
  estimated_weight_kg_override?: string | null;
  sku_variant?: string | null;
  stock_quantity?: string | null;
  is_active_for_product?: boolean;
}
/**
 * اینترفیس برای داده‌هایی که هنگام "ایجاد" یک محصول جدید از فرم به API ارسال می‌شوند.
 * این تایپ باید با آبجکت productPayload در تابع onSubmit (قبل از ساخت FormData) مطابقت داشته باشد.
 * فیلدهای فایل در اینجا نیستند چون جداگانه به تابع API پاس داده می‌شوند.
 */
// برای ایجاد محصول
export interface ProductFormData {
  name: string;
  slug: string;
  is_active: boolean;
  is_featured?: boolean;
  category_id: number | null;
  short_description?: string | null;
  description?: string | null; // این از full_description فرم می‌آید

  base_price: number;
  price_type: 'FIXED' | 'PER_KG' | 'PER_SERVING';
  sale_price?: number | null;
  schedule_sale_enabled?: boolean;
  sale_start_date?: string | null;
  sale_end_date?: string | null;

  flavor_ids?: number[];
  size_variants?: SizeVariantFormData[];
  // available_addon_ids?: number[]; // اگر افزودنی دارید

  ingredients_text?: string | null;
  nutrition_info_text?: string | null;
  allergen_info_text?: string | null;
  tags?: number[];

  meta_title?: string | null;
  meta_description?: string | null;
  meta_keywords?: string | null;
}

// برای ویرایش محصول (همه فیلدها اختیاری هستند)
export interface UpdateProductFormData extends Partial<ProductFormData> {
  remove_main_image?: boolean;
  gallery_images_to_remove_ids?: (number | string)[];
}

export interface SupplyType {
  id: number;
  name: string;
  slug: string;
}
export interface Color {
  id: number;
  name: string;
  hex_code: string;
}
export interface Theme {
  id: number;
  name: string;
  slug: string;
}

// تایپ اصلی برای محصول لوازم جشن
export interface PartySupply {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: string;
  stock: number;
  image: string;
  type: SupplyType;
  colors: Color[];
  themes: Theme[];
  is_wishlisted?: boolean;
}

// تایپی برای نگهداری تمام گزینه‌های فیلتر
export interface SupplyFilterOptions {
  types: SupplyType[];
  colors: Color[];
  themes: Theme[];
}