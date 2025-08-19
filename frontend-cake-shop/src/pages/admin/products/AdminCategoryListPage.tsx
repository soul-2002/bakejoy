// src/pages/admin/categories/AdminCategoryListPage.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTags, faPlus, faToggleOn, faToggleOff } from '@fortawesome/free-solid-svg-icons';

import AdminPageLayout from '../../../components/admin/layout/AdminPageLayout';
import AdminDataTable, { TableColumn } from '../../../components/admin/tables/AdminDataTable';
import PaginationControls from '../../../components/admin/common/PaginationControls'; // کامپوننت Pagination
import EmptyState from '../../../components/admin/common/EmptyState';

import { useAuth } from '../../../contexts/AuthContext';
import { getAdminCategories, updateAdminCategory, deleteAdminCategory } from '../../../services/api'; // توابع API
import { Category, PaginatedResponse } from '../../../types'; // تایپ‌ها

// فایل CSS سفارشی را اگر لازم است ایمپورت کنید
// import '../../../styles/admin-tables.css';

const AdminCategoryListPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State های Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [nextPageUrl, setNextPageUrl] = useState<string | null>(null);
  const [prevPageUrl, setPrevPageUrl] = useState<string | null>(null);
  
  // State برای فیلتر و جستجو
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState(''); // 'active', 'inactive', یا '' برای همه

  const { accessToken } = useAuth();
  const navigate = useNavigate();

  const fetchCategories = useCallback(async (page: number, search: string, status: string) => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const params: any = { // TODO: Define proper type for params
        limit: itemsPerPage,
        offset: (page - 1) * itemsPerPage,
        ordering: 'name', // مرتب‌سازی پیش‌فرض
      };
      if (search) params.search = search;
      if (status) params.is_active = status === 'active';

      const data = await getAdminCategories(accessToken, params);
      if (data && typeof data === 'object' && 'results' in data) {
        const paginatedData = data as PaginatedResponse<Category>;
        setCategories(paginatedData.results);
        setTotalItems(paginatedData.count);
        setNextPageUrl(paginatedData.next);
        setPrevPageUrl(paginatedData.previous);
      } else if (Array.isArray(data)) {
        setCategories(data);
        setTotalItems(data.length); // اگر API صفحه‌بندی استاندارد ندارد
      } else {
        setCategories([]);
        setTotalItems(0);
      }
    } catch (err: any) {
      setError("خطا در دریافت دسته‌بندی‌ها: " + (err.message || "خطای ناشناخته"));
    } finally {
      setLoading(false);
    }
  }, [accessToken, itemsPerPage]);

  useEffect(() => {
    fetchCategories(currentPage, searchTerm, statusFilter);
  }, [currentPage, searchTerm, statusFilter, fetchCategories]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleEditCategory = (category: Category) => {
    navigate(`/admin/categories/edit/${category.id}`); // یا category.slug
  };

  const handleDeleteCategory = async (category: Category) => {
    if (window.confirm(`آیا از حذف دسته‌بندی "${category.name}" اطمینان دارید؟ این عمل قابل بازگشت نیست.`)) {
      if (!accessToken) return;
      try {
        setLoading(true); // یا یک state جداگانه برای حذف
        await deleteAdminCategory(accessToken, category.id);
        // بروزرسانی لیست پس از حذف
        fetchCategories(currentPage, searchTerm, statusFilter); 
        alert("دسته‌بندی با موفقیت حذف شد.");
      } catch (err: any) {
        setError("خطا در حذف دسته‌بندی: " + (err.message || ""));
        setLoading(false);
      }
    }
  };

  const handleToggleActiveCategory = async (category: Category) => {
    if (!accessToken) return;
    try {
        setLoading(true);
        await updateAdminCategory(accessToken, category.id, { is_active: !category.is_active });
        fetchCategories(currentPage, searchTerm, statusFilter);
        alert(`وضعیت دسته‌بندی "${category.name}" با موفقیت تغییر کرد.`);
    } catch (err: any) {
        setError("خطا در تغییر وضعیت دسته‌بندی: " + (err.message || ""));
        setLoading(false);
    }
  };

  const columns: TableColumn<Category>[] = [
    // { header: 'ID', accessor: 'id', className: 'w-16 text-center' },
    {
      header: 'نام دسته‌بندی',
      accessor: 'name',
      render: (category) => (
        <div className="flex items-center">
          {category.image && (
            <img 
              src={category.image} 
              alt={category.name} 
              className="w-10 h-10 rounded-md object-cover ml-3 rtl:mr-0 rtl:ml-3" 
            />
          )}
          {!category.image && (
             <div className="w-10 h-10 rounded-md bg-gray-100 dark:bg-slate-700 flex items-center justify-center text-gray-400 dark:text-slate-500 ml-3 rtl:mr-0 rtl:ml-3">
                <FontAwesomeIcon icon={faTags} />
            </div>
          )}
          <RouterLink 
            to={`/admin/categories/edit/${category.id}`} 
            className="font-medium text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300"
          >
            {category.name}
          </RouterLink>
        </div>
      ),
    },
    { header: 'اسلاگ', accessor: 'slug', className: 'hidden md:table-cell' },
    {
      header: 'تعداد محصولات',
      accessor: 'products_count', // این فیلد باید از API بیاید یا در فرانت‌اند محاسبه شود (اگر امکان‌پذیر است)
      render: (category) => (category as any).products_count?.toLocaleString('fa-IR') || '۰', // مثال
      className: 'text-center hidden sm:table-cell',
    },
    {
      header: 'وضعیت',
      accessor: 'is_active',
      render: (category) => (
        <span
          className={`px-2 py-1 text-xs rounded-full font-semibold
            ${category.is_active 
              ? 'bg-green-100 text-green-700 dark:bg-green-700 dark:text-green-100' 
              : 'bg-red-100 text-red-700 dark:bg-red-700 dark:text-red-100'}`}
        >
          {category.is_active ? 'فعال' : 'غیرفعال'}
        </span>
      ),
      className: 'text-center',
    },
  ];

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // داده‌های فیلتر برای AdminPageLayout
  const filterOptionsForLayout = [
    {
      label: "وضعیت",
      options: [
        { value: "", label: "همه وضعیت‌ها" },
        { value: "active", label: "فعال" },
        { value: "inactive", label: "غیرفعال" },
      ],
      currentValue: statusFilter,
      onFilterChange: setStatusFilter,
    },
    // می‌توانید فیلترهای دیگری هم اضافه کنید
  ];

  return (
    <AdminPageLayout
      pageTitle="مدیریت دسته‌بندی‌ها"
      onAddNewClick={() => navigate('/admin/categories/new')}
      onSearchChange={setSearchTerm}
      searchPlaceholder="جستجو در نام یا اسلاگ دسته‌بندی..."
      filterSections={filterOptionsForLayout}
      // onApplyFiltersClick={() => fetchCategories(1, searchTerm, statusFilter)} // اگر دکمه فیلتر جداگانه دارید
    >
      {loading && <div className="text-center py-10">در حال بارگذاری...</div>}
      {!loading && error && <div className="text-center py-10 text-red-500">خطا: {error}</div>}
      {!loading && !error && categories.length === 0 && (
        <EmptyState
          icon={faTags}
          title="هنوز هیچ دسته‌بندی‌ای ایجاد نشده است"
          message="با افزودن دسته‌بندی‌های جدید، محصولات خود را بهتر سازماندهی کنید."
          actionButtonText="افزودن دسته‌بندی جدید"
          onActionButtonClick={() => navigate('/admin/categories/new')}
          actionButtonIcon={faPlus}
        />
      )}
      {!loading && !error && categories.length > 0 && (
        <>
          <AdminDataTable<Category>
            columns={columns}
            data={categories}
            onEditClick={handleEditCategory}
            onDeleteClick={handleDeleteCategory}
            onToggleActiveClick={handleToggleActiveCategory}
            getItemId={(category) => category.id}
            selectableRows={true} // فعال کردن چک‌باکس‌ها
            // selectedRows={selectedCategoryIds} // state برای نگهداری ID های انتخاب شده
            // onRowSelect={handleCategorySelect}
            // onSelectAllRows={handleSelectAllCategories}
          />
          <div className="mt-6"> {/* کلاس pagination از HTML شما */}
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              hasNextPage={!!nextPageUrl}
              hasPrevPage={!!prevPageUrl}
            />
             <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between mt-2 md:mt-0"> {/* نمایش تعداد نتایج */}
                <div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                    نمایش
                    <span className="font-medium mx-1">{(totalItems > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0).toLocaleString('fa-IR')}</span>
                    تا
                    <span className="font-medium mx-1">{Math.min(currentPage * itemsPerPage, totalItems).toLocaleString('fa-IR')}</span>
                    از
                    <span className="font-medium mx-1">{totalItems.toLocaleString('fa-IR')}</span>
                    نتیجه
                    </p>
                </div>
            </div>
          </div>
        </>
      )}
    </AdminPageLayout>
  );
};

export default AdminCategoryListPage;