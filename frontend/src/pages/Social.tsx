import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../utils/api';
import { FilterBar } from '../components/FilterBar';
import { StatusBadge } from '../components/StatusBadge';
import { Plus, Check, X, Upload, Award, ShieldAlert, GraduationCap, Users } from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

export const Social: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'activities' | 'participation' | 'training'>('dashboard');

  const [departments, setDepartments] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  
  const [filters, setFilters] = useState<Record<string, string>>({
    departmentId: '',
    from: '',
    to: '',
    activityStatus: ''
  });

  const [socialDashboard, setSocialDashboard] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [participations, setParticipations] = useState<any[]>([]);
  const [trainingRecords, setTrainingRecords] = useState<any[]>([]);
  const [systemSettings, setSystemSettings] = useState<any>(null);

  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showTrainingModal, setShowTrainingModal] = useState(false);
  const [uploadingPartId, setUploadingPartId] = useState<string | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);

  const [newActivity, setNewActivity] = useState({
    title: '',
    description: '',
    categoryId: '',
    departmentId: '',
    date: new Date().toISOString().slice(0, 10),
    location: '',
    targetParticipants: '',
    points: '50'
  });

  const [newTraining, setNewTraining] = useState({
    employeeId: '',
    trainingName: '',
    completedAt: '',
    status: 'ASSIGNED'
  });

  const [loading, setLoading] = useState(true);

  const fetchMetadata = async () => {
    try {
      const [depts, cats, users, settings] = await Promise.all([
        apiRequest('/api/departments').catch(() => []),
        apiRequest('/api/categories').catch(() => []),
        apiRequest('/api/auth/me').then(async () => {
          const list = await apiRequest('/api/departments');
          return list;
        }).catch(() => []),
        apiRequest('/api/settings').catch(() => null)
      ]);
      setDepartments(depts || []);
      setCategories(cats.filter((c: any) => c.type === 'CSR_ACTIVITY') || []);
      setSystemSettings(settings);

      const allUsers = await apiRequest('/api/departments').then(async () => {
        try {
          const res = await fetch('/api/departments');
          return [];
        } catch {
          return [];
        }
      });
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSocialDashboard = async () => {
    try {
      const res = await apiRequest('/api/dashboard/social');
      setSocialDashboard(res);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchActivities = async () => {
    try {
      const res = await apiRequest('/api/csr-activities');
      setActivities(res || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchParticipations = async () => {
    try {
      const res = await apiRequest('/api/participation');
      setParticipations(res || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTrainingRecords = async () => {
    try {
      const res = await apiRequest('/api/training-records');
      setTrainingRecords(res || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([
      fetchMetadata(),
      fetchSocialDashboard(),
      fetchActivities(),
      fetchParticipations(),
      fetchTrainingRecords()
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
      activityStatus: ''
    });
  };

  const handleCreateActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/api/csr-activities', {
        method: 'POST',
        body: {
          ...newActivity,
          targetParticipants: newActivity.targetParticipants ? parseInt(newActivity.targetParticipants) : null,
          points: parseInt(newActivity.points),
          date: new Date(newActivity.date).toISOString()
        }
      });
      setShowActivityModal(false);
      setNewActivity({
        title: '',
        description: '',
        categoryId: '',
        departmentId: '',
        date: new Date().toISOString().slice(0, 10),
        location: '',
        targetParticipants: '',
        points: '50'
      });
      loadAll();
    } catch (err) {
      console.error(err);
    }
  };

  const handleTransitionStatus = async (id: string, targetStatus: string) => {
    try {
      await apiRequest(`/api/csr-activities/${id}/status`, {
        method: 'PATCH',
        body: { status: targetStatus }
      });
      loadAll();
    } catch (err) {
      console.error(err);
    }
  };

  const handleJoinActivity = async (activityId: string) => {
    try {
      await apiRequest(`/api/csr-activities/${activityId}/participate`, {
        method: 'POST'
      });
      loadAll();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUploadProof = async (e: React.FormEvent, participationId: string) => {
    e.preventDefault();
    if (!proofFile) {
      return;
    }
    const formData = new FormData();
    formData.append('proof', proofFile);

    try {
      await apiRequest(`/api/participation/${participationId}/proof`, {
        method: 'POST',
        body: formData
      });
      setUploadingPartId(null);
      setProofFile(null);
      loadAll();
    } catch (err) {
      console.error(err);
    }
  };

  const handleApproveParticipation = async (participation: any) => {
    const evidenceRequired = systemSettings?.evidenceRequirementEnabled === true;
    if (evidenceRequired && !participation.proofUrl) {
      window.dispatchEvent(
        new CustomEvent('toast-notification', {
          detail: { type: 'error', message: 'Approval blocked: Proof file is required by system settings' }
        })
      );
      return;
    }

    try {
      await apiRequest(`/api/participation/${participation.id}/approve`, {
        method: 'PATCH'
      });
      loadAll();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRejectParticipation = async (id: string) => {
    try {
      await apiRequest(`/api/participation/${id}/reject`, {
        method: 'PATCH'
      });
      loadAll();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateTraining = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/api/training-records', {
        method: 'POST',
        body: {
          ...newTraining,
          completedAt: newTraining.completedAt ? new Date(newTraining.completedAt).toISOString() : null
        }
      });
      setShowTrainingModal(false);
      setNewTraining({
        employeeId: '',
        trainingName: '',
        completedAt: '',
        status: 'ASSIGNED'
      });
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
      key: 'activityStatus',
      label: 'Status',
      type: 'select' as const,
      options: [
        { value: 'DRAFT', label: 'Draft' },
        { value: 'ACTIVE', label: 'Active' },
        { value: 'COMPLETED', label: 'Completed' },
        { value: 'CANCELLED', label: 'Cancelled' }
      ]
    }
  ];

  const genderData = Object.entries(socialDashboard?.diversitySummary?.gender || {}).map(([name, value]) => ({
    name,
    value: Number(value)
  }));

  const ageData = Object.entries(socialDashboard?.diversitySummary?.ageBand || {}).map(([name, value]) => ({
    name,
    value: Number(value)
  }));

  const nationalityData = Object.entries(socialDashboard?.diversitySummary?.nationality || {}).map(([name, value]) => ({
    name,
    value: Number(value)
  }));

  const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'];

  const filteredActivities = activities.filter(act => {
    if (filters.departmentId && act.departmentId !== filters.departmentId) return false;
    if (filters.activityStatus && act.status !== filters.activityStatus) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Social Module</h1>
          <p className="text-slate-400 text-sm">Oversee CSR initiatives, training courses, and diversity distributions.</p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === 'activities' && (user?.role === 'ADMIN' || user?.role === 'ESG_MANAGER' || user?.role === 'DEPARTMENT_HEAD') && (
            <button
              onClick={() => setShowActivityModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold transition"
            >
              <Plus className="w-4 h-4" /> Create Activity
            </button>
          )}
          {activeTab === 'training' && (user?.role === 'ADMIN' || user?.role === 'ESG_MANAGER') && (
            <button
              onClick={() => setShowTrainingModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold transition"
            >
              <Plus className="w-4 h-4" /> Assign Training
            </button>
          )}
        </div>
      </div>

      <div className="flex border-b border-white/5 gap-4">
        {(['dashboard', 'activities', 'participation', 'training'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 text-sm font-semibold border-b-2 transition ${
              activeTab === tab
                ? 'border-emerald-500 text-white font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab === 'participation' ? 'Volunteering Queue' : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard
              title="Volunteering Rate"
              value={loading ? '...' : `${socialDashboard?.csrParticipationRate?.toFixed(1) ?? '0.0'}%`}
              icon={<Users className="w-5 h-5" />}
              color="emerald"
            />
            <StatCard
              title="Training Completion"
              value={loading ? '...' : `${socialDashboard?.trainingCompletionRate?.toFixed(1) ?? '0.0'}%`}
              icon={<GraduationCap className="w-5 h-5" />}
              color="indigo"
            />
            <StatCard
              title="CSR Activities Held"
              value={loading ? '...' : activities.length}
              icon={<Award className="w-5 h-5" />}
              color="violet"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="p-6 bg-[#161d30]/30 border border-white/5 rounded-2xl flex flex-col items-center">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-6 w-full text-left">Gender Diversity</h2>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={genderData.length > 0 ? genderData : [{ name: 'No data', value: 1 }]}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {genderData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="p-6 bg-[#161d30]/30 border border-white/5 rounded-2xl flex flex-col items-center">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-6 w-full text-left">Age Distribution</h2>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ageData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0a" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} />
                    <YAxis stroke="#94a3b8" fontSize={9} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                    <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="p-6 bg-[#161d30]/30 border border-white/5 rounded-2xl flex flex-col items-center">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-6 w-full text-left">Nationality Diversity</h2>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={nationalityData.length > 0 ? nationalityData : [{ name: 'No data', value: 1 }]}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {nationalityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'activities' && (
        <div className="space-y-6">
          <FilterBar
            filters={filterConfig}
            values={filters}
            onChange={handleFilterChange}
            onClear={handleClearFilters}
          />

          <div className="overflow-x-auto border border-white/5 rounded-2xl bg-[#161d30]/30">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-slate-900/40 text-slate-400 text-xs font-semibold uppercase">
                  <th className="p-4">Title</th>
                  <th className="p-4">Department</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Points</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm text-slate-300">
                {filteredActivities.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500 italic">No CSR activities found</td>
                  </tr>
                ) : (
                  filteredActivities.map(act => {
                    const isRegistered = participations.some(p => p.activityId === act.id);
                    const userParticipation = participations.find(p => p.activityId === act.id);

                    return (
                      <tr key={act.id} className="hover:bg-white/5 transition">
                        <td className="p-4 font-medium text-white">{act.title}</td>
                        <td className="p-4">{act.department?.name || 'All'}</td>
                        <td className="p-4">{new Date(act.date).toLocaleDateString()}</td>
                        <td className="p-4 text-emerald-400 font-bold">{act.points} pts</td>
                        <td className="p-4">
                          <StatusBadge
                            status={act.status}
                            color={act.status === 'ACTIVE' ? 'green' : act.status === 'DRAFT' ? 'yellow' : act.status === 'COMPLETED' ? 'blue' : 'red'}
                          />
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            {user?.role === 'EMPLOYEE' && act.status === 'ACTIVE' && !isRegistered && (
                              <button
                                onClick={() => handleJoinActivity(act.id)}
                                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition"
                              >
                                Join
                              </button>
                            )}
                            {user?.role === 'EMPLOYEE' && isRegistered && (
                              <span className="text-slate-500 text-xs font-semibold">Joined ({userParticipation?.approvalStatus})</span>
                            )}
                            {(user?.role === 'ADMIN' || user?.role === 'ESG_MANAGER') && (
                              <>
                                {act.status === 'DRAFT' && (
                                  <>
                                    <button
                                      onClick={() => handleTransitionStatus(act.id, 'ACTIVE')}
                                      className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition"
                                    >
                                      Activate
                                    </button>
                                    <button
                                      onClick={() => handleTransitionStatus(act.id, 'CANCELLED')}
                                      className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold transition"
                                    >
                                      Cancel
                                    </button>
                                  </>
                                )}
                                {act.status === 'ACTIVE' && (
                                  <>
                                    <button
                                      onClick={() => handleTransitionStatus(act.id, 'COMPLETED')}
                                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition"
                                    >
                                      Complete
                                    </button>
                                    <button
                                      onClick={() => handleTransitionStatus(act.id, 'CANCELLED')}
                                      className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold transition"
                                    >
                                      Cancel
                                    </button>
                                  </>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'participation' && (
        <div className="space-y-6">
          {user?.role === 'EMPLOYEE' ? (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-white">My Voluteering participations</h2>
              <div className="overflow-x-auto border border-white/5 rounded-2xl bg-[#161d30]/30">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 bg-slate-900/40 text-slate-400 text-xs font-semibold uppercase">
                      <th className="p-4">Activity Title</th>
                      <th className="p-4">Points</th>
                      <th className="p-4">Proof File</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-sm text-slate-300">
                    {participations.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-500 italic">No registrations found</td>
                      </tr>
                    ) : (
                      participations.map(p => (
                        <tr key={p.id} className="hover:bg-white/5 transition">
                          <td className="p-4 font-medium text-white">{p.activity?.title || 'Unknown'}</td>
                          <td className="p-4 text-emerald-400 font-bold">{p.activity?.points || 0} pts</td>
                          <td className="p-4">
                            {p.proofUrl ? (
                              <a href={p.proofUrl} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline text-xs">View File</a>
                            ) : (
                              <span className="text-slate-500 text-xs">Not uploaded</span>
                            )}
                          </td>
                          <td className="p-4">
                            <StatusBadge
                              status={p.approvalStatus}
                              color={p.approvalStatus === 'APPROVED' ? 'green' : p.approvalStatus === 'PENDING' ? 'yellow' : 'red'}
                            />
                          </td>
                          <td className="p-4">
                            {p.approvalStatus === 'PENDING' && (
                              <div className="flex flex-col gap-2">
                                {uploadingPartId === p.id ? (
                                  <form onSubmit={(e) => handleUploadProof(e, p.id)} className="flex items-center gap-2">
                                    <input
                                      type="file"
                                      required
                                      onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                                      className="text-xs text-slate-400"
                                    />
                                    <button
                                      type="submit"
                                      className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs transition"
                                    >
                                      Submit
                                    </button>
                                  </form>
                                ) : (
                                  <button
                                    onClick={() => setUploadingPartId(p.id)}
                                    className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition"
                                  >
                                    <Upload className="w-3.5 h-3.5" /> Upload Proof
                                  </button>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-white">Volunteering Approval Queue</h2>
              <div className="overflow-x-auto border border-white/5 rounded-2xl bg-[#161d30]/30">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 bg-slate-900/40 text-slate-400 text-xs font-semibold uppercase">
                      <th className="p-4">Employee</th>
                      <th className="p-4">CSR Activity</th>
                      <th className="p-4">Proof</th>
                      <th className="p-4">Points Award</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-sm text-slate-300">
                    {participations.filter(p => p.approvalStatus === 'PENDING').length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-500 italic">Approval queue is empty</td>
                      </tr>
                    ) : (
                      participations.filter(p => p.approvalStatus === 'PENDING').map(p => (
                        <tr key={p.id} className="hover:bg-white/5 transition">
                          <td className="p-4 font-medium text-white">{p.employee?.name || 'Unknown'}</td>
                          <td className="p-4">{p.activity?.title || 'Unknown'}</td>
                          <td className="p-4">
                            {p.proofUrl ? (
                              <a href={p.proofUrl} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline text-xs">View Proof File</a>
                            ) : (
                              <span className="text-slate-500 text-xs">No proof uploaded</span>
                            )}
                          </td>
                          <td className="p-4 text-emerald-400 font-bold">{p.activity?.points || 0} pts</td>
                          <td className="p-4">
                            <StatusBadge status={p.approvalStatus} color="yellow" />
                          </td>
                          <td className="p-4">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleApproveParticipation(p)}
                                className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition"
                              >
                                <Check className="w-3.5 h-3.5" /> Approve
                              </button>
                              <button
                                onClick={() => handleRejectParticipation(p.id)}
                                className="flex items-center gap-1 px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition"
                              >
                                <X className="w-3.5 h-3.5" /> Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'training' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-6 bg-[#161d30]/30 border border-white/5 rounded-2xl">
              <h2 className="text-lg font-bold text-white mb-4">Training completion rate by Department</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={socialDashboard?.trainingRecordsSummary?.byDepartment || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0a" />
                    <XAxis dataKey="departmentName" stroke="#94a3b8" fontSize={9} />
                    <YAxis stroke="#94a3b8" fontSize={9} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                    <Bar dataKey="completionRate" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="overflow-x-auto border border-white/5 rounded-2xl bg-[#161d30]/30">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-slate-900/40 text-slate-400 text-xs font-semibold uppercase">
                    <th className="p-4">Employee</th>
                    <th className="p-4">Training Name</th>
                    <th className="p-4">Completed Date</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm text-slate-300">
                  {trainingRecords.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-slate-500 italic">No training assignments found</td>
                    </tr>
                  ) : (
                    trainingRecords.map(tr => (
                      <tr key={tr.id} className="hover:bg-white/5 transition">
                        <td className="p-4 font-medium text-white">{tr.employee?.name || 'Unknown'}</td>
                        <td className="p-4">{tr.trainingName}</td>
                        <td className="p-4">
                          {tr.completedAt ? new Date(tr.completedAt).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="p-4">
                          <StatusBadge status={tr.status} color={tr.status === 'COMPLETED' ? 'green' : 'yellow'} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {showActivityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-[#0f172a] border border-white/10 rounded-2xl p-6 shadow-2xl space-y-4">
            <h2 className="text-xl font-bold text-white">Create CSR Activity</h2>
            <form onSubmit={handleCreateActivity} className="space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-400 uppercase">Title</label>
                <input
                  type="text"
                  required
                  value={newActivity.title}
                  onChange={e => setNewActivity(prev => ({ ...prev, title: e.target.value }))}
                  className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-200 outline-none focus:border-emerald-500/50"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-400 uppercase">Description</label>
                <textarea
                  value={newActivity.description}
                  onChange={e => setNewActivity(prev => ({ ...prev, description: e.target.value }))}
                  className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-200 outline-none focus:border-emerald-500/50"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">Category</label>
                  <select
                    required
                    value={newActivity.categoryId}
                    onChange={e => setNewActivity(prev => ({ ...prev, categoryId: e.target.value }))}
                    className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-200 outline-none focus:border-emerald-500/50"
                  >
                    <option value="">Select Category</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">Department</label>
                  <select
                    required
                    value={newActivity.departmentId}
                    onChange={e => setNewActivity(prev => ({ ...prev, departmentId: e.target.value }))}
                    className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-200 outline-none focus:border-emerald-500/50"
                  >
                    <option value="">Select Department</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">Date</label>
                  <input
                    type="date"
                    required
                    value={newActivity.date}
                    onChange={e => setNewActivity(prev => ({ ...prev, date: e.target.value }))}
                    className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-200 outline-none focus:border-emerald-500/50"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">Location</label>
                  <input
                    type="text"
                    value={newActivity.location}
                    onChange={e => setNewActivity(prev => ({ ...prev, location: e.target.value }))}
                    className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-200 outline-none focus:border-emerald-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">Target Participants</label>
                  <input
                    type="number"
                    value={newActivity.targetParticipants}
                    onChange={e => setNewActivity(prev => ({ ...prev, targetParticipants: e.target.value }))}
                    className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-200 outline-none focus:border-emerald-500/50"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">Points Value</label>
                  <input
                    type="number"
                    required
                    value={newActivity.points}
                    onChange={e => setNewActivity(prev => ({ ...prev, points: e.target.value }))}
                    className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-200 outline-none focus:border-emerald-500/50"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowActivityModal(false)}
                  className="px-4 py-2 border border-slate-800 text-slate-400 hover:text-white rounded-xl text-sm font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold transition"
                >
                  Save Activity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showTrainingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-[#0f172a] border border-white/10 rounded-2xl p-6 shadow-2xl space-y-4">
            <h2 className="text-xl font-bold text-white">Assign Employee Training</h2>
            <form onSubmit={handleCreateTraining} className="space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-400 uppercase">Employee ID (UUID)</label>
                <input
                  type="text"
                  required
                  placeholder="Enter employee user ID"
                  value={newTraining.employeeId}
                  onChange={e => setNewTraining(prev => ({ ...prev, employeeId: e.target.value }))}
                  className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-200 outline-none focus:border-emerald-500/50"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-400 uppercase">Training Program Name</label>
                <input
                  type="text"
                  required
                  value={newTraining.trainingName}
                  onChange={e => setNewTraining(prev => ({ ...prev, trainingName: e.target.value }))}
                  className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-200 outline-none focus:border-emerald-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">Status</label>
                  <select
                    value={newTraining.status}
                    onChange={e => setNewTraining(prev => ({ ...prev, status: e.target.value }))}
                    className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-200 outline-none focus:border-emerald-500/50"
                  >
                    <option value="ASSIGNED">Assigned</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">Completed Date</label>
                  <input
                    type="date"
                    value={newTraining.completedAt}
                    onChange={e => setNewTraining(prev => ({ ...prev, completedAt: e.target.value }))}
                    className="px-3 py-2 rounded-xl bg-[#0f172a] border border-slate-800 text-sm text-slate-200 outline-none focus:border-emerald-500/50"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowTrainingModal(false)}
                  className="px-4 py-2 border border-slate-800 text-slate-400 hover:text-white rounded-xl text-sm font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold transition"
                >
                  Assign Training
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Social;
