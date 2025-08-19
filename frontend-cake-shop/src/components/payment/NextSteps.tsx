// src/components/payment/NextSteps.tsx
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faTruck, faHeadset } from '@fortawesome/free-solid-svg-icons';

const NextSteps: React.FC = () => {
  const steps = [
    {
      icon: faCheckCircle,
      text: "جزئیات سفارش به شما پیامک شد.",
      colorClass: "text-green-500"
    },
    {
      icon: faTruck,
      text: "شما می‌توانید وضعیت سفارش خود را در بخش \"سفارشات من\" در پنل کاربری‌تان پیگیری کنید.",
      colorClass: "text-amber-500"
    },
    {
      icon: faHeadset,
      text: "در صورت هرگونه سوال با پشتیبانی BAKEJÖY تماس بگیرید.",
      colorClass: "text-blue-500"
    }
  ];

  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">مراحل بعدی</h2>
      <ul className="space-y-3 text-gray-700 dark:text-gray-200">
        {steps.map((step, index) => (
          <li key={index} className="flex items-start">
            <FontAwesomeIcon 
              icon={step.icon} 
              className={`mt-1 ml-3 flex-shrink-0 ${step.colorClass}`} 
            />
            <span>{step.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default NextSteps;
