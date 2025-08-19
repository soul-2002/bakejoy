// src/components/admin/sidebar/Sidebar.tsx
import React from 'react';
import SidebarHeader from './SidebarHeader';
import SidebarNav, { NavSectionData } from './SidebarNav'; // NavSectionData را هم از SidebarNav بگیرید
import SidebarFooter from './SidebarFooter';

// آیکون‌های لازم را اینجا ایمپورت کنید
import {
  faTachometerAlt, faBirthdayCake, faTags, faIceCream, faRulerCombined, faPlusCircle,
  faShoppingCart, faUsers, faPercentage, faChartLine, faChartPie, faCog, faUserShield,
  faCommentAlt, faListAlt
} from '@fortawesome/free-solid-svg-icons';

interface SidebarProps {
  isOpen: boolean;            // برای کنترل عرض در دسکتاپ
  toggleSidebar: () => void;
}

const navSections: NavSectionData[] = [ // تایپ به NavSectionData تغییر کرد
  {
    items: [
      { label: 'پیشخوان', href: '/admin', icon: faTachometerAlt, exact: true },
    ],
  },
  {
    title: 'مدیریت محصولات',
    items: [
      { label: 'کیک‌ها', href: '/admin/products', icon: faBirthdayCake },
      { label: 'دسته‌بندی‌ها', href: '/admin/categories', icon: faTags },
      { label: 'طعم‌ها', href: '/admin/flavors', icon: faIceCream },
      { label: 'اندازه‌ها', href: '/admin/sizes', icon: faRulerCombined },
      { label: 'افزودنی‌ها', href: '/admin/addons', icon: faPlusCircle },
    ],
  },
  {
    title: 'مدیریت فروش',
    items: [
      { label: 'سفارشات', href: '/admin/orders', icon: faShoppingCart, badge: '۵ جدید' }, // badge را هم می‌توانید داینامیک کنید
      { label: 'مشتریان', href: '/admin/customers', icon: faUsers },
      { label: 'تخفیف‌ها', href: '/admin/discounts', icon: faPercentage },
    ],
  },
  {
    title: 'گزارش‌ها و تحلیل‌ها',
    items: [
      { label: 'گزارش فروش', href: '/admin/reports/sales', icon: faChartLine },
      { label: 'تحلیل محصولات', href: '/admin/reports/products', icon: faChartPie },
    ],
  },
  {
    title: 'تنظیمات',
    items: [
      { label: 'تنظیمات فروشگاه', href: '/admin/settings/store', icon: faCog },
      { label: 'کاربران ادمین', href: '/admin/settings/users', icon: faUserShield },
      { label: 'قالب‌های پیامک', href: '/admin/notification-settings/sms-templates', icon: faCommentAlt },
      { label: 'لاگ پیامک‌ها', href: '/admin/notification-settings/sms-logs', icon: faListAlt },
    ],
  },
];

const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar }) => {
  return (
           <aside
      id="sidebar"
      className={`
        bg-white dark:bg-slate-800 h-screen fixed rtl:right-0 top-0 shadow-lg 
        flex flex-col z-20
        transition-all duration-300 ease-in-out
        // عرض سایدبار در تمام اندازه‌های صفحه توسط isOpen کنترل می‌شود
        ${isOpen ? 'w-64' : 'w-20'}
      `}
    >
      <SidebarHeader 
        isOpen={isOpen} 
        toggleSidebar={toggleSidebar} 
      />
      <SidebarNav 
        sections={navSections} 
        isSidebarOpen={isOpen} 
      />
      <SidebarFooter 
        isOpen={isOpen} 
      />
    </aside>
  );
};


export default Sidebar;