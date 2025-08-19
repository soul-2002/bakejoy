// src/pages/admin/AdminOrderListPage.tsx
import React, { useEffect, useState, useCallback, useMemo } from 'react'; // useMemo اضافه شد
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faShoppingBag, faClock, faCheckCircle, faTimesCircle, faSearch,
  faChevronDown, faFilter, faDownload, faPrint, faEye, faRedo,
  faChevronLeft, faChevronRight, faUserCircle, faFilePdf, faSpinner
} from '@fortawesome/free-solid-svg-icons';
import StatCard from '../../../components/admin/dashboard/StatCard'; // مسیر را در صورت نیاز تنظیم کنید

import { useAuth } from '../../../contexts/AuthContext';
// فرض می‌کنیم توابعی برای دریافت آمار و همچنین ارسال پارامترهای فیلتر به getAdminOrders دارید
import { bulkSoftDeleteOrdersApi, downloadAdminOrdersPDF, getAdminOrders, GetAdminOrdersParams, getAdminDashboardStats, downloadAdminOrdersCSV, bulkUpdateOrderStatusApi } from '../../../services/api';
import { Order, PaginationControlsProps, User, AdminDashboardStats } from '../../../types'; // User را هم اضافه کنید اگر ساختار user در Order مشخص است
import BulkActionsBar, { BulkActionItem } from '../../../components/admin/common/BulkActionsBar'; // مسیر صحیح را وارد کنید
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Button from '@mui/material/Button'; // دکمه MUI
import Select, { SelectChangeEvent } from '@mui/material/Select'; // Select از MUI
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel'
// import '../../styles/AdminOrderListPage.css'; // اگر فایل CSS سفارشی دارید

// --- Helper function for status styling ---
// این تابع را می‌توانید در همین فایل یا یک فایل utils تعریف کنید
export const getStatusStyles = (statusKey?: string): string => {
  if (!statusKey) return 'bg-gray-100 text-gray-700 dark:bg-gray-700/30 dark:text-gray-400';
  switch (statusKey.toUpperCase()) { // با حروف بزرگ مقایسه کنید تا حساسیت به کوچکی و بزرگی حروف کمتر شود
    case 'DELIVERED':
      return 'bg-green-100 text-green-700 dark:bg-green-700/30 dark:text-green-400';
    case 'PROCESSING':
      return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-700/30 dark:text-yellow-400';
    case 'PENDING_PAYMENT':
      return 'bg-orange-100 text-orange-700 dark:bg-orange-700/30 dark:text-orange-400';
    case 'CANCELLED':
    case 'PAYMENT_FAILED': // وضعیت شکست پرداخت را هم می‌توان قرمز نشان داد
      return 'bg-red-100 text-red-700 dark:bg-red-700/30 dark:text-red-400';
    case 'SHIPPED':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-700/30 dark:text-blue-400';
    case 'CART':
      return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-700/30 dark:text-indigo-400'; // مثالی برای وضعیت سبد خرید
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-700/30 dark:text-gray-400';
  }
};

interface PaymentStatusInfo {
  text: string;
  className: string;
}

