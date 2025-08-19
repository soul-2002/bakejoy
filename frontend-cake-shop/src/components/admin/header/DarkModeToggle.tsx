// src/components/admin/header/DarkModeToggle.tsx
import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSun, faMoon } from '@fortawesome/free-solid-svg-icons';

const DarkModeToggle: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const storedPreference = localStorage.getItem('bakejoy-admin-theme');
      if (storedPreference) {
        return storedPreference === 'dark';
      }
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false; // پیش‌فرض برای SSR یا محیط‌های بدون window
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (isDarkMode) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('bakejoy-admin-theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('bakejoy-admin-theme', 'light');
      }
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(prevMode => !prevMode);
  };

  return (
    <button
      onClick={toggleDarkMode}
      className="text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-amber-400 
                 focus:outline-none p-2 rounded-full hover:bg-amber-50 dark:hover:bg-gray-700/50 transition-colors"
      aria-label={isDarkMode ? "تغییر به حالت روشن" : "تغییر به حالت تاریک"}
      title={isDarkMode ? "حالت روشن" : "حالت تاریک"}
    >
      <FontAwesomeIcon icon={isDarkMode ? faSun : faMoon} className="text-lg" />
    </button>
  );
};

export default DarkModeToggle;