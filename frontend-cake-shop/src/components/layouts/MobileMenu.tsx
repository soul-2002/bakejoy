import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext'; // ۱. ایمپورت هوک useAuth

// آیکون‌ها
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faUser, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

// ۲. لینک لوازم جشن به لیست اضافه شد
const menuLinks = [
  { name: 'خانه', href: '/' },
  { name: 'کیک‌ها', href: '/products' },
  { name: 'لوازم جشن', href: '/supplies' },
  { name: 'درباره ما', href: '/about' },
  { name: 'مجله کیک', href: '/blog' },
  { name: 'تماس با ما', href: '/contact' },
];

const MobileMenu: React.FC<MobileMenuProps> = ({ isOpen, onClose }) => {
  const { isAuthenticated, logout } = useAuth(); // ۳. گرفتن وضعیت لاگین و تابع خروج
  const navigate = useNavigate();

  if (!isOpen) {
    return null;
  }

  const handleLinkClick = () => {
    onClose();
  };
  
  const handleLogout = () => {
    logout();
    onClose(); // بستن منو
    navigate('/'); // هدایت به صفحه اصلی
  };

  return (
    <div
      className={`fixed inset-0 bg-white z-[1001] transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      onClick={onClose}
    >
      <div
        className="container mx-auto px-6 py-4 h-full flex flex-col bg-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-8 flex-shrink-0">
          <span className="text-3xl font-bold text-amber-700" style={{fontFamily: 'Playfair Display, serif'}}>BAKEJÖY</span>
          <button onClick={onClose} className="text-gray-700 hover:text-amber-600">
            <FontAwesomeIcon icon={faTimes} size="2x" />
          </button>
        </div>

        <nav className="flex flex-col text-xl flex-grow overflow-y-auto">
          {menuLinks.map((link) => (
            <NavLink
              key={link.name}
              to={link.href}
              className={({ isActive }) => 
                `py-3 border-b border-gray-100 transition ${isActive ? 'text-amber-600 font-semibold' : 'text-gray-700 hover:text-amber-600'}`
              }
              onClick={handleLinkClick}
            >
              {link.name}
            </NavLink>
          ))}

          <div className="pt-8 mt-auto pb-6 space-y-4">
            {isAuthenticated ? (
              <>
                <Link
                  to="/profile"
                  className="flex items-center justify-center w-full text-center bg-amber-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-amber-600 transition"
                  onClick={handleLinkClick}
                >
                  <FontAwesomeIcon icon={faUser} className="ml-2" />
                  حساب کاربری
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center justify-center w-full text-center bg-gray-200 text-gray-800 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
                >
                  <FontAwesomeIcon icon={faSignOutAlt} className="ml-2" />
                  خروج
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="block w-full text-center bg-amber-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-amber-700 transition"
                onClick={handleLinkClick}
              >
                ورود / ثبت نام
              </Link>
            )}
          </div>
        </nav>
      </div>
    </div>
  );
};

export default MobileMenu;