interface StatCardData {
  id: string; // یک شناسه برای key در حلقه map
  title: string;
  value: string | number;
  unit?: string;
  icon: IconProp;
  iconBgColor: string;
  iconTextColor: string;
  percentageChange?: number;
  changePeriod?: string;
  loading?: boolean; // اگر می‌خواهید هر کارت به صورت جداگانه loading داشته باشد
}
const getPaymentStatusDisplayInfo = (
  transactions?: TransactionInterface[] | null,
  orderStatus?: string // وضعیت کلی سفارش، مانند Order.OrderStatusChoices.PENDING_PAYMENT
): PaymentStatusInfo => {
  if (transactions && transactions.length > 0) {
    const hasSuccessfulTransaction = transactions.some(t => t.status?.toUpperCase() === 'SUCCESS');
    if (hasSuccessfulTransaction) {
      return { text: 'موفق', className: 'bg-green-100 text-green-700 dark:bg-green-700/30 dark:text-green-400' };
    }

    const hasPendingTransaction = transactions.some(t => t.status?.toUpperCase() === 'PENDING');
    if (hasPendingTransaction) {
      return { text: 'در انتظار تایید درگاه', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-700/30 dark:text-yellow-400' };
    }

    // اگر تراکنشی وجود دارد اما هیچکدام موفق یا در انتظار نیستند، پس ناموفق بوده
    return { text: 'ناموفق', className: 'bg-red-100 text-red-700 dark:bg-red-700/30 dark:text-red-400' };
  }

  // اگر تراکنشی وجود ندارد، بر اساس وضعیت خود سفارش تصمیم می‌گیریم
  // این بخش نیاز به تطبیق با منطق کسب‌وکار شما دارد
  if (orderStatus?.toUpperCase() === 'PENDING_PAYMENT') {
    return { text: 'در انتظار پرداخت', className: 'bg-orange-100 text-orange-700 dark:bg-orange-700/30 dark:text-orange-400' };
  }
  if (orderStatus?.toUpperCase() === 'CANCELLED' || orderStatus?.toUpperCase() === 'PAYMENT_FAILED') {
    return { text: 'پرداخت نشده/لغو', className: 'bg-red-100 text-red-700 dark:bg-red-700/30 dark:text-red-400' };
  }
  // برای وضعیت‌هایی مانند تحویل شده یا در حال پردازش که باید پرداخت موفق داشته باشند
  // اما تراکنشی ثبت نشده (مثلاً پرداخت در محل یا خطای سیستمی)
  if (orderStatus && ['DELIVERED', 'PROCESSING', 'SHIPPED'].includes(orderStatus.toUpperCase())) {
    // اگر سفارش در این مراحل است، باید پرداخت موفق بوده باشد. 
    // اگر تراکنش موفق نیست، ممکن است پرداخت نقدی یا نوع دیگری باشد.
    // یا شاید بخواهیم اینجا هم "نامشخص" نمایش دهیم اگر تراکنش نداریم.
    // فعلا یک استایل موفق برای این حالت‌ها در نظر می‌گیریم، اما این را بررسی کنید.
    return { text: 'پرداخت شده (احتمالی)', className: 'bg-green-100 text-green-700 dark:bg-green-700/30 dark:text-green-400' };
  }

  return { text: 'نامشخص', className: 'bg-gray-100 text-gray-700 dark:bg-gray-700/30 dark:text-gray-400' };
};

const PaginationControls: React.FC<PaginationControlsProps> = ({ currentPage, totalPages, onPageChange, hasNextPage, hasPrevPage }) => {
  const pageNumbers = useMemo(() => {
    const pages = [];
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }, [currentPage, totalPages]);

  if (totalPages <= 1) return null;

  return (
    <div className="flex space-x-1 space-x-reverse">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={!hasPrevPage}
        className="px-3 py-1 border border-gray-300 dark:border-slate-600 rounded text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <FontAwesomeIcon icon={faChevronRight} />
      </button>
      {pageNumbers[0] > 1 && (
        <>
          <button onClick={() => onPageChange(1)} className="px-3 py-1 border border-gray-300 dark:border-slate-600 rounded text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700">1</button>
          {pageNumbers[0] > 2 && <span className="px-3 py-1 text-gray-600 dark:text-gray-300">...</span>}
        </>
      )}
      {pageNumbers.map(number => (
        <button
          key={number}
          onClick={() => onPageChange(number)}
          className={`px-3 py-1 border rounded ${currentPage === number ? 'border-amber-500 bg-amber-500 text-white' : 'border-gray-300 dark:border-slate-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'}`}
        >
          {number.toLocaleString('fa-IR')}
        </button>
      ))}
      {pageNumbers[pageNumbers.length - 1] < totalPages && (
        <>
          {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && <span className="px-3 py-1 text-gray-600 dark:text-gray-300">...</span>}
          <button onClick={() => onPageChange(totalPages)} className="px-3 py-1 border border-gray-300 dark:border-slate-600 rounded text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700">{totalPages.toLocaleString('fa-IR')}</button>
        </>
      )}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={!hasNextPage}
        className="px-3 py-1 border border-gray-300 dark:border-slate-600 rounded text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <FontAwesomeIcon icon={faChevronLeft} />
      </button>
    </div>
  );
};

const AdminOrderListPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalOrdersCount, setTotalOrdersCount] = useState(0);
  const [nextPageUrl, setNextPageUrl] = useState<string | null>(null);
  const [prevPageUrl, setPrevPageUrl] = useState<string | null>(null);

  // --- State برای فیلترها ---
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState(''); // مقدار اولیه: بدون فیلتر وضعیت
  const [selectedDateOption, setSelectedDateOption] = useState(''); // مقدار اولیه: بدون فیلتر تاریخ

  const [isDownloadingCsv, setIsDownloadingCsv] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  // --- State برای آمار داشبورد ---
  const [dashboardStatsCards, setDashboardStatsCards] = useState<StatCardData[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);

  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<number>>(new Set()); // استفاده از Set برای مدیریت آسان‌تر ID های یکتا
  const [isChangeStatusModalOpen, setIsChangeStatusModalOpen] = useState(false);
  const [statusToApplyForBulk, setStatusToApplyForBulk] = useState(''); // برای نگهداری مقدار وضعیت انتخابی در مودال
  const [isDeleteConfirmModalOpen, setIsDeleteConfirmModalOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false); // <--- وضعیت لودینگ برای عملیات حذف گروهی



  const { accessToken } = useAuth();
  const navigate = useNavigate();
  const handleClearSelection = () => {
    setSelectedOrderIds(new Set());
  };
  const [isBulkUpdatingStatus, setIsBulkUpdatingStatus] = useState(false); // <--- وضعیت لودینگ برای عملیات گروهی

  const openDeleteConfirmModal = () => {
    if (selectedOrderIds.size === 0) {
      alert("هیچ سفارشی برای حذف انتخاب نشده است.");
      return;
    }
    setIsDeleteConfirmModalOpen(true);
  };

  const handleCloseDeleteConfirmModal = () => {
    setIsDeleteConfirmModalOpen(false);
  };

  const handleConfirmBulkDelete = async () => {
  if (selectedOrderIds.size === 0) {
    alert("هیچ سفارشی برای حذف انتخاب نشده است.");
    return;
  }
  if (!accessToken) {
    alert("لطفا ابتدا وارد شوید.");
    return;
  }

  const idsToDelete = Array.from(selectedOrderIds);
  console.log(`Attempting to soft delete orders with IDs:`, idsToDelete);

  setIsBulkDeleting(true); // شروع لودینگ
  // setError(null); // اگر state خطای عمومی دارید، آن را پاک کنید

  try {
    const response = await bulkSoftDeleteOrdersApi(accessToken, idsToDelete);

    // نمایش پیام موفقیت به کاربر
    alert(response.detail || `${response.deleted_count || idsToDelete.length} سفارش با موفقیت حذف (نرم) شدند.`);

    fetchOrders(currentPage); // بارگذاری مجدد لیست سفارشات (سفارشات حذف شده نباید نمایش داده شوند)
    handleClearSelection();   // پاک کردن آیتم‌های انتخاب شده
    handleCloseDeleteConfirmModal(); // بستن مودال تایید حذف

  } catch (error: any) {
    console.error("Error during bulk soft delete in component:", error);
    // setError(error.message || "خطا در هنگام حذف گروهی سفارشات رخ داد.");
    alert(`خطا: ${error.message || "خطا در هنگام حذف گروهی سفارشات رخ داد."}`);
    // می‌توانید مودال را باز نگه دارید یا ببندید، بسته به تجربه کاربری مورد نظر
    // handleCloseDeleteConfirmModal(); 
  } finally {
    setIsBulkDeleting(false); // پایان لودینگ
  }
};

