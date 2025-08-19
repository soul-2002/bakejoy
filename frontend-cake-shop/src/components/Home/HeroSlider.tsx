// src/components/Home/HeroSlider.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom'; // برای دکمه‌ها
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInstagram, faFacebook, faTwitter } from '@fortawesome/free-brands-svg-icons';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';

// تعریف نوع داده برای هر اسلاید
interface SlideData {
  id: number;
  titleHighlight: string;
  titleNormal: string;
  description: string;
  imageUrl: string;
  imageAlt: string;
  readMoreLink: string;
  orderNowLink: string;
}

// داده‌های نمونه برای اسلایدر (این داده‌ها باید از API یا props بیایند)
const sampleSlides: SlideData[] = [
  {
    id: 1,
    titleHighlight: 'تازه پخته شده',
    titleNormal: 'با عشق درست شده!',
    description: 'هر کیکی که می‌پزیم با عشق و بهترین مواد اولیه ساخته می‌شود تا شادی را به لحظات خاص شما بیاورد. تفاوت اشتیاق را بچشید.',
    imageUrl: '/images/02 1.png', // مسیر تصویر را تنظیم کنید
    imageAlt: 'کیک توت‌فرنگی خوشمزه',
    readMoreLink: '/about', // مسیر دلخواه
    orderNowLink: '/products', // مسیر دلخواه
  },
  {
    id: 2,
    titleHighlight: 'طعم‌های جدید',
    titleNormal: 'برای هر مناسبت!',
    description: 'مجموعه جدید کیک‌های ما را کشف کنید، مناسب برای جشن‌ها و دورهمی‌های شما.',
    imageUrl: '/images/cake-chocolate.png', // مسیر تصویر نمونه دیگر
    imageAlt: 'کیک شکلاتی غنی',
    readMoreLink: '/blog',
    orderNowLink: '/products',
  },
  {
    id: 3,
    titleHighlight: 'سفارش آسان',
    titleNormal: 'درب منزل تحویل بگیرید!',
    description: 'به راحتی کیک مورد علاقه خود را آنلاین سفارش دهید و در کمترین زمان تحویل بگیرید.',
    imageUrl: '/images/cake-vanilla.png', // مسیر تصویر نمونه دیگر
    imageAlt: 'کیک وانیلی کلاسیک',
    readMoreLink: '/contact',
    orderNowLink: '/products',
  },
];

// Props کامپوننت (اختیاری)
interface HeroSliderProps {
  slides?: SlideData[];
}

