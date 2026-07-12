import React from 'react';

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const norm = status?.toUpperCase() || 'PENDING';

  const badgeMap: Record<string, { bg: string; text: string; border: string }> = {
    ON_TRACK: {
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-400',
      border: 'border-emerald-500/20'
    },
    ACHIEVED: {
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-400',
      border: 'border-emerald-500/20'
    },
    AT_RISK: {
      bg: 'bg-amber-500/10',
      text: 'text-amber-400',
      border: 'border-amber-500/20'
    },
    MISSED: {
      bg: 'bg-rose-500/10',
      text: 'text-rose-400',
      border: 'border-rose-500/20'
    },
    PENDING: {
      bg: 'bg-indigo-500/10',
      text: 'text-indigo-400',
      border: 'border-indigo-500/20'
    },
    ACKNOWLEDGED: {
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-400',
      border: 'border-emerald-500/20'
    },
    RESOLVED: {
      bg: 'bg-teal-500/10',
      text: 'text-teal-400',
      border: 'border-teal-500/20'
    },
    CLOSED: {
      bg: 'bg-slate-500/10',
      text: 'text-slate-400',
      border: 'border-slate-500/20'
    },
    OPEN: {
      bg: 'bg-rose-500/10',
      text: 'text-rose-400',
      border: 'border-rose-500/20'
    },
    IN_PROGRESS: {
      bg: 'bg-blue-500/10',
      text: 'text-blue-400',
      border: 'border-blue-500/20'
    },
    COMPLETED: {
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-400',
      border: 'border-emerald-500/20'
    },
    PLANNED: {
      bg: 'bg-indigo-500/10',
      text: 'text-indigo-400',
      border: 'border-indigo-500/20'
    }
  };

  const style = badgeMap[norm] || {
    bg: 'bg-slate-500/10',
    text: 'text-slate-400',
    border: 'border-slate-500/20'
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${style.bg} ${style.text} ${style.border}`}
    >
      {norm.replace('_', ' ')}
    </span>
  );
};
