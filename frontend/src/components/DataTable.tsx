import React from 'react';

interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
}

export function DataTable<T>({
  columns,
  data,
  loading = false,
  emptyMessage = 'No records found'
}: DataTableProps<T>) {
  return (
    <div className="w-full overflow-hidden rounded-2xl border border-white/5 bg-[#111726]/40 backdrop-blur-md shadow-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/5 bg-[#161d30]/50 text-xs font-semibold uppercase tracking-wider text-slate-400">
              {columns.map((c, i) => (
                <th key={i} className={`p-4 ${c.className || ''}`}>
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-sm text-slate-300">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="p-8 text-center text-slate-500 italic">
                  Loading records...
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="p-8 text-center text-slate-500 italic">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className="transition-colors duration-150 hover:bg-[#161d30]/20"
                >
                  {columns.map((c, colIndex) => (
                    <td key={colIndex} className={`p-4 ${c.className || ''}`}>
                      {typeof c.accessor === 'function'
                        ? c.accessor(row)
                        : (row[c.accessor] as unknown as React.ReactNode)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
