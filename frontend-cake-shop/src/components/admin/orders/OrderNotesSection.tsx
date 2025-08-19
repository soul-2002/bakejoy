// src/components/admin/orders/OrderNotesSection.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faStickyNote, // برای یادداشت مشتری
    faClipboardList, // برای یادداشت‌های داخلی
    faPlusCircle,
    faSpinner
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../../contexts/AuthContext'; // مسیر صحیح
import { getInternalOrderNotes, addInternalOrderNote } from '../../../services/api'; // توابع API
import { InternalNote, User } from '../../../types'; // اینترفیس‌ها
import styles from './OrderNotesSection.module.css';
// استایل‌های CSS که قبلاً تعریف کردید را یا در یک فایل CSS جداگانه
// که به این کامپوننت import می‌کنید قرار دهید، یا اگر از Tailwind استفاده می‌کنید
// و می‌خواهید به صورت inline یا با افزونه typography پیاده‌سازی کنید، روش متفاوت خواهد بود.
// برای سادگی، فرض می‌کنیم شما این کلاس‌های CSS (.note-timeline, .note-timeline-dot) 
// را در یک فایل CSS سراسری یا فایل CSS مخصوص این کامپوننت تعریف کرده‌اید.
// import './OrderNotesSection.css'; // مثال برای ایمپورت CSS

interface OrderNotesSectionProps {
    orderId: number | null;
    customerNote?: string | null;
}

