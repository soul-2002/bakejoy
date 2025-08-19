import React from 'react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean; // برای نمایش وضعیت لودینگ
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({ isOpen, onClose, onConfirm, isDeleting }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="modal-overlay absolute inset-0 bg-black/50" onClick={onClose}></div>
      <div className="modal-content bg-white rounded-lg shadow-xl w-full max-w-md mx-4 relative p-6">
        <h3 className="text-lg font-bold text-gray-800">حذف آدرس</h3>
        <p className="text-gray-600 mt-2">آیا از حذف این آدرس مطمئن هستید؟ این عمل قابل بازگشت نیست.</p>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} disabled={isDeleting} className="px-4 py-2 border rounded-lg disabled:opacity-50">
            انصراف
          </button>
          <button onClick={onConfirm} disabled={isDeleting} className="px-4 py-2 bg-red-600 text-white rounded-lg disabled:opacity-50">
            {isDeleting ? 'در حال حذف...' : 'بله، حذف شود'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;