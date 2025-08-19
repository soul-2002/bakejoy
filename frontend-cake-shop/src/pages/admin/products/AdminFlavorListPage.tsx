// src/pages/admin/flavors/AdminFlavorListPage.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom'; // Link را هم اگر مستقیماً استفاده می‌کنید، ایمپورت کنید
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFlask, faPlus, faToggleOn, faToggleOff } from '@fortawesome/free-solid-svg-icons'; // آیکون مناسب برای طعم‌ها

import AdminPageLayout from '../../../components/admin/layout/AdminPageLayout';
import AdminDataTable, { TableColumn } from '../../../components/admin/tables/AdminDataTable';
import PaginationControls from '../../../components/admin/common/PaginationControls';
import EmptyState from '../../../components/admin/common/EmptyState';

import { useAuth } from '../../../contexts/AuthContext';
import { 
  getAdminFlavors, 
  // createAdminFlavor, // برای دکمه افزودن در فرم لازم است
  updateAdminFlavor, // برای تغییر وضعیت فعال/غیرفعال
  deleteAdminFlavor,
  GetAdminApiParams // اگر اینترفیس پارامترهای عمومی را ساخته‌اید
} from '../../../services/api';
import { Flavor, PaginatedResponse, FlavorFormData } from '../../../types'; // تایپ Flavor و FlavorFormData

// اگر استایل سفارشی برای جدول دارید
// import '../../../styles/admin-tables.css';

const ITEMS_PER_PAGE = 10; // تعداد آیتم در هر صفحه برای صفحه‌بندی

