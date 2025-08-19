// src/components/admin/orders/CustomerInfoCard.tsx
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserCircle, faMapMarkedAlt, faEnvelope, faPhone, faCalendarAlt, faShoppingCart, faDollarSign, faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons';
import { User, Address as AddressType } from '../../../types'; // مسیر صحیح به تایپ‌های شما

interface CustomerInfoCardProps {
  user?: User | null; // کاربر می‌تواند آبجکت کامل User یا بخشی از آن باشد
  address?: AddressType | null; // آدرس می‌تواند null باشد
}

const CustomerInfoCard: React.FC<CustomerInfoCardProps> = ({ user, address }) => {
  // تابع کمکی برای نمایش "نامشخص" اگر داده وجود ندارد
  const displayInfo = (data: string | number | undefined | null, fallback: string = 'نامشخص') => {
    return data ? String(data) : fallback;
  };

  const userFullName = user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username : 'کاربر مهمان';

  // تابع برای نمایش آواتار یا آیکون پیش‌فرض
  const renderUserAvatar = () => {
    // فرض می‌کنیم User interface شما فیلد avatar?: string | null را دارد
    // اگر نه، باید آن را اضافه کنید یا این بخش را برای نمایش حروف اول تغییر دهید
    if (user && (user as any).avatar) { // (user as any) برای دسترسی به فیلد avatar اگر در تایپ User شما نیست
      return <img src={(user as any).avatar} alt={userFullName} className="w-12 h-12 rounded-full ml-3 object-cover" />;
    }
    return (
      <div className="w-12 h-12 rounded-full ml-3 bg-gray-200 dark:bg-slate-700 text-gray-500 dark:text-gray-400 flex items-center justify-center">
        <FontAwesomeIcon icon={faUserCircle} className="text-3xl" />
      </div>
    );
  };


  return (
    <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-lg shadow-md border border-gray-200 dark:border-slate-700 space-y-6">
      {/* بخش اطلاعات مشتری */}
      <div>
        <h2 className="font-semibold text-lg text-gray-800 dark:text-gray-100 mb-4 flex items-center">
          <FontAwesomeIcon icon={faUserCircle} className="ml-2 text-blue-500 dark:text-blue-400" />
          اطلاعات مشتری
        </h2>
        {user ? (
          <>
            <div className="flex items-center mb-4">
              {renderUserAvatar()}
              <div>
                <p className="font-medium text-gray-800 dark:text-gray-100">{userFullName}</p>
               {user.date_joined && ( // اگر فیلد date_joined در اینترفیس User شما هست
                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center mt-1">
                  <FontAwesomeIcon icon={faCalendarAlt} className="ml-1 rtl:mr-1" />
                  عضویت از: {new Date(user.date_joined).toLocaleDateString('fa-IR')}
                </p>
              )}
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400 flex items-center"><FontAwesomeIcon icon={faEnvelope} className="ml-2 w-4" />ایمیل:</span>
                <a href={`mailto:${user.email}`} className="font-medium text-blue-600 hover:underline dark:text-blue-400">
                  {displayInfo(user.email)}
                </a>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400 flex items-center"><FontAwesomeIcon icon={faPhone} className="ml-2 w-4" />تلفن:</span>
                <a href={`tel:${user.phone}`} className="font-medium text-blue-600 hover:underline dark:text-blue-400 ltr-text"> {/* کلاس ltr-text برای نمایش صحیح شماره */}
                  {displayInfo(user.phone?.toLocaleString('fa-IR'))}
                </a>
              </div>
              {/* می‌توانید اطلاعات بیشتری مانند تعداد کل سفارشات یا مجموع خریدها را اینجا اضافه کنید */}
              {/* این موارد نیاز به داده‌های اضافی از API دارند */}
              {/* <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400 flex items-center"><FontAwesomeIcon icon={faShoppingCart} className="ml-2 w-4" />تعداد سفارشات:</span>
                <span className="font-medium text-gray-700 dark:text-gray-200">{user.order_count || '۰'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400 flex items-center"><FontAwesomeIcon icon={faDollarSign} className="ml-2 w-4" />مجموع خریدها:</span>
                <span className="font-medium text-gray-700 dark:text-gray-200">{user.total_spent ? user.total_spent.toLocaleString('fa-IR') + ' تومان' : '۰ تومان'}</span>
              </div> 
              */}
            </div>
            {/* <div className="mt-4 pt-3 border-t border-gray-200 dark:border-slate-600">
              <a href={`/admin/users/${user.id}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium flex items-center text-sm">
                <FontAwesomeIcon icon={faExternalLinkAlt} className="ml-2" />
                مشاهده پروفایل کامل مشتری
              </a>
            </div> */}
          </>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">اطلاعات کاربری برای این سفارش موجود نیست (مثلاً کاربر مهمان).</p>
        )}
      </div>

      {/* بخش آدرس تحویل */}
      {address && ( // فقط اگر آدرسی برای سفارش ثبت شده باشد
        <div className="pt-6 border-t border-gray-200 dark:border-slate-600">
          <h2 className="font-semibold text-lg text-gray-800 dark:text-gray-100 mb-4 flex items-center">
            <FontAwesomeIcon icon={faMapMarkedAlt} className="ml-2 text-green-500 dark:text-green-400" />
            آدرس تحویل
          </h2>
          <div className="space-y-1 text-sm text-gray-700 dark:text-gray-200">
            {/* نام تحویل گیرنده معمولاً از اطلاعات مشتری گرفته می‌شود، مگر اینکه آدرس فیلد جداگانه داشته باشد */}
            <p className="font-medium">{userFullName}</p> 
            <p>{displayInfo(address.city_name)}، {displayInfo(address.street)}</p>
            <p>کد پستی: {displayInfo(address.postal_code?.toLocaleString('fa-IR'))}</p>
            {/* اگر شماره تلفن در آدرس دارید: */}
            {/* <p>تلفن آدرس: {displayInfo(address.phone_number?.toLocaleString('fa-IR'))}</p> */}
          </div>
          {/* <div className="mt-4 pt-3 border-t border-gray-200 dark:border-slate-600">
            <a href="#" className="text-green-500 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-medium flex items-center text-sm">
              <FontAwesomeIcon icon={faMapMarkedAlt} className="ml-2" />
              مشاهده روی نقشه (اگر لینک دارید)
            </a>
          </div> */}
        </div>
      )}
      {!address && user && ( // اگر کاربر هست ولی آدرسی برای این سفارش ثبت نشده
         <div className="pt-6 border-t border-gray-200 dark:border-slate-600">
            <h2 className="font-semibold text-lg text-gray-800 dark:text-gray-100 mb-4 flex items-center">
                <FontAwesomeIcon icon={faMapMarkedAlt} className="ml-2 text-green-500 dark:text-green-400" />
                آدرس تحویل
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">آدرسی برای این سفارش ثبت نشده است.</p>
        </div>
      )}
    </div>
  );
};

export default CustomerInfoCard;