// src/components/Products/QuantityInput.tsx
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faMinus } from '@fortawesome/free-solid-svg-icons';

interface QuantityInputProps {
  quantity: number;
  onQuantityChange: (newQuantity: number) => void;
  disabled?: boolean;
}

const QuantityInput: React.FC<QuantityInputProps> = ({ quantity, onQuantityChange, disabled = false }) => {
  const handleDecrement = () => {
    if (quantity > 1) {
      onQuantityChange(quantity - 1);
    }
  };

  const handleIncrement = () => {
    onQuantityChange(quantity + 1);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
     const value = parseInt(e.target.value, 10);
     if (!isNaN(value) && value >= 1) {
       onQuantityChange(value);
     } else if (e.target.value === '') {
         onQuantityChange(1); // یا مدیریت حالت خالی به شکل دیگر
     }
  };

  return (
    <div className="mb-6">
      <h3 className="font-bold text-lg mb-3 text-dark">تعداد</h3>
      <div className="inline-flex items-center gap-2 border border-gray-300 rounded-lg">
        <button
          type="button"
          onClick={handleDecrement}
          disabled={quantity <= 1 || disabled}
          className="quantity-btn flex items-center justify-center w-8 h-8 text-text-secondary hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed transition"
          aria-label="کاهش تعداد"
        >
          <FontAwesomeIcon icon={faMinus} />
        </button>
        <input
          type="number"
          value={quantity}
          min="1"
          onChange={handleChange}
          disabled={disabled}
          className="h-8 w-12 text-center focus:outline-none disabled:opacity-50 border-none bg-transparent"
          aria-label="تعداد"
        />
        <button
          type="button"
          onClick={handleIncrement}
          disabled={disabled}
          className="quantity-btn flex items-center justify-center w-8 h-8 text-text-secondary hover:text-primary disabled:opacity-50 transition"
          aria-label="افزایش تعداد"
        >
          <FontAwesomeIcon icon={faPlus} />
        </button>
      </div>
    </div>
  );
};

export default QuantityInput;