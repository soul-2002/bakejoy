// src/components/HowToOrder/StepCard.tsx
import React from 'react';
import type { StepData } from '../../types'; // مسیر types را تنظیم کنید

interface StepCardProps {
  step: StepData;
}

const StepCard: React.FC<StepCardProps> = ({ step }) => {
  return (
    <div className="flex flex-col items-center text-center max-w-xs">
      {/* شماره مرحله */}
      <div className="bg-accent text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mb-6">
        {step.stepNumber}
      </div>
      {/* عنوان مرحله */}
      <h3 className="text-xl font-semibold font-body mb-3 text-dark">{step.title}</h3> {/* font-body, text-dark */}
      {/* توضیحات مرحله */}
      <p className="text-text-secondary text-sm">{step.description}</p> {/* text-text-secondary */}
    </div>
  );
};

export default StepCard;