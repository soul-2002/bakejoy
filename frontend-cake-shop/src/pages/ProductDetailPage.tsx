// src/pages/ProductDetailPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getProductBySlug, addItemToCart, OrderItemInputData, getProductReviews, getSuggestedProductsBySlug, AddToCartPayload } from '../services/api';
import type { Cake, Review, OrderItem, } from '../types'; // تایپ OrderItem را هم اضافه کنید
import { useAuth } from '../contexts/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome, faChevronLeft, faStar, faStarHalfAlt } from '@fortawesome/free-solid-svg-icons';
import Alert from '@mui/material/Alert';

// --- کامپوننت‌های فرزند (فرض بر اینکه اینها را ساخته‌اید) ---
import ProductCard from '../components/Products/ProductCard';
import ProductOptions from '../components/Products/ProductOptions';
import QuantityInput from '../components/Products/QuantityInput';
import NotesInput from '../components/Products/NotesInput';
import AddToCartSection from '../components/Products/AddToCartSection';
import ProductGallery from '../components/Products/ProductGallery';
import ProductDetailsTab from '../components/Products/ProductDetailsTab';
import ProductIngredientsTab from '../components/Products/ProductIngredientsTab';
import ProductNutritionTab from '../components/Products/ProductNutritionTab';
import ProductReviewsTab from '../components/Products/ProductReviewsTab';

