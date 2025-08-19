// src/components/admin/sms/SmsCreditWidget.tsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { getSmsCreditBalance } from '../../../services/api'; // تابع API جدید
import { FaPlus, FaSpinner } from 'react-icons/fa';

const SmsCreditWidget: React.FC = () => {
    const [credit, setCredit] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { accessToken } = useAuth();

    useEffect(() => {
        if (!accessToken) return;

        const fetchCredit = async () => {
            setIsLoading(true);
            try {
                const data = await getSmsCreditBalance(accessToken);
                setCredit(data.credit);
            } catch (error) {
                console.error("Failed to fetch SMS credit:", error);
                setCredit(null); // در صورت خطا، اعتبار را نامشخص نشان بده
            } finally {
                setIsLoading(false);
            }
        };

        fetchCredit();
    }, [accessToken]);

    const displayCredit = () => {
        if (isLoading) {
            return <FaSpinner className="fa-spin text-primary" />;
        }
        if (credit === null) {
            return <span className="text-red-500 text-sm">خطا در دریافت</span>;
        }
        return (
            <>
                {credit.toLocaleString('fa-IR')}
                <span className="text-sm font-normal text-gray-500 dark:text-gray-400 mr-1">پیامک</span>
            </>
        );
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm mb-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="font-medium text-gray-700 dark:text-gray-200">اعتبار پیامک باقیمانده</h3>
                    <p className="text-2xl font-bold text-primary mt-1">
                        {displayCredit()}
                    </p>
                </div>
                <button className="bg-primary hover:bg-yellow-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                    <FaPlus /> خرید اعتبار جدید
                </button>
            </div>
        </div>
    );
};

export default SmsCreditWidget;

