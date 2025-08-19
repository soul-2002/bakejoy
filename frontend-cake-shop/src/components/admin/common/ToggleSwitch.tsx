// src/components/common/ToggleSwitch.tsx

import React from 'react';

interface ToggleSwitchProps {
  id: string;
  checked: boolean;
  onChange: (isChecked: boolean) => void;
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ id, checked, onChange }) => {
  return (
    <div className="relative inline-block w-10 align-middle select-none transition duration-200 ease-in">
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer peer"
      />
      <label
        htmlFor={id}
        className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer peer-checked:bg-green-400 peer-checked:border-green-400"
      ></label>
    </div>
  );
};