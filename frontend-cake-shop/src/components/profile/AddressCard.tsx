import React from 'react';
import type { Address } from '../../schemas/addressSchema';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrashAlt, faCheckCircle, faUser, faMapMarkerAlt, faMailBulk, faPhoneAlt } from '@fortawesome/free-solid-svg-icons';
import '../../app.css';
interface AddressCardProps {
  address: Address;
  onEdit: (address: Address) => void;
  onDelete: (id: number) => void;
  onSetDefault: (id:number) => void;
}

const AddressCard: React.FC<AddressCardProps> = ({ address, onEdit, onDelete, onSetDefault }) => {
     console.log('Address Card received data:', address);
      const fullAddress = [address.province_name, address.city_name, address.street]
    .filter(part => part)
    .join(', ');
  return (
    <div className="address-card bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden relative">
      {address.is_default && (
        <div className="absolute top-4 left-4">
          <span className="default-badge text-xs text-white px-2 py-1 rounded-full font-medium">پیش‌فرض</span>
        </div>
      )}
      <div className="p-5">
        <div className="flex justify-between items-start mb-3">
          <h4 className="font-bold text-gray-800">{address.title}</h4>
          <div className="flex space-x-2 space-x-reverse ">
            <button onClick={() => onEdit(address)} className="text-amber-500 hover:text-amber-600"><FontAwesomeIcon icon={faEdit} /></button>
            <button onClick={() => onDelete(address.id)} className="text-red-400 hover:text-red-500"><FontAwesomeIcon icon={faTrashAlt} /></button>
          </div>
        </div>
        <div className="space-y-2 text-sm text-gray-700">
          <p className="flex items-center"><FontAwesomeIcon icon={faUser} className="ml-2 text-gray-400 w-4" />{address.recipient_name}</p>
          <p className="flex items-center"><FontAwesomeIcon icon={faMapMarkerAlt} className="ml-2 text-gray-400 w-4" />{fullAddress}</p>
          <p className="flex items-center"><FontAwesomeIcon icon={faMailBulk} className="ml-2 text-gray-400 w-4" />{address.postal_code}</p>
          <p className="flex items-center"><FontAwesomeIcon icon={faPhoneAlt} className="ml-2 text-gray-400 w-4" />{address.phone_number}</p>
        </div>
      </div>
      {!address.is_default && (
        <div className="bg-gray-50 px-5 py-3 flex justify-end">
            <button onClick={() => onSetDefault(address.id)} className="text-sm text-gray-500 hover:text-amber-500">
                <FontAwesomeIcon icon={faCheckCircle} className="ml-1" />
                انتخاب به عنوان پیش‌فرض
            </button>
        </div>
      )}
    </div>
  );
};

export default AddressCard;