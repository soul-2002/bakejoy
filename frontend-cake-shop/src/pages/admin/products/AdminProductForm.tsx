// src/pages/admin/products/AdminProductFormPage.tsx

// --- تمام ایمپورت‌های لازم ---
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, Link as RouterLink } from 'react-router-dom';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSave, faTimes, faSpinner, faPlus, faFileExport, faArrowRight,
  faInfoCircle, faImage, faDollarSign, faTasks, faCog, faSearch, faCheck  // آیکون‌های نمونه برای تب‌ها
} from '@fortawesome/free-solid-svg-icons';

// --- کامپوننت‌های فرزند ---
import AdminPageLayout from '../../../components/admin/layout/AdminPageLayout';
import ProductGeneralInfoSection from '../../../components/admin/products/form/ProductGeneralInfoSection';
import ProductImagesSection from '../../../components/admin/products/form/ProductImagesSection';
import ProductPricingSection from '../../../components/admin/products/form/ProductPricingSection';
import ProductOptionsSection from '../../../components/admin/products/form/ProductOptionsSection';
import ProductAdditionalInfoSection from '../../../components/admin/products/form/ProductAdditionalInfoSection'; // ایمپورت جدید
import ProductSeoSection from '../../../components/admin/products/form/ProductSeoSection'; // ایمپورت جدید
// کامپوننت‌های زیر باید ایجاد شوند:


// --- توابع و تایپ‌های API ---
import { useAuth } from '../../../contexts/AuthContext';
import {
  createAdminProduct, getAdminProductDetail, updateAdminProduct,
  getAdminCategories, getAdminFlavors, getAdminSizes, findOrCreateTags,
  // getAdminAddons, // اگر دارید
} from '../../../services/api';
import {
  Product, PaginatedResponse,
  Category as ProductCategoryType, Flavor, Size, Addon,
  // ProductFormValues, // این را از Zod schema می‌گیریم
  NewProductFormData, UpdateProductFormData // تایپ‌های خاص برای ارسال به API
} from '../../../types';


// --- Zod Schema (کامل شده از پاسخ‌های قبلی) ---
const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const fileListSchema = z.instanceof(FileList).optional().nullable();
const stringToFloatOptional = (errorMessage: string = "مقدار باید عدد باشد.") =>
  z.string().optional().nullable().transform(val => val && val.trim() !== '' ? parseFloat(val.replace(/,/g, '.')) : null)
    .pipe(z.number({ invalid_type_error: errorMessage }).optional().nullable());

const stringToPositiveFloatOptional = (errorMessage: string = "مقدار باید عدد مثبت باشد.") =>
  stringToFloatOptional(errorMessage).pipe(z.number().positive(errorMessage).optional().nullable());

const stringToPositiveFloatRequired = (requiredMsg: string, typeErrorMsg: string, positiveMsg: string) =>
  z.string({ required_error: requiredMsg, invalid_type_error: typeErrorMsg }).min(1, requiredMsg)
    .transform(val => parseFloat(val.replace(/,/g, '')))
    .pipe(z.number({ invalid_type_error: typeErrorMsg }).positive(positiveMsg));

const stringToIntegerMinZeroOptional = (errorMessage: string = "مقدار باید عدد صحیح و غیرمنفی باشد.") =>
  z.string().optional().nullable().transform(val => val && val.trim() !== '' ? parseInt(val, 10) : null)
    .pipe(z.number({ invalid_type_error: errorMessage }).int(errorMessage).min(0).optional().nullable());

