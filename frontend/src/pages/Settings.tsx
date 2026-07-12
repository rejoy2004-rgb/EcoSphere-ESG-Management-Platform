import React, { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';
import { Plus, Save, Edit3, EyeOff, Check, X } from 'lucide-react';

export const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'system' | 'departments' | 'categories'>('system');

  const [settings, setSettings] = useState<any>({
    esgWeightEnvironmental: 40,
    esgWeightSocial: 30,
    esgWeightGovernance: 30,
    subScoreFormulaConfigJson: '{}',
    autoEmissionCalculationEnabled: true,
    evidenceRequirementEnabled: false,
    badgeAutoAwardEnabled: true,
    notificationChannels: '{}',
    policyReminderCadenceDays: 7
  });

  const [departments, setDepartments] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  const [showDeptModal, setShowDeptModal] = useState(false);
  const [showCatModal, setShowCatModal] = useState(false);

  const [newDept, setNewDept] = useState({
    id: '',
    name: '',
    code: '',
    headId: '',
    parentDepartmentId: '',
    status: 'ACTIVE'
  });

  const [newCat, setNewCat] = useState({
    id: '',
    name: '',
    type: 'CSR_ACTIVITY',
    status: 'ACTIVE'
  });

  const [loading, setLoading] = useState(true);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [settingsData, deptsData, catsData] = await Promise.all([
        apiRequest('/api/settings').catch(() => null),
        apiRequest('/api/departments').catch(() => []),
        apiRequest('/api/categories').catch(() => [])
      ]);
      if (settingsData) {
        setSettings({
          ...settingsData,
          esgWeightEnvironmental: settingsData.esgWeightEnvironmental ?? 40,
          esgWeightSocial: settingsData.esgWeightSocial ?? 30,
          esgWeightGovernance: settingsData.esgWeightGovernance ?? 30
        });
      }
      setDepartments(deptsData || []);
      setCategories(catsData || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const sum =
      Number(settings.esgWeightEnvironmental) +
      Number(settings.esgWeightSocial) +
      Number(settings.esgWeightGovernance);
    if (sum !== 100) {
      window.dispatchEvent(
        new CustomEvent('toast-notification', {
          detail: { type: 'error', message: `ESG Weights must sum to 100%. Current sum: ${sum}%` }
        })
      );
      return;
    }

    try {
      await apiRequest('/api/settings', {
        method: 'PUT',
        body: settings
      });
      window.dispatchEvent(
        new CustomEvent('toast-notification', {
          detail: { type: 'success', message: 'System Settings updated successfully' }
        })
      );
      loadAll();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveDept = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (newDept.id) {
        await apiRequest(`/api/departments/${newDept.id}`, {
          method: 'PUT',
          body: newDept
        });
      } else {
        await apiRequest('/api/departments', {
          method: 'POST',
          body: {
            name: newDept.name,
            code: newDept.code,
            parentDepartmentId: newDept.parentDepartmentId || null,
            headId: newDept.headId || null
          }
        });
      }
      setShowDeptModal(false);
      setNewDept({
        id: '',
        name: '',
        code: '',
        headId: '',
        parentDepartmentId: '',
        status: 'ACTIVE'
      });
      loadAll();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveCat = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (newCat.id) {
        await apiRequest(`/api/categories/${newCat.id}`, {
          method: 'PUT',
          body: newCat
        });
      } else {
        await apiRequest('/api/categories', {
          method: 'POST',
          body: {
            name: newCat.name,
            type: newCat.type
          }
        });
      }
      setShowCatModal(false);
      setNewCat({
        id: '',
        name: '',
        type: 'CSR_ACTIVITY',
        status: 'ACTIVE'
      });
      loadAll();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeactivateDept = async (id: string) => {
    try {
      await apiRequest(`/api/departments/${id}`, {
        method: 'PUT',
        body: { status: 'INACTIVE' }
      });
      loadAll();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeactivateCat = async (id: string) => {
    try {
      await apiRequest(`/api/categories/${id}`, {
        method: 'PUT',
        body: { status: 'INACTIVE' }
      });
      loadAll();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleChannel = (type: string, channel: 'inApp' | 'email') => {
    const channels = JSON.parse(settings.notificationChannels || '{}');
    if (!channels[type]) {
      channels[type] = { inApp: true, email: false };
    }
    channels[type][channel] = !channels[type][channel];
    setSettings((prev: any) => ({ ...prev, notificationChannels: JSON.stringify(channels) }));
  };

  const notifTypes = [
    { key: 'ComplianceIssueRaised', label: 'Compliance Issue raised' },
    { key: 'CSR_APPROVED', label: 'CSR Activity Approved' },
    { key: 'CHALLENGE_APPROVED', label: 'Challenge Approved' },
    { key: 'POLICY_REMINDER', label: 'Policy Signature Reminder' }
  ];

  const parsedChannels = JSON.parse(settings.notificationChannels || '{}');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">System Administration</h1>
          <p className="text-slate-400 text-sm">Configure ESG scores weights and weights config structures.</p>
        </div>
      </div>

      <div className="flex border-b border-white/5 gap-4">
        {(['system', 'departments', 'categories'] as const).map(tab => (
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

      {activeTab === 'system' && (
        <form onSubmit={handleSaveSettings} className="space-y-6 bg-[#161d30]/30 border border-white/5 p-6 rounded-2xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-400 uppercase">Environmental Weight ({settings.esgWeightEnvironmental}%)</label>
              <input
                type="range"
                min="0"
                max="100"
                value={settings.esgWeightEnvironmental}
                onChange={e => setSettings((prev: any) => ({ ...prev, esgWeightEnvironmental: parseInt(e.target.value) }))}
                className="accent-emerald-500"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-400 uppercase">Social Weight ({settings.esgWeightSocial}%)</label>
              <input
                type="range"
                min="0"
                max="100"
                value={settings.esgWeightSocial}
                onChange={e => setSettings((prev: any) => ({ ...prev, esgWeightSocial: parseInt(e.target.value) }))}
                className="accent-amber-500"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-400 uppercase">Governance Weight ({settings.esgWeightGovernance}%)</label>
              <input
                type="range"
                min="0"
                max="100"
                value={settings.esgWeightGovernance}
                onChange={e => setSettings((prev: any) => ({ ...prev, esgWeightGovernance: parseInt(e.target.value) }))}
                className="accent-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-white/5">
            <div className="flex items-center justify-between p-3 bg-slate-900/40 border border-white/5 rounded-xl">
              <div>
                <span className="text-xs font-bold text-white block">Auto Emissions Calc</span>
                <span className="text-[10px] text-slate-500">Enable automatic carbon calculations</span>
              </div>
              <input
                type="checkbox"
                checked={settings.autoEmissionCalculationEnabled}
                onChange={e => setSettings((prev: any) => ({ ...prev, autoEmissionCalculationEnabled: e.target.checked }))}
                className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500/50 bg-slate-950 border-slate-800"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-900/40 border border-white/5 rounded-xl">
              <div>
                <span className="text-xs font-bold text-white block">Evidence Required</span>
                <span className="text-[10px] text-slate-500">Block approvals without proofs</span>
              </div>
              <input
                type="checkbox"
                checked={settings.evidenceRequirementEnabled}
                onChange={e => setSettings((prev: any) => ({ ...prev, evidenceRequirementEnabled: e.target.checked }))}
                className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500/50 bg-slate-950 border-slate-800"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-900/40 border border-white/5 rounded-xl">
              <div>
                <span className="text-xs font-bold text-white block">Badge Auto Award</span>
                <span className="text-[10px] text-slate-500">Auto award badges on triggers</span>
              </div>
              <input
                type="checkbox"
                checked={settings.badgeAutoAwardEnabled}
                onChange={e => setSettings((prev: any) => ({ ...prev, badgeAutoAwardEnabled: e.target.checked }))}
                className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500/50 bg-slate-950 border-slate-800"
              />
            </div>
          </div>

          <div className="space-y-4 pt-6 border-t border-white/5">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Notification Delivery Channels</h3>
            <div className="overflow-x-auto border border-white/5 rounded-xl bg-slate-950/20">
              <table className="w-full text-left text-xs text-slate-300">
                <thead>
                  <tr className="border-b border-white/5 bg-slate-900/40 font-semibold uppercase">
                    <th className="p-3">Notification Alert</th>
                    <th className="p-3 text-center">In-App Notification</th>
                    <th className="p-3 text-center">Email Alert</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {notifTypes.map(t => {
                    const cfg = parsedChannels[t.key] || { inApp: true, email: false };
                    return (
                      <tr key={t.key}>
                        <td className="p-3 font-semibold text-white">{t.label}</td>
                        <td className="p-3 text-center">
                          <input
                            type="checkbox"
                            checked={cfg.inApp}
                            onChange={() => handleToggleChannel(t.key, 'inApp')}
                            className="w-4 h-4 rounded text-indigo-500 focus:ring-indigo-500/50 bg-slate-950 border-slate-800"
                          />
                        </td>
                        <td className="p-3 text-center">
                          <input
                            type="checkbox"
                            checked={cfg.email}
                            onChange={() => handleToggleChannel(t.key, 'email')}
                            className="w-4 h-4 rounded text-indigo-500 focus:ring-indigo-500/50 bg-slate-950 border-slate-800"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold transition"
            >
              <Save className="w-4 h-4" /> Save Administration Config
            </button>
          </div>
        </form>
      )}

      {activeTab === 'departments' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-white">Departments Directory</h2>
            <button
              onClick={() => {
                setNewDept({ id: '', name: '', code: '', headId: '', parentDepartmentId: '', status: 'ACTIVE' });
                setShowDeptModal(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold transition"
            >
              <Plus className="w-4 h-4" /> Add Department
            </button>
          </div>

          <div className="overflow-x-auto border border-white/5 rounded-2xl bg-[#161d30]/30">
            <table className="w-full text-left border-collapse text-sm text-slate-300">
              <thead>
                <tr className="border-b border-white/5 bg-slate-900/40 text-slate-400 text-xs font-semibold uppercase">
                  <th className="p-4">Name</th>
                  <th className="p-4">Code</th>
                  <th className="p-4">Hierarchy Level</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {departments.map(d => (
                  <tr key={d.id} className="hover:bg-white/5 transition">
                    <td className="p-4 font-semibold text-white">{d.name}</td>
                    <td className="p-4">{d.code}</td>
                    <td className="p-4 text-xs">
                      {d.parentDepartmentId ? `Child of ${departments.find(p => p.id === d.parentDepartmentId)?.name || 'Parent'}` : 'Top-Level'}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        d.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {d.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setNewDept({
                              id: d.id,
                              name: d.name,
                              code: d.code,
                              headId: d.headId || '',
                              parentDepartmentId: d.parentDepartmentId || '',
                              status: d.status
                            });
                            setShowDeptModal(true);
                          }}
                          className="p-1 text-slate-400 hover:text-white transition"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        {d.status === 'ACTIVE' && (
                          <button
                            onClick={() => handleDeactivateDept(d.id)}
                            className="p-1 text-rose-400 hover:text-rose-300 transition"
                          >
                            <EyeOff className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'categories' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-white">ESG Categorization Tags</h2>
            <button
              onClick={() => {
                setNewCat({ id: '', name: '', type: 'CSR_ACTIVITY', status: 'ACTIVE' });
                setShowCatModal(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold transition"
            >
              <Plus className="w-4 h-4" /> Add Category
            </button>
          </div>

          <div className="overflow-x-auto border border-white/5 rounded-2xl bg-[#161d30]/30">
            <table className="w-full text-left border-collapse text-sm text-slate-300">
              <thead>
                <tr className="border-b border-white/5 bg-slate-900/40 text-slate-400 text-xs font-semibold uppercase">
                  <th className="p-4">Name</th>
                  <th className="p-4">ESG Pillar Type</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {categories.map(c => (
                  <tr key={c.id} className="hover:bg-white/5 transition">
                    <td className="p-4 font-semibold text-white">{c.name}</td>
                    <td className="p-4 font-mono text-xs text-indigo-400">{c.type}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        c.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setNewCat({
                              id: c.id,
                              name: c.name,
                              type: c.type,
                              status: c.status
                            });
                            setShowCatModal(true);
                          }}
                          className="p-1 text-slate-400 hover:text-white transition"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        {c.status === 'ACTIVE' && (
                          <button
                            onClick={() => handleDeactivateCat(c.id)}
                            className="p-1 text-rose-400 hover:text-rose-300 transition"
                          >
                            <EyeOff className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showDeptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-[#0f172a] border border-white/10 rounded-2xl p-6 shadow-2xl space-y-4">
            <h2 className="text-xl font-bold text-white">{newDept.id ? 'Edit Department' : 'Create Department'}</h2>
            <form onSubmit={handleSaveDept} className="space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-400 uppercase">Department Name</label>
                <input
                  type="text"
                  required
                  value={newDept.name}
                  onChange={e => setNewDept(prev => ({ ...prev, name: e.target.value }))}
                  className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-200 outline-none focus:border-emerald-500/50"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-400 uppercase">Code</label>
                <input
                  type="text"
                  required
                  value={newDept.code}
                  onChange={e => setNewDept(prev => ({ ...prev, code: e.target.value }))}
                  className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-200 outline-none focus:border-emerald-500/50"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-400 uppercase">Parent Department</label>
                <select
                  value={newDept.parentDepartmentId}
                  onChange={e => setNewDept(prev => ({ ...prev, parentDepartmentId: e.target.value }))}
                  className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-200 outline-none focus:border-emerald-500/50"
                >
                  <option value="">None (Top-Level)</option>
                  {departments
                    .filter(d => d.id !== newDept.id)
                    .map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowDeptModal(false)}
                  className="px-4 py-2 border border-slate-800 text-slate-400 hover:text-white rounded-xl text-sm font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold transition"
                >
                  Save Department
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-[#0f172a] border border-white/10 rounded-2xl p-6 shadow-2xl space-y-4">
            <h2 className="text-xl font-bold text-white">{newCat.id ? 'Edit Category' : 'Create Category'}</h2>
            <form onSubmit={handleSaveCat} className="space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-400 uppercase">Category Name</label>
                <input
                  type="text"
                  required
                  value={newCat.name}
                  onChange={e => setNewCat(prev => ({ ...prev, name: e.target.value }))}
                  className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-200 outline-none focus:border-emerald-500/50"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-400 uppercase">Type</label>
                <select
                  value={newCat.type}
                  onChange={e => setNewCat(prev => ({ ...prev, type: e.target.value }))}
                  className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-200 outline-none focus:border-emerald-500/50"
                >
                  <option value="CSR_ACTIVITY">CSR Activity</option>
                  <option value="CHALLENGE">Challenge</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCatModal(false)}
                  className="px-4 py-2 border border-slate-800 text-slate-400 hover:text-white rounded-xl text-sm font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold transition"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
