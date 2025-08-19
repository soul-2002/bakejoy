// src/pages/admin/sizes/AdminSizeListPage.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRulerCombined, faPlus, faToggleOn, faToggleOff, faEdit, faTrash } from '@fortawesome/free-solid-svg-icons'; // آیکون مناسب برای اندازه‌ها

import AdminPageLayout from '../../../components/admin/layout/AdminPageLayout';
import AdminDataTable, { TableColumn } from '../../../components/admin/tables/AdminDataTable';
import PaginationControls from '../../../components/admin/common/PaginationControls';
import EmptyState from '../../../components/admin/common/EmptyState';
import { useAuth } from '../../../contexts/AuthContext';
import {
  getAdminSizes,
  updateAdminSize,
  deleteAdminSize,
  GetAdminApiParams
} from '../../../services/api';
import { Size, PaginatedResponse, SizeFormData } from '../../../types';

// import '../../../styles/admin-tables.css'; // اگر استایل سفارشی دارید

const ITEMS_PER_PAGE = 10;

const AdminSizeListPage: React.FC = () => {
  const [sizes, setSizes] = useState<Size[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [nextPageUrl, setNextPageUrl] = useState<string | null>(null);
  const [prevPageUrl, setPrevPageUrl] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState(''); // 'active', 'inactive', یا ''

  const { accessToken } = useAuth();
  const navigate = useNavigate();

  const fetchSizes = useCallback(async (page: number, search: string, status: string) => {
    if (!accessToken) {
      setError("توکن دسترسی موجود نیست.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const params: GetAdminApiParams = {
        limit: ITEMS_PER_PAGE,
        offset: (page - 1) * ITEMS_PER_PAGE,
        ordering: 'name', // یا هر مرتب‌سازی پیش‌فرض دیگر
      };
      if (search) params.search = search;
      if (status) params.is_active = status === 'active';

      const data = await getAdminSizes(accessToken, params);

      if (data && typeof data === 'object' && 'results' in data) {
        const paginatedData = data as PaginatedResponse<Size>;
        setSizes(paginatedData.results);
        setTotalItems(paginatedData.count);
        setNextPageUrl(paginatedData.next);
        setPrevPageUrl(paginatedData.previous);
      } else if (Array.isArray(data)) {
        setSizes(data);
        setTotalItems(data.length);
      } else {
        setSizes([]);
        setTotalItems(0);
      }
    } catch (err: any) {
      setError("خطا در دریافت لیست اندازه‌ها: " + (err.message || "خطای ناشناخته"));
      console.error("Error fetching sizes:", err);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    fetchSizes(currentPage, searchTerm, statusFilter);
  }, [currentPage, searchTerm, statusFilter, fetchSizes]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleEditSize = (size: Size) => {
    navigate(`/admin/sizes/edit/${size.id}`);
  };

  const handleDeleteSize = async (size: Size) => {
    if (window.confirm(`آیا از حذف اندازه "${size.name}" اطمینان دارید؟`)) {
      if (!accessToken) return;
      try {
        await deleteAdminSize(accessToken, size.id);
        alert("اندازه با موفقیت حذف شد.");
        fetchSizes(currentPage, searchTerm, statusFilter); // یا رفرش هوشمندانه‌تر
      } catch (err: any) {
        setError("خطا در حذف اندازه: " + (err.message || ""));
      }
    }
  };

  const handleToggleActiveSize = async (size: Size) => {
    if (!accessToken) return;
    try {
      const updatedData: Partial<SizeFormData> = { is_active: !size.is_active };
      await updateAdminSize(accessToken, size.id, updatedData);
      alert(`وضعیت اندازه "${size.name}" با موفقیت تغییر کرد.`);
      fetchSizes(currentPage, searchTerm, statusFilter);
    } catch (err: any) {
      setError("خطا در تغییر وضعیت اندازه: " + (err.message || ""));
    }
  };

  const columns: TableColumn<Size>[] = [
    {
      header: 'نام اندازه',
      accessor: 'name',
      render: (size) => (
        <span
          onClick={() => handleEditSize(size)}
          className="font-medium text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 cursor-pointer"
        >
          {size.name}
        </span>
      ),
    },
    {
      header: 'وزن تخمینی (کیلوگرم)',
      accessor: 'estimated_weight_kg',
      render: (size) => size.estimated_weight_kg ? `${parseFloat(String(size.estimated_weight_kg)).toLocaleString('fa-IR')} کیلوگرم` : '-',
      className: 'text-center hidden md:table-cell',
      headerClassName: 'hidden md:table-cell',
    },
    {
      header: 'تعدیل‌کننده قیمت',
      accessor: 'price_modifier',
      render: (size) => size.price_modifier ? `${parseFloat(String(size.price_modifier)).toLocaleString('fa-IR')} تومان` : '۰ تومان',
      className: 'text-center hidden lg:table-cell',
      headerClassName: 'hidden lg:table-cell',
    },
    {
      header: 'وضعیت',
      accessor: 'is_active',
      render: (size) => (
        <button
          onClick={() => handleToggleActiveSize(size)}
          title={size.is_active ? "غیرفعال کردن" : "فعال کردن"}
          className={`p-1 rounded-full text-xl transition-colors
            ${size.is_active
              ? 'text-green-500 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300'
              : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300'}`}
        >
          <FontAwesomeIcon icon={size.is_active ? faToggleOn : faToggleOff} />
        </button>
      ),
      className: 'text-center w-24',
      headerClassName: 'text-center w-24',
    },
  ];

  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

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
  ];

  return (
    <AdminPageLayout
      pageTitle="مدیریت اندازه‌ها"
      onAddNewClick={() => navigate('/admin/sizes/new')}
      onSearchChange={setSearchTerm}
      searchPlaceholder="جستجو در نام اندازه..."
      filterSections={filterOptionsForLayout}
    >
      {loading && <div className="text-center py-10 text-gray-500 dark:text-gray-400">در حال بارگذاری اندازه‌ها...</div>}
      {!loading && error && <div className="text-center py-10 text-red-500 dark:text-red-400">خطا: {error}</div>}
      {!loading && !error && sizes.length === 0 && (
        <EmptyState
          icon={faRulerCombined}
          title="هنوز هیچ اندازه‌ای ایجاد نشده است"
          message="با افزودن اندازه‌های جدید، گزینه‌های بیشتری برای محصولات خود ارائه دهید."
          actionButtonText="افزودن اندازه جدید"
          onActionButtonClick={() => navigate('/admin/sizes/new')}
          actionButtonIcon={faPlus}
        />
      )}
      {!loading && !error && sizes.length > 0 && (
        <>
          <AdminDataTable<Size>
            columns={columns}
            data={sizes}
            onEditClick={handleEditSize}
            onDeleteClick={handleDeleteSize}
            getItemId={(size) => size.id}
            // selectableRows={true}
          />
          {totalPages > 1 && (
            <div className="mt-6 flex flex-col md:flex-row items-center justify-between pt-4 border-t border-gray-200 dark:border-slate-700">
              <div className="mb-4 md:mb-0 text-sm text-gray-700 dark:text-gray-300">
                نمایش
                <span className="font-medium mx-1">{(totalItems > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0).toLocaleString('fa-IR')}</span>
                تا
                <span className="font-medium mx-1">{Math.min(currentPage * ITEMS_PER_PAGE, totalItems).toLocaleString('fa-IR')}</span>
                از
                <span className="font-medium mx-1">{totalItems.toLocaleString('fa-IR')}</span>
                نتیجه
              </div>
              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                hasNextPage={!!nextPageUrl}
                hasPrevPage={!!prevPageUrl}
              />
            </div>
          )}
        </>
      )}
    </AdminPageLayout>
  );
};

export default AdminSizeListPage;