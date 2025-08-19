// src/components/Products/NotesInput.tsx
import React from 'react';

interface NotesInputProps {
    notes: string;
    onNotesChange: (notes: string) => void;
    disabled?: boolean;
    maxLength?: number;
}

const NotesInput: React.FC<NotesInputProps> = ({ notes, onNotesChange, disabled = false, maxLength = 50 }) => {
    return (
        <div className="mb-6">
            <h3 className="font-bold text-lg mb-3 text-dark">یادداشت سفارشی (اختیاری)</h3>
            <textarea
                placeholder={`متن مورد نظر برای روی کیک (حداکثر ${maxLength} کاراکتر)`}
                value={notes}
                onChange={(e) => onNotesChange(e.target.value)}
                className="w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent text-sm disabled:opacity-50"
                maxLength={maxLength}
                rows={3}
                disabled={disabled}
            ></textarea>
        </div>
    );
};

export default NotesInput;