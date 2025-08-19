// src/components/Products/ProductReviewsTab.tsx
import React, { useState } from 'react';
import type { Review } from '../../types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar as faStarSolid } from '@fortawesome/free-solid-svg-icons';
import { faFlag as faFlagRegular } from '@fortawesome/free-regular-svg-icons';
import { Link } from 'react-router-dom';
import { submitReview } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

// --- کامپوننت نمایش ستاره‌ها ---
const RatingStarsDisplay: React.FC<{ rating: number, size?: string }> = ({ rating, size = "text-sm" }) => {
    const fullStars = Math.floor(rating);
    if (rating <= 0) return null; // اگر امتیاز صفر یا منفی بود، چیزی نمایش نده
    return (
        <div className={`flex items-center space-x-1 space-x-reverse text-yellow-400 ${size}`}>
            {[...Array(fullStars)].map((_, i) => (
                <FontAwesomeIcon icon={faStarSolid} key={i} className="w-4 h-4" /> // اندازه ثابت برای ستاره‌ها
            ))}
        </div>
    );
};

// --- کامپوننت ورودی امتیاز ستاره‌ای ---
const RatingInput: React.FC<{ rating: number; onRatingChange: (rating: number) => void; disabled?: boolean }> = ({ rating, onRatingChange, disabled }) => {
    const [hoverRating, setHoverRating] = useState(0);
    return (
        <div className="flex items-center space-x-1 space-x-reverse text-2xl text-gray-300">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    disabled={disabled}
                    className={`transition-colors duration-150 focus:outline-none ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                    onClick={() => !disabled && onRatingChange(star)}
                    onMouseEnter={() => !disabled && setHoverRating(star)}
                    onMouseLeave={() => !disabled && setHoverRating(0)}
                    aria-label={`امتیاز ${star}`}
                >
                    <FontAwesomeIcon
                        icon={faStarSolid}
                        className={ (hoverRating >= star || rating >= star) ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-300' }
                    />
                </button>
            ))}
        </div>
    );
};

// --- Props کامپوننت اصلی ---
interface ProductReviewsTabProps {
    reviews: Review[];
    loading: boolean;
    error: string | null;
    isAuthenticated?: boolean;
    reviewCount?: number;
    productSlug?: string; // این prop برای ارسال نظر لازم است
    onReviewSubmitted?: () => void; // برای رفرش لیست بعد از ثبت نظر
}

const ProductReviewsTab: React.FC<ProductReviewsTabProps> = ({
    reviews,
    loading,
    error,
    isAuthenticated,
    reviewCount = 0, // مقدار پیش‌فرض
    productSlug,
    onReviewSubmitted
}) => {
    console.log("--- ProductReviewsTab: Rendering with Props ---", { reviews, loading, error, isAuthenticated, reviewCount, productSlug });

    const { accessToken } = useAuth();
    const [newRating, setNewRating] = useState<number>(0);
    const [newComment, setNewComment] = useState<string>('');
    const [isSubmittingReview, setIsSubmittingReview] = useState<boolean>(false);
    const [submissionError, setSubmissionError] = useState<string | null>(null);
    const [submissionSuccess, setSubmissionSuccess] = useState<string | null>(null);

    const handleReportReview = (reviewId: number) => { /* ... (فعلا خالی) ... */ alert('گزارش نظر پیاده‌سازی نشده'); };

    const handleReviewSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!productSlug || !accessToken || !isAuthenticated || newRating === 0) {
            setSubmissionError("برای ثبت نظر، لطفا ابتدا وارد شوید و امتیاز خود را انتخاب کنید.");
            return;
        }
        setIsSubmittingReview(true); setSubmissionError(null); setSubmissionSuccess(null);
        try {
            const reviewData = { rating: newRating, comment: newComment };
            await submitReview(productSlug, reviewData, accessToken);
            setSubmissionSuccess("نظر شما با موفقیت ثبت و پس از تایید نمایش داده خواهد شد."); // پیام بهتر
            setNewRating(0); setNewComment('');
            if (onReviewSubmitted) onReviewSubmitted();
        } catch (apiError: any) {
            const message = apiError.response?.data?.detail || apiError.response?.data?.message || (typeof apiError.response?.data === 'object' ? JSON.stringify(apiError.response.data) : apiError.message) || "خطا در ثبت نظر.";
            setSubmissionError(message);
            console.error("Review submission error:", apiError);
        } finally {
            setIsSubmittingReview(false);
        }
    };

    // --- VVVV بررسی اولیه لودینگ و خطا --- VVVV
    if (loading) {
        console.log("ProductReviewsTab: Showing Loading State");
        return <p className="text-text-secondary p-4 md:p-6 text-center">در حال بارگذاری نظرات...</p>;
    }
    if (error) {
        console.log("ProductReviewsTab: Showing Error State - ", error);
        return <p className="text-red-600 p-4 md:p-6 text-center">{error}</p>;
    }
    // --- ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ ---

    // اگر به اینجا برسیم یعنی نه لودینگ است و نه خطا
    console.log("ProductReviewsTab: Preparing to render main content. Reviews count:", reviews.length);

    return (
        <div id="reviews-tab" className="tab-content active">
            <h3 className="font-bold text-lg mb-6 text-dark">نظرات مشتریان ({reviewCount.toLocaleString('fa-IR')})</h3>

            {/* نمایش لیست نظرات یا پیام عدم وجود نظر */}
            {reviews.length === 0 ? (
                <>
                    {console.log("ProductReviewsTab: Rendering EMPTY state message.")}
                    <p className="text-text-secondary">هنوز نظری برای این محصول ثبت نشده است. شما اولین نفر باشید!</p>
                </>
            ) : (
                <>
                    {console.log("ProductReviewsTab: Rendering reviews LIST.")}
                    <div className="space-y-6">
                        {reviews.map((review) => (
                            <div key={review.id} className="border-b border-gray-200 pb-6 last:border-b-0 last:pb-0">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h4 className="font-semibold text-dark font-body">
                                            {review.user.first_name || review.user.last_name ? `${review.user.first_name ?? ''} ${review.user.last_name ?? ''}`.trim() : review.user.username}
                                        </h4>
                                        <div className="flex items-center gap-x-2 mt-1">
                                            <RatingStarsDisplay rating={review.rating} />
                                            <span className="text-gray-400 text-xs">
                                                {new Date(review.created_at).toLocaleDateString('fa-IR')}
                                            </span>
                                        </div>
                                    </div>
                                    <button onClick={() => handleReportReview(review.id)} className="text-gray-400 hover:text-red-500 text-xs" title="گزارش نظر نامناسب">
                                        <FontAwesomeIcon icon={faFlagRegular} />
                                    </button>
                                </div>
                                {review.comment && (
                                    <p className="text-text-secondary mt-2 text-sm leading-relaxed">{review.comment}</p>
                                )}
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* بخش فرم ثبت نظر جدید */}
            <div className="mt-8 pt-6 border-t border-gray-200">
                <h4 className="font-bold text-lg mb-4 text-dark">ثبت نظر جدید</h4>
                {isAuthenticated && accessToken ? ( // از پراپ isAuthenticated استفاده شد
                    (console.log("ProductReviewsTab: Rendering Review FORM because user is authenticated."),
                    <form onSubmit={handleReviewSubmit}>
                        <div className="mb-4">
                            <label className="block text-text-main mb-2 font-medium">امتیاز شما:</label>
                            <RatingInput
                                rating={newRating}
                                onRatingChange={setNewRating}
                                disabled={isSubmittingReview}
                            />
                        </div>
                        <div className="mb-4">
                            <label htmlFor="review-text" className="block text-text-main mb-2 font-medium">نظر شما:</label>
                            <textarea
                                id="review-text"
                                rows={4}
                                className="w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent text-sm disabled:opacity-50"
                                placeholder="تجربه خود از این محصول را بنویسید..."
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                disabled={isSubmittingReview}
                            />
                        </div>
                        {submissionError && <p className="text-red-600 text-sm mb-3">{submissionError}</p>}
                        {submissionSuccess && <p className="text-green-600 text-sm mb-3">{submissionSuccess}</p>}
                        <button
                            type="submit"
                            disabled={isSubmittingReview || newRating === 0}
                            className="bg-primary hover:bg-secondary text-white px-6 py-2 rounded-lg font-medium font-body transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmittingReview ? 'در حال ثبت...' : 'ثبت نظر'}
                        </button>
                    </form>)
                ) : (
                    (console.log("ProductReviewsTab: Rendering LOGIN PROMPT because user is NOT authenticated."),
                    <p className="text-text-secondary text-sm">برای ثبت نظر باید <Link to="/login" className="text-primary hover:underline">وارد شوید</Link>.</p>)
                )}
            </div>
        </div>
    );
};

export default ProductReviewsTab;