// src/components/Layout/Footer.tsx
import React from 'react';
import { Link } from 'react-router-dom';

// آیکون‌های شبکه‌های اجتماعی (می‌توانید از فایل NewsletterSignUp کپی کنید یا جداگانه ایمپورت کنید)
const TwitterIcon: React.FC<{ className?: string }> = ({ className="w-6 h-6" }) => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className={className}> <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/> </svg> );
const InstagramIcon: React.FC<{ className?: string }> = ({ className="w-6 h-6" }) => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className={className}> <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/> </svg> );
const FacebookIcon: React.FC<{ className?: string }> = ({ className="w-6 h-6" }) => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className={className}> <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/> </svg> );

// آیکون‌های تماس
const LocationIcon: React.FC<{ className?: string }> = ({ className = "h-5 w-5" }) => ( <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"> <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /> <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /> </svg> );
const PhoneIcon: React.FC<{ className?: string }> = ({ className = "h-5 w-5" }) => ( <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"> <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /> </svg> );
const MailIcon: React.FC<{ className?: string }> = ({ className = "h-5 w-5" }) => ( <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"> <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /> </svg> );

// داده‌های لینک‌ها
const quickLinks = [
  { name: 'خانه', href: '/' },
  { name: 'کیک‌های ما', href: '/products' },
  { name: 'درباره ما', href: '/about' },
  { name: 'مجله کیک', href: '/blog' },
  { name: 'تماس با ما', href: '/contact' },
];

const helpLinks = [
  { name: 'سوالات متداول', href: '/faq' },
  { name: 'ارسال و تحویل', href: '/shipping' },
  { name: 'بازگشت و استرداد', href: '/returns' },
  { name: 'پیگیری سفارش', href: '/orders' }, // لینک به تاریخچه سفارشات کاربر
  { name: 'سیاست حفظ حریم خصوصی', href: '/privacy' },
];

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-dark text-gray-300 pt-16 pb-8"> {/* text-white به gray-300 برای کنتراست بهتر */}
      <div className="container mx-auto px-6">
        {/* بخش بالایی فوتر (۴ ستون) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 md:gap-12 mb-12"> {/* افزایش gap */}
          {/* ستون ۱: درباره ما */}
          <div>
             {/* font-heading و text-white برای لوگو/نام */}
            <h3 className="text-xl font-heading font-bold text-white mb-6">BAKEJÖY</h3>
            <p className="text-sm mb-4 leading-relaxed"> {/* کمی تغییر سایز و فاصله خط */}
              ایجاد آثار هنری خوراکی از سال ۲۰۱۰. اشتیاق ما به پخت در هر کیکی که خلق می‌کنیم می‌درخشد.
            </p>
            {/* آیکون‌های اجتماعی با gap و hover:text-primary */}
            <div className="flex gap-4 mt-4">
              <a href="#" aria-label="Twitter" className="text-gray-400 hover:text-primary transition"> <TwitterIcon /> </a>
              <a href="#" aria-label="Instagram" className="text-gray-400 hover:text-primary transition"> <InstagramIcon /> </a>
              <a href="#" aria-label="Facebook" className="text-gray-400 hover:text-primary transition"> <FacebookIcon /> </a>
            </div>
          </div>

          {/* ستون ۲: لینک‌های سریع */}
          <div>
            <h3 className="text-lg font-heading font-semibold text-white mb-6">لینک‌های سریع</h3> {/* font-semibold */}
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <Link to={link.href} className="hover:text-primary transition text-sm">{link.name}</Link> {/* text-sm */}
                </li>
              ))}
            </ul>
          </div>

          {/* ستون ۳: راهنما */}
          <div>
            <h3 className="text-lg font-heading font-semibold text-white mb-6">راهنما</h3>
            <ul className="space-y-3">
              {helpLinks.map((link) => (
                <li key={link.name}>
                  <Link to={link.href} className="hover:text-primary transition text-sm">{link.name}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ستون ۴: تماس با ما */}
          <div>
            <h3 className="text-lg font-heading font-semibold text-white mb-6">تماس با ما</h3>
            <ul className="space-y-4"> {/* افزایش space */}
              <li className="flex items-start">
                 {/* ml-3 برای RTL */}
                <LocationIcon className="h-5 w-5 ml-3 mt-1 flex-shrink-0" />
                <span className="text-sm">خیابان بیکر ۱۲۳، لندن، انگلستان</span>
              </li>
              <li className="flex items-center">
                <PhoneIcon className="h-5 w-5 ml-3 flex-shrink-0" />
                <span className="text-sm">021-12345678</span> {/* شماره نمونه فارسی */}
              </li>
              <li className="flex items-center">
                <MailIcon className="h-5 w-5 ml-3 flex-shrink-0" />
                <span className="text-sm">hello@bakejoy.com</span>
              </li>
            </ul>
          </div>
        </div>

        {/* بخش پایینی فوتر (کپی‌رایت و ...) */}
        <div className="border-t border-gray-700 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-gray-400"> {/* text-xs */}
          <p>&copy; {currentYear} بیک‌جوی. تمام حقوق محفوظ است.</p>
          {/* لوگوی روش‌های پرداخت (می‌توانید با لوگوهای واقعی جایگزین کنید) */}
          <div className="mt-4 md:mt-0">
            <img src="/images/payment-methods.png" alt="Payment methods" className="h-8 opacity-70" /> {/* مسیر نمونه در public */}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;