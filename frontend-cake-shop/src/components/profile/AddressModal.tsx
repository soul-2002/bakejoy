import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';

import { addressSchema, type AddressFormData, type Address } from '../../schemas/addressSchema';
import { getProvinces, getCities } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import '../../app.css';

interface Location { id: number; name: string; }

interface AddressModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: AddressFormData) => Promise<void>;
    initialData?: Address | null;
}

const formInputClasses = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition";
const formLabelClasses = "block text-sm font-medium text-gray-700 mb-1";
const formErrorClasses = "text-red-500 text-xs mt-1";

const AddressModal: React.FC<AddressModalProps> = ({ isOpen, onClose, onSubmit, initialData }) => {
    const { accessToken } = useAuth();
    const {
        register,
        handleSubmit,
        reset,
        watch,
        setValue,
        formState: { errors, isSubmitting }
    } = useForm<AddressFormData>({
        resolver: zodResolver(addressSchema),
    });

    const [provinces, setProvinces] = useState<Location[]>([]);
    const [cities, setCities] = useState<Location[]>([]);
    const [citiesLoading, setCitiesLoading] = useState(false);
    const selectedProvinceId = watch('province');

    useEffect(() => {
        if (isOpen && accessToken) {
            getProvinces(accessToken).then(setProvinces);

            if (initialData?.province_id) {
                setCitiesLoading(true);
                getCities(String(initialData.province_id), accessToken)
                    .then(cityData => {
                        setCities(cityData);

                        // فقط بعد از اینکه شهرها کامل لود شد، مقدار شهر رو تنظیم کن
                        reset({
                            ...initialData,
                            province: String(initialData.province_id),
                            city: String(initialData.city_id),
                        });

                        setValue('province', String(initialData.province_id));
                        setValue('city', String(initialData.city_id));
                        console.log("🎯 initialData:", initialData);
                        console.log("📦 شهرها:", cityData);
                        console.log("✅ مقدار انتخاب شده برای شهر:", String(initialData.city_id));
                    })
                    .catch(console.error)
                    .finally(() => setCitiesLoading(false));
            } else {
                reset({ title: '', recipient_name: '', province: '', city: '', street: '', postal_code: '', phone_number: '', is_default: false });
                setCities([]);
            }
        }
    }, [isOpen, initialData, accessToken, reset, setValue]);

    // Effect ۲: این هوک فقط مسئول آپدیت شهرها هنگام تغییر دستی استان توسط کاربر است
    useEffect(() => {
        // اگر در حال لود اولیه هستیم یا استانی انتخاب نشده، این هوک را اجرا نکن
        if (!selectedProvinceId || !accessToken || (initialData && String(initialData.province_id) === selectedProvinceId)) {
            return;
        }

        setCitiesLoading(true);
        setValue('city', ''); // با تغییر دستی استان، شهر ریست می‌شود
        getCities(selectedProvinceId, accessToken)
            .then(setCities)
            .catch(console.error)
            .finally(() => setCitiesLoading(false));

    }, [selectedProvinceId, accessToken, setValue, initialData]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[1000]">
            <div className="modal-overlay fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
            <div className="flex items-center justify-center min-h-screen p-4">
                <div className="modal-content bg-white rounded-lg shadow-xl w-full max-w-md mx-auto relative z-10">
                    <div className="p-5 border-b border-gray-200 flex justify-between items-center">
                        <h3 className="text-lg font-bold text-gray-800">{initialData ? 'ویرایش آدرس' : 'افزودن آدرس جدید'}</h3>
                        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                            <FontAwesomeIcon icon={faTimes} />
                        </button>
                    </div>
                    <div className="p-5 max-h-[80vh] overflow-y-auto">
                        {/* در اینجا onSubmit را مستقیماً به handleSubmit پاس می‌دهیم */}
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

                            {/* ... تمام فیلدهای فرم شما ... */}
                            <div>
                                <label htmlFor="address-title" className={formLabelClasses}>عنوان آدرس</label>
                                <input {...register('title')} id="address-title" className={formInputClasses} placeholder="مثال: خانه، محل کار" />
                                {errors.title && <p className={formErrorClasses}>{errors.title.message}</p>}
                            </div>
                            <div>
                                <label htmlFor="full-name" className={formLabelClasses}>نام و نام خانوادگی گیرنده</label>
                                <input {...register('recipient_name')} id="full-name" className={formInputClasses} />
                                {errors.recipient_name && <p className={formErrorClasses}>{errors.recipient_name.message}</p>}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="province" className={formLabelClasses}>استان</label>
                                    <select {...register('province')} id="province" className={formInputClasses}>
                                        <option value="">انتخاب کنید</option>
                                        {provinces.map(p => <option key={p.id} value={String(p.id)}>{p.name}</option>)}
                                    </select>
                                    {errors.province && <p className={formErrorClasses}>{errors.province.message}</p>}
                                </div>
                                <div>
                                    <label htmlFor="city" className={formLabelClasses}>شهر</label>
                                    <select
                                        {...register('city')}
                                        id="city"
                                        value={watch('city') || ''} // به صورت کنترل‌شده برای اطمینان
                                        disabled={!selectedProvinceId || citiesLoading}
                                        className={`${formInputClasses} disabled:bg-gray-100`}
                                    >
                                        <option value="">ابتدا استان را انتخاب کنید</option>
                                        {citiesLoading && <option>در حال بارگذاری...</option>}
                                        {cities.map(c => (
                                            <option key={c.id} value={String(c.id)}>
                                                {c.name}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.city && <p className={formErrorClasses}>{errors.city.message}</p>}
                                </div>
                            </div>
                            <div>
                                <label htmlFor="address-details" className={formLabelClasses}>آدرس دقیق</label>
                                <textarea {...register('street')} id="address-details" rows={3} className={formInputClasses} placeholder="خیابان، کوچه، پلاک، واحد"></textarea>
                                {errors.street && <p className={formErrorClasses}>{errors.street.message}</p>}
                            </div>
                            <div>
                                <label htmlFor="postal-code" className={formLabelClasses}>کد پستی</label>
                                <input {...register('postal_code')} id="postal-code" className={formInputClasses} placeholder="۱۰ رقمی" />
                                {errors.postal_code ? <p className={formErrorClasses}>{errors.postal_code.message}</p> : <p className="text-xs text-gray-500 mt-1">کد پستی باید ۱۰ رقم باشد</p>}
                            </div>
                            <div>
                                <label htmlFor="phone_number" className={formLabelClasses}>شماره موبایل</label>
                                <input type="tel" {...register('phone_number')} id="phone_number" className={formInputClasses} placeholder="۰۹۱۲۳۴۵۶۷۸۹" />
                                {errors.phone_number && <p className={formErrorClasses}>{errors.phone_number.message}</p>}
                            </div>
                            <div className="flex items-center">
                                <input type="checkbox" {...register('is_default')} id="set-default" className="h-4 w-4 text-amber-500 focus:ring-amber-500 border-gray-300 rounded ml-2" />
                                <label htmlFor="set-default" className="text-sm text-gray-700">تنظیم به عنوان آدرس پیش‌فرض</label>
                            </div>

                            <div className="mt-6 flex justify-end space-x-3 space-x-reverse border-t border-gray-200 pt-5">
                                <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">انصراف</button>
                                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium disabled:opacity-50">
                                    {isSubmitting ? 'در حال ذخیره...' : 'ذخیره آدرس'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddressModal;