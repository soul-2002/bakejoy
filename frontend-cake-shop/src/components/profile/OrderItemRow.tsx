import React from 'react';
import type { OrderItem } from '../../types';
import { Link } from 'react-router-dom';

interface OrderItemRowProps {
  item: OrderItem;
}

const OrderItemRow: React.FC<OrderItemRowProps> = ({ item }) => {
  const formatPrice = (price: string | number | null | undefined) => {
    if (price == null) return 'N/A';
    const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
    return `${numericPrice.toLocaleString('fa-IR')} تومان`;
  };
  const product = item.product;

  // ساخت دینامیک توضیحات از سایز و طعم
  const description = [item.size?.name, item.flavor?.name].filter(Boolean).join(' - ');

  return (
    <tr className="border-b border-gray-100 last:border-b-0">
      <td className="py-4">
        <div className="flex items-center">
          <img src={product.image} alt={product.name} className="product-image" />
          <div className="mr-4">
            <Link to={`/products/${product.slug}`} className="font-medium text-gray-800 hover:text-amber-600">
              {product.name}
            </Link>
            {description && <p className="text-gray-500 text-sm mt-1">{description}</p>}
             {item.notes && (
              <p className="text-xs text-blue-600 bg-blue-50 rounded p-1 mt-2">
                یادداشت: {item.notes}
              </p>
            )}
          </div>
        </div>
      </td>
      <td className="py-4 text-center text-gray-700">{formatPrice(item.price_at_order)}</td>
      <td className="py-4 text-center text-gray-700">{item.quantity}</td>
      <td className="py-4 text-left text-gray-800 font-medium">{formatPrice(item.total_price)}</td>
    </tr>
  );
};

export default OrderItemRow;