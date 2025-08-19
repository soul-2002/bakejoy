import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string().min(1, "نام کاربری یا ایمیل الزامی است"),
  password: z.string().min(1, "رمز عبور الزامی است"),
});

export type LoginFormData = z.infer<typeof loginSchema>;