// کامپوننت ستاره‌ها (بدون تغییر)
const RatingStars: React.FC<{ rating?: number | null, reviewCount?: number }> = ({ rating, reviewCount }) => {
  const numRating = rating ?? 0;
  const fullStars = Math.floor(numRating);
  const hasHalfStar = numRating % 1 >= 0.5;
  if (numRating <= 0) return <div className="text-sm text-gray-500">هنوز امتیازی ثبت نشده</div>;
  return (
    <div className="flex items-center space-x-1 space-x-reverse text-yellow-400">
      {[...Array(fullStars)].map((_, i) => <FontAwesomeIcon icon={faStar} key={`full-${i}`} className="w-4 h-4" />)}
      {hasHalfStar && <FontAwesomeIcon icon={faStarHalfAlt} key="half" className="w-4 h-4" />}
      {[...Array(5 - fullStars - (hasHalfStar ? 1 : 0))].map((_, i) => <FontAwesomeIcon icon={faStar} key={`empty-${i}`} className="w-4 h-4 text-gray-300" />)}
      <span className="text-gray-500 dark:text-gray-400 text-sm mr-2">
        ({numRating.toLocaleString('fa-IR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} - {reviewCount?.toLocaleString('fa-IR')} نظر)
      </span>
    </div>
  );
};

const DEFAULT_IMAGE_URL = '/images/default-cake.png'; // تصویر پیش‌فرض

const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, accessToken } = useAuth();

  const [product, setProduct] = useState<Cake | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // State های فرم سفارش
  const [selectedSizeVariantId, setSelectedSizeVariantId] = useState<number | ''>('');
  const [selectedFlavorId, setSelectedFlavorId] = useState<number | ''>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [notes, setNotes] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('details');

  // State های ارسال به سبد خرید
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [submissionSuccess, setSubmissionSuccess] = useState<string | null>(null);

  // State های دیگر
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState<boolean>(true);
  const [reviewsError, setReviewsError] = useState<string | null>(null);
  const [suggestedProducts, setSuggestedProducts] = useState<Cake[]>([]);
  const [suggestedLoading, setSuggestedLoading] = useState<boolean>(true);
  const [suggestedError, setSuggestedError] = useState<string | null>(null);

  const [calculatedPrice, setCalculatedPrice] = useState<number>(0);

  const fetchProductData = useCallback(async () => {
    if (!slug) {
      setError("شناسه محصول نامعتبر است.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await getProductBySlug(slug);
      setProduct(data);
      // تنظیم مقادیر پیش‌فرض برای گزینه‌ها
      if (data.size_variants?.length > 0) {
        setSelectedSizeVariantId(data.size_variants[0].id ?? '');
      }
      if (data.available_flavors?.length > 0) {
        setSelectedFlavorId(data.available_flavors[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'خطا در دریافت اطلاعات محصول.');
      console.error("Failed to fetch product:", err);
    } finally {
      setLoading(false);
    }
  }, [slug]);
  useEffect(() => {
    if (!product) return; // اگر محصول لود نشده، کاری نکن

    const basePrice = parseFloat(String(product.base_price));
    let finalPrice = basePrice;

    if (selectedSizeVariantId) {
      const selectedVariant = product.size_variants.find(
        (variant) => variant.id === selectedSizeVariantId
      );
      if (selectedVariant && selectedVariant.price_modifier) {
        // قیمت نهایی = قیمت پایه + تعدیل‌کننده قیمت اندازه
        finalPrice = basePrice + parseFloat(String(selectedVariant.price_modifier));
      }
    }

    // اطمینان از اینکه قیمت منفی نشود (اختیاری)
    setCalculatedPrice(Math.max(0, finalPrice));

  }, [product, selectedSizeVariantId]);

  const fetchReviewsData = useCallback(async () => {
    if (!slug) return;
    setReviewsLoading(true);
    setReviewsError(null);
    try {
      const fetchedReviews = await getProductReviews(slug);
      setReviews(fetchedReviews);
    } catch (err) {
      setReviewsError("مشکلی در دریافت نظرات پیش آمد.");
    } finally {
      setReviewsLoading(false);
    }
  }, [slug]);

  const fetchSuggestedData = useCallback(async () => {
    if (!slug) return;
    setSuggestedLoading(true);
    setSuggestedError(null);
    try {
      const suggestedData = await getSuggestedProductsBySlug(slug);
      setSuggestedProducts(suggestedData);
    } catch (err) {
      setSuggestedError('مشکلی در دریافت محصولات مشابه پیش آمد.');
    } finally {
      setSuggestedLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchProductData();
    fetchReviewsData();
    fetchSuggestedData();
  }, [fetchProductData, fetchReviewsData, fetchSuggestedData]);

  const handleAddToCart = async () => {
    if (!isAuthenticated || !accessToken || !product) {
      setSubmissionError("لطفا برای افزودن محصول به سبد خرید، ابتدا وارد شوید.");
      return;
    }
    if (product.size_variants.length > 0 && !selectedSizeVariantId) {
      setSubmissionError("لطفاً اندازه کیک را انتخاب کنید.");
      return;
    }
    if (product.available_flavors.length > 0 && !selectedFlavorId) {
      setSubmissionError("لطفاً طعم کیک را انتخاب کنید.");
      return;
    }

    setSubmissionError(null);
    setSubmissionSuccess(null);
    setIsSubmitting(true);

    const orderItemData: AddToCartPayload = {
      product_id: product.id, // <-- نام اصلاح شد
      product_type: 'cake',
      quantity,
      flavor_id: selectedFlavorId ? Number(selectedFlavorId) : undefined,
      size_variant_id: selectedSizeVariantId ? Number(selectedSizeVariantId) : undefined, // <-- نام اصلاح شد
      notes,
    };

    try {
      const createdOrderItem = await addItemToCart(orderItemData, accessToken);
      console.log('Item added to cart successfully:', createdOrderItem);
      setSubmissionSuccess(`"${product.name}" با موفقیت به سبد خرید اضافه شد!`);
      // TODO: آپدیت کردن وضعیت سبد خرید در Navigation یا Context
    } catch (apiError: any) {
      const message = apiError.response?.data?.detail || apiError.message || "خطا در ثبت سفارش رخ داد.";
      setSubmissionError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="text-center py-20"><p>در حال بارگذاری اطلاعات محصول...</p></div>;
  if (error && !product) return <div className="text-center py-20 text-red-600"><p>{error}</p></div>;
  if (!product) return <div className="text-center py-20"><p>محصول یافت نشد.</p></div>;

  const displayImage = product.image ?? DEFAULT_IMAGE_URL;
  const galleryImages = product.images?.map(img => ({ original: img.image, thumbnail: img.image_thumbnail || img.image })) || [];

  return (
    <main className="container mx-auto px-4 py-8 bg-background-light dark:bg-background-dark">
      <div className="mb-8">
        <nav className="flex" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-2 space-x-reverse text-sm">
            <li className="inline-flex items-center">
              <Link to="/" className="inline-flex items-center text-gray-600 hover:text-primary dark:text-gray-300 dark:hover:text-primary-dark">
                <FontAwesomeIcon icon={faHome} className="ml-2 rtl:mr-2 w-4 h-4" />
                خانه
              </Link>
            </li>
            <li>
              <div className="flex items-center">
                <FontAwesomeIcon icon={faChevronLeft} className="text-gray-400 w-3 h-3" />
                <Link to="/products" className="mr-2 text-gray-600 hover:text-primary dark:text-gray-300 dark:hover:text-primary-dark">محصولات</Link>
              </div>
            </li>
            <li aria-current="page">
              <div className="flex items-center">
                <FontAwesomeIcon icon={faChevronLeft} className="text-gray-400 w-3 h-3" />
                <span className="mr-2 font-medium text-gray-800 dark:text-gray-100">{product.name}</span>
              </div>
            </li>
          </ol>
        </nav>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 p-4 md:p-6 lg:p-8">

          <ProductGallery
            mainImageUrl={displayImage}
            altText={product.name}
            thumbnails={galleryImages}
          />

          <div className="flex flex-col">
            <div>
              {product.category && (
                <div className="mb-4">
                  <Link to={`/products?category=${product.category.slug}`} className="inline-block bg-primary text-white text-xs px-3 py-1 rounded-full hover:bg-primary-dark">
                    {product.category.name}
                  </Link>
                </div>
              )}
              <h1 className="text-3xl md:text-4xl font-bold text-dark dark:text-light font-heading mb-2">{product.name}</h1>
              <div className="mb-4">
                <RatingStars rating={parseFloat(product.average_rating)} reviewCount={product.review_count} />
              </div>
              <div className="mb-6">
                <span className="font-bold text-primary text-2xl">
                  {calculatedPrice.toLocaleString('fa-IR')} تومان
                </span>
                {product.price_type === 'PER_KG' && <span className="text-gray-500 text-sm mr-2">(کیلویی)</span>}
              </div>
              {product.short_description && <div className="mb-6"><p className="text-gray-600 dark:text-gray-300 leading-relaxed">{product.short_description}</p></div>}
            </div>

            <div className="border-t border-gray-200 dark:border-slate-700 my-6"></div>

            <div className="flex-grow">
              <ProductOptions
                sizes={product.size_variants ?? []} // پاس دادن متغیرهای اندازه
                selectedSizeId={selectedSizeVariantId}
                onSizeChange={(sizeId) => setSelectedSizeVariantId(sizeId)}
                flavors={product.available_flavors ?? []}
                selectedFlavorId={selectedFlavorId}
                onFlavorChange={(flavorId) => setSelectedFlavorId(flavorId)}
                disabled={isSubmitting}
              />
              <QuantityInput
                quantity={quantity}
                onQuantityChange={(newQuantity) => { if (newQuantity >= 1) setQuantity(newQuantity); }}
                disabled={isSubmitting}
              />
              <NotesInput
                notes={notes}
                onNotesChange={setNotes}
                disabled={isSubmitting}
              />
            </div>

            <div className="mt-auto pt-6">
              {submissionError && <Alert severity="error" sx={{ mb: 2 }}>{submissionError}</Alert>}
              {submissionSuccess && <Alert severity="success" sx={{ mb: 2 }}>{submissionSuccess}</Alert>}

              <AddToCartSection
                isAuthenticated={isAuthenticated}
                isSubmitting={isSubmitting}

                // موارد جدید و اصلاح شده
                initialIsWishlisted={product.is_wishlisted} // یا هر متغیری که وضعیت اولیه را دارد
                productSlug={product.slug} // اسلاگ محصول برای ارسال به API

                onAddToCart={handleAddToCart}
                onWishlistChange={(newStatus) => {
                  // (اختیاری) اگر لازم است کامپوننت والد از تغییر وضعیت باخبر شود
                  console.log(`وضعیت علاقه‌مندی به ${newStatus} تغییر کرد`);
                  // می‌توانید وضعیت را در کامپوننت والد هم آپدیت کنید
                }}
              />
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-slate-700 mt-6 md:mt-8">
          <div className="flex overflow-x-auto border-b border-gray-200 dark:border-slate-700">
            {[
              { id: 'details', label: 'جزئیات محصول' },
              { id: 'ingredients', label: 'مواد تشکیل دهنده' },
              { id: 'nutrition', label: 'ارزش غذایی' },
              { id: 'reviews', label: `نظرات (${product.review_count.toLocaleString('fa-IR')})` }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 md:px-6 py-3 text-sm md:text-base font-medium transition whitespace-nowrap focus:outline-none border-b-2 ${activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-text-secondary hover:text-primary hover:border-gray-300'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="p-4 md:p-6 min-h-[200px]">
            {activeTab === 'details' && <ProductDetailsTab product={product} />}
            {activeTab === 'ingredients' && <ProductIngredientsTab product={product} />}
            {activeTab === 'nutrition' && <ProductNutritionTab product={product} />}
            {activeTab === 'reviews' && (
              <ProductReviewsTab
                reviews={reviews}
                loading={reviewsLoading}
                error={reviewsError}
                isAuthenticated={isAuthenticated}
                reviewCount={product.review_count}
                productSlug={product.slug}
                onReviewSubmitted={fetchReviewsData}
              />
            )}
          </div>
        </div>
      </div>

      <div className="mt-16">
        <h2 className="text-2xl font-bold text-dark font-heading mb-6">محصولات مشابه</h2>
        {suggestedLoading && <p className="text-text-secondary col-span-full text-center py-8">در حال بارگذاری محصولات مشابه...</p>}
        {suggestedError && <p className="text-red-600 col-span-full text-center py-8">{suggestedError}</p>}
        {!suggestedLoading && !suggestedError && suggestedProducts.length === 0 && (
          <p className="text-text-secondary col-span-full text-center py-8">محصول مشابهی یافت نشد.</p>
        )}
        {!suggestedLoading && !suggestedError && suggestedProducts.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {suggestedProducts.map((suggestedCake) => (
              <ProductCard key={suggestedCake.id} cake={suggestedCake} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
};

export default ProductDetailPage;