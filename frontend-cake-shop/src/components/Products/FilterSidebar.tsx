import React from 'react';
import type { SupplyFilterOptions } from '../../types';

interface FilterSidebarProps {
  filterOptions: SupplyFilterOptions | null;
  activeFilters: {
    type: string | null;
    colors: number[]; // آرایه‌ای از ID رنگ‌های انتخاب شده
    themes: string[]; // آرایه‌ای از slug تم‌های انتخاب شده
  };
  onFilterChange: (filterType: 'type' | 'color' | 'theme', value: string | number) => void;
  onClearFilters: () => void;
}

const FilterSidebar: React.FC<FilterSidebarProps> = ({ 
  filterOptions, 
  activeFilters, 
  onFilterChange,
  onClearFilters 
}) => {
  if (!filterOptions) {
    return (
      <aside className="w-full md:w-64">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          در حال بارگذاری فیلترها...
        </div>
      </aside>
    );
  }

  // تابع کمکی برای چک کردن اینکه آیا یک رنگ انتخاب شده است یا نه
  const isColorActive = (colorId: number) => activeFilters.colors.includes(colorId);

  return (
<aside className="w-full md:w-64 bg-white p-6 rounded-xl shadow-sm h-fit sticky top-4">
      <div className="flex justify-between items-center mb-4 border-b border-gray-200 pb-4">
        <h2 className="text-lg font-bold text-gray-800">فیلترها</h2>
        <button onClick={onClearFilters} className="text-sm text-amber-600 hover:underline">
          حذف همه
        </button>
      </div>
      
      {/* Product Type Filter */}
      <div className="mb-6">
        <h3 className="font-semibold mb-3 text-gray-700">نوع محصول</h3>
        <div className="space-y-2">
          {filterOptions.types.map(type => (
            <label key={type.id} className="flex items-center cursor-pointer">
              <input 
                type="radio"
                name="product_type"
                value={type.slug}
                checked={activeFilters.type === type.slug}
                onChange={() => onFilterChange('type', type.slug)}
                className="rounded text-amber-600 focus:ring-amber-500 ml-2" 
              />
              <span>{type.name}</span>
            </label>
          ))}
        </div>
      </div>
      
      {/* Color Filter */}
      <div className="mb-6 border-t border-gray-200 pt-4">
        <h3 className="font-semibold mb-3 text-gray-700">رنگ</h3>
        <div className="flex flex-wrap gap-2">
          {filterOptions.colors.map(color => (
            <span 
              key={color.id}
              onClick={() => onFilterChange('color', color.id)}
              className={`color-swatch ${activeFilters.colors.includes(color.id) ? 'selected' : ''}`}
              style={{ backgroundColor: color.hex_code }}
              title={color.name}
            ></span>
          ))}
        </div>
      </div>

      {/* --- START: بخش‌های اضافه شده --- */}
      {/* Theme Filter */}
      <div className="mb-6 border-t border-gray-200 pt-4">
        <h3 className="font-semibold mb-3 text-gray-700">تم/سبک</h3>
        <div className="space-y-2">
          {filterOptions.themes.map(theme => (
            <label key={theme.id} className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                value={theme.slug}
                checked={activeFilters.themes.includes(theme.slug)}
                onChange={() => onFilterChange('theme', theme.slug)}
                className="rounded text-amber-600 focus:ring-amber-500 ml-2"
              />
              <span>{theme.name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Price Range Filter */}
      <div className="mb-6 border-t border-gray-200 pt-4">
        <h3 className="font-semibold mb-3 text-gray-700">محدوده قیمت</h3>
        {/* TODO: برای پیاده‌سازی کامل اسلایدر، می‌توانید از کتابخانه‌ای مانند 'rc-slider' استفاده کنید */}
        <input 
          type="range" 
          min="0" 
          max="500000" 
          // onChange={(e) => console.log(e.target.value)} // منطق مدیریت قیمت را اینجا اضافه کنید
          className="w-full h-2 bg-amber-200 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:bg-amber-500"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-2">
          <span>۰ تومان</span>
          <span>۵۰۰,۰۰۰ تومان</span>
        </div>
      </div>
      
    </aside>
  );
};

export default FilterSidebar;