// src/components/admin/products/form/ProductOptionsSection.tsx
import React from 'react';
import { UseFormReturn, Controller, useFieldArray } from 'react-hook-form';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlusCircle, faTrash, faRulerCombined } from '@fortawesome/free-solid-svg-icons';
import type { ProductFormValues } from '../../../../pages/admin/products/AdminProductFormPage';
import { Flavor, Addon, Size, ProductSizeVariant } from '../../../../types';
import { Link as RouterLink, useNavigate } from 'react-router-dom';

interface ProductOptionsSectionProps {
    formMethods: UseFormReturn<ProductFormValues>;
    allFlavors: Flavor[];
    allAddons: Addon[];
    allSizes: Size[];
}

const labelClasses = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";
const errorMessageClasses = "mt-1 text-sm text-red-600 dark:text-red-400";
const sectionCardClasses = "bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700";
const baseInputClasses = "w-full px-3 py-1.5 border rounded-lg focus:outline-none focus:ring-2 bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-200 text-sm";
const defaultInputClasses = "border-gray-300 dark:border-slate-600 focus:ring-amber-500 focus:border-transparent";
const errorInputClasses = "border-red-500 dark:border-red-500 focus:ring-red-500 focus:border-transparent";
const checkboxLabelClasses = "mr-2 rtl:ml-2 rtl:mr-0 text-sm text-gray-700 dark:text-gray-300 cursor-pointer select-none";
const checkboxInputClasses = "h-4 w-4 text-amber-600 border-gray-300 dark:border-slate-600 rounded focus:ring-amber-500 dark:bg-slate-900 dark:focus:ring-offset-slate-800 cursor-pointer";

