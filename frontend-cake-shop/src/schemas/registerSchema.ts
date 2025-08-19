import { z } from 'zod';

export const registerSchema = z.object({
    username: z.string().min(3, "نام کاربری باید حداقل ۳ کاراکتر باشد"),
    first_name: z.string().min(2, "نام باید حداقل ۲ کاراکتر باشد"),
    last_name: z.string().min(2, "نام خانوادگی باید حداقل ۲ کاراکتر باشد"),
    email: z.string().email("لطفاً یک آدرس ایمیل معتبر وارد کنید"),
    phone: z.string().optional(),
    password: z.string().min(8, "رمز عبور باید حداقل ۸ کاراکتر باشد"),
    password2: z.string(), // <-- از confirm_password به password2 تغییر کرد
    terms: z.boolean().refine(val => val === true, {
        message: "شما باید با شرایط و مقررات موافقت کنید",
    }),
}).refine(data => data.password === data.password2, {
    message: "رمزهای عبور با یکدیگر مطابقت ندارند",
    path: ["confirm_password"],
});

export type RegisterFormData = z.infer<typeof registerSchema>;