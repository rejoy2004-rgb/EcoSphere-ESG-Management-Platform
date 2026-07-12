import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../utils/api';
import { FilterBar } from '../components/FilterBar';
import { StatCard } from '../components/StatCard';
import { StatusBadge } from '../components/StatusBadge';
import { Plus, Footprints, AlertTriangle, FileText, CheckCircle } from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

export const Environmental: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions' | 'goals' | 'factors'>('dashboard');
  
  const [departments, setDepartments] = useState<any[]>([]);
  const [filters, setFilters] = useState<Record<string, string>>({
    departmentId: '',
    from: '',
    to: '',
    sourceType: ''
  });

  const [dashboardData, setDashboardData] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [factors, setFactors] = useState<any[]>([]);

  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showFactorModal, setShowFactorModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);

  const [newTx, setNewTx] = useState({
    departmentId: '',
    sourceType: 'PURCHASE',
    quantity: '',
    unit: 'kWh',
    transactionDate: new Date().toISOString().slice(0, 10),
    description: ''
  });

  const [newFactor, setNewFactor] = useState({
    activityType: 'PURCHASE',
    unit: 'kWh',
    co2eFactor: '',
    source: '',
    validFrom: new Date().toISOString().slice(0, 10),
    validTo: '',
    status: 'ACTIVE'
  });

  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    departmentId: '',
    metricType: 'CARBON_EMISSIONS',
    targetValue: '',
    currentValue: '0',
    unit: 'kg CO2e',
    startDate: new Date().toISOString().slice(0, 10),
    targetDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    status: 'ON_TRACK'
  });

  const [loading, setLoading] = useState(true);

  const fetchDepartments = async () => {
    try {
      const res = await apiRequest('/api/departments');
      setDepartments(res || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.departmentId) params.append('departmentId', filters.departmentId);
      if (filters.from) params.append('from', filters.from);
      if (filters.to) params.append('to', filters.to);
      const res = await apiRequest(`/api/dashboard/environmental?${params.toString()}`);
      setDashboardData(res);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTransactions = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.departmentId) params.append('departmentId', filters.departmentId);
      if (filters.from) params.append('from', filters.from);
      if (filters.to) params.append('to', filters.to);
      if (filters.sourceType) params.append('sourceType', filters.sourceType);
      const res = await apiRequest(`/api/carbon-transactions?${params.toString()}`);
      setTransactions(res?.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchGoals = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.departmentId) params.append('departmentId', filters.departmentId);
      const res = await apiRequest(`/api/environmental-goals?${params.toString()}`);
      setGoals(res?.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchFactors = async () => {
    try {
      const res = await apiRequest('/api/emission-factors');
      setFactors(res?.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([
      fetchDepartments(),
      fetchDashboardData(),
      fetchTransactions(),
      fetchGoals(),
      fetchFactors()
    ]);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, [filters]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = () => {
    setFilters({
      departmentId: '',
      from: '',
      to: '',
      sourceType: ''
    });
  };

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/api/carbon-transactions', {
        method: 'POST',
        body: {
          ...newTx,
          quantity: parseFloat(newTx.quantity),
          transactionDate: new Date(newTx.transactionDate).toISOString()
        }
      });
      setShowTransactionModal(false);
      setNewTx({
        departmentId: '',
        sourceType: 'PURCHASE',
        quantity: '',
        unit: 'kWh',
        transactionDate: new Date().toISOString().slice(0, 10),
        description: ''
      });
      loadAll();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateFactor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/api/emission-factors', {
        method: 'POST',
        body: {
          ...newFactor,
          co2eFactor: parseFloat(newFactor.co2eFactor),
          validFrom: new Date(newFactor.validFrom).toISOString(),
          validTo: newFactor.validTo ? new Date(newFactor.validTo).toISOString() : null
        }
      });
      setShowFactorModal(false);
      setNewFactor({
        activityType: 'PURCHASE',
        unit: 'kWh',
        co2eFactor: '',
        source: '',
        validFrom: new Date().toISOString().slice(0, 10),
        validTo: '',
        status: 'ACTIVE'
      });
      loadAll();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/api/environmental-goals', {
        method: 'POST',
        body: {
          ...newGoal,
          targetValue: parseFloat(newGoal.targetValue),
          currentValue: parseFloat(newGoal.currentValue),
          startDate: new Date(newGoal.startDate).toISOString(),
          targetDate: new Date(newGoal.targetDate).toISOString()
        }
      });
      setShowGoalModal(false);
      setNewGoal({
        title: '',
        description: '',
        departmentId: '',
        metricType: 'CARBON_EMISSIONS',
        targetValue: '',
        currentValue: '0',
        unit: 'kg CO2e',
        startDate: new Date().toISOString().slice(0, 10),
        targetDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        status: 'ON_TRACK'
      });
      loadAll();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRecalculateGoals = async () => {
    try {
      await apiRequest('/api/scoring/recalculate', { method: 'POST' });
      window.dispatchEvent(
        new CustomEvent('toast-notification', {
          detail: { type: 'success', message: 'Goals and scores recalculated successfully' }
        })
      );
      loadAll();
    } catch (err) {
      console.error(err);
    }
  };

  const filterConfig = [
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

  const transactionFilters = [
    ...filterConfig,
    {
      key: 'sourceType',
      label: 'Source Type',
      type: 'select' as const,
      options: [
        { value: 'PURCHASE', label: 'Purchase' },
        { value: 'MANUFACTURING', label: 'Manufacturing' },
        { value: 'EXPENSE', label: 'Expense' },
        { value: 'FLEET', label: 'Fleet' }
      ]
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Environmental Module</h1>
          <p className="text-slate-400 text-sm">Monitor carbon footprints, department targets, and track offsets.</p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === 'transactions' && (user?.role === 'ADMIN' || user?.role === 'ESG_MANAGER') && (
            <button
              onClick={() => setShowTransactionModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold transition"
            >
              <Plus className="w-4 h-4" /> Add Transaction
            </button>
          )}
          {activeTab === 'goals' && (user?.role === 'ADMIN' || user?.role === 'ESG_MANAGER') && (
            <button
              onClick={() => setShowGoalModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold transition"
            >
              <Plus className="w-4 h-4" /> Add Sustainability Goal
            </button>
          )}
          {activeTab === 'factors' && user?.role === 'ADMIN' && (
            <button
              onClick={() => setShowFactorModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold transition"
            >
              <Plus className="w-4 h-4" /> Add Emission Factor
            </button>
          )}
          {(user?.role === 'ADMIN' || user?.role === 'ESG_MANAGER') && (
            <button
              onClick={handleRecalculateGoals}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-sm font-semibold transition"
            >
              Recalculate Goals
            </button>
          )}
        </div>
      </div>

      <div className="flex border-b border-white/5 gap-4">
        {(['dashboard', 'transactions', 'goals', 'factors'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 text-sm font-semibold border-b-2 transition ${
              activeTab === tab
                ? 'border-emerald-500 text-white font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <FilterBar
            filters={filterConfig}
            values={filters}
            onChange={handleFilterChange}
            onClear={handleClearFilters}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard
              title="Total Emissions"
              value={loading ? '...' : `${dashboardData?.totalEmissions?.toFixed(1) ?? '0.0'} kg CO2e`}
              icon={<Footprints className="w-5 h-5" />}
              color="emerald"
            />
            <StatCard
              title="Active Goals"
              value={loading ? '...' : goals.length}
              icon={<FileText className="w-5 h-5" />}
              color="indigo"
            />
            <StatCard
              title="Goals Achieved"
              value={loading ? '...' : goals.filter((g: any) => g.status === 'ACHIEVED').length}
              icon={<CheckCircle className="w-5 h-5" />}
              color="violet"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-6 bg-[#161d30]/30 border border-white/5 rounded-2xl">
              <h2 className="text-lg font-bold text-white mb-4">Emissions Trend (kg CO2e)</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dashboardData?.emissionsTrend || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0a" />
                    <XAxis dataKey="period" stroke="#94a3b8" fontSize={10} />
                    <YAxis stroke="#94a3b8" fontSize={10} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                    <Area type="monotone" dataKey="co2e" stroke="#10b981" fill="#10b9811a" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="p-6 bg-[#161d30]/30 border border-white/5 rounded-2xl">
              <h2 className="text-lg font-bold text-white mb-4">Emissions by Department (kg CO2e)</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dashboardData?.emissionsByDepartment || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0a" />
                    <XAxis dataKey="departmentName" stroke="#94a3b8" fontSize={10} />
                    <YAxis stroke="#94a3b8" fontSize={10} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                    <Bar dataKey="co2e" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'transactions' && (
        <div className="space-y-6">
          <FilterBar
            filters={transactionFilters}
            values={filters}
            onChange={handleFilterChange}
            onClear={handleClearFilters}
          />

          <div className="overflow-x-auto border border-white/5 rounded-2xl bg-[#161d30]/30">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-slate-900/40 text-slate-400 text-xs font-semibold uppercase">
                  <th className="p-4">Department</th>
                  <th className="p-4">Source Type</th>
                  <th className="p-4">Quantity</th>
                  <th className="p-4">CO2e Calculated</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Auto Calc</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm text-slate-300">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500 italic">No transactions found</td>
                  </tr>
                ) : (
                  transactions.map(t => (
                    <tr key={t.id} className="hover:bg-white/5 transition">
                      <td className="p-4 font-medium text-white">{t.department?.name || 'Unknown'}</td>
                      <td className="p-4">
                        <span className="px-2 py-1 text-xs font-semibold rounded bg-slate-800 text-slate-300 uppercase tracking-wide">
                          {t.sourceType}
                        </span>
                      </td>
                      <td className="p-4">{Number(t.quantity).toFixed(1)} {t.unit || ''}</td>
                      <td className="p-4 font-bold text-emerald-400">{Number(t.calculatedCO2e).toFixed(1)} kg</td>
                      <td className="p-4">{new Date(t.transactionDate).toLocaleDateString()}</td>
                      <td className="p-4">
                        {t.autoCalculated ? (
                          <span className="text-emerald-400 text-xs font-bold">Yes</span>
                        ) : (
                          <span className="text-slate-500 text-xs">No</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'goals' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goals.length === 0 ? (
            <div className="col-span-full p-8 text-center border border-white/5 rounded-2xl bg-[#161d30]/30 text-slate-500 italic">
              No goals set for the current filters
            </div>
          ) : (
            goals.map(goal => {
              const progress = Math.min(((Number(goal.currentValue) || 0) / (Number(goal.targetValue) || 1)) * 100, 100);
              let badgeColor: 'green' | 'yellow' | 'red' | 'blue' = 'blue';
              if (goal.status === 'ON_TRACK') badgeColor = 'green';
              if (goal.status === 'AT_RISK') badgeColor = 'yellow';
              if (goal.status === 'MISSED') badgeColor = 'red';
              if (goal.status === 'ACHIEVED') badgeColor = 'blue';

              return (
                <div key={goal.id} className="p-6 bg-[#161d30]/30 border border-white/5 rounded-2xl flex flex-col justify-between hover:border-emerald-500/20 transition">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-white text-lg">{goal.title}</h3>
                      <StatusBadge status={goal.status} color={badgeColor} />
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-2">{goal.description}</p>
                    <div className="text-[10px] uppercase font-bold text-slate-500">
                      Department: {goal.department?.name || 'All Departments'}
                    </div>
                  </div>

                  <div className="space-y-4 mt-6">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-400">Progress</span>
                      <span className="text-white">{progress.toFixed(0)}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Current: {Number(goal.currentValue).toFixed(0)} {goal.unit}</span>
                      <span>Target: {Number(goal.targetValue).toFixed(0)} {goal.unit}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 pt-2 border-t border-white/5">
                      Target Date: {new Date(goal.targetDate).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {activeTab === 'factors' && (
        <div className="overflow-x-auto border border-white/5 rounded-2xl bg-[#161d30]/30">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-slate-900/40 text-slate-400 text-xs font-semibold uppercase">
                <th className="p-4">Activity Type</th>
                <th className="p-4">Unit</th>
                <th className="p-4">CO2e Factor</th>
                <th className="p-4">Source</th>
                <th className="p-4">Valid From</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm text-slate-300">
              {factors.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 italic">No emission factors found</td>
                </tr>
              ) : (
                factors.map(f => (
                  <tr key={f.id} className="hover:bg-white/5 transition">
                    <td className="p-4 font-bold text-white uppercase">{f.activityType}</td>
                    <td className="p-4">{f.unit}</td>
                    <td className="p-4 text-emerald-400 font-bold">{Number(f.co2eFactor).toFixed(4)}</td>
                    <td className="p-4 text-slate-400">{f.source || 'N/A'}</td>
                    <td className="p-4">{new Date(f.validFrom).toLocaleDateString()}</td>
                    <td className="p-4">
                      <StatusBadge status={f.status} color={f.status === 'ACTIVE' ? 'green' : 'red'} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {showTransactionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-[#0f172a] border border-white/10 rounded-2xl p-6 shadow-2xl space-y-4">
            <h2 className="text-xl font-bold text-white">Create Carbon Transaction</h2>
            <form onSubmit={handleCreateTransaction} className="space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-400 uppercase">Department</label>
                <select
                  required
                  value={newTx.departmentId}
                  onChange={e => setNewTx(prev => ({ ...prev, departmentId: e.target.value }))}
                  className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-200 outline-none focus:border-emerald-500/50"
                >
                  <option value="">Select Department</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">Source Type</label>
                  <select
                    value={newTx.sourceType}
                    onChange={e => setNewTx(prev => ({ ...prev, sourceType: e.target.value }))}
                    className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-200 outline-none focus:border-emerald-500/50"
                  >
                    <option value="PURCHASE">Purchase</option>
                    <option value="MANUFACTURING">Manufacturing</option>
                    <option value="EXPENSE">Expense</option>
                    <option value="FLEET">Fleet</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">Unit</label>
                  <input
                    type="text"
                    required
                    value={newTx.unit}
                    onChange={e => setNewTx(prev => ({ ...prev, unit: e.target.value }))}
                    className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-200 outline-none focus:border-emerald-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">Quantity</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={newTx.quantity}
                    onChange={e => setNewTx(prev => ({ ...prev, quantity: e.target.value }))}
                    className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-200 outline-none focus:border-emerald-500/50"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">Date</label>
                  <input
                    type="date"
                    required
                    value={newTx.transactionDate}
                    onChange={e => setNewTx(prev => ({ ...prev, transactionDate: e.target.value }))}
                    className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-200 outline-none focus:border-emerald-500/50"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-400 uppercase">Description</label>
                <textarea
                  value={newTx.description}
                  onChange={e => setNewTx(prev => ({ ...prev, description: e.target.value }))}
                  className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-200 outline-none focus:border-emerald-500/50"
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowTransactionModal(false)}
                  className="px-4 py-2 border border-slate-800 text-slate-400 hover:text-white rounded-xl text-sm font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold transition"
                >
                  Save Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showFactorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-[#0f172a] border border-white/10 rounded-2xl p-6 shadow-2xl space-y-4">
            <h2 className="text-xl font-bold text-white">Create Emission Factor</h2>
            <form onSubmit={handleCreateFactor} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">Activity Type</label>
                  <select
                    value={newFactor.activityType}
                    onChange={e => setNewFactor(prev => ({ ...prev, activityType: e.target.value }))}
                    className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-200 outline-none focus:border-emerald-500/50"
                  >
                    <option value="PURCHASE">Purchase</option>
                    <option value="MANUFACTURING">Manufacturing</option>
                    <option value="EXPENSE">Expense</option>
                    <option value="FLEET">Fleet</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">Unit</label>
                  <input
                    type="text"
                    required
                    value={newFactor.unit}
                    onChange={e => setNewFactor(prev => ({ ...prev, unit: e.target.value }))}
                    className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-200 outline-none focus:border-emerald-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">CO2e Factor</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={newFactor.co2eFactor}
                    onChange={e => setNewFactor(prev => ({ ...prev, co2eFactor: e.target.value }))}
                    className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-200 outline-none focus:border-emerald-500/50"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">Source</label>
                  <input
                    type="text"
                    value={newFactor.source}
                    onChange={e => setNewFactor(prev => ({ ...prev, source: e.target.value }))}
                    className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-200 outline-none focus:border-emerald-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">Valid From</label>
                  <input
                    type="date"
                    required
                    value={newFactor.validFrom}
                    onChange={e => setNewFactor(prev => ({ ...prev, validFrom: e.target.value }))}
                    className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 outline-none focus:border-emerald-500/50"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">Valid To</label>
                  <input
                    type="date"
                    value={newFactor.validTo}
                    onChange={e => setNewFactor(prev => ({ ...prev, validTo: e.target.value }))}
                    className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 outline-none focus:border-emerald-500/50"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowFactorModal(false)}
                  className="px-4 py-2 border border-slate-800 text-slate-400 hover:text-white rounded-xl text-sm font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold transition"
                >
                  Save Factor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showGoalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-[#0f172a] border border-white/10 rounded-2xl p-6 shadow-2xl space-y-4">
            <h2 className="text-xl font-bold text-white">Create Sustainability Goal</h2>
            <form onSubmit={handleCreateGoal} className="space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-400 uppercase">Title</label>
                <input
                  type="text"
                  required
                  value={newGoal.title}
                  onChange={e => setNewGoal(prev => ({ ...prev, title: e.target.value }))}
                  className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-200 outline-none focus:border-emerald-500/50"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-400 uppercase">Description</label>
                <textarea
                  value={newGoal.description}
                  onChange={e => setNewGoal(prev => ({ ...prev, description: e.target.value }))}
                  className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-200 outline-none focus:border-emerald-500/50"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">Department</label>
                  <select
                    value={newGoal.departmentId}
                    onChange={e => setNewGoal(prev => ({ ...prev, departmentId: e.target.value }))}
                    className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-200 outline-none focus:border-emerald-500/50"
                  >
                    <option value="">All Departments</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">Metric Type</label>
                  <input
                    type="text"
                    required
                    value={newGoal.metricType}
                    onChange={e => setNewGoal(prev => ({ ...prev, metricType: e.target.value }))}
                    className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-200 outline-none focus:border-emerald-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">Target Value</label>
                  <input
                    type="number"
                    required
                    value={newGoal.targetValue}
                    onChange={e => setNewGoal(prev => ({ ...prev, targetValue: e.target.value }))}
                    className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-200 outline-none focus:border-emerald-500/50"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">Unit</label>
                  <input
                    type="text"
                    required
                    value={newGoal.unit}
                    onChange={e => setNewGoal(prev => ({ ...prev, unit: e.target.value }))}
                    className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-200 outline-none focus:border-emerald-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">Start Date</label>
                  <input
                    type="date"
                    required
                    value={newGoal.startDate}
                    onChange={e => setNewGoal(prev => ({ ...prev, startDate: e.target.value }))}
                    className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-200 outline-none focus:border-emerald-500/50"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">Target Date</label>
                  <input
                    type="date"
                    required
                    value={newGoal.targetDate}
                    onChange={e => setNewGoal(prev => ({ ...prev, targetDate: e.target.value }))}
                    className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-200 outline-none focus:border-emerald-500/50"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowGoalModal(false)}
                  className="px-4 py-2 border border-slate-800 text-slate-400 hover:text-white rounded-xl text-sm font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold transition"
                >
                  Save Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Environmental;
