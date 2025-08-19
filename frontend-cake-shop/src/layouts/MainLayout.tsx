// src/layouts/MainLayout.tsx
import React, { useState } from 'react';
import { Outlet, Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// کامپوننت‌های MUI
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Link from '@mui/material/Link'; 
// برای فوتر
import IconButton from '@mui/material/IconButton'; // برای آیکون‌ها
import Footer from '../components/layouts/Footer'; // <-- ایمپورت فوتر جدید
import MobileMenu from '../components/layouts/MobileMenu';

// آیکون‌های MUI
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout'; // آیکون برای خروج

// تعریف رنگ‌ها و فونت‌های مورد نظر شما برای دسترسی آسان‌تر
const themeStyles = {
  colors: {
    primary: '#F59E0B',
    secondary: '#D97706',
    accent: '#B45309', // رنگ اصلی لوگو و هاورها
    dark: '#111827',
    light: '#FFFBEB',
    textMain: '#374151', // رنگ متن اصلی
    textSecondary: '#6B7280',
  },
  fonts: {
    heading: 'Playfair Display, serif',
    body: 'Vazirmatn, Poppins, sans-serif',
    logo: 'Playfair Display, serif',
  },
};

const MainLayout: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleToggleMobileMenu = () => {
    // مقدار قبلی state را می‌گیرد و آن را برعکس می‌کند
    setIsMobileMenuOpen(prev => !prev);
  };

  return (<Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
    <AppBar 
      
      position="sticky"
      sx={{
        bgcolor: 'white',
        color: themeStyles.colors.textMain,
        boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        zIndex: 0, // برای اطمینان از اینکه در بالای سایر کامپوننت‌ها قرار گیرد
      }}
      
    >
      <Container maxWidth="xl">
        <Toolbar disableGutters sx={{ justifyContent: 'space-between' }}>

          {/* Logo - با فعال شدن RTL این باید راست قرار گیرد */}
          <Typography
            component={RouterLink}
            to="/"
            sx={{
              fontFamily: themeStyles.fonts.logo,
              fontWeight: 700,
              fontSize: '1.8rem', // سایز تنظیم شده
              color: themeStyles.colors.accent,
              textDecoration: 'none',
              // در حالت RTL، این فاصله باید از سمت چپ باشد که MUI خودکار انجام می‌دهد
               // mr: 2, // <- نیاز نیست دستی تغییر دهیم
            }}
          >
            BAKEJÖY
          </Typography>

          {/* Navigation Links (Desktop) */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 3 }}>
             {/* ترتیب دکمه‌ها در RTL: خانه باید راست‌ترین باشد */}
            <Button component={RouterLink} to="/" sx={{ fontSize: '1rem', fontFamily: themeStyles.fonts.body, color: themeStyles.colors.textMain, textTransform: 'none', '&:hover': { color: themeStyles.colors.accent, bgcolor: 'transparent' } }}>خانه</Button>
            <Button component={RouterLink} to="/products" sx={{ fontSize: '1rem', fontFamily: themeStyles.fonts.body, color: themeStyles.colors.textMain, textTransform: 'none', '&:hover': { color: themeStyles.colors.accent, bgcolor: 'transparent' } }}>کیک‌ها</Button>
            
            <Button component={RouterLink} to="/supplies" sx={{ fontSize: '1rem', fontFamily: themeStyles.fonts.body, color: themeStyles.colors.textMain, textTransform: 'none', '&:hover': { color: themeStyles.colors.accent, bgcolor: 'transparent' } }}>لوازم جشن</Button><Button component={RouterLink} to="/about" sx={{ fontSize: '1rem', fontFamily: themeStyles.fonts.body, color: themeStyles.colors.textMain, textTransform: 'none', '&:hover': { color: themeStyles.colors.accent, bgcolor: 'transparent' } }}>درباره ما</Button>
            <Button component={RouterLink} to="/blog" sx={{ fontSize: '1rem', fontFamily: themeStyles.fonts.body, color: themeStyles.colors.textMain, textTransform: 'none', '&:hover': { color: themeStyles.colors.accent, bgcolor: 'transparent' } }}>مجله کیک</Button>
            <Button component={RouterLink} to="/contact" sx={{ fontSize: '1rem', fontFamily: themeStyles.fonts.body, color: themeStyles.colors.textMain, textTransform: 'none', '&:hover': { color: themeStyles.colors.accent, bgcolor: 'transparent' } }}>تماس با ما</Button>
          </Box>

          {/* User Actions - با فعال شدن RTL این بخش باید چپ قرار گیرد */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, md: 2 } }}>
            {/* ترتیب آیکون‌ها در RTL: منو باید چپ‌ترین باشد */}
            <IconButton component={RouterLink} to={isAuthenticated ? "/profile" : "/login"} sx={{ color: themeStyles.colors.textMain, display: { xs: 'none', md: 'inline-flex' }, '&:hover': { color: themeStyles.colors.accent, bgcolor: 'transparent' } }} title={isAuthenticated ? "پروفایل" : "ورود"}>
              <PersonOutlineIcon />
            </IconButton>
            <IconButton component={RouterLink} to="/cart" sx={{ color: themeStyles.colors.textMain, '&:hover': { color: themeStyles.colors.accent, bgcolor: 'transparent' } }} title="سبد خرید">
              <ShoppingCartOutlinedIcon />
            </IconButton>
            {isAuthenticated && (
              <IconButton onClick={handleLogout} sx={{ color: themeStyles.colors.textMain, display: { xs: 'none', md: 'inline-flex' }, '&:hover': { color: themeStyles.colors.accent, bgcolor: 'transparent' } }} title="خروج">
                <LogoutIcon />
              </IconButton>
            )}
            <IconButton onClick={handleToggleMobileMenu} sx={{ color: themeStyles.colors.textMain, display: { xs: 'inline-flex', md: 'none' }, '&:hover': { color: themeStyles.colors.accent, bgcolor: 'transparent' } }} title="منو">
              <MenuIcon />
            </IconButton>
          </Box>

        </Toolbar>
      </Container>
    </AppBar>

    {/* Main Content */}
    <Container maxWidth="xl" component="main" disableGutters sx={{pb: 4, flexGrow: 1 }}>
      <Outlet />
    </Container>

    <Footer />
    <MobileMenu
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)} // <-- تابع بستن مستقیم پاس داده شد
        />
  </Box>
);
};

export default MainLayout;