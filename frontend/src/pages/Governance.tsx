import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../utils/api';
import { DataTable } from '../components/DataTable';
import { Modal } from '../components/Modal';
import { StatusBadge } from '../components/StatusBadge';
import { Plus, Edit2, Check, RefreshCw, FileText, CheckCircle2, ShieldAlert } from 'lucide-react';

export const Governance: React.FC = () => {
  const { user } = useAuth();
  const isAdminOrManager = user?.role === 'ADMIN' || user?.role === 'ESG_MANAGER';

  const [activeTab, setActiveTab] = useState<'policies' | 'my-ack' | 'audits' | 'compliance'>('policies');

  const [policies, setPolicies] = useState<any[]>([]);
  const [policiesLoading, setPoliciesLoading] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<any>(null);
  const [policyForm, setPolicyForm] = useState({
    title: '',
    category: 'GOVERNANCE',
    version: 'v1.0',
    effectiveDate: '',
    mandatoryAcknowledgement: true
  });
  const [selectedPolicyForAck, setSelectedPolicyForAck] = useState<any>(null);
  const [policyAcks, setPolicyAcks] = useState<any[]>([]);
  const [policyAcksLoading, setPolicyAcksLoading] = useState(false);

  const [myAcks, setMyAcks] = useState<any[]>([]);
  const [myAcksLoading, setMyAcksLoading] = useState(false);

  const [audits, setAudits] = useState<any[]>([]);
  const [auditsLoading, setAuditsLoading] = useState(false);
  const [departments, setDepartments] = useState<any[]>([]);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [editingAudit, setEditingAudit] = useState<any>(null);
  const [auditForm, setAuditForm] = useState({
    title: '',
    departmentId: '',
    auditorId: '',
    startDate: '',
    endDate: ''
  });

  const [complianceIssues, setComplianceIssues] = useState<any[]>([]);
  const [complianceLoading, setComplianceLoading] = useState(false);
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [showComplianceModal, setShowComplianceModal] = useState(false);
  const [editingCompliance, setEditingCompliance] = useState<any>(null);
  const [complianceForm, setComplianceForm] = useState({
    severity: 'MEDIUM',
    description: '',
    ownerId: '',
    dueDate: ''
  });

  const fetchPolicies = async () => {
    setPoliciesLoading(true);
    try {
      const data = await apiRequest('/api/esg-policies');
      if (Array.isArray(data)) setPolicies(data);
    } catch {}
    setPoliciesLoading(false);
  };

  const handleSavePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPolicy) {
        await apiRequest(`/api/esg-policies/${editingPolicy.id}`, {
          method: 'PUT',
          body: policyForm
        });
      } else {
        await apiRequest('/api/esg-policies', {
          method: 'POST',
          body: policyForm
        });
      }
      setShowPolicyModal(false);
      setEditingPolicy(null);
      fetchPolicies();
    } catch {}
  };

  const handlePublishPolicy = async (id: string) => {
    try {
      await apiRequest(`/api/policies/${id}/publish`, { method: 'PATCH' });
      fetchPolicies();
    } catch {}
  };

  const handleViewAcks = async (policy: any) => {
    setSelectedPolicyForAck(policy);
    setPolicyAcksLoading(true);
    try {
      const data = await apiRequest(`/api/policies/${policy.id}/acknowledgements`);
      if (Array.isArray(data)) {
        setPolicyAcks(data);
      }
    } catch {}
    setPolicyAcksLoading(false);
  };

  const fetchMyAcks = async () => {
    setMyAcksLoading(true);
    try {
      const data = await apiRequest('/api/me/acknowledgements');
      if (Array.isArray(data)) setMyAcks(data);
    } catch {}
    setMyAcksLoading(false);
  };

  const handleAcknowledge = async (ackId: string) => {
    try {
      await apiRequest(`/api/acknowledgements/${ackId}/acknowledge`, { method: 'POST' });
      fetchMyAcks();
    } catch {}
  };

  const fetchAudits = async () => {
    setAuditsLoading(true);
    try {
      const [auditData, deptData] = await Promise.all([
        apiRequest('/api/audits'),
        apiRequest('/api/departments')
      ]);
      if (Array.isArray(auditData)) setAudits(auditData);
      if (Array.isArray(deptData)) setDepartments(deptData);
    } catch {}
    setAuditsLoading(false);
  };

  const handleSaveAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAudit) {
        await apiRequest(`/api/audits/${editingAudit.id}`, {
          method: 'PUT',
          body: auditForm
        });
      } else {
        await apiRequest('/api/audits', {
          method: 'POST',
          body: { ...auditForm, auditorId: user?.id }
        });
      }
      setShowAuditModal(false);
      setEditingAudit(null);
      fetchAudits();
    } catch {}
  };

  const handleTransitionAudit = async (id: string, nextStatus: string) => {
    try {
      await apiRequest(`/api/audits/${id}/status`, {
        method: 'PATCH',
        body: { status: nextStatus }
      });
      fetchAudits();
    } catch {}
  };

  const fetchCompliance = async () => {
    setComplianceLoading(true);
    try {
      const url = overdueOnly ? '/api/compliance-issues?overdue=true' : '/api/compliance-issues';
      const data = await apiRequest(url);
      if (Array.isArray(data)) setComplianceIssues(data);
    } catch {}
    setComplianceLoading(false);
  };

  const handleSaveCompliance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complianceForm.ownerId || !complianceForm.dueDate) {
      window.dispatchEvent(
        new CustomEvent('toast-notification', {
          detail: { type: 'error', message: 'Owner ID and Due Date are required.' }
        })
      );
      return;
    }
    try {
      if (editingCompliance) {
        await apiRequest(`/api/compliance-issues/${editingCompliance.id}`, {
          method: 'PUT',
          body: complianceForm
        });
      } else {
        await apiRequest('/api/compliance-issues', {
          method: 'POST',
          body: complianceForm
        });
      }
      setShowComplianceModal(false);
      setEditingCompliance(null);
      fetchCompliance();
    } catch {}
  };

  const handleTransitionCompliance = async (id: string, status: string) => {
    try {
      await apiRequest(`/api/compliance-issues/${id}/status`, {
        method: 'PATCH',
        body: { status }
      });
      fetchCompliance();
    } catch {}
  };

  useEffect(() => {
    if (activeTab === 'policies') fetchPolicies();
    if (activeTab === 'my-ack') fetchMyAcks();
    if (activeTab === 'audits') fetchAudits();
    if (activeTab === 'compliance') fetchCompliance();
  }, [activeTab, overdueOnly]);

  const totalAcks = policyAcks.length;
  const acknowledgedCount = policyAcks.filter((a) => a.status === 'ACKNOWLEDGED').length;
  const ackPercentage = totalAcks > 0 ? (acknowledgedCount / totalAcks) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Governance Module</h1>
          <p className="text-slate-400 text-sm mt-1">
            Maintain compliance audits, ESG policies, and resolve compliance tickets.
          </p>
        </div>
      </div>

      <div className="flex border-b border-white/5 gap-2">
        <button
          onClick={() => setActiveTab('policies')}
          className={`px-4 py-2.5 text-sm font-bold tracking-wide transition-all border-b-2 ${
            activeTab === 'policies'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          ESG Policies
        </button>
        <button
          onClick={() => setActiveTab('my-ack')}
          className={`px-4 py-2.5 text-sm font-bold tracking-wide transition-all border-b-2 ${
            activeTab === 'my-ack'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          My Acknowledgements
        </button>
        <button
          onClick={() => setActiveTab('audits')}
          className={`px-4 py-2.5 text-sm font-bold tracking-wide transition-all border-b-2 ${
            activeTab === 'audits'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Audits
        </button>
        <button
          onClick={() => setActiveTab('compliance')}
          className={`px-4 py-2.5 text-sm font-bold tracking-wide transition-all border-b-2 ${
            activeTab === 'compliance'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Compliance Issues
        </button>
      </div>

      {activeTab === 'policies' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-white">Policies Catalog</h3>
            {isAdminOrManager && (
              <button
                onClick={() => {
                  setEditingPolicy(null);
                  setPolicyForm({
                    title: '',
                    category: 'GOVERNANCE',
                    version: 'v1.0',
                    effectiveDate: new Date().toISOString().split('T')[0],
                    mandatoryAcknowledgement: true
                  });
                  setShowPolicyModal(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition"
              >
                <Plus className="w-4 h-4" /> Create Policy
              </button>
            )}
          </div>
          <DataTable
            columns={[
              { header: 'Title', accessor: 'title' },
              { header: 'Category', accessor: 'category' },
              { header: 'Version', accessor: 'version' },
              {
                header: 'Effective Date',
                accessor: (row: any) => new Date(row.effectiveDate).toLocaleDateString()
              },
              {
                header: 'Mandatory',
                accessor: (row: any) => (row.mandatoryAcknowledgement ? 'Yes' : 'No')
              },
              { header: 'Status', accessor: (row: any) => <StatusBadge status={row.status} /> },
              {
                header: 'Actions',
                accessor: (row: any) => (
                  <div className="flex items-center gap-2">
                    {isAdminOrManager && (
                      <>
                        <button
                          onClick={() => {
                            setEditingPolicy(row);
                            setPolicyForm({
                              title: row.title,
                              category: row.category,
                              version: row.version,
                              effectiveDate: new Date(row.effectiveDate)
                                .toISOString()
                                .split('T')[0],
                              mandatoryAcknowledgement: row.mandatoryAcknowledgement
                            });
                            setShowPolicyModal(true);
                          }}
                          className="p-1 rounded bg-slate-800 text-slate-400 hover:text-white"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {row.status === 'DRAFT' && (
                          <button
                            onClick={() => handlePublishPolicy(row.id)}
                            className="px-2 py-1 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold hover:bg-indigo-500/20"
                          >
                            Publish
                          </button>
                        )}
                      </>
                    )}
                    <button
                      onClick={() => handleViewAcks(row)}
                      className="px-2 py-1 rounded bg-slate-800 text-xs text-slate-300 font-bold hover:bg-slate-700"
                    >
                      Acknowledge Status
                    </button>
                  </div>
                )
              }
            ]}
            data={policies}
            loading={policiesLoading}
          />
        </div>
      )}

      {activeTab === 'my-ack' && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-white">My Pending Policies</h3>
          <DataTable
            columns={[
              { header: 'Policy Title', accessor: (row: any) => row.policy?.title || 'Unknown' },
              { header: 'Category', accessor: (row: any) => row.policy?.category || 'GOVERNANCE' },
              { header: 'Status', accessor: (row: any) => <StatusBadge status={row.status} /> },
              {
                header: 'Action',
                accessor: (row: any) =>
                  row.status === 'PENDING' ? (
                    <button
                      onClick={() => handleAcknowledge(row.id)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition"
                    >
                      <Check className="w-3.5 h-3.5" /> Acknowledge
                    </button>
                  ) : (
                    <span className="text-xs text-slate-500">Acknowledged</span>
                  )
              }
            ]}
            data={myAcks}
            loading={myAcksLoading}
          />
        </div>
      )}

      {activeTab === 'audits' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-white">Compliance Audits</h3>
            {isAdminOrManager && (
              <button
                onClick={() => {
                  setEditingAudit(null);
                  setAuditForm({
                    title: '',
                    departmentId: '',
                    auditorId: '',
                    startDate: new Date().toISOString().split('T')[0],
                    endDate: new Date().toISOString().split('T')[0]
                  });
                  setShowAuditModal(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition"
              >
                <Plus className="w-4 h-4" /> Create Audit
              </button>
            )}
          </div>
          <DataTable
            columns={[
              { header: 'Title', accessor: 'title' },
              { header: 'Department', accessor: (row: any) => row.department?.name || 'Unknown' },
              {
                header: 'Date Range',
                accessor: (row: any) =>
                  `${new Date(row.startDate).toLocaleDateString()} - ${new Date(row.endDate).toLocaleDateString()}`
              },
              { header: 'Status', accessor: (row: any) => <StatusBadge status={row.status} /> },
              {
                header: 'Transitions',
                accessor: (row: any) => (
                  <div className="flex gap-2">
                    {isAdminOrManager && (
                      <>
                        {row.status === 'PLANNED' && (
                          <button
                            onClick={() => handleTransitionAudit(row.id, 'IN_PROGRESS')}
                            className="px-2 py-1 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold hover:bg-blue-500/20"
                          >
                            Start
                          </button>
                        )}
                        {row.status === 'IN_PROGRESS' && (
                          <button
                            onClick={() => handleTransitionAudit(row.id, 'COMPLETED')}
                            className="px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold hover:bg-emerald-500/20"
                          >
                            Complete
                          </button>
                        )}
                      </>
                    )}
                  </div>
                )
              }
            ]}
            data={audits}
            loading={auditsLoading}
          />
        </div>
      )}

      {activeTab === 'compliance' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h3 className="text-lg font-bold text-white">Compliance Logs</h3>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={overdueOnly}
                  onChange={(e) => setOverdueOnly(e.target.checked)}
                  className="rounded border-slate-800 bg-slate-900 text-indigo-500 focus:ring-0"
                />
                <span className="text-xs font-bold text-slate-400">Show Overdue Only</span>
              </label>
              {isAdminOrManager && (
                <button
                  onClick={() => {
                    setEditingCompliance(null);
                    setComplianceForm({
                      severity: 'MEDIUM',
                      description: '',
                      ownerId: '',
                      dueDate: new Date().toISOString().split('T')[0]
                    });
                    setShowComplianceModal(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition"
                >
                  <Plus className="w-4 h-4" /> Create Issue
                </button>
              )}
            </div>
          </div>
          <DataTable
            columns={[
              {
                header: 'Severity',
                accessor: (row: any) => {
                  const colors: Record<string, string> = {
                    HIGH: 'bg-rose-500/15 text-rose-400 border-rose-500/25',
                    MEDIUM: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
                    LOW: 'bg-blue-500/15 text-blue-400 border-blue-500/25'
                  };
                  return (
                    <span
                      className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold border ${
                        colors[row.severity] || colors.MEDIUM
                      }`}
                    >
                      {row.severity}
                    </span>
                  );
                }
              },
              { header: 'Description', accessor: 'description' },
              { header: 'Owner ID', accessor: 'ownerId' },
              {
                header: 'Due Date',
                accessor: (row: any) => new Date(row.dueDate).toLocaleDateString()
              },
              { header: 'Status', accessor: (row: any) => <StatusBadge status={row.status} /> },
              {
                header: 'Actions',
                accessor: (row: any) => (
                  <div className="flex gap-2">
                    {isAdminOrManager && row.status !== 'RESOLVED' && row.status !== 'CLOSED' && (
                      <button
                        onClick={() => handleTransitionCompliance(row.id, 'RESOLVED')}
                        className="px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold hover:bg-emerald-500/20"
                      >
                        Resolve
                      </button>
                    )}
                  </div>
                )
              }
            ]}
            data={complianceIssues}
            loading={complianceLoading}
          />
        </div>
      )}

      <Modal
        isOpen={showPolicyModal}
        onClose={() => setShowPolicyModal(false)}
        title={editingPolicy ? 'Edit Policy' : 'Create ESG Policy'}
        footer={
          <>
            <button
              onClick={() => setShowPolicyModal(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white text-xs font-bold transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSavePolicy}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition"
            >
              Save
            </button>
          </>
        }
      >
        <form onSubmit={handleSavePolicy} className="space-y-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-400">Policy Title</label>
            <input
              type="text"
              required
              value={policyForm.title}
              onChange={(e) => setPolicyForm({ ...policyForm, title: e.target.value })}
              className="px-3.5 py-2 rounded-xl bg-slate-950/60 border border-slate-800 text-sm text-white placeholder-slate-600 outline-none focus:border-indigo-500/50"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-400">Category</label>
            <select
              value={policyForm.category}
              onChange={(e) => setPolicyForm({ ...policyForm, category: e.target.value })}
              className="px-3.5 py-2 rounded-xl bg-slate-950/60 border border-slate-800 text-sm text-white outline-none focus:border-indigo-500/50"
            >
              <option value="ENVIRONMENTAL">Environmental</option>
              <option value="SOCIAL">Social</option>
              <option value="GOVERNANCE">Governance</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-400">Version</label>
            <input
              type="text"
              required
              value={policyForm.version}
              onChange={(e) => setPolicyForm({ ...policyForm, version: e.target.value })}
              className="px-3.5 py-2 rounded-xl bg-slate-950/60 border border-slate-800 text-sm text-white placeholder-slate-600 outline-none focus:border-indigo-500/50"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-400">Effective Date</label>
            <input
              type="date"
              required
              value={policyForm.effectiveDate}
              onChange={(e) => setPolicyForm({ ...policyForm, effectiveDate: e.target.value })}
              className="px-3.5 py-2 rounded-xl bg-slate-950/60 border border-slate-800 text-sm text-white outline-none focus:border-indigo-500/50"
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer py-2">
            <input
              type="checkbox"
              checked={policyForm.mandatoryAcknowledgement}
              onChange={(e) =>
                setPolicyForm({ ...policyForm, mandatoryAcknowledgement: e.target.checked })
              }
              className="rounded border-slate-800 bg-slate-900 text-indigo-500 focus:ring-0"
            />
            <span className="text-xs font-bold text-slate-400">Mandatory Acknowledgement</span>
          </label>
        </form>
      </Modal>

      <Modal
        isOpen={selectedPolicyForAck !== null}
        onClose={() => setSelectedPolicyForAck(null)}
        title="Acknowledgement Status Drill-Down"
      >
        <div className="space-y-4">
          <div className="flex justify-between items-center text-sm font-semibold">
            <span className="text-slate-400">Progress:</span>
            <span className="text-white">{acknowledgedCount} / {totalAcks} ({ackPercentage.toFixed(1)}%)</span>
          </div>
          <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-indigo-500 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${ackPercentage}%` }}
            />
          </div>
          <div className="space-y-2 mt-4">
            {policyAcksLoading ? (
              <p className="text-xs text-slate-500 italic text-center py-4">Loading list...</p>
            ) : policyAcks.length === 0 ? (
              <p className="text-xs text-slate-500 italic text-center py-4">No acknowledgements linked.</p>
            ) : (
              policyAcks.map((a) => (
                <div key={a.id} className="flex justify-between items-center p-2 bg-slate-900/30 rounded border border-white/5 text-xs">
                  <div>
                    <p className="font-bold text-white">{a.employee?.name || 'Unknown'}</p>
                    <p className="text-slate-500">{a.employee?.email || ''}</p>
                  </div>
                  <StatusBadge status={a.status} />
                </div>
              ))
            )}
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showAuditModal}
        onClose={() => setShowAuditModal(false)}
        title={editingAudit ? 'Edit Audit' : 'Schedule Audit'}
        footer={
          <>
            <button
              onClick={() => setShowAuditModal(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white text-xs font-bold transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveAudit}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition"
            >
              Schedule
            </button>
          </>
        }
      >
        <form onSubmit={handleSaveAudit} className="space-y-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-400">Audit Title</label>
            <input
              type="text"
              required
              value={auditForm.title}
              onChange={(e) => setAuditForm({ ...auditForm, title: e.target.value })}
              className="px-3.5 py-2 rounded-xl bg-slate-950/60 border border-slate-800 text-sm text-white placeholder-slate-600 outline-none focus:border-indigo-500/50"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-400">Target Department</label>
            <select
              required
              value={auditForm.departmentId}
              onChange={(e) => setAuditForm({ ...auditForm, departmentId: e.target.value })}
              className="px-3.5 py-2 rounded-xl bg-slate-950/60 border border-slate-800 text-sm text-white outline-none focus:border-indigo-500/50"
            >
              <option value="">Select Department</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-400">Start Date</label>
            <input
              type="date"
              required
              value={auditForm.startDate}
              onChange={(e) => setAuditForm({ ...auditForm, startDate: e.target.value })}
              className="px-3.5 py-2 rounded-xl bg-slate-950/60 border border-slate-800 text-sm text-white outline-none focus:border-indigo-500/50"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-400">End Date</label>
            <input
              type="date"
              required
              value={auditForm.endDate}
              onChange={(e) => setAuditForm({ ...auditForm, endDate: e.target.value })}
              className="px-3.5 py-2 rounded-xl bg-slate-950/60 border border-slate-800 text-sm text-white outline-none focus:border-indigo-500/50"
            />
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showComplianceModal}
        onClose={() => setShowComplianceModal(false)}
        title={editingCompliance ? 'Edit Compliance Issue' : 'Log Compliance Issue'}
        footer={
          <>
            <button
              onClick={() => setShowComplianceModal(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white text-xs font-bold transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveCompliance}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition"
            >
              Log Issue
            </button>
          </>
        }
      >
        <form onSubmit={handleSaveCompliance} className="space-y-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-400">Severity</label>
            <select
              value={complianceForm.severity}
              onChange={(e) => setComplianceForm({ ...complianceForm, severity: e.target.value })}
              className="px-3.5 py-2 rounded-xl bg-slate-950/60 border border-slate-800 text-sm text-white outline-none focus:border-indigo-500/50"
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-400">Description</label>
            <textarea
              required
              value={complianceForm.description}
              onChange={(e) => setComplianceForm({ ...complianceForm, description: e.target.value })}
              className="px-3.5 py-2 rounded-xl bg-slate-950/60 border border-slate-800 text-sm text-white placeholder-slate-600 outline-none focus:border-indigo-500/50 min-h-[100px]"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-400">Owner User ID <span className="text-rose-500">*</span></label>
            <input
              type="text"
              required
              placeholder="e.g. employee-uuid-123"
              value={complianceForm.ownerId}
              onChange={(e) => setComplianceForm({ ...complianceForm, ownerId: e.target.value })}
              className="px-3.5 py-2 rounded-xl bg-slate-950/60 border border-slate-800 text-sm text-white placeholder-slate-600 outline-none focus:border-indigo-500/50"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-400">Due Date <span className="text-rose-500">*</span></label>
            <input
              type="date"
              required
              value={complianceForm.dueDate}
              onChange={(e) => setComplianceForm({ ...complianceForm, dueDate: e.target.value })}
              className="px-3.5 py-2 rounded-xl bg-slate-950/60 border border-slate-800 text-sm text-white outline-none focus:border-indigo-500/50"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Governance;