const ProductOptionsSection: React.FC<ProductOptionsSectionProps> = ({
    formMethods,
    allFlavors,
    allAddons,
    allSizes,
}) => {
    console.log("All sizes received in ProductOptionsSection:", allSizes); // لاگ در فرزند

    const { control, register, formState: { errors }, setValue, watch } = formMethods;
    const navigate = useNavigate();

    // --- Flavors ---
    const selectedFlavorIds = watch('available_flavor_ids') || [];
    const handleFlavorChange = (flavorId: number) => {
        const currentSelected = new Set(selectedFlavorIds);
        if (currentSelected.has(flavorId)) currentSelected.delete(flavorId);
        else currentSelected.add(flavorId);
        setValue('available_flavor_ids', Array.from(currentSelected), { shouldValidate: true, shouldDirty: true });
    };

    // --- Addons ---
    const selectedAddonIds = watch('available_addon_ids') || [];
    const handleAddonChange = (addonId: number) => {
        const currentSelected = new Set(selectedAddonIds);
        if (currentSelected.has(addonId)) currentSelected.delete(addonId);
        else currentSelected.add(addonId);
        setValue('available_addon_ids', Array.from(currentSelected), { shouldValidate: true, shouldDirty: true });
    };

    // --- Size Variants ---
    const { fields: sizeVariantFields, append: appendSizeVariant, remove: removeSizeVariant } = useFieldArray({
        control,
        name: "size_variants"
    });

    const addNewSizeVariant = () => {
        appendSizeVariant({
            size: undefined as any, // Zod required error will trigger if not selected
            price_modifier: '', // Zod will transform to number or null
            estimated_weight_kg_override: '', // Zod will transform
            sku_variant: '',
            stock_quantity: '', // Zod will transform
            is_active_for_product: true,
        } as ProductSizeVariant); // Cast to satisfy initial undefined for size
    };

    const getAvailableSizesForVariantDropdown = (currentIndex: number): Size[] => {
        const currentFieldValue = watch(`size_variants.${currentIndex}.size` as const);
        const selectedInOtherRows = sizeVariantFields
            .filter((_, idx) => idx !== currentIndex)
            .map((_, idx) => watch(`size_variants.${idx}.size` as const))
            .filter(id => id !== undefined && id !== null) as number[];

        return allSizes.filter(s =>
            s.is_active &&
            (s.id === currentFieldValue || !selectedInOtherRows.includes(s.id))
        );
    };


    return (
        <div className={sectionCardClasses}> {/* Main card for options section */}
            <div className="form-section-header p-4 sm:p-6 border-b border-gray-200 dark:border-slate-700">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">گزینه‌ها و متغیرها</h3>
            </div>
            <div className="form-section-body p-4 sm:p-6 space-y-8">

                {/* Flavors Section */}
                <div className="p-4 border border-gray-200 dark:border-slate-700 rounded-md">
                    <div className="flex justify-between items-center mb-3">
                        <label className={labelClasses}>طعم‌های قابل انتخاب برای این محصول</label>
                        <button type="button" onClick={() => navigate('/admin/flavors/new', { replace: true })}
                            className="text-xs text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 font-medium flex items-center">
                            <FontAwesomeIcon icon={faPlusCircle} className="ml-1 rtl:mr-1" /> افزودن طعم جدید به سیستم
                        </button>
                    </div>
                    {allFlavors.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-6 gap-y-3">
                            {allFlavors.filter(f => f.is_active).map(flavor => (
                                <label key={flavor.id} className="inline-flex items-center">
                                    <input type="checkbox" className={checkboxInputClasses} checked={selectedFlavorIds.includes(flavor.id)} onChange={() => handleFlavorChange(flavor.id)} />
                                    <span className={checkboxLabelClasses}>{flavor.name}</span>
                                </label>
                            ))}
                        </div>
                    ) : (<p className="text-sm text-gray-500 dark:text-gray-400">هیچ طعم فعالی در سیستم برای انتخاب وجود ندارد.</p>)}
                    {errors.available_flavor_ids && <p className={errorMessageClasses}>{errors.available_flavor_ids.message}</p>}
                </div>

                {/* Addons Section */}
                <div className="p-4 border border-gray-200 dark:border-slate-700 rounded-md">
                    <div className="flex justify-between items-center mb-3">
                        <label className={labelClasses}>افزودنی‌های قابل انتخاب</label>
                        <button type="button" className="text-xs text-gray-400 cursor-not-allowed flex items-center" disabled>
                            <FontAwesomeIcon icon={faPlusCircle} className="ml-1 rtl:mr-1" /> مدیریت افزودنی‌ها
                        </button>
                    </div>
                    {allAddons && allAddons.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-6 gap-y-3">
                            {allAddons.filter(a => a.is_active).map(addon => (
                                <label key={addon.id} className="inline-flex items-center">
                                    <input type="checkbox" className={checkboxInputClasses} checked={selectedAddonIds.includes(addon.id)} onChange={() => handleAddonChange(addon.id)} />
                                    <span className={checkboxLabelClasses}>{addon.name} {addon.price && addon.price > 0 && `(‎+${Number(addon.price).toLocaleString('fa-IR')} ت)`}</span>
                                </label>
                            ))}
                        </div>
                    ) : (<p className="text-sm text-gray-500 dark:text-gray-400">هیچ افزودنی فعالی در سیستم برای انتخاب وجود ندارد.</p>)}
                    {errors.available_addon_ids && <p className={errorMessageClasses}>{errors.available_addon_ids.message}</p>}
                </div>

                {/* Size Variants Section */}
                <div className="p-4 border border-gray-200 dark:border-slate-700 rounded-md">
                    <div className="flex justify-between items-center mb-3">
                        <label className={labelClasses}>اندازه‌ها و مشخصات وابسته محصول</label>
                        <button type="button" onClick={() => navigate('/admin/sizes/new', { replace: true })}
                            className="text-xs text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 font-medium flex items-center">
                            <FontAwesomeIcon icon={faPlusCircle} className="ml-1 rtl:mr-1" /> افزودن اندازه جدید به سیستم
                        </button>
                    </div>

                    {sizeVariantFields.length === 0 && (
                        <div className="py-4 text-center">
                            <FontAwesomeIcon icon={faRulerCombined} className="text-3xl text-gray-300 dark:text-slate-600 mb-2" />
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                هنوز هیچ متغیر اندازه‌ای برای این محصول تعریف نشده است.
                            </p>
                        </div>
                    )}

                    <div className="space-y-6"> {/* فاصله بین هر ردیف اندازه */}
                        {sizeVariantFields.map((field, index) => {
                            const availableSizesForThisSelect = getAvailableSizesForVariantDropdown(index);
                            const sizeVariantItemErrors = errors.size_variants?.[index];
                            return (
                                <div key={field.id} className="p-4 border border-gray-300 dark:border-slate-600 rounded-lg relative bg-gray-50 dark:bg-slate-800/50">
                                    <button
                                        type="button"
                                        onClick={() => removeSizeVariant(index)}
                                        className="absolute top-2 left-2 rtl:right-auto rtl:left-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-1.5 rounded-full bg-white dark:bg-slate-700 hover:bg-red-50 dark:hover:bg-red-900/50 shadow-sm z-10"
                                        title="حذف این ردیف اندازه"
                                    >
                                        <FontAwesomeIcon icon={faTrash} />
                                    </button>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4 items-start">
                                        {/* Size Selection */}
                                        <div>
                                            <label htmlFor={`size_variants.${index}.size`} className={`${labelClasses} text-xs`}>
                                                اندازه <span className="text-red-500">*</span>
                                            </label>
                                            <Controller
                                                name={`size_variants.${index}.size`}
                                                control={control}
                                                defaultValue={field.size}
                                                render={({ field: controllerField }) => (
                                                    <select
                                                        {...controllerField}
                                                        id={`size_variants.${index}.size`}
                                                        className={`${baseInputClasses} ${sizeVariantItemErrors?.size ? errorInputClasses : defaultInputClasses} appearance-none pr-8 rtl:pl-8 rtl:pr-4`}
                                                        onChange={(e) => controllerField.onChange(e.target.value ? parseInt(e.target.value, 10) : undefined)}
                                                    >
                                                        <option value="">انتخاب کنید...</option>
                                                        {availableSizesForThisSelect.map(s => (
                                                            <option key={s.id} value={s.id}>{s.name} {s.estimated_weight_kg ? `(${s.estimated_weight_kg} ک‌گ)` : ''}</option>
                                                        ))}
                                                    </select>
                                                )}
                                            />
                                            {sizeVariantItemErrors?.size && <p className={errorMessageClasses}>{sizeVariantItemErrors.size.message}</p>}
                                        </div>

                                        {/* Price Modifier */}
                                        <div>
                                            <label htmlFor={`size_variants.${index}.price_modifier`} className={`${labelClasses} text-xs`}>تعدیل قیمت (تومان)</label>
                                            <div className="relative">
                                                <input type="text" id={`size_variants.${index}.price_modifier`}
                                                    {...register(`size_variants.${index}.price_modifier` as const)}
                                                    className={`${baseInputClasses} pr-12 rtl:pl-12 rtl:pr-3 text-left rtl:text-right ${sizeVariantItemErrors?.price_modifier ? errorInputClasses : defaultInputClasses}`}
                                                    placeholder="مثال: 50000 یا -10000" />
                                                <span className="absolute inset-y-0 right-3 rtl:left-3 rtl:right-auto flex items-center text-gray-400 dark:text-gray-500 text-xs pointer-events-none">تومان</span>
                                            </div>
                                            {sizeVariantItemErrors?.price_modifier && <p className={errorMessageClasses}>{sizeVariantItemErrors.price_modifier.message}</p>}
                                        </div>

                                        {/* Estimated Weight Override */}
                                        <div>
                                            <label htmlFor={`size_variants.${index}.estimated_weight_kg_override`} className={`${labelClasses} text-xs`}>وزن خاص این متغیر (ک‌گ)</label>
                                            <div className="relative">
                                                <input type="text" id={`size_variants.${index}.estimated_weight_kg_override`}
                                                    {...register(`size_variants.${index}.estimated_weight_kg_override` as const)}
                                                    className={`${baseInputClasses} pr-10 rtl:pl-10 rtl:pr-3 text-left rtl:text-right ${sizeVariantItemErrors?.estimated_weight_kg_override ? errorInputClasses : defaultInputClasses}`}
                                                    placeholder="پیش‌فرض اندازه را override می‌کند" />
                                                <span className="absolute inset-y-0 right-3 rtl:left-3 rtl:right-auto flex items-center text-gray-400 dark:text-gray-500 text-xs pointer-events-none">ک‌گ</span>
                                            </div>
                                            {sizeVariantItemErrors?.estimated_weight_kg_override && <p className={errorMessageClasses}>{sizeVariantItemErrors.estimated_weight_kg_override.message}</p>}
                                        </div>

                                        {/* SKU Variant */}
                                        <div>
                                            <label htmlFor={`size_variants.${index}.sku_variant`} className={`${labelClasses} text-xs`}>SKU متغیر (اختیاری)</label>
                                            <input type="text" id={`size_variants.${index}.sku_variant`}
                                                {...register(`size_variants.${index}.sku_variant` as const)}
                                                className={`${baseInputClasses} ${sizeVariantItemErrors?.sku_variant ? errorInputClasses : defaultInputClasses}`}
                                                placeholder="شناسه انبار برای این اندازه" />
                                            {sizeVariantItemErrors?.sku_variant && <p className={errorMessageClasses}>{sizeVariantItemErrors.sku_variant.message}</p>}
                                        </div>

                                        {/* Stock Quantity */}
                                        <div>
                                            <label htmlFor={`size_variants.${index}.stock_quantity`} className={`${labelClasses} text-xs`}>موجودی انبار (اختیاری)</label>
                                            <input type="number" id={`size_variants.${index}.stock_quantity`}
                                                {...register(`size_variants.${index}.stock_quantity` as const)}
                                                className={`${baseInputClasses} ${sizeVariantItemErrors?.stock_quantity ? errorInputClasses : defaultInputClasses} text-left rtl:text-right`}
                                                placeholder="تعداد موجود" min="0" />
                                            {sizeVariantItemErrors?.stock_quantity && <p className={errorMessageClasses}>{sizeVariantItemErrors.stock_quantity.message}</p>}
                                        </div>

                                        {/* Is Active for this Product-Size Variant */}
                                        <div className="flex items-center pt-5">
                                            <Controller
                                                name={`size_variants.${index}.is_active_for_product` as const}
                                                control={control}
                                                defaultValue={true}
                                                render={({ field }) => (
                                                    <label className="inline-flex items-center cursor-pointer">
                                                        <input type="checkbox" className={checkboxInputClasses} checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />
                                                        <span className={`${checkboxLabelClasses} text-xs`}>این اندازه برای محصول فعال است</span>
                                                    </label>
                                                )}
                                            />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <button
                        type="button"
                        onClick={addNewSizeVariant}
                        className="mt-6 px-4 py-2 border border-dashed border-amber-500 text-amber-600 dark:text-amber-400 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-800/30 text-sm font-medium flex items-center"
                    >
                        <FontAwesomeIcon icon={faPlusCircle} className="ml-2 rtl:mr-2" />
                        افزودن متغیر اندازه جدید
                    </button>
                    {errors.size_variants && typeof errors.size_variants.message === 'string' && (
                        <p className={`${errorMessageClasses} mt-2`}>{errors.size_variants.message}</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductOptionsSection;