import React, { useMemo } from 'react';

interface PasswordStrengthMeterProps {
  password?: string;
}

const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({ password = '' }) => {
  const requirements = useMemo(() => {
    const hasLength = password.length >= 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    
    let strength = 0;
    if (hasLength) strength += 33;
    if (hasUppercase) strength += 33;
    if (hasNumber) strength += 34;

    let strengthColor = 'bg-red-500';
    if (strength > 60) strengthColor = 'bg-amber-500';
    if (strength >= 100) strengthColor = 'bg-green-500';

    return {
      hasLength,
      hasUppercase,
      hasNumber,
      strength,
      strengthColor
    };
  }, [password]);

  return (
    <>
      <div className="password-strength">
        <div 
          className={`password-strength-bar ${requirements.strengthColor}`}
          style={{ width: `${requirements.strength}%` }}
        ></div>
      </div>
      <div className="text-xs text-gray-500 mt-1">
        <p className="text-gray-500">رمز عبور باید شامل:</p>
        <ul className="list-disc mr-4 mt-1 space-y-1">
          <li className={requirements.hasLength ? 'text-green-500' : 'text-gray-400'}>حداقل ۸ کاراکتر</li>
          <li className={requirements.hasUppercase ? 'text-green-500' : 'text-gray-400'}>حرف بزرگ (A-Z)</li>
          <li className={requirements.hasNumber ? 'text-green-500' : 'text-gray-400'}>عدد (0-9)</li>
        </ul>
      </div>
    </>
  );
};

export default PasswordStrengthMeter;