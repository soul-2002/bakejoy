// src/components/admin/common/PaginationControls.tsx
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  hasNextPage: boolean; // آیا صفحه بعدی وجود دارد (از API.next می‌آید)
  hasPrevPage: boolean; // آیا صفحه قبلی وجود دارد (از API.previous می‌آید)
  // اختیاری: تعداد دکمه‌های شماره صفحه‌ای که می‌خواهید همیشه نمایش داده شوند
  pageNeighbours?: number; 
}

const PaginationControls: React.FC<PaginationControlsProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  hasNextPage,
  hasPrevPage,
  pageNeighbours = 1, // به طور پیش‌فرض، ۱ صفحه قبل و ۱ صفحه بعد از صفحه فعلی نمایش داده می‌شود
}) => {
  if (totalPages <= 1) {
    return null; // اگر فقط یک صفحه یا کمتر وجود دارد، چیزی نمایش نده
  }

  const pageNumbers = [];
  const totalNumbers = pageNeighbours * 2 + 3; // صفحه فعلی + همسایه‌ها + اولین/آخرین صفحه + ...
  const totalBlocks = totalNumbers + 2; // totalNumbers + "..." شروع + "..." پایان

  if (totalPages > totalBlocks) {
    const startPage = Math.max(2, currentPage - pageNeighbours);
    const endPage = Math.min(totalPages - 1, currentPage + pageNeighbours);

    pageNumbers.push(1); // همیشه صفحه اول را اضافه کن

    if (startPage > 2) {
      pageNumbers.push(-1); // -1 به عنوان نشانگر "..."
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    if (endPage < totalPages - 1) {
      pageNumbers.push(-1); // -1 به عنوان نشانگر "..."
    }

    pageNumbers.push(totalPages); // همیشه صفحه آخر را اضافه کن
  } else {
    for (let i = 1; i <= totalPages; i++) {
      pageNumbers.push(i);
    }
  }

  return (
    <nav aria-label="Pagination">
      <ul className="flex items-center space-x-1 space-x-reverse"> {/* space-x-reverse برای RTL */}
        <li>
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={!hasPrevPage}
            className="px-3 h-8 flex items-center justify-center border border-gray-300 dark:border-slate-600 rounded-md text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="صفحه قبلی"
          >
            <FontAwesomeIcon icon={faChevronRight} /> {/* آیکون برای RTL */}
          </button>
        </li>

        {pageNumbers.map((page, index) => {
          if (page === -1) { // نشانگر "..."
            return (
              <li key={`ellipsis-${index}`}>
                <span className="px-3 h-8 flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">...</span>
              </li>
            );
          }
          return (
            <li key={page}>
              <button
                onClick={() => onPageChange(page)}
                className={`px-3 h-8 flex items-center justify-center border rounded-md text-sm font-medium
                  ${currentPage === page
                    ? 'border-amber-500 bg-amber-500 text-white dark:border-amber-400 dark:bg-amber-500 dark:text-white cursor-default'
                    : 'border-gray-300 dark:border-slate-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'
                  }`
                }
                aria-current={currentPage === page ? 'page' : undefined}
                aria-label={`رفتن به صفحه ${page.toLocaleString('fa-IR')}`}
                disabled={currentPage === page}
              >
                {page.toLocaleString('fa-IR')}
              </button>
            </li>
          );
        })}

        <li>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={!hasNextPage}
            className="px-3 h-8 flex items-center justify-center border border-gray-300 dark:border-slate-600 rounded-md text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="صفحه بعدی"
          >
            <FontAwesomeIcon icon={faChevronLeft} /> {/* آیکون برای RTL */}
          </button>
        </li>
      </ul>
    </nav>
  );
};

export default PaginationControls;