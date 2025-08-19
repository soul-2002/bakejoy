// src/pages/admin/AdminOrderDetailPage.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faPrint, faEdit, faTruck, faUndo, faSpinner, faTimesCircle } from '@fortawesome/free-solid-svg-icons'; // آیکون‌های نمونه

import { useAuth } from '../../../contexts/AuthContext';
import { getAdminOrderDetail } from '../../../services/api';
import { Order, OrderItem, User, Address as AddressType, Transaction as TransactionType } from '../../../types'; // تایپ‌های دقیق‌تر
import OrderDetailHeader from '../../../components/admin/orders/OrderDetailHeader'; // <--- ایمپورت کامپوننت جدید
import OrderInfoCard from '../../../components/admin/orders/OrderInfoCard'; // <--- ایمپورت کامپوننت جدید
import CustomerInfoCard from '../../../components/admin/orders/CustomerInfoCard';
import OrderItemsTable from '../../../components/admin/orders/OrderItemsTable'; // <--- ایمپورت کامپوننت جدید // <--- ایمپورت کامپوننت جدید
import OrderNotesSection from '../../../components/admin/orders/OrderNotesSection'; // <--- ایمپورت کامپوننت جدید
import OrderStatusHistoryTable from '../../../components/admin/orders/OrderStatusHistoryTable'; // <--- ایمپورت کامپوننت جدید
import OrderTransactionsTable from '../../../components/admin/orders/OrderTransactionsTable'; // <--- ایمپورت کامپوننت جدید

import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Button from '@mui/material/Button';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';

import { updateAdminOrderStatus, downloadAdminOrderInvoicePDF } from '../../../services/api'; // فرض کنید اینجا تابع updateAdminOrderStatus را دارید
import { AlertCard } from '../../../components/admin/common/AlertCard';
import type { AlertVariant } from '../../../components/admin/common/AlertCard'; // برای استفاده از نوع داده



const AdminOrderDetailPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { accessToken } = useAuth();
  const navigate = useNavigate();

  const [isSingleOrderStatusModalOpen, setIsSingleOrderStatusModalOpen] = useState(false);
  const [statusToApply, setStatusToApply] = useState(''); // برای نگهداری وضعیت انتخابی در مودال
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false); // برای لودینگ دکمه تایید مودال
  const [isCancelConfirmModalOpen, setIsCancelConfirmModalOpen] = useState(false);
  const [pageAlert, setPageAlert] = useState<{ message: string; variant: AlertVariant } | null>(null);
  useEffect(() => {
        if (pageAlert) {
            const timer = setTimeout(() => {
                setPageAlert(null);
            }, 5000); // هشدار پس از 5 ثانیه محو می‌شود
            return () => clearTimeout(timer);
        }
    }, [pageAlert]);


  const handlePrintInvoice = async () => {
    if (!order || order.id === null || !accessToken) {
      alert("اطلاعات سفارش موجود نیست یا لاگین نکرده‌اید.");
      return;
    }
    // setIsPrintingInvoice(true);
    // setError(null); // اگر state خطا دارید

    try {
      const blob = await downloadAdminOrderInvoicePDF(accessToken, order.id);
      const fileURL = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = fileURL;
      link.setAttribute('download', `invoice_order_${order.id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(fileURL);
    } catch (error: any) {
      console.error('Error downloading invoice PDF:', error);
      //alert(`خطا در دانلود فاکتور: ${error.message}`);
      setPageAlert({ variant: 'error', message: `خطا در دانلود فاکتور: ${error.message}` });
      // setError(error.message);
    } finally {
      // setIsPrintingInvoice(false);
    }
  };
  const openChangeStatusModal = () => {
    if (!order) return;
    setStatusToApply(order.status); // مقدار اولیه دراپ‌داون را برابر با وضعیت فعلی سفارش قرار بده
    setIsSingleOrderStatusModalOpen(true);
  };

  const handleCloseSingleOrderStatusModal = () => {
    setIsSingleOrderStatusModalOpen(false);
  };

  const handleConfirmSingleOrderStatusChange = async () => {
    if (!order || !order.id || !statusToApply) {
      alert("اطلاعات لازم برای تغییر وضعیت کامل نیست.");
      return;
    }
    if (!accessToken) {
      alert("لطفا ابتدا وارد شوید.");
      return;
    }

    setIsUpdatingStatus(true);
    // setError(null); // اگر state خطای عمومی برای صفحه دارید

    try {
      // TODO: در مرحله بعد، تابع API زیر را ایجاد و فراخوانی می‌کنیم
      // await updateAdminSingleOrderStatus(accessToken, order.id, statusToApply);
      const updatedOrderData = await updateAdminOrderStatus(order.id, statusToApply, accessToken);
      //alert(`وضعیت سفارش #${order.id.toLocaleString('fa-IR')} با موفقیت به "${updatedOrderData.status_display || statusToApply}" به‌روز شد.`);
        setPageAlert({ variant: 'success', message: `وضعیت سفارش با موفقیت به "${updatedOrderData.status_display}" به‌روز شد.` }); // <--- این خط جایگزین می‌شود

      // شبیه‌سازی فراخوانی API و موفقیت
      console.log(`API Call (mock): Update status for order ${order.id} to ${statusToApply}`);
      await new Promise(resolve => setTimeout(resolve, 1000)); // شبیه‌سازی تاخیر شبکه
      // --------

      //alert(`وضعیت سفارش #${order.id} با موفقیت به‌روز شد.`);
      fetchOrderDetail(); // بارگذاری مجدد جزئیات سفارش برای نمایش تغییرات
      handleCloseSingleOrderStatusModal();
    } catch (err: any) {
      console.error("Error updating single order status:", err);
      // setError(err.message || "خطا در به‌روزرسانی وضعیت سفارش.");
      alert(`خطا: ${err.message || "خطا در به‌روزرسانی وضعیت سفارش."}`);
              setPageAlert({ variant: 'error', message: err.message || "خطا در به‌روزرسانی وضعیت." }); // <--- این خط جایگزین می‌شود

    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const openCancelConfirmModal = () => {
    if (!order || !order.id) return;
    // می‌توانید اینجا بررسی کنید که آیا سفارش اصلاً قابل لغو است یا خیر
    // بر اساس order.status و قوانین شما
    const canBeCancelled = order.status !== 'CANCELLED' && order.status !== 'DELIVERED' && order.status !== 'SHIPPED'; // مثال
    if (!canBeCancelled) {
      alert(`سفارش با وضعیت "${order.status_display || order.status}" قابل لغو نیست.`);
      return;
    }
    setIsCancelConfirmModalOpen(true);
  };

  const handleCloseCancelConfirmModal = () => {
    setIsCancelConfirmModalOpen(false);
  };

  const handleConfirmCancelOrder = async () => {
    if (!order || order.id === null || !accessToken) { // order.id === null هم بررسی شود
      alert("اطلاعات لازم برای لغو سفارش کامل نیست.");
      handleCloseCancelConfirmModal();
      return;
    }

    // فرض می‌کنیم isUpdatingStatus یا یک state لودینگ مشابه دارید
    setIsUpdatingStatus(true); // یا یک state جدید isCancellingOrder
    // setError(null);

    try {
      // استفاده از تابع updateAdminOrderStatus با وضعیت "CANCELLED"
      // مطمئن شوید "CANCELLED" دقیقاً کلید وضعیت لغو در بک‌اند شماست
      const cancelledStatusKey = "CANCELLED"; // این را با کلید واقعی جایگزین کنید
      const updatedOrderData = await updateAdminOrderStatus(order.id, cancelledStatusKey, accessToken);

      alert(`سفارش #${order.id.toLocaleString('fa-IR')} با موفقیت لغو شد.`);
      fetchOrderDetail(); // بارگذاری مجدد جزئیات برای نمایش وضعیت جدید

    } catch (err: any) {
      console.error("Error cancelling order:", err);
      alert(`خطا در لغو سفارش: ${err.message || "خطای نامشخص"}`);
    } finally {
      setIsUpdatingStatus(false); // یا setIsCancellingOrder(false)
      handleCloseCancelConfirmModal();
    }
  };
  const handleCancelOrder = () => {
    openCancelConfirmModal(); // فقط مودال را باز کن
  };
  const handleSendEmail = () => console.log("ارسال ایمیل برای سفارش:", order?.id); // TODO: پیاده‌سازی
  const handleRefund = () => console.log("بازپرداخت برای سفارش:", order?.id); // TODO: پیاده‌سازی

  const fetchOrderDetail = useCallback(async () => {
    if (!accessToken || !orderId) {
      setError("اطلاعات لازم برای دریافت جزئیات سفارش موجود نیست.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminOrderDetail(accessToken, orderId);

      setOrder(data);
      console.log("Order Detail Data Received from API:", data);

    } catch (err: any) {
      setError(err.response?.data?.detail || "خطا در دریافت جزئیات سفارش.");
      console.error("Error fetching order detail:", err);
    } finally {
      setLoading(false);
    }
  }, [accessToken, orderId]);

  useEffect(() => {
    fetchOrderDetail();
  }, [fetchOrderDetail]);

  if (loading) return <div className="p-6 text-center text-gray-500 dark:text-gray-400">در حال بارگذاری جزئیات سفارش...</div>;
  if (error) return <div className="p-6 text-center text-red-500 dark:text-red-400">خطا: {error}</div>;
  if (!order) return <div className="p-6 text-center text-gray-500 dark:text-gray-400">سفارشی یافت نشد.</div>;

  // توابع نمونه برای دکمه‌های عملیات (بعداً تکمیل می‌شوند)
  const orderUser = order.user as User | undefined;
  const orderAddress = order.address as AddressType | undefined; // اگر address یک آبجکت است
  return (
    <>
      <div className="p-4 md:p-6 lg:p-8">
        {pageAlert && (
            <div className="mb-6"> {/* افزودن کمی فاصله از پایین */}
                <AlertCard variant={pageAlert.variant} message={pageAlert.message} />
            </div>
        )}
        {/* دکمه بازگشت و عنوان صفحه */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            <FontAwesomeIcon icon={faArrowRight} className="ml-2 rtl:mr-2" /> {/* rtl:mr-2 برای فارسی */}
            بازگشت به لیست سفارشات
          </button>
          <h1 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-gray-100">
            جزئیات سفارش #{order?.id?.toLocaleString('fa-IR')} {/* order? برای جلوگیری از خطا اگر order نال است */}
          </h1>
        </div>

        {/* هدر جزئیات سفارش (وضعیت و دکمه‌های عملیات اصلی) */}
        <OrderDetailHeader
          order={order}
          onPrintInvoiceClick={handlePrintInvoice}
          onSendEmailClick={handleSendEmail}
          onRefundClick={handleRefund}
          onCancelOrderClick={handleCancelOrder}
          onChangeStatusClick={openChangeStatusModal} // <--- اتصال صحیح
        />

        {/* بخش‌بندی اصلی اطلاعات با Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6"> {/* mt-6 برای فاصله از OrderDetailHeader */}

          {/* ستون اصلی (سمت راست در RTL): اطلاعات کلی، آیتم‌ها، تاریخچه وضعیت */}
          <div className="lg:col-span-2 space-y-6">
            <OrderInfoCard order={order} />

            {/* جدول آیتم‌های سفارش */}
            <OrderItemsTable items={order?.items || []} /> {/* پاس دادن order.items */}

            {/* تاریخچه وضعیت سفارش */}
          </div>

          {/* ستون کناری (سمت چپ در RTL): اطلاعات مشتری، یادداشت‌ها، عملیات دیگر، تراکنش‌ها */}
          <div className="space-y-6">
            <CustomerInfoCard
              user={orderUser}
              address={orderAddress}
            />

            {/* بخش یادداشت‌ها */}
            <OrderNotesSection
              orderId={order?.id}
              customerNote={order?.notes_read || order?.notes}
            />

            {/* بخش عملیات اضافی یا خلاصه عملیات (اگر از OrderDetailHeader جدا باشد) */}
            {/* <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-lg shadow-md border border-gray-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-200">
            سایر عملیات
          </h3>
          {/* ... دکمه‌های عملیات دیگر ... * /
        </div>
        */}

            {/* تاریخچه تراکنش‌ها */}

          </div>
        </div>
        <div className="space-y-6 gap-6 mt-6">
          <OrderStatusHistoryTable orderId={order?.id} /> {/* پاس دادن order.id */}

          <OrderTransactionsTable transactions={order?.transactions} /></div>
      </div>
      {/* مودال‌ها باید خارج از ساختار اصلی Grid و معمولاً در انتهای JSX کامپوننت والد باشند */}
      {/* <ChangeStatusModal open={isChangeStatusModalOpen} onClose={handleCloseChangeStatusModal} ... /> */}
      {/* <DeleteConfirmModal open={isDeleteConfirmModalOpen} onClose={handleCloseDeleteConfirmModal} ... /> */}

      {order && ( // مودال فقط زمانی رندر شود که order موجود است
        <Dialog open={isSingleOrderStatusModalOpen} onClose={handleCloseSingleOrderStatusModal} fullWidth maxWidth="xs">
          <DialogTitle>تغییر وضعیت سفارش #{order.id?.toLocaleString('fa-IR')}</DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ mb: 2 }}>
              لطفاً وضعیت جدید را برای این سفارش انتخاب کنید.
            </DialogContentText>
            <FormControl fullWidth margin="dense">
              <InputLabel id="single-order-status-select-label">وضعیت جدید</InputLabel>
              <Select
                labelId="single-order-status-select-label"
                value={statusToApply}
                label="وضعیت جدید"
                onChange={(e: SelectChangeEvent<string>) => setStatusToApply(e.target.value)}
              >
                {/* از statusOptions که در AdminOrderListPage داشتید، می‌توانید اینجا هم استفاده کنید
                    یا یک لیست وضعیت مناسب برای تغییر تکی تعریف کنید.
                    مطمئن شوید که value ها با کلیدهای وضعیت در بک‌اند مطابقت دارند.
                */}
                {/* مثال با statusOptions (باید از فایل مربوطه import یا در اینجا تعریف شود) */}
                {/* {statusOptions 
                  .filter(option => option.value !== '' && option.value !== 'CART') // حذف گزینه‌های نامرتبط
                  .map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                ))} */}
                {/* مثال ساده‌تر با چند گزینه: */}
                <MenuItem value="PENDING_PAYMENT">در انتظار پرداخت</MenuItem>
                <MenuItem value="PROCESSING">در حال پردازش</MenuItem>
                <MenuItem value="SHIPPED">ارسال شده</MenuItem>
                <MenuItem value="DELIVERED">تحویل داده شده</MenuItem>
                <MenuItem value="CANCELLED">لغو شده</MenuItem>
                <MenuItem value="PAYMENT_FAILED">پرداخت ناموفق</MenuItem>
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions sx={{ padding: '16px 24px' }}>
            <Button onClick={handleCloseSingleOrderStatusModal} color="secondary">
              لغو
            </Button>
            <Button
              onClick={handleConfirmSingleOrderStatusChange}
              variant="contained"
              color="primary"
              disabled={!statusToApply || statusToApply === order.status || isUpdatingStatus} // غیرفعال اگر وضعیت تغییر نکرده یا در حال آپدیت است
            >
              {isUpdatingStatus ? <FontAwesomeIcon icon={faSpinner} spin /> : 'تایید و تغییر وضعیت'}
            </Button>
          </DialogActions>
        </Dialog>
      )}
      {order && ( // فقط اگر order موجود است
        <Dialog
          open={isCancelConfirmModalOpen}
          onClose={handleCloseCancelConfirmModal}
          fullWidth
          maxWidth="xs"
        >
          <DialogTitle sx={{ color: 'error.main', display: 'flex', alignItems: 'center' }}>
            <FontAwesomeIcon icon={faTimesCircle} style={{ marginRight: '8px' }} />
            تایید لغو سفارش
          </DialogTitle>
          <DialogContent>
            <DialogContentText>
              آیا از لغو سفارش #{order.id?.toLocaleString('fa-IR')} با وضعیت فعلی
              "{order.status_display || order.status}" مطمئن هستید؟
              <br />
              <strong>این عملیات ممکن است قابل بازگشت نباشد و وضعیت آن به "لغو شده" تغییر خواهد کرد.</strong>
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={{ padding: '16px 24px' }}>
            <Button onClick={handleCloseCancelConfirmModal} color="secondary">
              انصراف
            </Button>
            <Button
              onClick={handleConfirmCancelOrder}
              variant="contained"
              color="error" // برای تاکید بر خطرناک بودن
              disabled={isUpdatingStatus} // یا isCancellingOrder
            >
              {isUpdatingStatus ? <FontAwesomeIcon icon={faSpinner} spin /> : 'بله، لغو کن'}
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </>
  );
};

export default AdminOrderDetailPage;