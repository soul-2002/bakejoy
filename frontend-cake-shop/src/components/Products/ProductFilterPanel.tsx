import React from 'react';
import type { Category, Flavor } from '../../types';

interface FilterPanelProps {
  isOpen: boolean;
  categories: Category[];
  flavors: Flavor[];
  activeFilters: any; // تایپ دقیق‌تر بر اساس state شما
  onCategoryChange: (id: number) => void;
  onFlavorChange: (id: number) => void;
  onPriceChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearFilters: () => void;
}

const ProductFilterPanel: React.FC<FilterPanelProps> = ({
  isOpen, categories, flavors, activeFilters,
  onCategoryChange, onFlavorChange, onPriceChange, onClearFilters
}) => {
  return (
    <div className={`filter-section mt-4 pt-4 border-t overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {/* Category Filter */}
        <div>
          <h3 className="font-medium mb-2 text-dark">دسته‌بندی</h3>
          <div className="space-y-2">
            {categories.map(category => (
              <label key={category.id} className="flex items-center cursor-pointer">
                <input type="checkbox" className="rounded text-primary" checked={activeFilters.categories.has(category.id)} onChange={() => onCategoryChange(category.id)} />
                <span className="text-sm mr-2">{category.name}</span>
              </label>
            ))}
          </div>
        </div>
        {/* Flavor Filter */}
        <div>
          <h3 className="font-medium mb-2 text-dark">طعم</h3>
          <div className="space-y-2">
            {flavors.map(flavor => (
              <label key={flavor.id} className="flex items-center cursor-pointer">
                <input type="checkbox" className="rounded text-primary" checked={activeFilters.flavors.has(flavor.id)} onChange={() => onFlavorChange(flavor.id)} />
                <span className="text-sm mr-2">{flavor.name}</span>
              </label>
            ))}
          </div>
        </div>
        {/* Price Filter */}
        <div>
          <h3 className="font-medium mb-2 text-dark">محدوده قیمت (تومان)</h3>
          <div className="flex items-center gap-2">
            <input type="number" name="min_price" placeholder="از" value={activeFilters.min_price} onChange={onPriceChange} className="w-full border rounded-lg px-3 py-2 text-sm"/>
            <span>-</span>
            <input type="number" name="max_price" placeholder="تا" value={activeFilters.max_price} onChange={onPriceChange} className="w-full border rounded-lg px-3 py-2 text-sm"/>
          </div>
        </div>
      </div>
      <div className="mt-6 text-left rtl:text-right">
        <button onClick={onClearFilters} className="text-primary hover:underline text-sm font-body">پاک کردن همه فیلترها</button>
      </div>
    </div>
  );
};

export default ProductFilterPanel;