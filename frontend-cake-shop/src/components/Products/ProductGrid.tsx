import React from 'react';
import SupplyProductCard from './SupplyProductCard';
import type { PartySupply } from '../../types';

interface ProductGridProps {
  products: PartySupply[];
  onAddToCart: (productId: number, quantity: number) => void;
}

const ProductGrid: React.FC<ProductGridProps> = ({ products, onAddToCart }) => {
  if (products.length === 0) {
    return <div className="text-center text-gray-500 py-16">محصولی برای نمایش یافت نشد.</div>;
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
      {products.map(product => (
        <SupplyProductCard 
          key={product.id} 
          product={product} 
          onAddToCart={onAddToCart} 
        />
      ))}
    </div>
  );
};

export default ProductGrid;