const OrderNotesSection: React.FC<OrderNotesSectionProps> = ({ orderId, customerNote }) => {
    const { accessToken, user: adminUser } = useAuth(); // کاربر ادمین فعلی از AuthContext
    const [internalNotes, setInternalNotes] = useState<InternalNote[]>([]);
    const [newInternalNoteText, setNewInternalNoteText] = useState('');
    const [loadingNotes, setLoadingNotes] = useState(false);
    const [errorNotes, setErrorNotes] = useState<string | null>(null);
    const [submittingNote, setSubmittingNote] = useState(false);

    const fetchInternalNotes = useCallback(async () => {
        if (!orderId || !accessToken) return;
        setLoadingNotes(true);
        setErrorNotes(null);
        try {
            const notes = await getInternalOrderNotes(accessToken, orderId);
            setInternalNotes(notes);
        } catch (error) {
            console.error("Failed to fetch internal notes:", error);
            setErrorNotes("خطا در دریافت یادداشت‌های داخلی.");
        } finally {
            setLoadingNotes(false);
        }
    }, [accessToken, orderId]);

    useEffect(() => {
        fetchInternalNotes();
    }, [fetchInternalNotes]);

    const handleAddInternalNote = async () => {
        if (!newInternalNoteText.trim() || !orderId || !accessToken) return;
        setSubmittingNote(true);
        setErrorNotes(null);
        try {
            // کاربر ادمین فعلی را به عنوان ثبت کننده یادداشت ارسال می‌کنیم
            // بک‌اند شما باید بتواند این user_id را دریافت و ذخیره کند یا از request.user استفاده کند.
            // اگر API شما user را از توکن می‌خواند، نیازی به ارسال آن نیست.
            const addedNote = await addInternalOrderNote(accessToken, orderId, newInternalNoteText);
            setInternalNotes(prevNotes => [addedNote, ...prevNotes]); // اضافه کردن به ابتدای لیست
            setNewInternalNoteText('');
        } catch (error: any) {
            console.error("Failed to add internal note:", error);
            setErrorNotes(error.message || "خطا در ثبت یادداشت داخلی.");
        } finally {
            setSubmittingNote(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Customer Notes - بخش یادداشت مشتری */}
            {customerNote && (
                <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-lg shadow-md border border-gray-200 dark:border-slate-700">
                    <h2 className="font-semibold text-lg text-gray-800 dark:text-gray-100 mb-3 flex items-center">
                        <FontAwesomeIcon icon={faStickyNote} className="ml-2 rtl:mr-2 text-amber-500 dark:text-amber-400" />
                        یادداشت مشتری
                    </h2>
                    {/* استایل این بخش را از طرح HTML خودتان الهام بگیرید */}
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/30 rounded-lg p-4">
                        <p className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap">{customerNote}</p>
                    </div>
                </div>
            )}

            {/* Internal Admin Notes - بخش یادداشت‌های داخلی ادمین */}
            <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-lg shadow-md border border-gray-200 dark:border-slate-700">
                <h2 className="font-semibold text-lg text-gray-800 dark:text-gray-100 mb-4 flex items-center">
                    <FontAwesomeIcon icon={faClipboardList} className="ml-2 rtl:mr-2 text-primary dark:text-amber-400" />
                    یادداشت داخلی ادمین
                </h2>

                {/* Note Form - فرم افزودن یادداشت */}
                <div className="mb-6">
                    <textarea
                        rows={3}
                        className="w-full  border-gray-300 dark:border-slate-600 rounded-lg p-3 
                 focus:ring-2 focus:ring-primary dark:focus:ring-amber-400  /* استفاده از رنگ primary برای focus ring */
                 focus:border-primary dark:focus:border-amber-400 
                 outline-none bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-200 text-sm transition-colors"             placeholder="یادداشت جدید خود را اینجا بنویسید..."
                        value={newInternalNoteText}
                        onChange={(e) => setNewInternalNoteText(e.target.value)}
                        disabled={submittingNote}
                    />
                    <button
                        onClick={handleAddInternalNote}
                        disabled={!newInternalNoteText.trim() || submittingNote}
                        className="mt-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-secondary dark:hover:bg-accent transition text-sm font-medium flex items-center disabled:opacity-50"       >
                        {submittingNote ? (
                            <FontAwesomeIcon icon={faSpinner} spin className="ml-2 rtl:mr-2" />
                        ) : (
                            <FontAwesomeIcon icon={faPlusCircle} className="ml-2 rtl:mr-2" />
                        )}
                        {submittingNote ? 'در حال ثبت...' : 'ثبت یادداشت'}
                    </button>
                    {errorNotes && !submittingNote && <p className="text-xs text-red-500 mt-1">{errorNotes}</p>}
                </div>

                {/* Notes Timeline - نمایش یادداشت‌ها به صورت تایم‌لاین */}
                {loadingNotes && <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">در حال بارگذاری یادداشت‌ها...</p>}
                {!loadingNotes && !errorNotes && internalNotes.length === 0 && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">هنوز هیچ یادداشت داخلی ثبت نشده است.</p>
                )}
                {/* نمایش خطا اگر واکشی اولیه ناموفق بود ولی در حال ثبت یادداشت جدید نیستیم */}
                {!loadingNotes && errorNotes && !submittingNote && internalNotes.length === 0 && (
                    <p className="text-sm text-red-500 dark:text-red-400 text-center py-4">{errorNotes}</p>
                )}

                {!loadingNotes && internalNotes.length > 0 && (
                    <div className="space-y-4 mt-4">
                        {internalNotes.map(note => (
                            <div key={note.id} className={styles.noteTimeline}> {/* کلاس از CSS شما */}
                                <div className={styles.noteTimelineDot}></div> {/* استایل نقطه تایم‌لاین */}
                                <div className="bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 rounded-lg p-3">
                                    <div className="flex justify-between items-start text-xs">
                                        <p className="text-gray-700 dark:text-gray-200 whitespace-pre-wrap flex-grow">{note.note_text}</p>
                                        <span className="text-gray-400 dark:text-gray-500 whitespace-nowrap mr-2 rtl:ml-2 shrink-0"> {/* shrink-0 برای جلوگیری از کوچک شدن */}
                                            {new Date(note.created_at).toLocaleString('fa-IR', { dateStyle: 'short', timeStyle: 'short' })}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        ثبت شده توسط: {note.user?.username || (note.user as User)?.first_name || 'سیستم'}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default OrderNotesSection;