import React, { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';
import { FilterBar } from '../components/FilterBar';
import { Download, Eye, FileText } from 'lucide-react';

export const Reports: React.FC = () => {
  const [reportType, setReportType] = useState<'environmental' | 'social' | 'governance' | 'esg-summary' | 'custom'>('esg-summary');
  const [departments, setDepartments] = useState<any[]>([]);
  const [challenges, setChallenges] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  const [filters, setFilters] = useState<Record<string, string>>({
    departmentId: '',
    from: '',
    to: '',
    module: '',
    employeeId: '',
    challengeId: '',
    esgCategory: ''
  });

  const [previewData, setPreviewData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchMetadata = async () => {
    try {
      const [depts, chals, cats] = await Promise.all([
        apiRequest('/api/departments').catch(() => []),
        apiRequest('/api/challenges').catch(() => []),
        apiRequest('/api/categories').catch(() => [])
      ]);
      setDepartments(depts || []);
      setChallenges(chals || []);
      setCategories(cats || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPreview = async () => {
    setLoading(true);
    try {
      const type = reportType;
      let data;
      if (type === 'custom') {
        data = await apiRequest('/api/reports/custom?format=json', {
          method: 'POST',
          body: filters
        });
      } else {
        const params = new URLSearchParams();
        if (filters.departmentId) params.append('departmentId', filters.departmentId);
        if (filters.from) params.append('start', filters.from);
        if (filters.to) params.append('end', filters.to);
        if (filters.employeeId) params.append('employeeId', filters.employeeId);
        data = await apiRequest(`/api/reports/${type}?format=json&${params.toString()}`);
      }
      setPreviewData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetadata();
  }, []);

  useEffect(() => {
    fetchPreview();
  }, [reportType, filters]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = () => {
    setFilters({
      departmentId: '',
      from: '',
      to: '',
      module: '',
      employeeId: '',
      challengeId: '',
      esgCategory: ''
    });
  };

  const handleExport = async (format: string) => {
    try {
      const type = reportType;
      let res;
      const filename = `report-${type}-${Date.now()}.${format === 'xlsx' ? 'xlsx' : format === 'pdf' ? 'pdf' : 'csv'}`;
      const queryParams = new URLSearchParams({ format });
      const token = localStorage.getItem('token');

      if (type === 'custom') {
        const fetchRes = await fetch(`/api/reports/custom?${queryParams.toString()}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(filters)
        });
        res = await fetchRes.blob();
      } else {
        if (filters.departmentId) queryParams.append('departmentId', filters.departmentId);
        if (filters.from) queryParams.append('start', filters.from);
        if (filters.to) queryParams.append('end', filters.to);
        if (filters.employeeId) queryParams.append('employeeId', filters.employeeId);

        const fetchRes = await fetch(`/api/reports/${type}?${queryParams.toString()}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        res = await fetchRes.blob();
      }

      const url = window.URL.createObjectURL(res);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (err) {
      console.error(err);
    }
  };

  const reportFiltersConfig = [
    {
      key: 'departmentId',
      label: 'Department',
      type: 'select' as const,
      options: departments.map(d => ({ value: d.id, label: d.name }))
    },
    {
      key: 'from',
      label: 'Start Date',
      type: 'date' as const
    },
    {
      key: 'to',
      label: 'End Date',
      type: 'date' as const
    }
  ];

  const customFiltersConfig = [
    ...reportFiltersConfig,
    {
      key: 'module',
      label: 'Module',
      type: 'select' as const,
      options: [
        { value: 'ENVIRONMENTAL', label: 'Environmental' },
        { value: 'SOCIAL', label: 'Social' },
        { value: 'GOVERNANCE', label: 'Governance' },
        { value: 'GAMIFICATION', label: 'Gamification' }
      ]
    },
    {
      key: 'challengeId',
      label: 'Challenge',
      type: 'select' as const,
      options: challenges.map(c => ({ value: c.id, label: c.title }))
    },
    {
      key: 'esgCategory',
      label: 'Category',
      type: 'select' as const,
      options: categories.map(c => ({ value: c.id, label: c.name }))
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Reports & Disclosures</h1>
          <p className="text-slate-400 text-sm">Download ESG compliance reports and standard compliance formats.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExport('pdf')}
            className="flex items-center gap-2 px-4 py-2 bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 border border-rose-500/20 rounded-xl text-sm font-semibold transition"
          >
            <Download className="w-4 h-4" /> Export PDF
          </button>
          <button
            onClick={() => handleExport('xlsx')}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 rounded-xl text-sm font-semibold transition"
          >
            <Download className="w-4 h-4" /> Export Excel
          </button>
          <button
            onClick={() => handleExport('csv')}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-sm font-semibold transition"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 bg-[#161d30]/30 border border-white/5 p-4 rounded-2xl">
        <div className="flex flex-col gap-1 min-w-[180px]">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Report Type</span>
          <select
            value={reportType}
            onChange={e => setReportType(e.target.value as any)}
            className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 outline-none focus:border-emerald-500/50"
          >
            <option value="esg-summary">ESG Comprehensive Summary</option>
            <option value="environmental">Environmental (E)</option>
            <option value="social">Social (S)</option>
            <option value="governance">Governance (G)</option>
            <option value="custom">Custom report Builder</option>
          </select>
        </div>

        <FilterBar
          filters={reportType === 'custom' ? customFiltersConfig : reportType === 'social' ? [...reportFiltersConfig, { key: 'employeeId', label: 'Employee ID', type: 'text' as const, placeholder: 'Enter UUID...' }] : reportFiltersConfig}
          values={filters}
          onChange={handleFilterChange}
          onClear={handleClearFilters}
        />
      </div>

      <div className="p-6 bg-[#161d30]/30 border border-white/5 rounded-2xl min-h-[300px]">
        <div className="flex items-center gap-2 mb-4 border-b border-white/5 pb-2">
          <Eye className="w-5 h-5 text-indigo-400" />
          <h2 className="text-lg font-bold text-white">Live Dataset Preview</h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48 text-slate-500 italic text-sm">
            Fetching report records...
          </div>
        ) : !previewData ? (
          <div className="flex items-center justify-center h-48 text-slate-500 italic text-sm">
            No dataset loaded
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-950/30 p-4 rounded-xl border border-white/5">
              <div className="text-center">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Carbon Count</span>
                <span className="text-lg font-bold text-white">{previewData.carbonTransactions?.length || 0}</span>
              </div>
              <div className="text-center">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">CSR Count</span>
                <span className="text-lg font-bold text-white">{previewData.csrActivities?.length || 0}</span>
              </div>
              <div className="text-center">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Audits Count</span>
                <span className="text-lg font-bold text-white">{previewData.audits?.length || 0}</span>
              </div>
              <div className="text-center">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Challenges Count</span>
                <span className="text-lg font-bold text-white">{previewData.challenges?.length || 0}</span>
              </div>
            </div>

            {previewData.carbonTransactions?.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Carbon Emissions</h3>
                <div className="overflow-x-auto border border-white/5 rounded-xl bg-slate-950/20">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead>
                      <tr className="border-b border-white/5 bg-slate-900/40 font-semibold">
                        <th className="p-3">Department</th>
                        <th className="p-3">Source Type</th>
                        <th className="p-3">Quantity</th>
                        <th className="p-3">Calculated CO2e</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {previewData.carbonTransactions.map((t: any) => (
                        <tr key={t.id}>
                          <td className="p-3 font-semibold text-white">{t.department?.name || 'N/A'}</td>
                          <td className="p-3 uppercase">{t.sourceType}</td>
                          <td className="p-3">{Number(t.quantity).toFixed(1)} {t.unit}</td>
                          <td className="p-3 text-emerald-400 font-bold">{Number(t.calculatedCO2e).toFixed(1)} kg</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {previewData.csrActivities?.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">CSR Initiatives</h3>
                <div className="overflow-x-auto border border-white/5 rounded-xl bg-slate-950/20">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead>
                      <tr className="border-b border-white/5 bg-slate-900/40 font-semibold">
                        <th className="p-3">Activity</th>
                        <th className="p-3">Organizer</th>
                        <th className="p-3">Date</th>
                        <th className="p-3">Points</th>
                        <th className="p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {previewData.csrActivities.map((a: any) => (
                        <tr key={a.id}>
                          <td className="p-3 font-semibold text-white">{a.title}</td>
                          <td className="p-3">{a.department?.name || 'N/A'}</td>
                          <td className="p-3">{new Date(a.date).toLocaleDateString()}</td>
                          <td className="p-3 text-emerald-400 font-bold">{a.points}</td>
                          <td className="p-3 uppercase">{a.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {previewData.audits?.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Governance Audits</h3>
                <div className="overflow-x-auto border border-white/5 rounded-xl bg-slate-950/20">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead>
                      <tr className="border-b border-white/5 bg-slate-900/40 font-semibold">
                        <th className="p-3">Title</th>
                        <th className="p-3">Department</th>
                        <th className="p-3">Auditor</th>
                        <th className="p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {previewData.audits.map((au: any) => (
                        <tr key={au.id}>
                          <td className="p-3 font-semibold text-white">{au.title}</td>
                          <td className="p-3">{au.department?.name || 'N/A'}</td>
                          <td className="p-3">{au.auditor?.name || 'N/A'}</td>
                          <td className="p-3 uppercase">{au.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
