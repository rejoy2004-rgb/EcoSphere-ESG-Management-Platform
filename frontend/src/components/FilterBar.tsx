import React from 'react';

export interface FilterItem {
  key: string;
  label: string;
  type: 'select' | 'text' | 'date';
  options?: { value: string; label: string }[];
  placeholder?: string;
}

interface FilterBarProps {
  filters: FilterItem[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  onClear?: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  values,
  onChange,
  onClear
}) => {
  return (
    <div className="flex flex-wrap items-center gap-3 p-4 bg-[#161d30]/30 border border-white/5 rounded-2xl backdrop-blur-sm">
      {filters.map((f) => (
        <div key={f.key} className="flex flex-col gap-1 min-w-[150px]">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            {f.label}
          </span>
          {f.type === 'select' ? (
            <select
              value={values[f.key] || ''}
              onChange={(e) => onChange(f.key, e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800 text-xs text-slate-200 outline-none focus:border-emerald-500/50"
            >
              <option value="">All</option>
              {f.options?.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ) : f.type === 'date' ? (
            <input
              type="date"
              value={values[f.key] || ''}
              onChange={(e) => onChange(f.key, e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800 text-xs text-slate-200 outline-none focus:border-emerald-500/50"
            />
          ) : (
            <input
              type="text"
              placeholder={f.placeholder || 'Search...'}
              value={values[f.key] || ''}
              onChange={(e) => onChange(f.key, e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800 text-xs text-slate-200 outline-none focus:border-emerald-500/50"
            />
          )}
        </div>
      ))}
      {onClear && (
        <button
          onClick={onClear}
          className="mt-5 px-3 py-1.5 rounded-lg border border-slate-800 text-xs text-slate-400 hover:text-white hover:border-slate-700 transition"
        >
          Clear Filters
        </button>
      )}
    </div>
  );
};
