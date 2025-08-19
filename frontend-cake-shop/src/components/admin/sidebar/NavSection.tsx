// src/components/admin/sidebar/NavSection.tsx
import React from 'react';

interface NavSectionProps {
  title?: string; // عنوان بخش اختیاری است
}

const NavSection: React.FC<NavSectionProps> = ({ title }) => {
  if (!title) {
    return null; // اگر عنوانی وجود ندارد، چیزی رندر نکن
  }

  return (
    <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 px-3 py-2 mt-3 uppercase tracking-wider">
      {title}
    </div>
  );
};

export default NavSection;