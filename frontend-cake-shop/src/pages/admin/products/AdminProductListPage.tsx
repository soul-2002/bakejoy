// src/pages/admin/products/AdminProductListPage.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom'; // RouterLink برای لینک‌ها
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus, faFileExport, faSearch, faFilter, faExternalLinkAlt,
  faEdit, faTrash, faChevronLeft, faChevronRight, faBirthdayCake, faToggleOn, faToggleOff
  // سایر آیکون‌های لازم
} from '@fortawesome/free-solid-svg-icons';

import AdminPageLayout from '../../../components/admin/layout/AdminPageLayout';
import AdminDataTable, { TableColumn } from '../../../components/admin/tables/AdminDataTable';
import PaginationControls from '../../../components/admin/common/PaginationControls';
import EmptyState from '../../../components/admin/common/EmptyState';
import BulkActionsToolbar from '../../../components/admin/common/BulkActionsToolbar';

import { useAuth } from '../../../contexts/AuthContext';
import {
  getAdminProducts /* توابع دیگر API محصولات */,
  GetAdminApiParams,
  updateAdminProductStatusBulk, // <--- تابع API جدید برای آپدیت وضعیت گروهی
  deleteAdminProductsBulk,
} from '../../../services/api';
import { Product, PaginatedResponse, Category as ProductCategoryType } from '../../../types'; // تایپ Product و Category

// اگر استایل سفارشی برای جدول دارید
import '../styles/admin-tables.css';
// import '../../../styles/admin-product-list.css'; // استایل‌های خاص این صفحه اگر هست

const ITEMS_PER_PAGE = 10; // یا هر مقداری که برای صفحه‌بندی محصولات در نظر دارید

// داده نمونه برای فیلتر دسته‌بندی‌ها (این باید از API بیاید)
const sampleCategories: ProductCategoryType[] = [
  { id: 1, name: 'کیک تولد', slug: 'birthday-cake', is_active: true },
  { id: 2, name: 'کیک عروسی', slug: 'wedding-cake', is_active: true },
  { id: 3, name: 'کاپ کیک', slug: 'cupcake', is_active: true },
];

// وضعیت‌های محصول (این هم می‌تواند از API یا یک enum بیاید)
const productStatusOptions = [
  { value: '', label: 'همه وضعیت‌ها' },
  { value: 'active', label: 'فعال' },       // متناظر با is_active=true
  { value: 'draft', label: 'پیش‌نویس' },    // این نیاز به فیلد status در مدل Product دارد
  { value: 'inactive', label: 'غیرفعال' },  // متناظر با is_active=false
];


const AdminProductListPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [bulkActionLoading, setBulkActionLoading] = useState(false); // لودینگ برای عملیات گروهی
  const [error, setError] = useState<string | null>(null);

  // State های Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [nextPageUrl, setNextPageUrl] = useState<string | null>(null);
  const [prevPageUrl, setPrevPageUrl] = useState<string | null>(null);

  // State های فیلتر و جستجو
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState(''); // 'active', 'draft', 'inactive'

  // State برای انتخاب گروهی
  const [selectedProductIds, setSelectedProductIds] = useState<Set<number | string>>(new Set());

  const { accessToken } = useAuth();
  const navigate = useNavigate();

  // TODO: واکشی لیست دسته‌بندی‌ها برای فیلتر
  const [categoriesForFilter, setCategoriesForFilter] = useState<ProductCategoryType[]>(sampleCategories);
  // useEffect(() => { /* fetch categories for filter dropdown */ }, [accessToken]);
  const handleBulkProductAction = async (actionValue: string) => {
    if (!accessToken || selectedProductIds.size === 0) {
      alert("لطفاً ابتدا وارد شوید و حداقل یک محصول را انتخاب کنید.");
      return;
    }

    const ids = Array.from(selectedProductIds);
    let confirmMessage = '';
    let actionLabel = '';

    // تعیین پیام تایید و برچسب عملیات بر اساس actionValue
    if (actionValue === 'delete_selected') {
      actionLabel = "حذف";
      confirmMessage = `آیا از ${actionLabel} ${ids.length.toLocaleString('fa-IR')} محصول انتخاب شده اطمینان دارید؟ این عمل قابل بازگشت نیست.`;
    } else if (actionValue === 'activate_selected') {
      actionLabel = "فعال کردن";
      confirmMessage = `آیا از ${actionLabel} ${ids.length.toLocaleString('fa-IR')} محصول انتخاب شده اطمینان دارید؟`;
    } else if (actionValue === 'deactivate_selected') {
      actionLabel = "غیرفعال کردن";
      confirmMessage = `آیا از ${actionLabel} ${ids.length.toLocaleString('fa-IR')} محصول انتخاب شده اطمینان دارید؟`;
    } else {
      alert("عملیات انتخاب شده نامعتبر است.");
      return;
    }

    if (!window.confirm(confirmMessage)) return;

    setBulkActionLoading(true);
    setError(null); // پاک کردن خطاهای قبلی

    try {
      let responseDetail = '';
      if (actionValue === 'delete_selected') {
        const response = await deleteAdminProductsBulk(accessToken, ids);
        responseDetail = response?.detail || `${ids.length.toLocaleString('fa-IR')} محصول با موفقیت حذف شدند.`;
      } else if (actionValue === 'activate_selected') {
        const response = await updateAdminProductStatusBulk(accessToken, ids, true); // true برای فعال کردن
        responseDetail = response?.detail || `${ids.length.toLocaleString('fa-IR')} محصول با موفقیت فعال شدند.`;
      } else if (actionValue === 'deactivate_selected') {
        const response = await updateAdminProductStatusBulk(accessToken, ids, false); // false برای غیرفعال کردن
        responseDetail = response?.detail || `${ids.length.toLocaleString('fa-IR')} محصول با موفقیت غیرفعال شدند.`;
      }

      alert(responseDetail); // نمایش پیام موفقیت از بک‌اند یا یک پیام پیش‌فرض
      fetchProducts(currentPage, searchTerm, categoryFilter, statusFilter); // رفرش لیست محصولات
      setSelectedProductIds(new Set()); // پاک کردن آیتم‌های انتخاب شده
    } catch (err: any) {
      console.error(`Error performing bulk action "${actionValue}":`, err);
      const errorMessage = err.detail || err.message || `خطا در ${actionLabel} گروهی محصولات.`;
      setError(errorMessage); // یا نمایش با alert(errorMessage);
      alert(errorMessage); // برای نمایش سریع خطا
    } finally {
      setBulkActionLoading(false);
    }
  };
  const fetchProducts = useCallback(async (page: number, search: string, category: string, status: string) => {
    if (!accessToken) { /* ... */ return; }
    setLoading(true);
    setError(null);
    try {
      const params: GetAdminApiParams & { category?: string, status_param?: string } = { // status_param برای جلوگیری از تداخل با فیلد status مدل
        limit: ITEMS_PER_PAGE,
        offset: (page - 1) * ITEMS_PER_PAGE,
        ordering: '-created_at', // یا هر مرتب‌سازی پیش‌فرض
      };
      if (search) params.search = search;
      if (category) params.category = category; // بک‌اند باید فیلتر بر اساس category_id را پشتیبانی کند
      if (status) {
        if (status === 'active') params.is_active = true;
        else if (status === 'inactive') params.is_active = false;
        // else if (status === 'draft') params.status_param = 'DRAFT'; // اگر مدل Product فیلد status دارد
      }

      const data = await getAdminProducts(accessToken, params); // تابع API محصولات

      if (data && typeof data === 'object' && 'results' in data) {
        const paginatedData = data as PaginatedResponse<Product>;
        setProducts(paginatedData.results);
        setTotalItems(paginatedData.count);
        setNextPageUrl(paginatedData.next);
        setPrevPageUrl(paginatedData.previous);
      } else if (Array.isArray(data)) {
        setProducts(data);
        setTotalItems(data.length);
      } else {
        setProducts([]);
        setTotalItems(0);
      }
    } catch (err: any) { /* ... */ } finally { setLoading(false); }
  }, [accessToken]);

  useEffect(() => {
    fetchProducts(currentPage, searchTerm, categoryFilter, statusFilter);
  }, [currentPage, searchTerm, categoryFilter, statusFilter, fetchProducts]);

  const handlePageChange = (newPage: number) => setCurrentPage(newPage);
  const handleEditProduct = (product: Product) => navigate(`/admin/products/edit/${product.id}`); // یا product.slug

  const handleDeleteProduct = async (product: Product) => {
    if (window.confirm(`آیا از حذف محصول "${product.name}" اطمینان دارید؟`)) {
      if (!accessToken) return;
      try {
        // await deleteAdminProduct(accessToken, product.id); // تابع حذف تکی (اگر دارید)
        // یا از تابع حذف گروهی با یک ID استفاده کنید
        await deleteAdminProductsBulk(accessToken, [product.id]);
        alert("محصول با موفقیت حذف شد.");
        fetchProducts(currentPage, searchTerm, categoryFilter, statusFilter);
      } catch (err: any) {
        setError("خطا در حذف محصول: " + (err.message || ""));
      }
    }
  };
  const handleToggleActiveProduct = async (product: Product) => {
    if (!accessToken) return;
    try {
      // await updateAdminProduct(accessToken, product.id, { is_active: !product.is_active }); // تابع آپدیت تکی
      // یا از تابع آپدیت وضعیت گروهی با یک ID استفاده کنید
      await updateAdminProductStatusBulk(accessToken, [product.id], !product.is_active);
      alert(`وضعیت محصول "${product.name}" با موفقیت تغییر کرد.`);
      fetchProducts(currentPage, searchTerm, categoryFilter, statusFilter);
    } catch (err: any) {
      setError("خطا در تغییر وضعیت محصول: " + (err.message || ""));
    }
  };

  const handleSelectRow = (productId: number | string, isSelected: boolean) => {
    setSelectedProductIds(prevSelected => {
      const newSelected = new Set(prevSelected);
      if (isSelected) {
        newSelected.add(productId);
      } else {
        newSelected.delete(productId);
      }
      return newSelected;
    });
  };

  const handleSelectAllRows = (isSelected: boolean) => {
    if (isSelected) {
      setSelectedProductIds(new Set(products.map(p => p.id)));
    } else {
      setSelectedProductIds(new Set());
    }
  };

  // TODO: تابع برای اعمال عملیات گروهی
  const handleBulkAction = (action: string) => {
    if (selectedProductIds.size === 0) {
      alert("هیچ محصولی انتخاب نشده است.");
      return;
    }
    console.log(`Applying action "${action}" to products:`, Array.from(selectedProductIds));
    // بسته به action، تابع API مربوطه را فراخوانی کنید
    // سپس fetchProducts و setSelectedProductIds(new Set())
  };


  const getStatusClasses = (statusValue?: boolean | string): string => { // وضعیت می‌تواند is_active (boolean) یا یک رشته (draft) باشد
    if (statusValue === true || statusValue === 'active') return 'status-active'; // از CSS شما یا معادل Tailwind
    if (statusValue === false || statusValue === 'inactive') return 'status-inactive';
    if (statusValue === 'draft') return 'status-draft';
    return 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200'; // پیش‌فرض
  };

  const columns: TableColumn<Product>[] = [
    {
      header: 'تصویر',
      accessor: 'image', // فرض بر اینکه Product.image یک URL است
      render: (product) => (
        <div className="w-10 h-10 rounded-md overflow-hidden bg-gray-100 dark:bg-slate-700 flex items-center justify-center">
          {product.image ? (
            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <FontAwesomeIcon icon={faBirthdayCake} className="text-gray-300 dark:text-slate-500" />
          )}
        </div>
      ),
      cellClassName: "px-6 py-4 whitespace-nowrap", // از HTML شما
      headerClassName: "px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider",
    },
    {
      header: 'نام کیک',
      accessor: 'name',
      render: (product) => (
        <div>
          <span
            onClick={() => handleEditProduct(product)}
            className="text-sm font-medium text-gray-900 dark:text-gray-100 hover:text-amber-600 dark:hover:text-amber-400 cursor-pointer"
          >
            {product.name}
          </span>
          {product.slug && <div className="text-xs text-gray-500 dark:text-gray-400">{product.slug}</div>}
        </div>
      ),
      cellClassName: "px-6 py-4 whitespace-nowrap",
      headerClassName: "px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider",
    },
    {
      header: 'دسته‌بندی',
      accessor: 'category.name', // فرض: product.category یک آبجکت با فیلد name است
      render: (product) => <span className="text-sm text-gray-500 dark:text-gray-400">{product.category?.name || '-'}</span>,
      cellClassName: "px-6 py-4 whitespace-nowrap",
      headerClassName: "px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider",
    },
    {
      header: 'قیمت',
      accessor: 'base_price', // یا price
      render: (product) => <span className="text-sm text-gray-700 dark:text-gray-200">{parseFloat(String(product.base_price)).toLocaleString('fa-IR')} تومان</span>,
      cellClassName: "px-6 py-4 whitespace-nowrap",
      headerClassName: "px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider",
    },
    {
      header: 'وضعیت',
      accessor: 'is_active', // یا فیلد status اگر دارید
      render: (product) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusClasses(product.is_active /* یا product.status */)}`}>
          {product.is_active ? 'فعال' : 'غیرفعال'} {/* یا product.status_display */}
        </span>
      ),
      cellClassName: "px-6 py-4 whitespace-nowrap",
      headerClassName: "px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider",
    },
    {
      header: 'تاریخ ایجاد',
      accessor: 'created_at',
      render: (product) => <span className="text-sm text-gray-500 dark:text-gray-400">{product.created_at ? new Date(product.created_at).toLocaleDateString('fa-IR') : '-'}</span>,
      cellClassName: "px-6 py-4 whitespace-nowrap",
      headerClassName: "px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider",
    },
  ];

  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  // داده‌های فیلتر برای AdminPageLayout
  const filterOptionsForLayout = [
    {
      label: "دسته‌بندی",
      options: [
        { value: "", label: "همه دسته‌بندی‌ها" },
        ...categoriesForFilter.map(cat => ({ value: String(cat.id), label: cat.name }))
      ],
      currentValue: categoryFilter,
      onFilterChange: setCategoryFilter,
    },
    {
      label: "وضعیت",
      options: productStatusOptions,
      currentValue: statusFilter,
      onFilterChange: setStatusFilter,
    },
  ];

  return (
    <AdminPageLayout
      pageTitle="مدیریت کیک‌ها"
      onAddNewClick={() => navigate('/admin/products/new')}
      showExportButton={true}
      onExportClick={() => console.log("Exporting products...")} // TODO: پیاده‌سازی
      onSearchChange={setSearchTerm}
      searchPlaceholder="جستجو در نام کیک، اسلاگ..."
      filterSections={filterOptionsForLayout}
      onApplyFiltersClick={() => fetchProducts(1, searchTerm, categoryFilter, statusFilter)} // دکمه اعمال فیلتر از HTML شما
    >
      {loading && <div className="text-center py-10 text-gray-500 dark:text-gray-400">در حال بارگذاری محصولات...</div>}
      {!loading && error && <div className="text-center py-10 text-red-500 dark:text-red-400">خطا: {error}</div>}

      {!loading && !error && products.length === 0 && (
        <EmptyState
          icon={faBirthdayCake}
          title="هنوز هیچ کیکی ثبت نشده است"
          message="برای شروع می‌توانید یک کیک جدید به فروشگاه اضافه کنید."
          actionButtonText="افزودن کیک جدید"
          onActionButtonClick={() => navigate('/admin/products/new')}
          actionButtonIcon={faPlus}
        />
      )}

      {!loading && !error && products.length > 0 && (
        <>
          {selectedProductIds.size > 0 && (
            <BulkActionsToolbar
              selectedCount={selectedProductIds.size}
              onActionSelect={handleBulkProductAction}
              actionOptions={[
                { value: 'activate_selected', label: 'فعال کردن انتخاب شده‌ها' },   // <--- تغییر به activate_selected
                { value: 'deactivate_selected', label: 'غیرفعال کردن انتخاب شده‌ها' }, // <--- تغییر به deactivate_selected
                { value: 'delete_selected', label: 'حذف انتخاب شده‌ها' },       // <--- تغییر به delete_selected
              ]}
            />
          )}

          <AdminDataTable<Product>
            columns={columns}
            data={products}
            onEditClick={handleEditProduct}
            onDeleteClick={handleDeleteProduct}
            // onToggleActiveClick در ستون وضعیت هندل شده
            getItemId={(product) => product.id} // یا product.slug اگر ID اصلی است
            selectableRows={true}
            selectedRows={selectedProductIds}
            onRowSelect={handleSelectRow}
            onSelectAllRows={handleSelectAllRows}
          />
          {totalPages > 1 && (
            <div className="bg-white dark:bg-slate-800 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-slate-700 sm:px-6 mt-4 rounded-b-lg">
              <div className="flex-1 flex justify-between sm:hidden">
                <button onClick={() => handlePageChange(currentPage - 1)} disabled={!prevPageUrl} className="btn-pagination">قبلی</button>
                <button onClick={() => handlePageChange(currentPage + 1)} disabled={!nextPageUrl} className="btn-pagination">بعدی</button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    نمایش
                    <span className="font-medium mx-1">{(totalItems > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0).toLocaleString('fa-IR')}</span>
                    تا
                    <span className="font-medium mx-1">{Math.min(currentPage * ITEMS_PER_PAGE, totalItems).toLocaleString('fa-IR')}</span>
                    از
                    <span className="font-medium mx-1">{totalItems.toLocaleString('fa-IR')}</span>
                    نتیجه
                  </p>
                </div>
                <PaginationControls
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                  hasNextPage={!!nextPageUrl}
                  hasPrevPage={!!prevPageUrl}
                />
              </div>
            </div>
          )}
        </>
      )}
    </AdminPageLayout>
  );
};
// placeholder برای کلاس‌های دکمه pagination (باید در CSS تعریف شوند)
// .btn-pagination { @apply relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-slate-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50; }

export default AdminProductListPage;