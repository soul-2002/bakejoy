// src/components/admin/orders/OrderItemsTable.tsx
import React from 'react';
import { Link } from 'react-router-dom'; // برای لینک به صفحه محصول
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faImage } from '@fortawesome/free-solid-svg-icons'; // آیکون پیش‌فرض برای تصویر
import { OrderItem, ProductMini, Flavor, Size } from '../../../types'; // مسیر صحیح به تایپ‌های شما

interface OrderItemsTableProps {
  items: OrderItem[];
}

const OrderItemsTable: React.FC<OrderItemsTableProps> = ({ items }) => {
  if (!items || items.length === 0) {
    return <p className="text-sm text-gray-500 dark:text-gray-400">هیچ آیتمی در این سفارش وجود ندارد.</p>;
  }

  // تابع کمکی برای نمایش "نامشخص"
  const displayInfo = (data: string | number | undefined | null, fallback: string = '-') => {
    return data ? String(data) : fallback;
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-gray-200 dark:border-slate-700 overflow-hidden">
      <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-slate-700">
        <h2 className="font-semibold text-lg text-gray-800 dark:text-gray-100 flex items-center">
          {/* می‌توانید آیکون مناسبی برای این بخش انتخاب کنید، مثلاً faBoxes از طرح HTML شما */}
          {/* <FontAwesomeIcon icon={faBoxes} className="ml-2 text-blue-500 dark:text-blue-400" /> */}
          آیتم‌های سفارش
        </h2>
      </div>
      <div className="overflow-x-auto responsive-table"> {/* کلاس responsive-table برای اسکرول در موبایل */}
        <table className="w-full min-w-[600px]"> {/* min-w برای جلوگیری از به هم ریختگی زیاد در موبایل */}
          <thead className="bg-gray-50 dark:bg-slate-700">
            <tr className="text-right text-xs sm:text-sm text-gray-600 dark:text-gray-300">
              <th className="px-3 sm:px-4 py-3 font-medium">محصول</th>
              <th className="px-3 sm:px-4 py-3 font-medium">جزئیات (طعم/اندازه)</th>
              <th className="px-3 sm:px-4 py-3 font-medium text-center">تعداد</th>
              <th className="px-3 sm:px-4 py-3 font-medium">قیمت واحد (زمان سفارش)</th>
              <th className="px-3 sm:px-4 py-3 font-medium">قیمت کل آیتم</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
            {items.map((item) => {
              const product = item.cake || item.product; // بستگی به نام فیلد در OrderItem شما دارد
              const flavor = item.flavor as Flavor | null; // تایپ Flavor از types.ts
              const size = item.size as Size | null;     // تایپ Size از types.ts

              return (
                <tr key={item.id} className="text-right hover:bg-gray-50 dark:hover:bg-slate-700/50 text-sm text-gray-700 dark:text-gray-300">
                  <td className="px-3 sm:px-4 py-3">
                    <div className="flex items-center">
                      {product?.image ? (
                        <img 
                          src={product.image} 
                          alt={product.name} 
                          className="w-10 h-10 sm:w-12 sm:h-12 rounded object-cover ml-3 rtl:mr-3 border dark:border-slate-600" 
                        />
                      ) : (
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded ml-3 rtl:mr-3 bg-gray-100 dark:bg-slate-700 flex items-center justify-center text-gray-400 dark:text-gray-500 border dark:border-slate-600">
                          <FontAwesomeIcon icon={faImage} className="text-xl" />
                        </div>
                      )}
                      <div>
                        {product?.slug ? (
                           <Link to={`/products/${product.slug}`} target="_blank" className="font-medium text-blue-600 hover:underline dark:text-blue-400 block">
                             {displayInfo(product.name, 'محصول نامشخص')}
                           </Link>
                        ) : (
                           <span className="font-medium text-gray-800 dark:text-gray-100 block">
                             {displayInfo(product?.name, 'محصول نامشخص')}
                           </span>
                        )}
                        {/* می‌توانید SKU یا ID محصول را هم اینجا نمایش دهید */}
                        {/* <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">SKU: {product?.sku || '-'}</p> */}
                        {item.notes && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">یادداشت: {item.notes}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 sm:px-4 py-3">
                    {flavor && <p>طعم: {displayInfo(flavor.name)}</p>}
                    {size && <p className={flavor ? 'mt-0.5' : ''}>اندازه: {displayInfo(size.name)}</p>}
                    {(!flavor && !size) && '-'}
                  </td>
                  <td className="px-3 sm:px-4 py-3 text-center font-medium">{item.quantity.toLocaleString('fa-IR')}</td>
                  <td className="px-3 sm:px-4 py-3 ltr-text">{parseFloat(item.price_at_order).toLocaleString('fa-IR')} تومان</td>
                  <td className="px-3 sm:px-4 py-3 font-semibold ltr-text">
                    {/* total_price در OrderItem شما پراپرتی محاسبه شده بود */}
                    {(item.quantity * parseFloat(item.price_at_order)).toLocaleString('fa-IR')} تومان
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OrderItemsTable;