// اسکیمای اصلی فرم محصول
const productFormSchema = z.object({
  name: z.string().min(3, "نام محصول حداقل باید ۳ کاراکتر باشد.").max(200),
  slug: z.string().min(3, "اسلاگ الزامی است.").max(220).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "فرمت اسلاگ نامعتبر است."),
  is_active: z.boolean().default(true),
  is_featured: z.boolean().default(false), // اضافه شد

  category_id: z.coerce.number({
    // این پیام زمانی نمایش داده می‌شود که فیلد اصلاً ارسال نشود
    required_error: "انتخاب دسته‌بندی الزامی است.",
    // این پیام زمانی نمایش داده می‌شود که مقدار ورودی قابل تبدیل به عدد نباشد
    invalid_type_error: "دسته‌بندی نامعتبر است.",
  })
    .int("شناسه دسته‌بندی باید یک عدد صحیح باشد.") // تضمین می‌کند که عدد اعشاری نباشد
    .min(1, "انتخاب دسته‌بندی الزامی است."), // تضمین می‌کند که کاربر یک گزینه واقعی را انتخاب کرده باشد

  short_description: z.string().max(500).optional().nullable(),
  description: z.string().optional().nullable(), // این به full_description فرم مپ می‌شود

  main_image: fileListSchema
    .refine(files => !files || files.length === 0 || (files?.[0]?.size <= MAX_FILE_SIZE_BYTES), `حجم تصویر اصلی: حداکثر ${MAX_FILE_SIZE_MB}MB.`)
    .refine(files => !files || files.length === 0 || (files?.[0]?.type && ACCEPTED_IMAGE_TYPES.includes(files[0].type)), `فرمت تصویر اصلی نامعتبر.`),

  gallery_images: fileListSchema
    .refine(files => !files || files.length <= 5, "حداکثر ۵ تصویر گالری.")
    .refine(files => { if (!files || files.length === 0) return true; for (let i = 0; i < files.length; i++) { if (files[i].size > MAX_FILE_SIZE_BYTES) return false; } return true; }, `حجم هر تصویر گالری: حداکثر ${MAX_FILE_SIZE_MB}MB.`)
    .refine(files => { if (!files || files.length === 0) return true; for (let i = 0; i < files.length; i++) { if (!files[i].type || !ACCEPTED_IMAGE_TYPES.includes(files[i].type)) return false; } return true; }, `فرمت تصاویر گالری نامعتبر.`),

  base_price: stringToPositiveFloatRequired("قیمت پایه الزامی است.", "قیمت پایه باید عدد باشد.", "قیمت پایه باید مثبت باشد."),
  price_type: z.enum(['FIXED', 'PER_KG', 'PER_SERVING']).default('FIXED'),
  sale_price: stringToPositiveFloatOptional("قیمت تخفیف باید عدد مثبت باشد.").nullable(),

  schedule_sale_enabled: z.boolean().optional().default(false),
  sale_start_date: z.date({ invalid_type_error: "تاریخ شروع نامعتبر است." }).optional().nullable(),
  sale_end_date: z.date({ invalid_type_error: "تاریخ پایان نامعتبر است." }).optional().nullable(),

  available_flavor_ids: z.array(z.number()).optional().default([]),
  available_addon_ids: z.array(z.number()).optional().default([]),

  size_variants: z.array(z.object({
    id: z.number().optional(),
    size: z.number({ required_error: "انتخاب اندازه الزامی است." }),
    price_modifier: stringToFloatOptional("تعدیل‌کننده قیمت باید عدد باشد.").transform(val => val === null ? 0.00 : val).nullable(), // اصلاح شد
    estimated_weight_kg_override: stringToPositiveFloatOptional("وزن باید عدد مثبت باشد.").nullable(),
    sku_variant: z.string().max(50).optional().nullable(),
    stock_quantity: stringToIntegerMinZeroOptional("موجودی باید عدد صحیح غیرمنفی باشد.").nullable(),
    is_active_for_product: z.boolean().default(true),
  })).optional().default([])
    .refine(variants => {
      if (!variants || variants.length === 0) return true;
      const sizeIds = variants.map(v => v.size);
      return new Set(sizeIds).size === sizeIds.length;
    }, { message: "هر اندازه فقط یک بار می‌تواند برای محصول تعریف شود." }),

  tags: z.array(z.string().min(1).max(50)).optional().default([]),

  ingredients_text: z.string().optional().nullable(), // اصلاح شد
  nutrition_info_text: z.string().optional().nullable(), // اصلاح شد
  allergen_info_text: z.string().optional().nullable(), // اصلاح شد

  meta_title: z.string().max(70, "عنوان سئو بیش از ۷۰ کاراکتر نباشد.").optional().nullable(),
  meta_description: z.string().max(160, "توضیحات سئو بیش از ۱۶۰ کاراکتر نباشد.").optional().nullable(),
  meta_keywords: z.string().optional().nullable(),
})
  .refine(data => !data.sale_price || (data.base_price !== undefined && data.base_price > data.sale_price), {
    message: "قیمت تخفیف باید کمتر از قیمت پایه باشد.", path: ["sale_price"],
  })
  .refine(data => !data.schedule_sale_enabled || (data.sale_start_date && data.sale_end_date && data.sale_start_date < data.sale_end_date) || (!data.sale_start_date && !data.sale_end_date), {
    message: "تاریخ پایان تخفیف باید بعد از تاریخ شروع باشد.", path: ["sale_end_date"],
  });

