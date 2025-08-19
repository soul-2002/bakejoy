import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSlidersH, faTh, faList } from '@fortawesome/free-solid-svg-icons';

interface ProductToolbarProps {
  sortOrder: string;
  onSortChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  onFilterToggle: () => void;
}

const ProductToolbar: React.FC<ProductToolbarProps> = ({
  sortOrder, onSortChange, viewMode, onViewModeChange, onFilterToggle
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
      <div className="mb-4 md:mb-0">
        <button onClick={onFilterToggle} className="flex items-center gap-2 text-primary font-semibold">
          <FontAwesomeIcon icon={faSlidersH} />
          <span>فیلترها</span>
        </button>
      </div>

      <div className="flex items-center flex-wrap gap-x-4 gap-y-2">
        <div className="flex items-center gap-2">
          <span className="text-sm text-text-secondary">مرتب‌سازی:</span>
          <select
            value={sortOrder}
            onChange={onSortChange}
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="-created_at">جدیدترین</option>
            <option value="base_price">ارزان‌ترین</option>
            <option value="-base_price">گران‌ترین</option>
            <option value="-average_rating">بالاترین امتیاز</option>
          </select>
        </div>
        <div className="hidden md:flex items-center gap-2">
          <span className="text-sm text-text-secondary">نمایش:</span>
          <button onClick={() => onViewModeChange('grid')} className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
            <FontAwesomeIcon icon={faTh} />
          </button>
          <button onClick={() => onViewModeChange('list')} className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
            <FontAwesomeIcon icon={faList} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductToolbar;