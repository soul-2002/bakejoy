import { z } from 'zod';

export const addressSchema = z.object({
  id: z.number().optional(), // در زمان ساخت آدرس جدید، id نداریم
  title: z.string().min(2, "عنوان آدرس الزامی است."),
  recipient_name: z.string().min(3, "نام گیرنده الزامی است."),
  province: z.string().min(1, "انتخاب استان الزامی است."),
  city: z.string().min(1, "انتخاب شهر الزامی است."),
  street: z.string().min(5, "آدرس دقیق الزامی است."),
  postal_code: z.string().regex(/^\d{10}$/, "کد پستی باید ۱۰ رقمی باشد."),
  phone_number: z.string().regex(/^09\d{9}$/, "شماره موبایل نامعتبر است."),
  is_default: z.boolean().default(false),
});

export type AddressFormData = z.infer<typeof addressSchema>;

// تایپ کامل آدرس که از API دریافت می‌شود
export interface Address extends AddressFormData {
  id: number; // در پاسخ API، آیدی همیشه وجود دارد
}