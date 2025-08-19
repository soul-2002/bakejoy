import React, { useState, useEffect, useCallback } from 'react';
import ProductCard from '../components/Products/ProductCard';
import ProductToolbar from '../components/Products/ProductToolbar';
import ProductFilterPanel from '../components/Products/ProductFilterPanel';
import PaginationControls from '../components/admin/common/PaginationControls';
import { getProducts, getCategories, getFlavors } from '../services/api';
import type { Cake, Category, Flavor } from '../types';
import LoadingSpinner from '../components/common/LoadingSpinner';

const PAGE_SIZE = 8;

const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Cake[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [flavors, setFlavors] = useState<Flavor[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const [activeFilters, setActiveFilters] = useState({
    categories: new Set<number>(),
    flavors: new Set<number>(),
    min_price: '',
    max_price: '',
  });
  const [sortOrder, setSortOrder] = useState('-created_at');
  const [paginationData, setPaginationData] = useState({ count: 0, next: null as string | null, previous: null as string | null });
  const [currentPage, setCurrentPage] = useState(1);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params: { [key: string]: any } = { 
        page: currentPage, 
        page_size: PAGE_SIZE,
        ordering: sortOrder,
      };
      // افزودن فیلترهای فعال به پارامترهای درخواست
      if (activeFilters.categories.size > 0) params.category__id__in = Array.from(activeFilters.categories).join(',');
      if (activeFilters.flavors.size > 0) params.available_flavors__id__in = Array.from(activeFilters.flavors).join(',');
      if (activeFilters.min_price) params.base_price__gte = activeFilters.min_price;
      if (activeFilters.max_price) params.base_price__lte = activeFilters.max_price;

      // دریافت محصولات بر اساس فیلترها
      const productsResponse = await getProducts(params);
      setProducts(productsResponse.results || []);
      setPaginationData({
        count: productsResponse.count || 0,
        next: productsResponse.next,
        previous: productsResponse.previous,
      });

    } catch (err) {
      setError('متاسفانه در بارگذاری داده‌ها مشکلی پیش آمد.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, activeFilters, sortOrder]);

  // useEffect جداگانه برای گرفتن داده‌های فیلتر (فقط یک بار)
  useEffect(() => {
    const fetchFilterOptions = async () => {
        try {
            const [categoriesData, flavorsData] = await Promise.all([
                getCategories(),
                getFlavors(),
            ]);
            setCategories(categoriesData.results || categoriesData);
            setFlavors(flavorsData.results || flavorsData);
        } catch (err) {
            setError('خطا در دریافت گزینه‌های فیلتر.');
        }
    };
    fetchFilterOptions();
  }, []);

  // useEffect اصلی که به تغییرات فیلترها و صفحه گوش می‌دهد
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // توابع مدیریت state
  const handleFilterChange = (filterType: 'category' | 'flavor', value: number) => {
    setActiveFilters(prev => {
      const newSet = new Set(prev[filterType === 'category' ? 'categories' : 'flavors']);
      newSet.has(value) ? newSet.delete(value) : newSet.add(value);
      return { ...prev, [filterType === 'category' ? 'categories' : 'flavors']: newSet };
    });
    setCurrentPage(1);
  };
  
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setActiveFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortOrder(e.target.value);
    setCurrentPage(1);
  };
  
  const handleClearFilters = () => {
    setActiveFilters({ categories: new Set(), flavors: new Set(), min_price: '', max_price: '' });
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(paginationData.count / PAGE_SIZE);

  if (loading && products.length === 0) return <LoadingSpinner />;
  if (error) return <div className="text-center py-20 text-red-600">{error}</div>;

  return (
    <main className="container mx-auto px-4 py-8 min-h-screen">
      <div className="mb-8 text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-dark font-heading mb-2">کیک‌های ما</h1>
        <p className="text-text-secondary max-w-2xl mx-auto">لذت طعم‌های بی‌نظیر را با مجموعه کیک‌های ما تجربه کنید</p>
      </div>
      
      <div className="mb-8 bg-white rounded-2xl shadow-sm p-4">
        <ProductToolbar 
          sortOrder={sortOrder}
          onSortChange={handleSortChange}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onFilterToggle={() => setIsFilterOpen(!isFilterOpen)}
        />
        <ProductFilterPanel 
          isOpen={isFilterOpen}
          categories={categories}
          flavors={flavors}
          activeFilters={activeFilters}
          onCategoryChange={(id) => handleFilterChange('category', id)}
          onFlavorChange={(id) => handleFilterChange('flavor', id)}
          onPriceChange={handlePriceChange}
          onClearFilters={handleClearFilters}
        />
      </div>

      {products.length === 0 && !loading ? (
        <div className="text-center py-10"><p>محصولی با این مشخصات یافت نشد.</p></div>
      ) : (
        <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'} gap-8`}>
          {products.map((product) => <ProductCard key={product.id} cake={product} />)}
        </div>
      )}

      <div className="mt-12 flex justify-center">
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          hasNextPage={!!paginationData.next}
          hasPrevPage={!!paginationData.previous}
        />
      </div>
    </main>
  );
};

export default ProductsPage;