// src/theme.ts (مسیر فایل تم شما)
import { createTheme, alpha } from '@mui/material/styles'; // alpha برای ایجاد رنگ‌های روشن‌تر/تیره‌تر از رنگ اصلی است

// مقادیر رنگ و فونت از تعریف شما
const colorPrimary = '#F59E0B';
const colorSecondary = '#D97706';
const colorAccent = '#B45309'; // این رنگ را می‌توانیم به عنوان secondary.dark یا یک رنگ سفارشی استفاده کنیم
const colorTextMain = '#374151';
const colorTextSecondary = '#6B7280';
const colorBackgroundLight = '#FFFBEB';
const colorBackgroundLightAlt = '#FEF3C7'; // می‌تواند برای primary.light استفاده شود

const fontHeading = '"Playfair Display", serif'; // نقل قول‌ها برای نام‌های فونت با فاصله مهم هستند
const fontBody = '"Vazirmatn", "Poppins", sans-serif';
// const fontLogo = '"Playfair Display", serif'; // برای لوگو می‌توانید به صورت خاص در کامپوننت لوگو استفاده کنید

const theme = createTheme({
  palette: {
    primary: {
      main: colorPrimary, // --color-primary: #F59E0B;
      light: colorBackgroundLightAlt, // استفاده از --color-light-alt: #FEF3C7 به عنوان نسخه روشن‌تر primary
      dark: colorSecondary,       // استفاده از --color-secondary: #D97706 به عنوان نسخه تیره‌تر primary
      contrastText: '#FFFFFF', // رنگ متن روی پس‌زمینه primary (معمولاً سفید یا سیاه)
    },
    secondary: {
      main: colorAccent, // استفاده از --color-accent: #B45309 به عنوان رنگ secondary
      // می‌توانید light و dark برای secondary هم تعریف کنید اگر لازم است
      // light: alpha(colorAccent, 0.8),
      // dark: alpha(colorAccent, 0.6),
      contrastText: '#FFFFFF',
    },
    // (اختیاری) می‌توانید یک رنگ accent مجزا هم تعریف کنید اگر MUI آن را مستقیماً پشتیبانی نمی‌کند
    // accent: {
    //   main: colorAccent,
    // },
    background: {
      default: colorBackgroundLight, // --color-light: #FFFBEB;
      paper: '#FFFFFF', // پس‌زمینه کامپوننت‌هایی مانند Paper, Card و ... (می‌توانید این را هم به colorBackgroundLight تغییر دهید اگر تمایل دارید)
    },
    text: {
      primary: colorTextMain,       // --color-text-main: #374151;
      secondary: colorTextSecondary,  // --color-text-secondary: #6B7280;
    },
    // می‌توانید رنگ‌های error, warning, info, success را هم سفارشی کنید
    // error: { main: '#D32F2F' },
    // warning: { main: '#FFA000' },
  },
  typography: {
    fontFamily: fontBody, // فونت پیش‌فرض بدنه متن --font-body
    // تنظیم فونت برای عناوین مختلف
    h1: { fontFamily: fontHeading },
    h2: { fontFamily: fontHeading },
    h3: { fontFamily: fontHeading },
    h4: { fontFamily: fontHeading },
    h5: { fontFamily: fontHeading },
    h6: { fontFamily: fontHeading },
    // می‌توانید فونت دکمه‌ها، کپشن‌ها و ... را هم مشخص کنید
    button: {
      fontFamily: fontBody, // یا فونت دیگری اگر مایلید
      // textTransform: 'none', // برای جلوگیری از بزرگ شدن تمام حروف دکمه‌ها (پیش‌فرض MUI)
    },
    // ... سایر تنظیمات تایپوگرافی
  },
  // (اختیاری) بازنویسی استایل‌های پیش‌فرض کامپوننت‌های خاص
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8, // مثال: گرد کردن گوشه‌های تمام دکمه‌ها
          // textTransform: 'none', // اگر می‌خواهید در همه جا اعمال شود
        },
        // می‌توانید برای variant های مختلف هم استایل تعریف کنید
        // containedPrimary: {
        //   '&:hover': {
        //     backgroundColor: colorSecondary, // تغییر رنگ هاور دکمه primary
        //   }
        // }
      },
    },
    MuiPaper: { // برای Paper که در CartPage استفاده شد
      styleOverrides: {
        root: {
          // backgroundColor: colorBackgroundLight, // اگر می‌خواهید Paper هم پس‌زمینه روشن داشته باشد
        }
      }
    },
    // ... سایر کامپوننت‌ها
  }
});

export default theme;