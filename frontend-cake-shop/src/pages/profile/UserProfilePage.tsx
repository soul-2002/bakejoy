import React, { useState, useEffect } from 'react';
import UserProfileForm from '../../components/profile/UserProfileForm';
import ChangePasswordForm from '../../components/profile/ChangePasswordForm';
import { getUserProfile, updateUserProfile, changePassword } from '../../services/api'; // توابع API
import type { User } from '../../types';
import type { ProfileFormData, PasswordFormData } from '../../schemas/userProfileSchemas';

const UserProfilePage: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const userData = await getUserProfile(); // تابع API برای گرفتن اطلاعات کاربر
                setUser(userData);
            } catch (e) {
                setError("خطا در دریافت اطلاعات کاربری.");
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, []);

    const handleProfileUpdate = async (data: ProfileFormData) => {
        try {
            const updatedUser = await updateUserProfile(data);
            setUser(updatedUser);
            alert("اطلاعات با موفقیت به‌روز شد.");
        } catch (e) {
            alert("خطا در به‌روزرسانی اطلاعات.");
            // می‌توانید خطاهای مربوط به هر فیلد را هم از سرور گرفته و در فرم نمایش دهید
        }
    };

    const handlePasswordChange = async (data: PasswordFormData) => {
        try {
            await changePassword(data);
            alert("رمز عبور با موفقیت تغییر یافت.");
        } catch (e) {
             alert("خطا در تغییر رمز عبور. ممکن است رمز فعلی را اشتباه وارد کرده باشید.");
        }
    };

    if (loading) return <div>در حال بارگذاری...</div>;
    if (error) return <div className="text-red-500">{error}</div>;
    if (!user) return <div>اطلاعات کاربری یافت نشد.</div>

    return (
        <div className="p-4 md:p-8">
            <div className="max-w-5xl mx-auto">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">پروفایل من</h1>
                <UserProfileForm user={user} onSubmit={handleProfileUpdate} />
                <ChangePasswordForm onSubmit={handlePasswordChange} />
            </div>
        </div>
    );
};

export default UserProfilePage;