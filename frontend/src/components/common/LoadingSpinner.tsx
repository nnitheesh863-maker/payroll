import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', text }) => {
  const sizeMap = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-3">
      <div className={`animate-spin rounded-full border-2 border-slate-200 border-t-primary-600 ${sizeMap[size]}`} />
      {text && <p className="text-xs font-medium text-slate-500">{text}</p>}
    </div>
  );
};
