// src/components/Home/NewsletterSignUp.tsx
import React, { useState } from 'react';

// آیکون‌های SVG را می‌توان به صورت کامپوننت جدا تعریف کرد یا مستقیم استفاده کرد
const TwitterIcon: React.FC<{ className?: string }> = ({ className }) => (
 <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className={className}>
   <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
 </svg>
);
const InstagramIcon: React.FC<{ className?: string }> = ({ className }) => (
 <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className={className}>
   <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
 </svg>
);
const FacebookIcon: React.FC<{ className?: string }> = ({ className }) => (
 <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className={className}>
   <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/>
 </svg>
);


const NewsletterSignUp: React.FC = () => {
  const [email, setEmail] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); // جلوگیری از ارسال عادی فرم
    if (!agreed) {
      setMessage('لطفاً با دریافت ایمیل‌ها موافقت کنید.');
      return;
    }
    if (!email) {
        setMessage('لطفاً آدرس ایمیل خود را وارد کنید.');
        return;
    }

    setIsSubmitting(true);
    setMessage(null);

    console.log('Subscribing email:', email);
    // --- منطق ارسال به API خبرنامه شما اینجا قرار می‌گیرد ---
    try {
      // مثال:
      // await subscribeToNewsletter(email);
      // فعلا فقط یک تاخیر شبیه‌سازی شده قرار می‌دهیم
      await new Promise(resolve => setTimeout(resolve, 1000));
      setMessage('عضویت شما با موفقیت ثبت شد!');
      setEmail(''); // پاک کردن فیلد ایمیل
      setAgreed(false); // ریست کردن چک‌باکس
    } catch (error) {
      console.error("Subscription error:", error);
      setMessage('مشکلی در ثبت عضویت پیش آمد. لطفاً دوباره تلاش کنید.');
    } finally {
      setIsSubmitting(false);
    }
    // --- پایان منطق ارسال ---
  };

  return (
    // استفاده از رنگ bg-light شما
    <section className="py-16 bg-light">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-md overflow-hidden">
          <div className="md:flex">
            {/* ستون چپ (متن و شبکه‌های اجتماعی) */}
            {/* استفاده از رنگ bg-accent شما */}
            <div className="md:w-1/2 bg-accent p-12 flex items-center justify-center">
              <div className="text-center">
                <h3 className="text-2xl font-heading font-bold text-white mb-4">تازه‌های شیرین</h3> {/* عنوان فارسی */}
                <p className="text-white opacity-90 mb-6">برای دریافت پیشنهادات ویژه، طعم‌های جدید و ایده‌های پخت، در خبرنامه ما عضو شوید.</p> {/* توضیحات فارسی */}
                {/* آیکون‌های شبکه‌های اجتماعی - space-x-reverse برای RTL */}
                <div className="flex justify-center gap-4"> {/* <-- تغییر کرد */}
                  <a href="#" className="bg-white text-accent p-3 rounded-full hover:bg-gray-100 transition">
                    <TwitterIcon />
                  </a>
                  <a href="#" className="bg-white text-accent p-3 rounded-full hover:bg-gray-100 transition">
                    <InstagramIcon />
                  </a>
                  <a href="#" className="bg-white text-accent p-3 rounded-full hover:bg-gray-100 transition">
                    <FacebookIcon />
                  </a>
                </div>
              </div>
            </div>

            {/* ستون راست (فرم) */}
            <div className="md:w-1/2 p-8 md:p-12">
              <form onSubmit={handleSubmit}>
                {/* فیلد ایمیل */}
                <div className="mb-6">
                  <label htmlFor="email" className="block text-text-main font-semibold mb-2">آدرس ایمیل</label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    // کلاس focus برای استایل شما (باید در index.css تعریف شود)
                    className="newsletter-input w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-accent focus:ring-2 focus:ring-accent focus:ring-opacity-30" // focus:ring-opacity-30
                    placeholder="you@example.com"
                    disabled={isSubmitting} // غیرفعال شدن در حین ارسال
                  />
                </div>
                {/* چک‌باکس موافقت */}
                <div className="mb-6">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={agreed}
                      onChange={(e) => setAgreed(e.target.checked)}
                      // استفاده از رنگ accent برای چک‌باکس
                      className="rounded text-accent focus:ring-accent focus:ring-offset-0" // focus:ring-offset-0
                      disabled={isSubmitting}
                    />
                     {/* mr-2 برای فاصله در حالت RTL */}
                    <span className="mr-2 text-text-secondary text-sm">موافقم ایمیل‌های بیک‌جوی را دریافت کنم</span>
                  </label>
                </div>
                {/* دکمه عضویت */}
                <button
                  type="submit"
                   // استفاده از رنگ accent و hover:bg-dark شما
                  className={`w-full bg-accent text-white py-3 rounded-lg font-semibold font-body hover:bg-dark transition ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`} // font-body
                  disabled={isSubmitting} // غیرفعال شدن دکمه در حین ارسال
                >
                  {isSubmitting ? 'در حال ارسال...' : 'عضویت'}
                </button>
                {/* نمایش پیام موفقیت یا خطا */}
                {message && (
                  <p className={`mt-4 text-sm ${message.includes('موفقیت') ? 'text-green-600' : 'text-red-600'}`}>
                    {message}
                  </p>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default NewsletterSignUp;