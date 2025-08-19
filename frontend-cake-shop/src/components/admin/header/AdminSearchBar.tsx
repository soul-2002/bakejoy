// src/components/admin/header/AdminSearchBar.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // برای هدایت به صفحه نتایج جستجو
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';

const AdminSearchBar: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      // کاربر را به صفحه نتایج جستجوی پنل ادمین هدایت کن
      // شما باید یک Route و کامپوننت برای '/admin/search' ایجاد کنید
      navigate(`/admin/search?q=${encodeURIComponent(searchTerm.trim())}`);
      // setSearchTerm(''); // اختیاری: خالی کردن فیلد جستجو پس از ارسال
    }
  };

  return (
    <form onSubmit={handleSearchSubmit} className="relative w-full max-w-xs sm:max-w-sm md:max-w-md group"> {/* گروه برای استایل focus-within */}
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="جستجو در پنل..."
        className="w-full py-2 pl-4 pr-10 rounded-lg border border-gray-300 dark:border-gray-600 
                   bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 
                   focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-amber-400 
                   focus:border-transparent text-sm transition-colors duration-200"
      />
      <button
        type="submit"
        className="absolute right-0 top-0 h-full px-3 text-gray-400 dark:text-gray-500 
                   group-focus-within:text-primary dark:group-focus-within:text-amber-400 
                   hover:text-primary dark:hover:text-amber-400 focus:outline-none transition-colors duration-200"
        aria-label="Search"
      >
        <FontAwesomeIcon icon={faSearch} />
      </button>
    </form>
  );
};

export default AdminSearchBar;