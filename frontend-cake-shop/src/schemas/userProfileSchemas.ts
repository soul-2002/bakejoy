import { z } from 'zod';

// Schema برای فرم اطلاعات شخصی
export const profileFormSchema = z.object({
  first_name: z.string().min(2, "نام باید حداقل ۲ کاراکتر باشد"),
  last_name: z.string().min(2, "نام خانوادگی باید حداقل ۲ کاراکتر باشد"),
  phone: z.string().optional(), // یا قوانین مربوط به شماره موبایل
  birth_date: z.string().optional(), // می‌تواند نوع Date هم باشد
});

// Schema برای فرم تغییر رمز عبور
export const passwordFormSchema = z.object({
  current_password: z.string().min(1, "رمز عبور فعلی الزامی است"),
  new_password: z.string().min(8, "رمز عبور جدید باید حداقل ۸ کاراکتر باشد"),
  confirm_password: z.string()
}).refine(data => data.new_password === data.confirm_password, {
  message: "تکرار رمز عبور جدید مطابقت ندارد",
  path: ["confirm_password"], // این خطا را به فیلد تکرار رمز نسبت می‌دهد
});

export type ProfileFormData = z.infer<typeof profileFormSchema>;
export type PasswordFormData = z.infer<typeof passwordFormSchema>;