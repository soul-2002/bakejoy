// src/components/TagInput.tsx (نسخه نهایی و امن)

import React, { useState } from 'react';

interface TagInputProps {
  value: string[] | undefined | null; // می‌پذیریم که مقدار ورودی ممکن است undefined باشد
  onChange: (tags: string[]) => void;
  placeholder?: string;
}

export const TagInput: React.FC<TagInputProps> = ({ value, onChange, placeholder }) => {
  const [inputValue, setInputValue] = useState('');

  // --- لایه محافظتی: همیشه مطمئن می‌شویم که با یک آرایه کار می‌کنیم ---
  const tagsArray = Array.isArray(value) ? value : [];

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim() !== '') {
      e.preventDefault();
      const newTag = inputValue.trim();
      
      // از tagsArray امن شده استفاده می‌کنیم
      if (!tagsArray.includes(newTag)) {
        onChange([...tagsArray, newTag]);
      }
      setInputValue('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    // از tagsArray امن شده استفاده می‌کنیم
    onChange(tagsArray.filter(tag => tag !== tagToRemove));
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 min-h-[42px]">
        {/* از tagsArray امن شده برای map استفاده می‌کنیم */}
        {tagsArray.map(tag => (
          <span key={tag} className="flex items-center bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded-full dark:bg-blue-900 dark:text-blue-300">
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="ml-2 mr-1 text-blue-500 hover:text-blue-700 dark:hover:text-blue-400 focus:outline-none"
            >
              &times;
            </button>
          </span>
        ))}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || 'تگ جدید را وارد و Enter بزنید...'}
          className="flex-grow bg-transparent outline-none p-1 text-gray-900 dark:text-gray-100"
        />
      </div>
    </div>
  );
};