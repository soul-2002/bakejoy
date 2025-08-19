import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import type { Address, AddressFormData } from '../../schemas/addressSchema';
import { getAddresses, addAddress, updateAddress, deleteAddress, setDefaultAddress } from '../../services/api';

import AddressCard from '../../components/profile/AddressCard';
import AddressModal from '../../components/profile/AddressModal';
import DeleteConfirmModal from '../../components/profile/DeleteConfirmModal'; // <-- ایمپورت مودال جدید
import LoadingSpinner from '../../components/common/LoadingSpinner'; // <-- ایمپورت لودینگ

// تعریف state برای مودال‌ها
type ModalState = 
  | { type: 'NONE' }
  | { type: 'ADD' }
  | { type: 'EDIT', address: Address }
  | { type: 'DELETE', addressId: number };

const UserAddressesPage: React.FC = () => {
    const { accessToken } = useAuth();
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // state یکپارچه برای مدیریت مودال‌ها
    const [modalState, setModalState] = useState<ModalState>({ type: 'NONE' });

    const fetchAddresses = useCallback(async () => {
        if (!accessToken) return;
        setLoading(true);
        try {
            const data = await getAddresses(accessToken);
            setAddresses(data);
        } catch (e) {
            setError("خطا در دریافت لیست آدرس‌ها.");
        } finally {
            setLoading(false);
        }
    }, [accessToken]);

    useEffect(() => {
        fetchAddresses();
    }, [fetchAddresses]);

    const handleSave = async (data: AddressFormData) => {
        if (!accessToken) return;
        setIsSubmitting(true);
        try {
            if (modalState.type === 'EDIT') {
                const updatedAddress = await updateAddress(modalState.address.id, data, accessToken);
                // آپدیت لیست بدون درخواست مجدد
                setAddresses(prev => prev.map(addr => addr.id === updatedAddress.id ? updatedAddress : addr));
            } else if (modalState.type === 'ADD') {
                const newAddress = await addAddress(data, accessToken);
                // آپدیت لیست بدون درخواست مجدد
                setAddresses(prev => [newAddress, ...prev]);
            }
            setModalState({ type: 'NONE' });
        } catch (e) {
            alert("خطا در ذخیره آدرس.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteConfirm = async () => {
        if (modalState.type !== 'DELETE' || !accessToken) return;
        setIsSubmitting(true);
        try {
            await deleteAddress(modalState.data, accessToken);
            // آپدیت لیست بدون درخواست مجدد
            setAddresses(prev => prev.filter(addr => addr.id !== modalState.data));
            setModalState({ type: 'NONE' });
        } catch (e) {
            alert("خطا در حذف آدرس.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSetDefault = async (id: number) => {
        if (!accessToken) return;
        await setDefaultAddress(id, accessToken);
        // برای آپدیت وضعیت is_default در همه کارت‌ها، لیست را دوباره می‌گیریم
        await fetchAddresses(); 
    };

    if (loading) return <LoadingSpinner text="در حال بارگذاری آدرس‌ها..." />;
    if (error) return <div className="text-red-500 p-8 text-center">{error}</div>;

    return (
        <div className="p-4 md:p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-xl font-bold text-gray-800">آدرس‌های من</h1>
                <button onClick={() => setModalState({ type: 'ADD' })} className="px-4 py-2 bg-amber-500 text-white rounded-lg">
                    افزودن آدرس جدید
                </button>
            </div>

            {addresses.length === 0 ? (
                <div className="text-center py-12"> {/* Empty State */}
                    <h3 className="text-xl font-bold">شما هنوز هیچ آدرسی ثبت نکرده‌اید</h3>
                    <button onClick={() => setModalState({ type: 'ADD' })} className="mt-4 px-6 py-2 bg-amber-500 text-white rounded-lg">
                        افزودن اولین آدرس
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {addresses.map(addr => (
                        <AddressCard 
                            key={addr.id} 
                            address={addr} 
                            onEdit={() => setModalState({ type: 'EDIT', address: addr })}
                            onDelete={() => setModalState({ type: 'DELETE', addressId: addr.id })}
                            onSetDefault={handleSetDefault}
                        />
                    ))}
                </div>
            )}
            
            <AddressModal
                isOpen={modalState.type === 'ADD' || modalState.type === 'EDIT'}
                onClose={() => setModalState({ type: 'NONE' })}
                onSubmit={handleSave}
                initialData={modalState.type === 'EDIT' ? modalState.address : null}
            />
            
            <DeleteConfirmModal
                isOpen={modalState.type === 'DELETE'}
                onClose={() => setModalState({ type: 'NONE' })}
                onConfirm={handleDeleteConfirm}
                isDeleting={isSubmitting}
            />
        </div>
    );
};

export default UserAddressesPage;