const AdminFlavorListPage: React.FC = () => {
  const [flavors, setFlavors] = useState<Flavor[]>([]);
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

  const fetchFlavors = useCallback(async (page: number, search: string, status: string) => {
    if (!accessToken) {
      setError("توکن دسترسی موجود نیست.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const params: GetAdminApiParams = { // استفاده از اینترفیس عمومی برای پارامترها
        limit: ITEMS_PER_PAGE,
        offset: (page - 1) * ITEMS_PER_PAGE,
        ordering: 'name', // مرتب‌سازی پیش‌فرض بر اساس نام طعم
      };
      if (search) params.search = search;
      if (status) params.is_active = status === 'active';

      const data = await getAdminFlavors(accessToken, params);
      
      if (data && typeof data === 'object' && 'results' in data) {
        const paginatedData = data as PaginatedResponse<Flavor>;
        setFlavors(paginatedData.results);
        setTotalItems(paginatedData.count);
        setNextPageUrl(paginatedData.next);
        setPrevPageUrl(paginatedData.previous);
      } else if (Array.isArray(data)) { // اگر API صفحه‌بندی استاندارد DRF را برنگرداند
        setFlavors(data);
        setTotalItems(data.length);
      } else {
        setFlavors([]);
        setTotalItems(0);
      }
    } catch (err: any) {
      setError("خطا در دریافت لیست طعم‌ها: " + (err.message || "خطای ناشناخته"));
      console.error("Error fetching flavors:", err);
    } finally {
      setLoading(false);
    }
  }, [accessToken]); // itemsPerPage را اگر state باشد، به وابستگی اضافه کنید

  useEffect(() => {
    fetchFlavors(currentPage, searchTerm, statusFilter);
  }, [currentPage, searchTerm, statusFilter, fetchFlavors]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleEditFlavor = (flavor: Flavor) => {
    navigate(`/admin/flavors/edit/${flavor.id}`);
  };

  const handleDeleteFlavor = async (flavor: Flavor) => {
    if (window.confirm(`آیا از حذف طعم "${flavor.name}" اطمینان دارید؟`)) {
      if (!accessToken) return;
      // بهتر است یک state لودینگ جدا برای عملیات حذف داشته باشید
      // setLoading(true); 
      try {
        await deleteAdminFlavor(flavor.id,accessToken) ;
        alert("طعم با موفقیت حذف شد.");
        // بارگذاری مجدد داده‌های صفحه فعلی یا صفحه اول
        fetchFlavors(currentPage, searchTerm, statusFilter); 
      } catch (err: any) {
        setError("خطا در حذف طعم: " + (err.message || ""));
        // setLoading(false);
      }
    }
  };

  const handleToggleActiveFlavor = async (flavor: Flavor) => {
    if (!accessToken) return;
    // setLoading(true);
    try {
      const updatedData: Partial<FlavorFormData> = { is_active: !flavor.is_active };
      await updateAdminFlavor(accessToken,flavor.id, updatedData);
      alert(`وضعیت طعم "${flavor.name}" با موفقیت تغییر کرد.`);
      fetchFlavors(currentPage, searchTerm, statusFilter);
    } catch (err: any) {
      setError("خطا در تغییر وضعیت طعم: " + (err.message || ""));
      // setLoading(false);
    }
  };

  const columns: TableColumn<Flavor>[] = [
    {
      header: 'نام طعم',
      accessor: 'name',
      render: (flavor) => (
        <span 
          onClick={() => handleEditFlavor(flavor)} 
          className="font-medium text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 cursor-pointer"
        >
          {flavor.name}
        </span>
      ),
      className: "w-1/3", // مثال برای تعیین عرض ستون
    },
    { 
      header: 'توضیحات', 
      accessor: 'description',
      render: (flavor) => <span className="text-sm text-gray-600 dark:text-gray-400 truncate">{flavor.description || '-'}</span>,
      className: "w-1/2 hidden md:table-cell", // در موبایل مخفی شود
      headerClassName: "hidden md:table-cell",
    },
    {
      header: 'تعداد محصولات',
      accessor: 'products_using_count', // این فیلد باید از API بیاید
      render: (flavor) => (
        (flavor.products_using_count !== undefined && flavor.products_using_count !== null)
          ? flavor.products_using_count.toLocaleString('fa-IR')
          : '۰' 
      ),
      className: 'text-center hidden sm:table-cell',
      headerClassName: 'text-center hidden sm:table-cell',
    },
    {
      header: 'وضعیت',
      accessor: 'is_active',
      render: (flavor) => (
        <button
          onClick={() => handleToggleActiveFlavor(flavor)}
          title={flavor.is_active ? "غیرفعال کردن" : "فعال کردن"}
          className={`p-1 rounded-full text-xl transition-colors
            ${flavor.is_active 
              ? 'text-green-500 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300' 
              : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300'}`}
        >
          <FontAwesomeIcon icon={flavor.is_active ? faToggleOn : faToggleOff} />
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
      pageTitle="مدیریت طعم‌ها"
      onAddNewClick={() => navigate('/admin/flavors/new')} // مسیر به فرم افزودن طعم
      onSearchChange={setSearchTerm} // اگر جستجو دارید
      searchPlaceholder="جستجو در نام طعم..."
      filterSections={filterOptionsForLayout} // اگر فیلتر دارید
      // onApplyFiltersClick={() => fetchFlavors(1, searchTerm, statusFilter)} // اگر دکمه فیلتر جداگانه دارید
    >
      {loading && <div className="text-center py-10 text-gray-500 dark:text-gray-400">در حال بارگذاری طعم‌ها...</div>}
      {!loading && error && <div className="text-center py-10 text-red-500 dark:text-red-400">خطا: {error}</div>}
      
      {!loading && !error && flavors.length === 0 && (
        <EmptyState
          icon={faFlask} // یا آیکون دیگر برای طعم
          title="هنوز هیچ طعمی ایجاد نشده است"
          message="با افزودن طعم‌های جدید، تنوع محصولات خود را افزایش دهید."
          actionButtonText="افزودن طعم جدید"
          onActionButtonClick={() => navigate('/admin/flavors/new')}
          actionButtonIcon={faPlus}
        />
      )}

      {!loading && !error && flavors.length > 0 && (
        <>
          <AdminDataTable<Flavor>
            columns={columns}
            data={flavors}
            onEditClick={handleEditFlavor}
            onDeleteClick={handleDeleteFlavor}
            // onToggleActiveClick={handleToggleActiveFlavor} // این در ستون وضعیت هندل شده
            getItemId={(flavor) => flavor.id}
            // selectableRows={true} // اگر نیاز به انتخاب گروهی دارید
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

export default AdminFlavorListPage;