export type ProductFormValues = z.infer<typeof productFormSchema>;

// تعریف تب‌ها
const TABS = [
  { id: 'general', label: 'اطلاعات اصلی', icon: faInfoCircle },
  { id: 'images', label: 'تصاویر', icon: faImage },
  { id: 'pricing', label: 'قیمت‌گذاری', icon: faDollarSign },
  { id: 'options', label: 'گزینه‌ها', icon: faTasks },
  { id: 'additional-info', label: 'اطلاعات تکمیلی', icon: faPlus }, // آیکون مناسب‌تر انتخاب کنید
  { id: 'seo', label: 'سئو', icon: faSearch }, // یا faCog
];


const AdminProductFormPage: React.FC = () => {
  const { productId } = useParams<{ productId?: string }>();
  const isEditMode = Boolean(productId);
  const navigate = useNavigate();
  const { accessToken } = useAuth();

  const [activeTab, setActiveTab] = useState<string>(TABS[0].id);
  const [pageLoading, setPageLoading] = useState(isEditMode);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [allCategories, setAllCategories] = useState<ProductCategoryType[]>([]);
  const [allFlavors, setAllFlavors] = useState<Flavor[]>([]);
  const [allSizesList, setAllSizesList] = useState<Size[]>([]);
  const [allAddons, setAllAddons] = useState<Addon[]>([]);
  const [allTags, setAllTags] = useState<{ id: number, name: string }[]>([]);

  const [ImagePreview, setImagePreview] = useState<string | null>(null);

  const [currentMainImageUrlFromAPI, setCurrentMainImageUrlFromAPI] = useState<string | null>(null);

  // State برای پیش‌نمایش تصویر اصلی که توسط کاربر انتخاب شده
  const [mainImageFilePreview, setMainImageFilePreview] = useState<string | null>(null);
  // State برای URL تصویر اصلی موجود (از API در حالت ویرایش)

  // State برای پیش‌نمایش تصاویر گالری که کاربر جدیداً انتخاب کرده
  const [galleryFilePreviews, setGalleryFilePreviews] = useState<{ file: File, previewUrl: string }[]>([]);
  // State برای URL تصاویر گالری موجود (از API در حالت ویرایش)
  const [currentGalleryImageUrlsFromAPI, setCurrentGalleryImageUrlsFromAPI] = useState<{ id: number, url: string }[]>([]);
  // State برای نگهداری ID تصاویر گالری که باید از سرور حذف شوند
  const [galleryImageIdsToRemove, setGalleryImageIdsToRemove] = useState<number[]>([]);

  const formMethods = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    // defaultValues در useEffect پس از واکشی اطلاعات اولیه ست می‌شوند
  });
      const onError: (errors: FieldErrors<ProductFormValues>) => void = (errors) => {
        console.error("خطاهای اعتبارسنجی فرم:", errors);
        setFormError("لطفا خطاهای فرم را برطرف کنید. برای جزئیات بیشتر کنسول را ببینید.");
    };
  const {reset, handleSubmit, control, formState: { errors, isSubmitting }, watch, setValue, getValues, trigger } = formMethods;

  // واکشی داده‌های اولیه برای select ها
  useEffect(() => {
    if (!accessToken) return;
    const fetchData = async () => {
      setPageLoading(true); // شروع لودینگ کلی
      try {
        const [catRes, flavRes, sizeRes /*, addonRes*/] = await Promise.all([
          getAdminCategories(accessToken), // حد بالا برای گرفتن همه
          getAdminFlavors(accessToken, { limit: 500 }),
          getAdminSizes(accessToken, { limit: 500 }),
          // getAdminAddons(accessToken, {limit: 500}), // اگر دارید
        ]);
        setAllCategories(Array.isArray(catRes) ? catRes : catRes?.results || []);
        setAllFlavors(Array.isArray(flavRes) ? flavRes : flavRes?.results || []);
        setAllSizesList(Array.isArray(sizeRes) ? sizeRes : sizeRes?.results || []);
        // setAllAddons(Array.isArray(addonRes) ? addonRes : addonRes?.results || []);
      } catch (error) {
        console.error("Failed to fetch initial form data (categories, flavors, sizes):", error);
        setFormError("خطا در دریافت داده‌های اولیه فرم (دسته‌بندی‌ها، طعم‌ها یا اندازه‌ها).");
      } finally {
        if (!isEditMode) setPageLoading(false); // اگر حالت افزودن است، لودینگ را اینجا تمام کن
      }
    };
    fetchData();
  }, [accessToken, isEditMode]); // isEditMode اضافه شد تا فقط یکبار در افزودن اجرا شود

  useEffect(() => {
    if (isEditMode && productId && accessToken && (allCategories.length > 0 || !productId)) { // یا شرط دیگری برای اطمینان از لود شدن selects
      setPageLoading(true);
      getAdminProductDetail(productId, accessToken)
        .then(product => {
          console.log("داده محصول با شناسه‌های تگ:", product);
          const defaultVals: Partial<ProductFormValues> = { /* ... (کد defaultValues شما از قبل) ... */
            name: product.name,
            slug: product.slug,
            is_active: product.is_active,
            category_id: product.category.id ? product.category.id : null,
            short_description: product.short_description || '',
            description: product.description || '',
            base_price: product.base_price,
            price_type: product.price_type || 'FIXED',
            sale_price: product.sale_price,
            schedule_sale_enabled: !!(product.sale_start_date || product.sale_end_date),
            sale_start_date: product.sale_start_date ? new Date(product.sale_start_date) : null,
            sale_end_date: product.sale_end_date ? new Date(product.sale_end_date) : null,
            available_flavor_ids: product.available_flavors?.map(f => typeof f === 'number' ? f : f.id) || [],
            // available_addon_ids: product.available_addons?.map(a => typeof a === 'number' ? a : a.id) || [],
            size_variants: product.size_variants?.map(sv => ({
              ...sv, // شامل id احتمالی خود size_variant
              size: typeof sv.size === 'object' && sv.size !== null ? sv.size.id : (typeof sv.size === 'number' ? sv.size : undefined),
              // اطمینان از اینکه مقادیر رشته‌ای به فرم ارسال می‌شوند اگر input ها text هستند
              price_modifier: sv.price_modifier !== null && sv.price_modifier !== undefined ? String(sv.price_modifier) : '',
              estimated_weight_kg_override: sv.estimated_weight_kg_override !== null && sv.estimated_weight_kg_override !== undefined ? String(sv.estimated_weight_kg_override) : '',
              stock_quantity: sv.stock_quantity !== null && sv.stock_quantity !== undefined ? String(sv.stock_quantity) : '',
            })) || [],
            ingredients_text: product.ingredients_text || '',
            nutrition_info_text: product.nutrition_info_text || '',
            allergen_info_text: product.allergen_info_text || '',
            meta_title: product.meta_title || '',
            meta_description: product.meta_description || '',
            meta_keywords: product.meta_keywords || '',
            tags: product.tags_details?.map(tagObject => tagObject.name) || [],            // main_image و gallery_images را مستقیم به reset پاس نمی‌دهیم
          };
          reset(defaultVals);
          if (product.image) setCurrentMainImageUrlFromAPI(product.image);
          if (product.images) setCurrentGalleryImageUrlsFromAPI(product.images.map(img => ({ url: img.image, id: img.id })));
        })
        .catch(err => setFormError("خطا در دریافت اطلاعات محصول برای ویرایش: " + (err.message || '')))
        .finally(() => setPageLoading(false));
    } else if (!isEditMode && !pageLoading) { // اطمینان از اینکه pageLoading در حالت افزودن false است
      reset({ // مقادیر پیش‌فرض برای حالت افزودن
        name: '', slug: '', is_active: true, category_id: 0,
        base_price: undefined, price_type: 'FIXED', sale_price: null,
        schedule_sale_enabled: false, sale_start_date: null, sale_end_date: null,
        available_flavor_ids: [], available_addon_ids: [], size_variants: [],
        short_description: '', description: '', ingredients_text: '',
        nutrition_info_text: '', allergen_info_text: '', meta_title: '',
        meta_description: '', meta_keywords: '',
        main_image: null, gallery_images: null,
      });
    }

  }, [productId, isEditMode, accessToken, reset, allCategories, allFlavors, allSizesList, /*allAddons,*/ setPageLoading, setFormError, setCurrentMainImageUrlFromAPI, setMainImageFilePreview, setCurrentGalleryImageUrlsFromAPI, setGalleryFilePreviews]); // allCategories.length برای اجرای مجدد پس از لود


  const onSubmit: SubmitHandler<ProductFormValues> = async (formDataValues) => {
    if (!accessToken) {
      setFormError("توکن دسترسی موجود نیست. لطفاً دوباره وارد شوید.");
      return;
    }
    setFormError(null);
    setSuccessMessage(null);
    console.log("AdminProductFormPage - onSubmit - Raw formDataValues from react-hook-form:", formDataValues);
    console.log("در حال تبدیل نام تگ‌ها به شناسه:", formDataValues.tags);
    const tagIds = await findOrCreateTags(accessToken, formDataValues.tags || []);
    console.log("شناسه‌های دریافت شده برای تگ‌ها:", tagIds);
    const mainImageToUpload: File | null =
      (formDataValues.main_image && formDataValues.main_image.length > 0)
        ? formDataValues.main_image[0]
        : null;

    const galleryImagesToUpload: FileList | null = formDataValues.gallery_images || null;

    const productPayload = {
      name: formDataValues.name,
      slug: formDataValues.slug,
      is_active: formDataValues.is_active,
      is_featured: formDataValues.is_featured,
      category_id: (formDataValues.category_id && formDataValues.category_id > 0)
        ? formDataValues.category_id : null,
      short_description: formDataValues.short_description || null,
      description: formDataValues.description || null,
      base_price: formDataValues.base_price,
      price_type: formDataValues.price_type,
      sale_price: formDataValues.sale_price,
      schedule_sale_enabled: formDataValues.schedule_sale_enabled || false,
      sale_start_date: formDataValues.sale_start_date ? formDataValues.sale_start_date.toISOString().split('T')[0] : null,
      sale_end_date: formDataValues.sale_end_date ? formDataValues.sale_end_date.toISOString().split('T')[0] : null,
      flavor_ids: formDataValues.available_flavor_ids || [],
      // size_ids is deprecated in favor of size_variants
      size_variants: formDataValues.size_variants?.map(sv => {
        // استخراج امن شناسه سایز
        const sizeId = typeof sv.size === 'object' && sv.size !== null ? (sv.size as any).id : sv.size;

        // اطمینان حاصل کنید که sizeId یک عدد معتبر است قبل از ارسال
        if (typeof sizeId !== 'number' || sizeId <= 0) {
          // می‌توانید اینجا خطا را مدیریت کنید یا هشداری نمایش دهید
          console.error('داده سایز نامعتبر است:', sv);
        }

        return {
          id: sv.id,
          size: sizeId, // همیشه یک شناسه عددی ارسال می‌شود
          price_modifier: sv.price_modifier,
          estimated_weight_kg_override: sv.estimated_weight_kg_override,
          sku_variant: sv.sku_variant || null,
          stock_quantity: sv.stock_quantity,
          is_active_for_product: sv.is_active_for_product,
        };
      }) || [],
      tag_ids: tagIds.length > 0 ? tagIds : '', // اطمینان از اینکه تگ‌ها خالی نیستند
      ingredients_text: formDataValues.ingredients_text || null,
      nutrition_info_text: formDataValues.nutrition_info_text || null,
      allergen_info_text: formDataValues.allergen_info_text || null,
      meta_title: formDataValues.meta_title || null,
      meta_description: formDataValues.meta_description || null,
      meta_keywords: formDataValues.meta_keywords || null,
    };


    if (isEditMode && !mainImageToUpload && currentMainImageUrlFromAPI && watch('main_image') === null) {
      (productPayload as UpdateProductFormData).remove_main_image = true;
    }

    // TODO: Add logic to populate galleryImageIdsToRemove from your state
    const galleryIdsToRemove: (number | string)[] = galleryImageIdsToRemove;

    try {
      let responseMessage = '';
      if (isEditMode && productId) {
        console.log("AdminProductFormPage - Calling updateAdminProduct for ID:", productId);
        const updatedProduct = await updateAdminProduct(
          accessToken,
          productId,
          productPayload as UpdateProductFormData,
          mainImageToUpload,
          galleryImagesToUpload,
          galleryIdsToRemove
        );
        responseMessage = `محصول "${updatedProduct.name}" با موفقیت ویرایش شد.`;

        // **FIX:** Use the returned data to update the state instead of re-fetching
        if (updatedProduct.image) {
          setCurrentMainImageUrlFromAPI(updatedProduct.image);
          setImagePreview(updatedProduct.image); // Update with the new server URL
        } else if ((productPayload as UpdateProductFormData).remove_main_image) {
          setCurrentMainImageUrlFromAPI(null);
          setImagePreview(null);
        }

        if (updatedProduct.gallery) {
          setCurrentGalleryImageUrlsFromAPI(updatedProduct.gallery.map(img => ({ url: img.image, id: img.id })));
        }
        setGalleryFilePreviews([]); // Clear the newly uploaded previews

      } else {
        console.log("AdminProductFormPage - Calling createAdminProduct.");
        const newProduct = await createAdminProduct(
          accessToken,
          productPayload as NewProductFormData,
          mainImageToUpload,
          galleryImagesToUpload
        );
        responseMessage = `محصول "${newProduct.name}" با موفقیت ایجاد شد.`;
        reset(); // Reset the entire form
        setImagePreview(null);
        setCurrentMainImageUrlFromAPI(null);
        setCurrentGalleryImageUrlsFromAPI([]);
        setGalleryFilePreviews([]);
        // Clear file input values
        const mainImgInput = document.getElementById('main-image-upload') as HTMLInputElement;
        if (mainImgInput) mainImgInput.value = '';
        const galleryImgInput = document.getElementById('gallery-images-upload') as HTMLInputElement;
        if (galleryImgInput) galleryImgInput.value = '';
      }
      setSuccessMessage(responseMessage);
      setTimeout(() => {
        setSuccessMessage(null);
        navigate('/admin/products');
      }, 2500);
    } catch (err: any) {
      console.error("AdminProductFormPage - Error saving product:", err);
      let detailedError = "خطای ناشناخته در ذخیره‌سازی.";
      if (err && typeof err === 'object') {
        if (err.detail) { detailedError = err.detail; }
        else {
          const fieldErrors = Object.entries(err)
            .map(([key, value]) => `${key}: ${(Array.isArray(value) ? value.join(', ') : String(value))}`)
            .join('; ');
          if (fieldErrors) detailedError = fieldErrors;
        }
      } else if (typeof err === 'string') { detailedError = err; }
      setFormError(`خطا در ذخیره‌سازی محصول: ${detailedError}`);
    }
  };


  const renderActiveTabContent = () => {
    switch (activeTab) {
      case 'general':
        return <ProductGeneralInfoSection formMethods={formMethods} categories={allCategories} />;
      case 'images':
        return <ProductImagesSection formMethods={formMethods} currentMainImageUrl={currentMainImageUrlFromAPI} currentGalleryImageUrls={currentGalleryImageUrlsFromAPI} />;
      case 'pricing':
        return <ProductPricingSection formMethods={formMethods} />;
      case 'options':
        return <ProductOptionsSection formMethods={formMethods} allFlavors={allFlavors} allSizes={allSizesList} allAddons={allAddons} />;
      case 'additional-info':
        return <ProductAdditionalInfoSection formMethods={formMethods} />;
      case 'seo':
        return <ProductSeoSection formMethods={formMethods} />;
      default:
        return <ProductGeneralInfoSection formMethods={formMethods} categories={allCategories} />;
    }
  };

  if (pageLoading && (!isEditMode || (isEditMode && !watch('name')))) { // لودینگ تا زمانی که داده‌های اولیه (حتی برای ویرایش) لود شوند
    return (
      <AdminPageLayout pageTitle={isEditMode ? "ویرایش محصول..." : "افزودن محصول جدید"}>
        <div className="flex justify-center items-center h-96">
          <FontAwesomeIcon icon={faSpinner} spin size="3x" className="text-amber-500" />
        </div>
      </AdminPageLayout>
    );
  }
  // console.log("All sizes fetched for form:", allSizesList); // لاگ در والد

  return (
    <AdminPageLayout
      pageTitle={isEditMode ? `ویرایش محصول: ${watch('name') || '...'}` : "افزودن محصول جدید"}
    >
      <div className="mb-6 border-b border-gray-200 dark:border-slate-700">
        <nav className="-mb-px flex space-x-4 rtl:space-x-reverse overflow-x-auto" aria-label="Tabs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap py-3 px-4 border-b-2 font-medium text-sm focus:outline-none
                ${activeTab === tab.id
                  ? 'border-amber-500 text-amber-600 dark:border-amber-400 dark:text-amber-300'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-slate-600'
                }`
              }
              aria-current={activeTab === tab.id ? 'page' : undefined}
            >
              {tab.icon && <FontAwesomeIcon icon={tab.icon} className="ml-2 rtl:mr-2" />}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <form onSubmit={handleSubmit(onSubmit, onError)} noValidate>
        {successMessage && (
          <div className="mb-4 p-3 bg-green-100 dark:bg-green-700/30 text-green-700 dark:text-green-200 rounded-md text-sm flex items-center">
            <FontAwesomeIcon icon={faCheck} className="ml-2 rtl:mr-2" /> {successMessage}
          </div>
        )}
        {formError && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-700/30 text-red-700 dark:text-red-300 rounded-md text-sm flex items-center">
            <FontAwesomeIcon icon={faTimes} className="ml-2 rtl:mr-2" /> {formError}
          </div>
        )}

        {renderActiveTabContent()}

        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-slate-700">
          <div className="flex justify-end space-x-3 rtl:space-x-reverse">
            <RouterLink
              to="/admin/products"
              className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
            >
              <FontAwesomeIcon icon={faTimes} className="ml-2 rtl:mr-2" />
              انصراف
            </RouterLink>
            <button
              type="submit"
              disabled={isSubmitting || pageLoading}
              className="px-6 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-70 flex items-center justify-center transition-colors"
            >
              {isSubmitting || pageLoading ? <FontAwesomeIcon icon={faSpinner} spin className="ml-2 rtl:mr-2" /> : <FontAwesomeIcon icon={faSave} className="ml-2 rtl:mr-2" />}
              {isEditMode ? 'ذخیره تغییرات' : 'ذخیره و انتشار'}
            </button>
          </div>
        </div>
      </form>
    </AdminPageLayout>
  );
};

export default AdminProductFormPage;