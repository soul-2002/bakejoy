import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom'; // برای هدایت به صفحه لاگین
import FilterSidebar from '../components/Products/FilterSidebar';
import { getSupplies, getSupplyFilterOptions, addItemToCart } from '../services/api';
import type { PartySupply, SupplyFilterOptions } from '../types';
import LoadingSpinner from '../components/common/LoadingSpinner';
import PaginationControls from '../components/admin/common/PaginationControls';
import ProductGrid from '../components/Products/ProductGrid';
import Breadcrumbs from '../components/common/Breadcrumbs';
import ActiveFiltersDisplay from '../components/products/ActiveFiltersDisplay';


const PAGE_SIZE = 12;

const PartySuppliesPage: React.FC = () => {
  const { accessToken } = useAuth();
  const navigate = useNavigate();

  const [products, setProducts] = useState<PartySupply[]>([]);
  const [filterOptions, setFilterOptions] = useState<SupplyFilterOptions | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [paginationData, setPaginationData] = useState({
    count: 0,
    next: null as string | null,
    previous: null as string | null,
  });
  const breadcrumbItems = [
    { label: "خانه", href: "/" },
    { label: "لوازم جشن و تزئینات" } // آیتم آخر لینک ندارد
  ];
  const [currentPage, setCurrentPage] = useState(1);

  const [activeFilters, setActiveFilters] = useState({
    type: null as string | null,
    colors: [] as number[],
    themes: [] as string[],
  });

  // ۱. useEffect اصلاح شد تا برای کاربران مهمان هم کار کند
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const params: any = { page: currentPage, page_size: PAGE_SIZE };

        if (activeFilters.type) params.type__slug = activeFilters.type;
        if (activeFilters.colors.length > 0) params.colors__id__in = activeFilters.colors.join(',');
        if (activeFilters.themes.length > 0) params.themes__slug__in = activeFilters.themes.join(',');

        // ما فقط یک درخواست برای محصولات ارسال می‌کنیم
        const productsData = await getSupplies(params, accessToken);

        // بررسی می‌کنیم که آیا پاسخ API صفحه‌بندی شده است یا یک آرایه خام
        const productsArray = Array.isArray(productsData)
          ? productsData
          : productsData.results;

        const paginationInfo = Array.isArray(productsData)
          ? { count: productsData.length, next: null, previous: null }
          : { count: productsData.count, next: productsData.next, previous: productsData.previous };

        // state ها را با داده‌های صحیح آپدیت می‌کنیم
        setProducts(Array.isArray(productsArray) ? productsArray : []);
        setPaginationData(paginationInfo);

        // گزینه‌های فیلتر را فقط در صورتی می‌گیریم که از قبل لود نشده باشند
        if (!filterOptions) {
          const filtersData = await getSupplyFilterOptions(accessToken);
          setFilterOptions(filtersData);
        }

      } catch (error) {
        console.error("Failed to load party supplies data:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [accessToken, activeFilters, currentPage, filterOptions]);
  const totalPages = Math.ceil(paginationData.count / PAGE_SIZE);

  const handleFilterChange = (filterType: 'type' | 'color' | 'theme', value: string | number) => {
    setActiveFilters(prev => {
      const newFilters = { ...prev };

      if (filterType === 'type') {
        newFilters.type = prev.type === value ? null : value as string;
      }
      else if (filterType === 'color') {
        const colors = new Set(prev.colors);
        colors.has(value as number) ? colors.delete(value as number) : colors.add(value as number);
        newFilters.colors = Array.from(colors);
      }
      else if (filterType === 'theme') {
        const themes = new Set(prev.themes);
        themes.has(value as string) ? themes.delete(value as string) : themes.add(value as string);
        newFilters.themes = Array.from(themes);
      }
      return newFilters;
    });

    // ۲. ریست کردن صفحه‌بندی به صفحه اول پس از هر تغییر فیلتر
    setPage(1);
  };

  const handleClearFilters = () => {
    setActiveFilters({ type: null, colors: [], themes: [] });
  };

  // ۳. منطق افزودن به سبد خرید کامل شد
  const handleAddToCart = async (productId: number, quantity: number) => {
    // اگر کاربر لاگین نکرده، او را به صفحه لاگین هدایت کن
    if (!accessToken) {
      navigate('/login', { state: { from: location.pathname } }); // state برای بازگشت به همین صفحه بعد از لاگین
      return;
    }

    try {
      // نام فیلد باید با سریالایزر بک‌اند شما هماهنگ باشد
      await addItemToCart({ product_id: productId, product_type: 'partysupply', quantity }, accessToken);
      alert('محصول با موفقیت به سبد خرید اضافه شد.');
    } catch (error) {
      console.error("Failed to add to cart:", error);
      alert('خطایی در افزودن به سبد خرید رخ داد.');
    }
  };

  if (loading) return <LoadingSpinner text="در حال بارگذاری محصولات..." />;

  return (
    <>
      <Breadcrumbs items={breadcrumbItems} />
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          <FilterSidebar
            filterOptions={filterOptions}
            activeFilters={activeFilters}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
          />
          <div className="flex-1">
            <ActiveFiltersDisplay
              activeFilters={activeFilters}
              filterOptions={filterOptions}
              onFilterChange={handleFilterChange}
              onClearFilters={handleClearFilters}
            />

            <ProductGrid products={products} onAddToCart={handleAddToCart} />
            <div className="mt-12">
              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => setCurrentPage(page)}
                hasNextPage={!!paginationData.next}
                hasPrevPage={!!paginationData.previous}
              />
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default PartySuppliesPage;