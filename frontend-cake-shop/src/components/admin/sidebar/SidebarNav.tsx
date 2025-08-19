// src/components/admin/sidebar/SidebarNav.tsx
import React from 'react';
import NavSection from './NavSection';
import NavItem, { NavItemProps as SingleNavItemProps } from './NavItem'; // NavItemProps را از NavItem ایمپورت می‌کنیم

// اینترفیس‌ها را اینجا هم تعریف می‌کنیم یا از یک فایل types مشترک ایمپورت می‌کنیم
export interface NavItemData extends SingleNavItemProps {
  isSidebarOpen?: boolean;
} // برای سازگاری با داده navSections

export interface NavSectionData {
  title?: string;
  items: NavItemData[];
}

interface SidebarNavProps {
  sections: NavSectionData[];
  isSidebarOpen: boolean;
}

const SidebarNav: React.FC<SidebarNavProps> = ({ sections, isSidebarOpen }) => {
  return (
    <div className="flex-grow overflow-y-auto overflow-x-hidden pt-2">
      <div className={`space-y-1 ${isSidebarOpen ? 'p-2' : 'p-1.5'}`}> {/* تنظیم پدینگ در حالت بسته */}
        {sections.map((section, index) => (
          <div key={section.title || `section-${index}`} className="mb-1">
            {/* فقط اگر سایدبار باز است و عنوان وجود دارد، آن را نمایش بده */}
            {section.title && isSidebarOpen && <NavSection title={section.title} />}

            {/* اگر سایدبار بسته است و عنوان وجود دارد، می‌توان یک خط جداکننده کوچک یا فضای خالی نمایش داد (اختیاری) */}
            {/* {section.title && !isSidebarOpen && <hr className="my-2 border-gray-200 dark:border-gray-700" />} */}

            <ul className="space-y-0.5">
              {section.items.map((item) => (
                <li key={item.href}>
                  <NavItem
                    label={item.label}
                    href={item.href}
                    icon={item.icon}
                    exact={item.exact}
                    badge={item.badge}
                    isSidebarOpen={isSidebarOpen} // <-- ارسال وضعیت سایدبار به هر NavItem
                  />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SidebarNav;