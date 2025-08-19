import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import type { SupplyFilterOptions } from '../../types';

// تایپ پراپ‌ها
interface ActiveFilters {
  type: string | null;
  colors: number[];
  themes: string[];
}

interface ActiveFiltersDisplayProps {
  activeFilters: ActiveFilters;
  filterOptions: SupplyFilterOptions | null;
  onFilterChange: (filterType: 'type' | 'color' | 'theme', value: string | number) => void;
  onClearFilters: () => void;
}

const ActiveFiltersDisplay: React.FC<ActiveFiltersDisplayProps> = ({ 
    activeFilters, 
    filterOptions,
    onFilterChange, 
    onClearFilters 
}) => {
  // اگر هیچ فیلتر یا گزینه‌ای وجود ندارد، چیزی نمایش نده
  if (!filterOptions || (!activeFilters.type && activeFilters.colors.length === 0 && activeFilters.themes.length === 0)) {
    return null;
  }

  // پیدا کردن نام فیلترها از روی ID یا slug آنها
  const activeTypeName = filterOptions.types.find(t => t.slug === activeFilters.type)?.name;
  const activeColors = filterOptions.colors.filter(c => activeFilters.colors.includes(c.id));
  const activeThemes = filterOptions.themes.filter(t => activeFilters.themes.includes(t.slug));

  return (
    <div className="bg-white p-3 rounded-xl shadow-sm mb-6 flex flex-wrap gap-2 items-center">
      <span className="text-gray-700 text-sm font-medium">فیلترهای فعال:</span>
      
      {/* نمایش نوع فعال */}
      {activeTypeName && (
        <div className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm flex items-center">
          <span>{activeTypeName}</span>
          <button onClick={() => onFilterChange('type', activeFilters.type!)} className="mr-2 text-amber-600 hover:text-amber-800">
            <FontAwesomeIcon icon={faTimes} size="sm" />
          </button>
        </div>
      )}

      {/* نمایش رنگ‌های فعال */}
      {activeColors.map(color => (
        <div key={color.id} className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm flex items-center">
          <span>{color.name}</span>
          <button onClick={() => onFilterChange('color', color.id)} className="mr-2 text-amber-600 hover:text-amber-800">
            <FontAwesomeIcon icon={faTimes} size="sm" />
          </button>
        </div>
      ))}

      {/* نمایش تم‌های فعال */}
      {activeThemes.map(theme => (
        <div key={theme.id} className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm flex items-center">
          <span>{theme.name}</span>
          <button onClick={() => onFilterChange('theme', theme.slug)} className="mr-2 text-amber-600 hover:text-amber-800">
            <FontAwesomeIcon icon={faTimes} size="sm" />
          </button>
        </div>
      ))}

      <button onClick={onClearFilters} className="text-amber-600 hover:text-amber-800 text-sm font-semibold mr-2">
        حذف همه
      </button>
    </div>
  );
};

export default ActiveFiltersDisplay;