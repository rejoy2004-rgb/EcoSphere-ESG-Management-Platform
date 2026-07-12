import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: string;
    positive: boolean;
  };
  color?: 'emerald' | 'blue' | 'amber' | 'indigo' | 'violet' | 'rose';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  trend,
  color = 'indigo'
}) => {
  const colorMap = {
    emerald: {
      bg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
      glow: 'shadow-emerald-500/5'
    },
    blue: {
      bg: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
      glow: 'shadow-blue-500/5'
    },
    amber: {
      bg: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
      glow: 'shadow-amber-500/5'
    },
    indigo: {
      bg: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400',
      glow: 'shadow-indigo-500/5'
    },
    violet: {
      bg: 'bg-violet-500/10 border-violet-500/20 text-violet-400',
      glow: 'shadow-violet-500/5'
    },
    rose: {
      bg: 'bg-rose-500/10 border-rose-500/20 text-rose-400',
      glow: 'shadow-rose-500/5'
    }
  };

  const selectedColor = colorMap[color] || colorMap.indigo;

  return (
    <div className={`p-6 rounded-2xl bg-[#161d30]/50 border border-white/5 shadow-lg backdrop-blur-sm transition-all duration-300 hover:border-white/10 hover:shadow-xl ${selectedColor.glow}`}>
      <div className="flex items-center justify-between mb-4">
        <span className="text-slate-400 text-sm font-medium">{title}</span>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${selectedColor.bg}`}>
          {icon}
        </div>
      </div>
      <div className="space-y-1">
        <h3 className="text-3xl font-bold text-white tracking-tight">{value}</h3>
        {trend && (
          <div className="flex items-center gap-1.5 text-xs font-semibold">
            <span className={trend.positive ? 'text-emerald-400' : 'text-rose-400'}>
              {trend.value}
            </span>
            <span className="text-slate-500">vs last month</span>
          </div>
        )}
      </div>
    </div>
  );
};
