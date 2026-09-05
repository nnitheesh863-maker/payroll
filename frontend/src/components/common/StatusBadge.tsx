import React from 'react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const normalized = status.toUpperCase().replace(/\s+/g, '_');

  let bg = 'bg-slate-100 text-slate-700 border-slate-200';

  if (['ACTIVE', 'PRESENT', 'APPROVED', 'PAID', 'VALIDATED'].includes(normalized)) {
    bg = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  } else if (['PENDING', 'DRAFT', 'COMPUTED', 'HALF_DAY'].includes(normalized)) {
    bg = 'bg-amber-50 text-amber-700 border-amber-200';
  } else if (['LATE', 'ON_LEAVE'].includes(normalized)) {
    bg = 'bg-blue-50 text-blue-700 border-blue-200';
  } else if (['REJECTED', 'TERMINATED', 'EXPIRED', 'ABSENT'].includes(normalized)) {
    bg = 'bg-rose-50 text-rose-700 border-rose-200';
  }

  const sizeCls = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${bg} ${sizeCls} uppercase tracking-wider`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-70"></span>
      {status.replace(/_/g, ' ')}
    </span>
  );
};