// همچنین، دکمه "حذف انتخاب شده‌ها" در bulkActionsList و دکمه تایید در مودال را برای نمایش حالت لودینگ به‌روز کنید:

// ۱. در تعریف bulkActionsList:
// const bulkActionsList: BulkActionItem[] = useMemo(() => [
//   // ... اکشن تغییر وضعیت ...
//   {
//     id: 'delete-selected',
//     label: isBulkDeleting ? 'در حال حذف...' : 'حذف انتخاب شده‌ها',
//     icon: isBulkDeleting ? faSpinner : faTimesCircle, // از faSpinner برای لودینگ استفاده کنید
//     onClick: openDeleteConfirmModal,
//     variant: 'danger',
//     disabled: selectedOrderIds.size === 0 || isBulkDeleting || isBulkUpdatingStatus, // هنگام سایر عملیات هم غیرفعال باشد
//   },
// ], [selectedOrderIds, isBulkUpdatingStatus, isBulkDeleting, openChangeStatusModal, openDeleteConfirmModal]); 
// isBulkDeleting را به وابستگی‌ها اضافه کنید

// ۲. در دکمه "بله، حذف کن" داخل مودال Dialog تایید حذف:
// <Button 
//   onClick={handleConfirmBulkDelete} 
//   variant="contained" 
//   color="error"
//   disabled={isBulkDeleting} 
// >
//   {isBulkDeleting ? <FontAwesomeIcon icon={faSpinner} spin /> : 'بله، حذف کن'}
// </Button>

  const handleCloseChangeStatusModal = () => {
    setIsChangeStatusModalOpen(false);
  };
  const openChangeStatusModal = () => {
    if (selectedOrderIds.size === 0) {
      alert("هیچ سفارشی برای تغییر وضعیت انتخاب نشده است."); // یا یک پیام بهتر با استفاده از notification
      return;
    }
    setStatusToApplyForBulk(''); // ریست کردن وضعیت انتخابی قبلی
    setIsChangeStatusModalOpen(true);
  };

  const handleConfirmBulkStatusChange = async () => {
    if (!statusToApplyForBulk) {
      alert("لطفاً یک وضعیت جدید برای اعمال انتخاب کنید.");
      return;
    }
    if (selectedOrderIds.size === 0) {
      alert("هیچ سفارشی انتخاب نشده است.");
      return;
    }
    if (!accessToken) {
      alert("لطفا ابتدا وارد شوید.");
      // setError("برای این عملیات، لطفا ابتدا وارد شوید."); // اگر state خطا دارید
      return;
    }

    const idsToUpdate = Array.from(selectedOrderIds);
    console.log(`درخواست تغییر وضعیت به '${statusToApplyForBulk}' برای سفارشات با ID:`, idsToUpdate);

    setIsBulkUpdatingStatus(true); // شروع لودینگ
    // setError(null); // اگر state خطای عمومی دارید، پاکش کنید

    try {
      const response = await bulkUpdateOrderStatusApi(accessToken, idsToUpdate, statusToApplyForBulk);

      // نمایش پیام موفقیت به کاربر (می‌توانید از یک سیستم notification بهتر استفاده کنید)
      alert(response.detail || `${response.updated_count || idsToUpdate.length} سفارش با موفقیت به‌روز شد.`);

      fetchOrders(currentPage); // بارگذاری مجدد لیست سفارشات برای نمایش تغییرات
      handleClearSelection();   // پاک کردن آیتم‌های انتخاب شده
      handleCloseChangeStatusModal(); // بستن مودال

    } catch (error: any) {
      console.error("Error during bulk status update in component:", error);
      // setError(error.message || "خطا در هنگام به‌روزرسانی گروهی وضعیت‌ها رخ داد.");
      alert(`خطا: ${error.message || "خطا در هنگام به‌روزرسانی گروهی وضعیت‌ها رخ داد."}`);
      // مودال را می‌توانید باز نگه دارید یا ببندید
      // handleCloseChangeStatusModal(); 
    } finally {
      setIsBulkUpdatingStatus(false); // پایان لودینگ
    }
  };
  // تعریف اکشن‌های چندتایی
  // توابع onClick فعلاً فقط console.log می‌زنند. بعداً آن‌ها را پیاده‌سازی می‌کنیم.
  const bulkActionsList: BulkActionItem[] = useMemo(() => [
    {
      id: 'change-status',
      label: 'تغییر وضعیت',
      icon: faClock, // آیکون مثال، می‌توانید تغییر دهید
      onClick: openChangeStatusModal, // <--- اتصال به تابع باز کردن مودال
      variant: 'primary',
      disabled: selectedOrderIds.size === 0,
    },
    {
      id: 'delete-selected',
      label: 'حذف انتخاب شده‌ها', // می‌توانید state لودینگ مشابهی هم برای این دکمه بگذارید
      icon: faTimesCircle, // آیکون مناسب برای حذف
      onClick: openDeleteConfirmModal, // <--- اتصال به تابع باز کردن مودال تایید حذف
      variant: 'danger', // استفاده از variant قرمز برای عملیات خطرناک
      disabled: selectedOrderIds.size === 0, // یا هنگام لودینگ عملیات دیگر
    },
    // می‌توانید اکشن‌های دیگری اضافه کنید
  ], [selectedOrderIds, isBulkUpdatingStatus, openChangeStatusModal, openDeleteConfirmModal]);
  const handleSelectOrder = (isSelected: boolean, orderId: number) => {
    setSelectedOrderIds(prevSelectedIds => {
      const newSelectedIds = new Set(prevSelectedIds);
      if (isSelected) {
        newSelectedIds.add(orderId);
      } else {
        newSelectedIds.delete(orderId);
      }
      return newSelectedIds;
    });
  };

  // برای تعیین وضعیت چک‌باکس "انتخاب همه"
  const isAllCurrentPageSelected = useMemo(() => {
    if (orders.length === 0) return false;
    return orders.every(order => order.id !== null && selectedOrderIds.has(order.id as number));
  }, [orders, selectedOrderIds]);

  // تابع برای انتخاب/عدم انتخاب همه سفارشات صفحه فعلی
  const handleSelectAllClick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isSelected = e.target.checked;
    setSelectedOrderIds(prevSelectedIds => {
      const newSelectedIds = new Set(prevSelectedIds); // از انتخاب‌های قبلی کپی بگیر
      orders.forEach(order => {
        if (order.id !== null) {
          if (isSelected) {
            newSelectedIds.add(order.id as number);
          } else {
            // فقط اگر این آیتم قبلا در Set بوده و متعلق به صفحه فعلی است، حذفش کن
            // این منطق برای deselect all آیتم‌های صفحه فعلی است
            if (orders.find(o => o.id === order.id) && prevSelectedIds.has(order.id as number)) {
              newSelectedIds.delete(order.id as number);
            }
          }
        }
      });
      // اگر می‌خواهید با برداشتن تیک "انتخاب همه"، *تمام* انتخاب‌ها در همه صفحات پاک شوند:
      // if (!isSelected) {
      //   return new Set(); // یک Set خالی برمی‌گرداند
      // }
      return newSelectedIds;
    });
  };
  const fetchOrders = useCallback(async (pageToFetch: number) => {
    if (!accessToken) {
      setError("برای دسترسی به این بخش، لطفا وارد شوید.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    const params: GetAdminOrdersParams = {
      limit: itemsPerPage,
      offset: (pageToFetch - 1) * itemsPerPage,
      ordering: '-created_at',
      search: searchTerm || undefined,         // خواندن از state
      status: selectedStatus || undefined,     // خواندن از state
      date_filter: selectedDateOption || undefined, // خواندن از state
    };

    Object.keys(params).forEach(key => {
      if ((params as any)[key] === undefined) {
        delete (params as any)[key];
      }
    });

    console.log(`Workspaceing orders for admin - Page: ${pageToFetch}, Params:`, params);

    try {
      const data = await getAdminOrders(accessToken, params);
      if (data && typeof data === 'object' && 'results' in data) {
        const paginatedData = data as PaginatedResponse<Order>;
        setOrders(paginatedData.results);
        setTotalOrdersCount(paginatedData.count);
        setNextPageUrl(paginatedData.next);
        setPrevPageUrl(paginatedData.previous);
      } else {
        console.warn("AdminOrderListPage: Received unexpected data format", data);
        setError("فرمت داده‌های دریافتی برای سفارشات نامعتبر است.");
        setOrders([]); setTotalOrdersCount(0);
      }
    } catch (err: any) {
      console.error("Error fetching admin orders:", err);
      setError(err.response?.data?.detail || "خطا در دریافت لیست سفارشات.");
    } finally {
      setLoading(false);
    }
  }, [accessToken, itemsPerPage, searchTerm, selectedStatus, selectedDateOption]); // وابستگی‌ها اضافه شد

  useEffect(() => {
    fetchOrders(currentPage);
  }, [currentPage, fetchOrders]); // fetchOrders خودش شامل وابستگی‌های فیلتر است

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };
  const handleDownloadCSV = async () => {
    if (!accessToken) {
      alert("لطفا ابتدا وارد شوید."); // یا نمایش یک پیام مناسب
      return;
    }
    setIsDownloadingCsv(true);
    setError(null); // پاک کردن خطاهای قبلی (اگر دارید)

    const currentParams: GetAdminOrdersParams = {
      search: searchTerm || undefined,
      status: selectedStatus || undefined,
      date_filter: selectedDateOption || undefined,
      ordering: '-created_at', // یا هر مرتب‌سازی دیگری که در لیست استفاده می‌کنید
      // توجه: limit و offset برای دانلود CSV معمولاً لازم نیست چون می‌خواهید همه نتایج فیلتر شده را بگیرید
      // بک‌اند شما در اکشن export_csv باید تمام نتایج فیلتر شده را برگرداند، نه فقط یک صفحه.
      // اگر بک‌اند شما همچنان از limit/offset برای این اکشن استفاده می‌کند، باید آن‌ها را هم ارسال کنید
      // یا یک پارامتر برای "دانلود همه" به API اضافه کنید.
      // فعلاً فرض می‌کنیم بک‌اند همه نتایج فیلتر شده را برای CSV برمی‌گرداند.
    };
    // حذف کلیدهایی که مقدارشان undefined است
    Object.keys(currentParams).forEach(key => {
      if ((currentParams as any)[key] === undefined) {
        delete (currentParams as any)[key];
      }
    });


    try {
      const blob = await downloadAdminOrdersCSV(accessToken, currentParams);

      // ایجاد یک URL موقت برای Blob و تریگر کردن دانلود در مرورگر
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const filename = `orders_export_${new Date().toISOString().slice(0, 10)}.csv`; // نام فایل با تاریخ امروز
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link); // حذف لینک پس از دانلود
      window.URL.revokeObjectURL(url); // آزاد کردن URL

    } catch (err: any) {
      console.error("Error downloading CSV:", err);
      setError(err.message || "خطا در دانلود فایل CSV.");
      // می‌توانید پیام خطا را به کاربر نمایش دهید
    } finally {
      setIsDownloadingCsv(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!accessToken) {
      // اگر از سیستم مدیریت خطای بهتری استفاده می‌کنید، آن را جایگزین alert کنید
      alert("لطفا ابتدا وارد شوید تا بتوانید PDF را دانلود کنید.");
      setError("برای دانلود PDF، لطفا ابتدا وارد شوید."); // به‌روزرسانی state خطا
      return;
    }

    setIsDownloadingPdf(true); // شروع حالت لودینگ
    setError(null); // پاک کردن خطاهای قبلی

    // جمع‌آوری پارامترهای فیلتر فعلی
    // این پارامترها باید با چیزی که بک‌اند شما برای فیلتر کردن PDF انتظار دارد، مطابقت داشته باشد.
    // معمولاً همان پارامترهایی هستند که برای فیلتر کردن لیست اصلی سفارشات استفاده می‌کنید.
    const currentParams: GetAdminOrdersParams = {
      search: searchTerm || undefined,
      status: selectedStatus || undefined,
      date_filter: selectedDateOption || undefined, // یا هر نامی که برای پارامتر فیلتر تاریخ در بک‌اند گذاشته‌اید
      ordering: '-created_at', // یا هر ترتیب پیش‌فرضی که استفاده می‌کنید

      // برای دانلود PDF، معمولاً تمام نتایج فیلتر شده را می‌خواهید، نه فقط یک صفحه.
      // بنابراین limit و offset را ارسال نمی‌کنیم، مگر اینکه بک‌اند شما به شکل دیگری پیاده‌سازی شده باشد.
      // فرض بر این است که اندپوینت export_pdf در بک‌اند، تمام نتایج فیلتر شده را برمی‌گرداند.
    };

    // حذف کلیدهایی از پارامترها که مقدارشان undefined است (برای تمیزتر بودن URL)
    Object.keys(currentParams).forEach(key => {
      if ((currentParams as any)[key] === undefined) {
        delete (currentParams as any)[key];
      }
    });

    try {
      const blob = await downloadAdminOrdersPDF(accessToken, currentParams);

      // ایجاد یک URL موقت برای Blob (فایل PDF)
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      // تنظیم نام فایل برای دانلود (می‌توانید تاریخ یا سایر اطلاعات را هم به نام اضافه کنید)
      const filename = `لیست_سفارشات_${new Date().toISOString().slice(0, 10).replace(/-/g, '_')}.pdf`;
      link.setAttribute('download', filename);

      // اضافه کردن لینک به بدنه صفحه، کلیک روی آن برای شروع دانلود، و سپس حذف لینک
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link); // حذف لینک از DOM

      // آزاد کردن URL موقت ایجاد شده
      window.URL.revokeObjectURL(url);

      console.log("فایل PDF با موفقیت برای دانلود آماده شد.");

    } catch (err: any) {
      console.error("خطا در هنگام دانلود فایل PDF:", err);
      setError(err.message || "خطا در دانلود فایل PDF. لطفاً دوباره امتحان کنید یا با پشتیبانی تماس بگیرید.");
      // می‌توانید پیام خطا را به کاربر با استفاده از یک notification یا alert نمایش دهید
    } finally {
      setIsDownloadingPdf(false); // پایان حالت لودینگ، چه موفقیت‌آمیز بود چه با خطا
    }
  };

  const handleFilterOrSearch = useCallback(() => {
    setCurrentPage(1); // فقط صفحه را به ۱ برگردان
  }, []);

  const totalPages = Math.ceil(totalOrdersCount / itemsPerPage);

  // مقادیر value در statusOptions باید با مقادیر کلیدی وضعیت در بک‌اند یکی باشند
  const statusOptions = [
    { label: 'همه وضعیت‌ها', value: '' },
    { label: 'در انتظار پرداخت', value: 'PENDING_PAYMENT' },
    { label: 'در حال پردازش', value: 'PROCESSING' },
    { label: 'ارسال شده', value: 'SHIPPED' },
    { label: 'تحویل داده شده', value: 'DELIVERED' },
    { label: 'لغو شده', value: 'CANCELLED' },
    { label: 'پرداخت ناموفق', value: 'PAYMENT_FAILED' },
  ];
  const dateOptions = [
    { label: 'همه تاریخ‌ها', value: '' },
    { label: 'امروز', value: 'today' },
    { label: '۷ روز گذشته', value: 'last_7_days' },
    { label: 'ماه جاری', value: 'this_month' },
    { label: 'ماه گذشته', value: 'last_month' },
    // می‌توانید گزینه‌های بیشتری اضافه کنید یا از یک Date Range Picker استفاده کنید
  ];

  useEffect(() => {
    const fetchDashboardStats = async () => {
      if (!accessToken) {
        // اگر توکن نبود، می‌توانیم خطایی تنظیم نکنیم یا یک پیام خاص برای آمار بگذاریم
        // چون بخش اصلی سفارشات ممکن است همچنان با ورود کاربر لود شود.
        // یا اینکه کل صفحه نیاز به احراز هویت داشته باشد.
        setStatsLoading(false);
        return;
      }
      setStatsLoading(true);
      setStatsError(null);
      try {
        const apiStats: AdminDashboardStats = await getAdminDashboardStats(accessToken);

        // فرض می‌کنیم تابع getAdminDashboardStats در api.ts تعریف شده
        // const apiStats: AdminDashboardStats = await getAdminDashboardStats(accessToken);
        const formattedStats: StatCardData[] = [
          {
            id: 'today_orders',
            title: 'سفارشات امروز',
            value: apiStats.todays_orders_count.toLocaleString('fa-IR'),
            unit: 'عدد', // واحد اختیاری
            icon: faShoppingBag,
            iconBgColor: 'bg-blue-100 dark:bg-blue-900/30', // کلاس‌های کامل Tailwind
            iconTextColor: 'text-blue-600 dark:text-blue-400'
          },
          {
            id: 'processing_orders',
            title: 'در حال پردازش',
            value: apiStats.processing_orders_count.toLocaleString('fa-IR'),
            unit: 'عدد',
            icon: faClock,
            iconBgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
            iconTextColor: 'text-yellow-600 dark:text-yellow-400'
          },
          {
            id: 'delivered_orders',
            title: 'تحویل داده شده',
            value: apiStats.delivered_orders_count.toLocaleString('fa-IR'),
            unit: 'عدد',
            icon: faCheckCircle,
            iconBgColor: 'bg-green-100 dark:bg-green-900/30',
            iconTextColor: 'text-green-600 dark:text-green-400'
          },
          {
            id: 'cancelled_orders',
            title: 'لغو شده',
            value: apiStats.cancelled_orders_count.toLocaleString('fa-IR'),
            unit: 'عدد',
            icon: faTimesCircle,
            iconBgColor: 'bg-red-100 dark:bg-red-900/30',
            iconTextColor: 'text-red-600 dark:text-red-400'
          },
        ];
        setDashboardStatsCards(formattedStats);


      } catch (err: any) {
        setStatsError("خطا در دریافت آمار داشبورد: " + (err.response?.data?.detail || err.message));
        console.error("Error fetching dashboard stats:", err);
      } finally {
        setStatsLoading(false);
      }
    };

    fetchDashboardStats();
  }, [accessToken]); // فقط با تغییر توکن (معمولاً یکبار پس از لاگین) فراخوانی شود

  const firstItemNum = totalOrdersCount > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0;
  const lastItemNum = Math.min(currentPage * itemsPerPage, totalOrdersCount);


  return (
    <>
      {/* Stats Summary - TODO: اتصال به dashboardStats state */}
      {statsLoading && <div className="p-4 text-center text-gray-500 dark:text-gray-400">در حال بارگذاری آمار...</div>}
      {!statsLoading && statsError && <div className="p-4 text-center text-red-500 dark:text-red-400">خطا در آمار: {statsError}</div>}
      {!statsLoading && !statsError && dashboardStatsCards.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {dashboardStatsCards.map(stat => (
            <StatCard
              key={stat.id} // استفاده از یک id منحصر به فرد برای هر کارت
              title={stat.title}
              value={stat.value}
              unit={stat.unit}
              icon={stat.icon}
              iconBgColor={stat.iconBgColor}
              iconTextColor={stat.iconTextColor}
            // loading={stat.loading} // اگر می‌خواهید loading را برای هر کارت جداگانه مدیریت کنید
            // percentageChange={stat.percentageChange} // اگر این داده‌ها را از API می‌گیرید
            // changePeriod={stat.changePeriod}
            />
          ))}
        </div>
      )}
      {!statsLoading && !statsError && dashboardStatsCards.length === 0 && (
        <div className="p-4 text-center text-gray-500 dark:text-gray-400">داده‌ای برای آمار یافت نشد.</div>
      )}
      {!statsLoading && !statsError && dashboardStatsCards.length === 0 && (
        <div className="p-4 text-center text-gray-500 dark:text-gray-400">داده‌ای برای آمار یافت نشد.</div>
      )}


      {/* Filters and Search */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 mb-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div className="relative flex-1">
            <label htmlFor="order-search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">جستجو</label>
            <input
              type="text"
              id="order-search"
              placeholder="شماره سفارش، نام مشتری..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleFilterOrSearch()}
              className="w-full pr-10 pl-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-200"
            />
            <FontAwesomeIcon icon={faSearch} className="absolute right-3 top-9 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 md:items-end">
            <div className="relative">
              <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">وضعیت</label>
              <select
                id="status-filter"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="appearance-none w-full sm:w-auto bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-200 rounded-lg px-4 py-2 pr-8 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
              >
                {statusOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
              <FontAwesomeIcon icon={faChevronDown} className="absolute right-3 top-9 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none" />
            </div>
            {/* TODO: پیاده‌سازی فیلتر تاریخ */}
            <div className="relative">
              <label htmlFor="date-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">محدوده تاریخ</label>
              <select
                id="date-filter"
                value={selectedDateOption}
                onChange={(e) => setSelectedDateOption(e.target.value)}
                className="appearance-none w-full sm:w-auto bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-200 rounded-lg px-4 py-2 pr-8 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
              >
                {dateOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
              <FontAwesomeIcon icon={faChevronDown} className="absolute right-3 top-9 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none" />
            </div>
            <button
              onClick={handleFilterOrSearch}
              className="bg-amber-500 text-white px-4 py-2 rounded-lg hover:bg-amber-600 transition flex items-center justify-center sm:w-auto h-[42px]" // تنظیم ارتفاع
            >
              <FontAwesomeIcon icon={faFilter} className="ml-2" />
              <span>فیلتر</span>
            </button>

          </div>

        </div>
        <div className="mt-6"> {/* div والد برای اعمال margin */}
          <BulkActionsBar
            selectedCount={selectedOrderIds.size}
            actions={bulkActionsList}
            onClearSelection={handleClearSelection}
            entityName="سفارش"
          />
          <Dialog open={isChangeStatusModalOpen} onClose={handleCloseChangeStatusModal} fullWidth maxWidth="xs">
            <DialogTitle>تغییر وضعیت سفارشات انتخاب شده</DialogTitle>
            <DialogContent>
              <DialogContentText sx={{ mb: 2 }}> {/* اضافه کردن کمی فاصله پایینی */}
                شما در حال تغییر وضعیت برای {selectedOrderIds.size.toLocaleString('fa-IR')} سفارش هستید.
                لطفاً وضعیت جدید مورد نظر را انتخاب کنید:
              </DialogContentText>
              <FormControl fullWidth margin="dense"> {/* margin="dense" برای اندازه کوچکتر */}
                <InputLabel id="bulk-status-select-label">وضعیت جدید</InputLabel>
                <Select
                  labelId="bulk-status-select-label"
                  id="bulk-status-select"
                  value={statusToApplyForBulk}
                  label="وضعیت جدید"
                  onChange={(e: SelectChangeEvent<string>) => setStatusToApplyForBulk(e.target.value)}
                >
                  {/* گزینه‌های وضعیت را اینجا قرار دهید.
              می‌توانید از statusOptions که برای فیلترها استفاده کردید، بهره ببرید.
              فقط گزینه "همه وضعیت‌ها" را حذف کنید و شاید وضعیت CART.
            */}
                  {statusOptions
                    .filter(option => option.value !== '' && option.value !== 'CART') // حذف "همه" و "سبد خرید"
                    .map(option => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </DialogContent>
            <DialogActions sx={{ padding: '16px 24px' }}> {/* اضافه کردن padding */}
              <Button onClick={handleCloseChangeStatusModal} color="secondary">
                لغو
              </Button>
              <Button
                onClick={handleConfirmBulkStatusChange}
                variant="contained"
                color="primary"
                disabled={!statusToApplyForBulk} // غیرفعال کردن دکمه اگر وضعیتی انتخاب نشده
              >
                تایید و تغییر وضعیت
              </Button>
            </DialogActions>
          </Dialog>
          <Dialog
            open={isDeleteConfirmModalOpen}
            onClose={handleCloseDeleteConfirmModal}
            fullWidth
            maxWidth="xs"
          >
            <DialogTitle sx={{ color: 'error.main' }}> {/* استفاده از رنگ خطا MUI */}
              <FontAwesomeIcon icon={faTimesCircle} style={{ marginRight: '8px' }} />
              تایید حذف سفارشات
            </DialogTitle>
            <DialogContent>
              <DialogContentText>
                آیا از حذف {selectedOrderIds.size.toLocaleString('fa-IR')} سفارش انتخاب شده مطمئن هستید؟
                <br />
                <strong>این عملیات قابل بازگشت نیست.</strong>
              </DialogContentText>
            </DialogContent>
            <DialogActions sx={{ padding: '16px 24px' }}>
              <Button onClick={handleCloseDeleteConfirmModal} color="secondary">
                لغو
              </Button>
              <Button
                onClick={handleConfirmBulkDelete}
                variant="contained"
                color="error" // استفاده از رنگ خطا MUI برای دکمه تایید حذف
              // disabled={isBulkDeleting} // اگر state لودینگ برای حذف دارید
              >
                {/* {isBulkDeleting ? <FontAwesomeIcon icon={faSpinner} spin /> : 'بله، حذف کن'} */}
                بله، حذف کن
              </Button>
            </DialogActions>
          </Dialog>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center">
          <h2 className="font-semibold text-lg text-gray-700 dark:text-gray-200">لیست سفارشات</h2>

          <div className="flex space-x-2 space-x-reverse">
            {/* TODO: پیاده‌سازی دانلود و چاپ */}
            <button onClick={handleDownloadCSV} title="دانلود CSV" className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-2 rounded hover:bg-gray-100 dark:hover:bg-slate-700">
              {isDownloadingCsv ? 'در حال آماده‌سازی...' : <FontAwesomeIcon icon={faDownload} />}
            </button>
            <button
              title={isDownloadingPdf ? "در حال آماده‌سازی PDF..." : "ذخیره به صورت PDF"}
              onClick={handleDownloadPDF}
              disabled={isDownloadingPdf || loading} // غیرفعال کردن اگر در حال دانلود PDF یا بارگذاری کلی داده‌ها هستید
              className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 p-2 rounded hover:bg-red-100 dark:hover:bg-slate-700 transition-colors" // استایل مثال، می‌توانید تغییر دهید
            >
              {isDownloadingPdf ? (
                <FontAwesomeIcon icon={faSpinner} spin className="ml-2" /> // آیکون لودینگ
              ) : (
                <FontAwesomeIcon icon={faFilePdf} /> // آیکون PDF
              )}
              <span className="hidden sm:inline ml-2">
                {isDownloadingPdf ? 'در حال آماده‌سازی...' : 'PDF'}
              </span>
            </button>
          </div>
        </div>

        {loading && (
          <div className="text-center py-10 text-gray-500 dark:text-gray-400">در حال بارگذاری سفارشات...</div>
        )}
        {!loading && error && (
          <div className="text-center py-10 text-red-500 dark:text-red-400">خطا: {error}</div>
        )}
        {!loading && !error && orders.length === 0 && (
          <div className="empty-state text-center py-12">
            <FontAwesomeIcon icon={faShoppingBag} className="text-5xl text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">هیچ سفارشی یافت نشد</h3>
            <p className="text-gray-500 dark:text-gray-400 mt-1">با تغییر فیلترها دوباره امتحان کنید.</p>
            <button onClick={() => fetchOrders(1)} className="mt-4 bg-amber-500 text-white px-4 py-2 rounded-lg hover:bg-amber-600 transition flex items-center mx-auto">
              <FontAwesomeIcon icon={faRedo} className="ml-2" />
              <span>بارگذاری مجدد</span>
            </button>
          </div>
        )}
        {!loading && !error && orders.length > 0 && (
          <>
            <div className="responsive-table">
              <table className="w-full order-table">
                <thead className="bg-gray-50 dark:bg-slate-700">
                  <tr className="text-right text-sm text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-slate-600">
                    <th className="px-4 py-3"><input type="checkbox" className="rounded text-amber-500 focus:ring-amber-500 dark:bg-slate-900 dark:border-slate-600"
                      checked={isAllCurrentPageSelected}
                      onChange={handleSelectAllClick}
                      ref={el => {
                        if (el) {
                          el.indeterminate = selectedOrderIds.size > 0 && !isAllCurrentPageSelected && orders.some(order => order.id !== null && selectedOrderIds.has(order.id as number));
                        }
                      }} /></th>
                    <th className="px-4 py-3">شماره سفارش</th>
                    <th className="px-4 py-3">مشتری</th>
                    <th className="px-4 py-3 hidden md:table-cell">تاریخ</th>
                    <th className="px-4 py-3 hidden lg:table-cell">مبلغ</th>
                    <th className="px-4 py-3">وضعیت سفارش</th>
                    <th className="px-4 py-3 hidden sm:table-cell">وضعیت پرداخت</th>
                    <th className="px-4 py-3">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                  {orders.map(order => {
                    const userObject = (typeof order.user === 'object' && order.user !== null) ? order.user as User : null;
                    const avatarUrl = userObject?.avatar; // به جای userObject?.avatar_url
                    const userName = userObject?.username || (typeof order.user === 'number' || typeof order.user === 'string' ? String(order.user) : 'کاربر ناشناس');
                    const paymentInfo = getPaymentStatusDisplayInfo(order.transactions, order.status);
                    return (
                      <tr key={order.id} className="text-right hover:bg-gray-50 dark:hover:bg-slate-700/50 text-sm text-gray-700 dark:text-gray-300">
                        <td className="px-4 py-3"><input type="checkbox" className="rounded text-amber-500 focus:ring-amber-500 dark:bg-slate-900 dark:border-slate-600"
                          checked={order.id !== null && selectedOrderIds.has(order.id as number)}
                          onChange={(e) => {
                            if (order.id !== null) {
                              handleSelectOrder(e.target.checked, order.id as number);
                            }
                          }} /></td>
                        <td
                          onClick={() => navigate(`/admin/orders/${order.id}`)}
                          className="px-4 py-3 font-medium text-blue-600 dark:text-blue-400 cursor-pointer hover:underline whitespace-nowrap"
                        >
                          #{order.id}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center">
                            {/* TODO: نمایش آواتار کاربر واقعی */}

                            {avatarUrl ? (<img
                              src={avatarUrl}
                              alt={`آواتار ${userName}`}
                              className="w-8 h-8 rounded-full ml-3 object-cover border border-gray-200 dark:border-gray-600"
                            />
                            ) : (
                              // اگر URL آواتار وجود ندارد، آیکون پیش‌فرض را نمایش بده
                              <div className="w-8 h-8 rounded-full ml-3 bg-gray-200 dark:bg-slate-700 text-gray-500 dark:text-gray-400 flex items-center justify-center border border-gray-300 dark:border-slate-600">
                                <FontAwesomeIcon icon={faUserCircle} className="text-xl" /> {/* یا faUser */}
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-gray-800 dark:text-gray-100">
                                {typeof order.user === 'object' && order.user !== null ? (order.user as User).username : order.user || 'N/A'}
                              </p>
                              {/* <p className="text-xs text-gray-500 dark:text-gray-400">{typeof order.user === 'object' ? (order.user as User).email : ''}</p> */}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap hidden md:table-cell">
                          {order.created_at ? (
                            <>
                              <p>{new Date(order.created_at).toLocaleDateString('fa-IR')}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {new Date(order.created_at).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </>
                          ) : (
                            // اگر order.created_at معتبر نبود، یک متن جایگزین نمایش می‌دهیم
                            <p className="text-xs text-gray-500 dark:text-gray-400">تاریخ نامشخص</p>
                          )}
                        </td>
                        <td className="px-4 py-3 font-medium whitespace-nowrap hidden lg:table-cell">
                          {parseFloat(order.total_price).toLocaleString('fa-IR')} تومان
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-semibold leading-tight rounded-full ${getStatusStyles(order.status)}`}>
                            {order.status_display || order.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap hidden sm:table-cell">
                          {/* TODO: نمایش وضعیت پرداخت واقعی بر اساس تراکنش‌ها */}
                          <span className={`px-2 py-1 text-xs font-medium leading-tight rounded-full ${paymentInfo.className}`}>
                            {paymentInfo.text}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <button
                            onClick={() => navigate(`/admin/orders/${order.id}`)}
                            className="text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 font-medium p-1"
                            title="مشاهده جزئیات"
                          >
                            <FontAwesomeIcon icon={faEye} />
                          </button>
                          {/* TODO: سایر دکمه‌های عملیات */}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-gray-200 dark:border-slate-700 flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="mb-4 md:mb-0">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  نمایش {firstItemNum.toLocaleString('fa-IR')} تا {lastItemNum.toLocaleString('fa-IR')} از {totalOrdersCount.toLocaleString('fa-IR')} سفارش
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
          </>
        )}
      </div>
    </>
  );
};

export default AdminOrderListPage;