const HeroSlider: React.FC<HeroSliderProps> = ({ slides = sampleSlides }) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  const handleNextSlide = () => {
    setCurrentSlideIndex((prevIndex) =>
      prevIndex === slides.length - 1 ? 0 : prevIndex + 1
    );
  };

  const handlePrevSlide = () => {
    setCurrentSlideIndex((prevIndex) =>
      prevIndex === 0 ? slides.length - 1 : prevIndex - 1
    );
  };

  const handleGoToSlide = (index: number) => {
    setCurrentSlideIndex(index);
  };

  // داده‌های اسلاید فعلی
  const currentSlide = slides[currentSlideIndex];

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-pink-50 via-white to-amber-50"> {/* گرادینت پس‌زمینه نمونه */}
      <div className="px-6 md:px-10 lg:px-16 py-12 md:py-24 flex flex-col md:flex-row items-center min-h-[70vh]"> {/* ارتفاع حداقلی */}

        {/* Left Column - Text Content */}
        <div className="md:w-1/2 relative z-10 mb-12 md:mb-0 text-center md:text-right">
          {/* عنوان با فونت کوچکتر */}
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold font-heading mb-6 text-gray-800 leading-tight"> {/* *** تغییر: سایز فونت *** */}
            <span className="text-accent">{currentSlide.titleHighlight}</span><br />
            {currentSlide.titleNormal}
          </h1>
          <p className="text-text-secondary text-lg mb-8 max-w-lg mx-auto md:mx-0">
            {currentSlide.description}
          </p>

          {/* Social Icons */}
          <div className="flex justify-center md:justify-start gap-4 mb-8"> {/* <-- تغییر کرد */}
            <a href="#" className="text-text-secondary hover:text-accent transition duration-300">
              <FontAwesomeIcon icon={faInstagram} size="lg" />
            </a>
            <a href="#" className="text-text-secondary hover:text-accent transition duration-300">
              <FontAwesomeIcon icon={faFacebook} size="lg" />
            </a>
            <a href="#" className="text-text-secondary hover:text-accent transition duration-300">
              <FontAwesomeIcon icon={faTwitter} size="lg" />
            </a>
          </div>

          {/* Buttons */}
          <div className="flex flex-wrap gap-4 justify-center md:justify-start">
        {/* دکمه بیشتر بخوانید (Filled Primary) */}
        <Link
          to={currentSlide.readMoreLink}
          // VVVV مطمئن شوید className دقیقاً همین است VVVV
         className="px-8 py-3 bg-primary text-white rounded-full font-body font-medium hover:bg-secondary transition duration-300"
        >
          بیشتر بخوانید
        </Link>
        {/* دکمه سفارش دهید (Outlined Primary) */}
        <Link
          to={currentSlide.orderNowLink}
          // VVVV مطمئن شوید className دقیقاً همین است VVVV
          className="px-8 py-3 border-2 border-primary text-primary rounded-full font-body font-medium hover:bg-primary hover:text-white transition duration-300"
        >
          سفارش دهید
        </Link>
      </div>
        </div> {/* End of Left Column */}

        {/* Right Column - Image */}
        <div className="w-full md:w-1/2 relative mt-10 md:mt-0 flex justify-center items-center"> {/* flex justify-center برای اطمینان از مرکز بودن نگهدارنده */}
          {/* نگهدارنده عکس و آرک - عرض ثابت و وسط چین */}
          <div className="relative w-full max-w-lg mx-auto aspect-square"> {/* عرض و ارتفاع ثابت اینجا اعمال شد */}

            {/* آرک قوسی - حالا داخل نگهدارنده است */}
            <div className="pink-arch"></div> {/* استایل CSS این باید position:absolute; inset:0; ... باشد */}

            {/* عکس - حالا w-full و h-full نسبت به نگهدارنده */}
            <img
              src={currentSlide.imageUrl}
              alt={currentSlide.imageAlt}
              key={currentSlide.id}
              className="absolute inset-0 w-full h-full object-cover rounded-lg drop-shadow-2xl z-10 transform hover:scale-105 transition duration-500 ease-in-out"
            // کلاس‌های موقعیت absolute و w-full/h-full اضافه شد
            // drop-shadow صحیح است
            // rounded-lg اضافه شد (اگر روی عکس هم گردی میخواهید)
            />

            {/* دکمه‌های فلش - حالا نسبت به نگهدارنده بیرونی موقعیت می‌گیرند */}
            {/* مقادیر left/right آپدیت شد */}
            <button
              onClick={handleNextSlide}
              className="hidden md:block absolute left-[-20px] top-1/2 transform -translate-y-1/2 bg-white p-3 rounded-full shadow-md text-accent hover:bg-accent hover:text-white transition duration-300 z-20" // مثال: کمی بیرون زدگی با left منفی
              aria-label="اسلاید بعدی"
            >
              <FontAwesomeIcon icon={faChevronLeft} />
            </button>
            <button
              onClick={handlePrevSlide}
              className="hidden md:block absolute right-[-20px] top-1/2 transform -translate-y-1/2 bg-white p-3 rounded-full shadow-md text-accent hover:bg-accent hover:text-white transition duration-300 z-20" // مثال: کمی بیرون زدگی با right منفی
              aria-label="اسلاید قبلی"
            >
              <FontAwesomeIcon icon={faChevronRight} />
            </button>

          </div> {/* End of Image & Arch Container */}

          {/* Slider Controls (Dots) - بیرون از نگهدارنده عکس */}
          <div className="absolute left-1/2 transform -translate-x-1/2 -bottom-10 flex justify-center gap-3 mt-6 w-full">
            {slides.map((slide, index) => (
              <button
                key={slide.id}
                onClick={() => handleGoToSlide(index)}
                className={`w-3 h-3 rounded-full transition-colors duration-300 ${index === currentSlideIndex ? 'bg-primary' : 'bg-gray-300 hover:bg-gray-400'}`}
                aria-label={`رفتن به اسلاید ${index + 1}`}
              ></button>
            ))}
          </div>

        </div> {/* End of Right Column */}

      </div> {/* End of Container */}
      {/* دکمه‌های فلش قبلاً اینجا بودند و حذف شدند */}
    </section>
  );
};

export default HeroSlider;