// src/components/payment/CollapsibleOrderItems.tsx
import React, { useState } from 'react';
import { OrderItem } from '../../types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';

interface CollapsibleOrderItemsProps {
  items: OrderItem[];
}

const OrderItemRow: React.FC<{ item: OrderItem }> = ({ item }) => (
  <div className="flex items-center">
    <img 
      src={item.cake?.image || 'https://via.placeholder.com/80x80'} 
      alt={item.cake?.name} 
      className="w-16 h-16 rounded-lg object-cover ml-4 rtl:mr-4 rtl:ml-0"
    />
    <div className="flex-grow">
      <h4 className="font-medium text-gray-800 dark:text-gray-100">{item.cake?.name || 'محصول'}</h4>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        {item.quantity.toLocaleString('fa-IR')} عدد - {parseFloat(String(item.price_at_order)).toLocaleString('fa-IR')} تومان
      </p>
    </div>
  </div>
);

const CollapsibleOrderItems: React.FC<CollapsibleOrderItemsProps> = ({ items }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mb-8">
      <div 
        className="flex justify-between items-center cursor-pointer py-2" 
        onClick={() => setIsOpen(!isOpen)}
        role="button"
        aria-expanded={isOpen}
      >
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
          جزئیات سفارش ({items.length.toLocaleString('fa-IR')} آیتم)
        </h2>
        <FontAwesomeIcon 
          icon={isOpen ? faChevronUp : faChevronDown} 
          className={`text-gray-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </div>
      <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'max-h-96 mt-4' : 'max-h-0'}`}>
        <div className="space-y-4 pt-2 border-t border-gray-200 dark:border-slate-700">
          {items.map((item, index) => (
            <OrderItemRow key={item.id || index} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default CollapsibleOrderItems;
