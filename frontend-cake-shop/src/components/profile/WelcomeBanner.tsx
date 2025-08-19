import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGift } from '@fortawesome/free-solid-svg-icons';
import type { User } from '../../types'; // تایپ کاربر شما

interface WelcomeBannerProps {
  user: User;
}

const WelcomeBanner: React.FC<WelcomeBannerProps> = ({ user }) => {
  // ۱. نام کاربر را از فیلد first_name می‌خوانیم
  // در صورت نبودن نام، از username به عنوان جایگزین استفاده می‌کنیم
  const displayName = user.first_name || user.username;

  // ۲. امتیاز کاربر (این بخش نیاز به تغییر در بک‌اند دارد - به توضیحات پایین مراجعه کنید)
  const userPoints = user.points || 0; // فرض می‌کنیم فیلدی به نام points وجود خواهد داشت

  return (
    <div className="bg-gradient-to-l rtl:bg-gradient-to-r from-amber-50 to-amber-100 dark:from-slate-800 dark:to-amber-900/20 rounded-xl p-6 mb-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="title-font text-xl font-bold text-amber-900 dark:text-amber-200 mb-2">
            سلام، {displayName} عزیز!
          </h3>
          <p className="text-amber-800 dark:text-amber-300/80">به پنل کاربری BAKEJÖY خوش آمدید.</p>
        </div>
        <div className="mt-4 md:mt-0">
          <button className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-2 rounded-lg flex items-center space-x-2 rtl:space-x-reverse">
            <FontAwesomeIcon className='px-1.5' icon={faGift} />
            <span>امتیازات من: {userPoints}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default WelcomeBanner;