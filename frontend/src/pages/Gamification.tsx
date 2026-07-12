import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../utils/api';
import { DataTable } from '../components/DataTable';
import { Modal } from '../components/Modal';
import { Plus, Edit2, Check, X, Award, ShoppingBag, List, Trophy, ShieldAlert, File } from 'lucide-react';

export const Gamification: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const isAdminOrManager = user?.role === 'ADMIN' || user?.role === 'ESG_MANAGER';

  const [activeTab, setActiveTab] = useState<'challenges' | 'badges' | 'rewards' | 'leaderboard'>('challenges');

  const [challenges, setChallenges] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [challengesLoading, setChallengesLoading] = useState(false);
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState<any>(null);
  const [challengeForm, setChallengeForm] = useState({
    title: '',
    categoryId: '',
    description: '',
    xp: '50',
    difficulty: 'MEDIUM',
    evidenceRequired: true,
    deadline: ''
  });

  const [showProgressModal, setShowProgressModal] = useState(false);
  const [selectedParticipation, setSelectedParticipation] = useState<any>(null);
  const [progressValue, setProgressValue] = useState<number>(0);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [uploadingProof, setUploadingProof] = useState(false);

  const [badges, setBadges] = useState<any[]>([]);
  const [unlockedBadges, setUnlockedBadges] = useState<any[]>([]);
  const [badgesLoading, setBadgesLoading] = useState(false);

  const [rewards, setRewards] = useState<any[]>([]);
  const [redemptions, setRedemptions] = useState<any[]>([]);
  const [rewardsLoading, setRewardsLoading] = useState(false);
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [editingReward, setEditingReward] = useState<any>(null);
  const [rewardForm, setRewardForm] = useState({
    name: '',
    description: '',
    pointsRequired: '100',
    stock: '10',
    status: 'ACTIVE'
  });

  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [leaderboardScope, setLeaderboardScope] = useState<'org' | 'department'>('org');
  const [leaderboardPeriod, setLeaderboardPeriod] = useState<'week' | 'month' | 'quarter' | 'all'>('all');

  const fetchChallenges = async () => {
    setChallengesLoading(true);
    try {
      const [challengesData, catsData] = await Promise.all([
        apiRequest('/api/challenges'),
        apiRequest('/api/categories')
      ]);
      if (Array.isArray(challengesData)) setChallenges(challengesData);
      if (Array.isArray(catsData)) {
        setCategories(catsData.filter((c: any) => c.type === 'CSR_ACTIVITY'));
      }
    } catch {}
    setChallengesLoading(false);
  };

  const handleSaveChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingChallenge) {
        await apiRequest(`/api/challenges/${editingChallenge.id}`, {
          method: 'PUT',
          body: challengeForm
        });
      } else {
        await apiRequest('/api/challenges', {
          method: 'POST',
          body: challengeForm
        });
      }
      setShowChallengeModal(false);
      setEditingChallenge(null);
      fetchChallenges();
    } catch {}
  };

  const handleTransitionChallengeStatus = async (id: string, status: string) => {
    try {
      await apiRequest(`/api/challenges/${id}/status`, {
        method: 'PATCH',
        body: { status }
      });
      fetchChallenges();
    } catch {}
  };

  const handleJoinChallenge = async (id: string) => {
    try {
      await apiRequest(`/api/challenges/${id}/join`, { method: 'POST' });
      fetchChallenges();
      window.dispatchEvent(
        new CustomEvent('toast-notification', {
          detail: { type: 'success', message: 'Successfully joined the challenge!' }
        })
      );
    } catch {}
  };

  const handleOpenProgressModal = (participation: any) => {
    setSelectedParticipation(participation);
    setProgressValue(participation.progress || 0);
    setProofFile(null);
    setShowProgressModal(true);
  };

  const handleProgressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedParticipation) return;
    setUploadingProof(true);

    try {
      const formData = new FormData();
      formData.append('progress', progressValue.toString());
      if (proofFile) {
        formData.append('proof', proofFile);
      }

      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      let role = '';
      if (userStr) {
        role = JSON.parse(userStr).role;
      }

      const res = await fetch(`/api/participation/challenge/${selectedParticipation.id}/progress`, {
        method: 'PATCH',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          ...(role ? { 'x-user-role': role } : {})
        },
        body: formData
      });

      if (!res.ok) {
        throw new Error('Upload failed');
      }

      setShowProgressModal(false);
      fetchChallenges();
      window.dispatchEvent(
        new CustomEvent('toast-notification', {
          detail: { type: 'success', message: 'Proof and progress submitted for review!' }
        })
      );
    } catch {
      window.dispatchEvent(
        new CustomEvent('toast-notification', {
          detail: { type: 'error', message: 'Failed to upload proof.' }
        })
      );
    } finally {
      setUploadingProof(false);
    }
  };

  const handleApproveSubmission = async (id: string) => {
    try {
      await apiRequest(`/api/participation/challenge/${id}/approve`, { method: 'PATCH' });
      fetchChallenges();
      refreshUser();
      window.dispatchEvent(
        new CustomEvent('toast-notification', {
          detail: { type: 'success', message: 'Submission approved and XP awarded!' }
        })
      );
    } catch {}
  };

  const handleRejectSubmission = async (id: string) => {
    try {
      await apiRequest(`/api/participation/challenge/${id}/reject`, { method: 'PATCH' });
      fetchChallenges();
      window.dispatchEvent(
        new CustomEvent('toast-notification', {
          detail: { type: 'info', message: 'Submission rejected.' }
        })
      );
    } catch {}
  };

  const fetchBadges = async () => {
    setBadgesLoading(true);
    try {
      const [allBadges, userBadges] = await Promise.all([
        apiRequest('/api/badges'),
        apiRequest(`/api/employees/${user?.id}/badges`)
      ]);
      if (Array.isArray(allBadges)) setBadges(allBadges);
      if (Array.isArray(userBadges)) setUnlockedBadges(userBadges);
    } catch {}
    setBadgesLoading(false);
  };

  const fetchRewards = async () => {
    setRewardsLoading(true);
    try {
      const [rewardsData, redemptionsData] = await Promise.all([
        apiRequest('/api/rewards'),
        apiRequest('/api/me/redemptions')
      ]);
      if (Array.isArray(rewardsData)) setRewards(rewardsData);
      if (Array.isArray(redemptionsData)) setRedemptions(redemptionsData);
    } catch {}
    setRewardsLoading(false);
  };

  const handleSaveReward = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingReward) {
        await apiRequest(`/api/rewards/${editingReward.id}`, {
          method: 'PUT',
          body: rewardForm
        });
      } else {
        await apiRequest('/api/rewards', {
          method: 'POST',
          body: rewardForm
        });
      }
      setShowRewardModal(false);
      setEditingReward(null);
      fetchRewards();
    } catch {}
  };

  const handleRedeem = async (id: string) => {
    try {
      await apiRequest(`/api/rewards/${id}/redeem`, { method: 'POST' });
      fetchRewards();
      refreshUser();
      window.dispatchEvent(
        new CustomEvent('toast-notification', {
          detail: { type: 'success', message: 'Reward redeemed successfully!' }
        })
      );
    } catch {}
  };

  const fetchLeaderboard = async () => {
    setLeaderboardLoading(true);
    try {
      const deptFilter = leaderboardScope === 'department' && user?.departmentId ? `&departmentId=${user.departmentId}` : '';
      const data = await apiRequest(`/api/leaderboard?scope=${leaderboardScope}&period=${leaderboardPeriod}${deptFilter}`);
      if (Array.isArray(data)) setLeaderboard(data);
    } catch {}
    setLeaderboardLoading(false);
  };

  useEffect(() => {
    if (activeTab === 'challenges') fetchChallenges();
    if (activeTab === 'badges') fetchBadges();
    if (activeTab === 'rewards') fetchRewards();
    if (activeTab === 'leaderboard') fetchLeaderboard();
  }, [activeTab, leaderboardScope, leaderboardPeriod]);

  const activeChallengeSubmissions: any[] = [];
  challenges.forEach((ch) => {
    if (ch.participations) {
      ch.participations.forEach((p: any) => {
        if (p.approval === 'PENDING') {
          activeChallengeSubmissions.push({ ...p, challenge: ch });
        }
      });
    }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight font-sans">EcoSphere Gamification</h1>
        <p className="text-slate-400 text-sm mt-1">
          Complete green tasks, secure achievements, and redeem clean-energy gifts.
        </p>
      </div>

      <div className="flex border-b border-white/5 gap-2">
        <button
          onClick={() => setActiveTab('challenges')}
          className={`px-4 py-2.5 text-sm font-bold tracking-wide transition-all border-b-2 ${
            activeTab === 'challenges'
              ? 'border-violet-500 text-violet-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Challenges
        </button>
        <button
          onClick={() => setActiveTab('badges')}
          className={`px-4 py-2.5 text-sm font-bold tracking-wide transition-all border-b-2 ${
            activeTab === 'badges'
              ? 'border-violet-500 text-violet-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          My Badges
        </button>
        <button
          onClick={() => setActiveTab('rewards')}
          className={`px-4 py-2.5 text-sm font-bold tracking-wide transition-all border-b-2 ${
            activeTab === 'rewards'
              ? 'border-violet-500 text-violet-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Rewards Catalog
        </button>
        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`px-4 py-2.5 text-sm font-bold tracking-wide transition-all border-b-2 ${
            activeTab === 'leaderboard'
              ? 'border-violet-500 text-violet-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Leaderboard
        </button>
      </div>

      {activeTab === 'challenges' && (
        <div className="space-y-8">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-white">Active Challenges</h3>
              {isAdminOrManager && (
                <button
                  onClick={() => {
                    setEditingChallenge(null);
                    setChallengeForm({
                      title: '',
                      categoryId: categories[0]?.id || '',
                      description: '',
                      xp: '50',
                      difficulty: 'MEDIUM',
                      evidenceRequired: true,
                      deadline: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0]
                    });
                    setShowChallengeModal(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition"
                >
                  <Plus className="w-4 h-4" /> Create Challenge
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {challengesLoading ? (
                <p className="text-xs text-slate-500 italic py-4">Loading challenges...</p>
              ) : challenges.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-4">No challenges scheduled.</p>
              ) : (
                challenges.map((ch) => {
                  const joined = ch.participations?.find((p: any) => p.employeeId === user?.id);
                  const isCreator = ch.createdById === user?.id;

                  return (
                    <div
                      key={ch.id}
                      className="p-5 rounded-2xl bg-[#161d30]/40 border border-white/5 shadow-xl flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold tracking-wider text-violet-400 uppercase bg-violet-500/10 px-2.5 py-0.5 rounded-full border border-violet-500/20">
                            {ch.difficulty}
                          </span>
                          <span className="text-xs font-bold text-slate-400">{ch.xp} XP</span>
                        </div>
                        <h4 className="text-base font-bold text-white">{ch.title}</h4>
                        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                          {ch.description || 'No description provided.'}
                        </p>
                      </div>

                      <div className="pt-2 flex flex-col gap-2">
                        <div className="flex justify-between text-[10px] font-semibold text-slate-500">
                          <span>Deadline: {new Date(ch.deadline).toLocaleDateString()}</span>
                          <span>Status: {ch.status}</span>
                        </div>

                        {joined ? (
                          <div className="space-y-2 pt-2 border-t border-white/5">
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-slate-400 font-semibold">Your Progress:</span>
                              <span className="text-violet-400 font-bold">{joined.progress}%</span>
                            </div>
                            <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="bg-violet-500 h-1.5 rounded-full"
                                style={{ width: `${joined.progress}%` }}
                              />
                            </div>
                            {joined.approval === 'PENDING' ? (
                              <span className="text-[10px] text-amber-400 bg-amber-500/5 px-2 py-1 rounded text-center block border border-amber-500/10">
                                Pending Approval
                              </span>
                            ) : joined.approval === 'APPROVED' ? (
                              <span className="text-[10px] text-emerald-400 bg-emerald-500/5 px-2 py-1 rounded text-center block border border-emerald-500/10">
                                Completed & XP Awarded
                              </span>
                            ) : (
                              <button
                                onClick={() => handleOpenProgressModal(joined)}
                                className="w-full py-1.5 rounded-lg bg-slate-800 text-xs font-bold text-slate-200 hover:bg-slate-700 transition"
                              >
                                Update Progress
                              </button>
                            )}
                          </div>
                        ) : ch.status === 'ACTIVE' ? (
                          <button
                            onClick={() => handleJoinChallenge(ch.id)}
                            className="w-full py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-violet-600/15"
                          >
                            Join Challenge
                          </button>
                        ) : null}

                        {isAdminOrManager && (
                          <div className="flex gap-2 pt-2 border-t border-white/5">
                            {ch.status === 'DRAFT' && (
                              <button
                                onClick={() => handleTransitionChallengeStatus(ch.id, 'ACTIVE')}
                                className="flex-1 py-1 bg-violet-500/10 border border-violet-500/20 text-violet-400 hover:bg-violet-500/20 text-[10px] font-bold rounded"
                              >
                                Activate
                              </button>
                            )}
                            {ch.status === 'ACTIVE' && (
                              <button
                                onClick={() => handleTransitionChallengeStatus(ch.id, 'COMPLETED')}
                                className="flex-1 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 text-[10px] font-bold rounded"
                              >
                                Complete
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {isAdminOrManager && (
            <div className="space-y-4 pt-6 border-t border-white/5">
              <h3 className="text-lg font-bold text-white">Submissions Approval Queue</h3>
              <DataTable
                columns={[
                  { header: 'Challenge', accessor: (row: any) => row.challenge?.title || 'Unknown' },
                  { header: 'Participant Name', accessor: (row: any) => row.employee?.name || 'Unknown' },
                  { header: 'Progress', accessor: (row: any) => `${row.progress}%` },
                  {
                    header: 'Evidence File',
                    accessor: (row: any) =>
                      row.proofUrl ? (
                        <a
                          href={row.proofUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-xs text-indigo-400 hover:underline"
                        >
                          <File className="w-3.5 h-3.5" /> View Proof
                        </a>
                      ) : (
                        <span className="text-xs text-slate-500 italic">No proof uploaded</span>
                      )
                  },
                  {
                    header: 'Actions',
                    accessor: (row: any) => (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleApproveSubmission(row.id)}
                          className="p-1 rounded bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleRejectSubmission(row.id)}
                          className="p-1 rounded bg-rose-500/15 border border-rose-500/20 text-rose-400 hover:bg-rose-500/30"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )
                  }
                ]}
                data={activeChallengeSubmissions}
              />
            </div>
          )}
        </div>
      )}

      {activeTab === 'badges' && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-white">My Badges Achievements</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {badgesLoading ? (
              <p className="text-xs text-slate-500 italic py-4">Loading badges...</p>
            ) : badges.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-4">No achievements setup.</p>
            ) : (
              badges.map((b) => {
                const unlocked = unlockedBadges.find((ub) => ub.badgeId === b.id);
                let ruleDesc = '';
                try {
                  const rule = JSON.parse(b.unlockRuleJson);
                  ruleDesc = `Requires: ${rule.metric} ${rule.operator} ${rule.value}`;
                } catch {
                  ruleDesc = b.unlockRuleJson || 'Unlock criteria hidden';
                }

                return (
                  <div
                    key={b.id}
                    title={ruleDesc}
                    className={`p-4 rounded-2xl border text-center flex flex-col items-center justify-center space-y-3 transition group relative ${
                      unlocked
                        ? 'bg-amber-500/5 border-amber-500/20'
                        : 'bg-slate-900/40 border-white/5 opacity-40 hover:opacity-60'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${
                      unlocked
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                        : 'bg-slate-800 border-slate-700 text-slate-500'
                    }`}>
                      <Award className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white truncate max-w-[120px]">{b.name}</h4>
                      <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{b.description}</p>
                    </div>
                    {!unlocked && (
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 hidden group-hover:block bg-slate-950 text-slate-300 text-[9px] font-bold px-2 py-1 rounded shadow-xl border border-slate-800 whitespace-nowrap z-10">
                        {ruleDesc}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {activeTab === 'rewards' && (
        <div className="space-y-8">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-white">Rewards Catalog</h3>
              {isAdminOrManager && (
                <button
                  onClick={() => {
                    setEditingReward(null);
                    setRewardForm({
                      name: '',
                      description: '',
                      pointsRequired: '100',
                      stock: '10',
                      status: 'ACTIVE'
                    });
                    setShowRewardModal(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition"
                >
                  <Plus className="w-4 h-4" /> Create Reward
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {rewardsLoading ? (
                <p className="text-xs text-slate-500 italic py-4">Loading catalog...</p>
              ) : rewards.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-4">No rewards available.</p>
              ) : (
                rewards.map((r) => {
                  const pointsRequired = parseInt(r.pointsRequired);
                  const canRedeem = (user?.pointsBalance ?? 0) >= pointsRequired && r.stock > 0;

                  return (
                    <div
                      key={r.id}
                      className="p-5 rounded-2xl bg-[#161d30]/40 border border-white/5 shadow-xl flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-2">
                        <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/25 flex items-center justify-center text-violet-400">
                          <ShoppingBag className="w-5 h-5" />
                        </div>
                        <h4 className="text-sm font-bold text-white">{r.name}</h4>
                        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                          {r.description}
                        </p>
                      </div>

                      <div className="space-y-3 pt-2 border-t border-white/5">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500">Required:</span>
                          <span className="font-bold text-violet-400">{r.pointsRequired} XP</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500">Stock:</span>
                          <span className="font-bold text-slate-300">{r.stock} items</span>
                        </div>

                        <button
                          onClick={() => handleRedeem(r.id)}
                          disabled={!canRedeem}
                          className="w-full py-2 bg-violet-600 hover:bg-violet-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl text-xs font-bold transition shadow-lg disabled:shadow-none"
                        >
                          Redeem Reward
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="space-y-4 pt-6 border-t border-white/5">
            <h3 className="text-lg font-bold text-white">Redemption History</h3>
            <DataTable
              columns={[
                { header: 'Reward Name', accessor: (row: any) => row.reward?.name || 'Unknown' },
                { header: 'Points Spent', accessor: 'pointsSpent' },
                { header: 'Status', accessor: 'status' },
                {
                  header: 'Date',
                  accessor: (row: any) => new Date(row.createdAt).toLocaleDateString()
                }
              ]}
              data={redemptions}
            />
          </div>
        </div>
      )}

      {activeTab === 'leaderboard' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#161d30]/30 p-4 rounded-2xl border border-white/5">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-400">Scope:</span>
              <div className="flex bg-slate-900 rounded-lg p-0.5 border border-slate-800">
                <button
                  onClick={() => setLeaderboardScope('org')}
                  className={`px-3 py-1 rounded text-xs font-bold transition ${
                    leaderboardScope === 'org'
                      ? 'bg-violet-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Organization
                </button>
                <button
                  onClick={() => setLeaderboardScope('department')}
                  className={`px-3 py-1 rounded text-xs font-bold transition ${
                    leaderboardScope === 'department'
                      ? 'bg-violet-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Department
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-400">Period:</span>
              <select
                value={leaderboardPeriod}
                onChange={(e: any) => setLeaderboardPeriod(e.target.value)}
                className="px-3 py-1 bg-slate-950/60 border border-slate-800 rounded-lg text-xs text-slate-200 outline-none focus:border-violet-500/50"
              >
                <option value="week">Weekly</option>
                <option value="month">Monthly</option>
                <option value="quarter">Quarterly</option>
                <option value="all">All-Time</option>
              </select>
            </div>
          </div>

          <DataTable
            columns={[
              {
                header: 'Rank',
                accessor: (row: any, i) => {
                  const medalColors: Record<number, string> = {
                    1: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
                    2: 'text-slate-300 bg-slate-500/10 border-slate-500/20',
                    3: 'text-amber-600 bg-amber-600/10 border-amber-600/20'
                  };
                  const rank = row.rank || i + 1;
                  return rank <= 3 ? (
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${medalColors[rank]}`}>
                      #{rank}
                    </span>
                  ) : (
                    <span className="text-slate-500 font-bold pl-2">#{rank}</span>
                  );
                }
              },
              { header: 'Name', accessor: 'name' },
              { header: 'Department', accessor: (row: any) => row.department || 'Unknown' },
              {
                header: 'Points',
                accessor: (row: any) => (
                  <span className="font-bold text-violet-400">{row.points} XP</span>
                )
              }
            ]}
            data={leaderboard.map((row: any, index: number) => ({
              ...row,
              rank: index + 1
            }))}
            loading={leaderboardLoading}
            emptyMessage="Leaderboard ranks empty."
          />
        </div>
      )}

      <Modal
        isOpen={showChallengeModal}
        onClose={() => setShowChallengeModal(false)}
        title={editingChallenge ? 'Edit Challenge' : 'Create Challenge'}
        footer={
          <>
            <button
              onClick={() => setShowChallengeModal(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white text-xs font-bold transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveChallenge}
              className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition"
            >
              Save
            </button>
          </>
        }
      >
        <form onSubmit={handleSaveChallenge} className="space-y-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-400">Challenge Title</label>
            <input
              type="text"
              required
              value={challengeForm.title}
              onChange={(e) => setChallengeForm({ ...challengeForm, title: e.target.value })}
              className="px-3.5 py-2 rounded-xl bg-slate-950/60 border border-slate-800 text-sm text-white placeholder-slate-600 outline-none focus:border-violet-500/50"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-400">Category Tag</label>
            <select
              required
              value={challengeForm.categoryId}
              onChange={(e) => setChallengeForm({ ...challengeForm, categoryId: e.target.value })}
              className="px-3.5 py-2 rounded-xl bg-slate-950/60 border border-slate-800 text-sm text-white outline-none focus:border-violet-500/50"
            >
              <option value="">Select Category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-400">Description</label>
            <textarea
              value={challengeForm.description}
              onChange={(e) => setChallengeForm({ ...challengeForm, description: e.target.value })}
              className="px-3.5 py-2 rounded-xl bg-slate-950/60 border border-slate-800 text-sm text-white placeholder-slate-600 outline-none focus:border-violet-500/50 min-h-[80px]"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-400">XP Points</label>
              <input
                type="number"
                required
                value={challengeForm.xp}
                onChange={(e) => setChallengeForm({ ...challengeForm, xp: e.target.value })}
                className="px-3.5 py-2 rounded-xl bg-slate-950/60 border border-slate-800 text-sm text-white outline-none focus:border-violet-500/50"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-400">Difficulty</label>
              <select
                value={challengeForm.difficulty}
                onChange={(e) => setChallengeForm({ ...challengeForm, difficulty: e.target.value })}
                className="px-3.5 py-2 rounded-xl bg-slate-950/60 border border-slate-800 text-sm text-white outline-none focus:border-violet-500/50"
              >
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
              </select>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-400">Deadline</label>
            <input
              type="date"
              required
              value={challengeForm.deadline}
              onChange={(e) => setChallengeForm({ ...challengeForm, deadline: e.target.value })}
              className="px-3.5 py-2 rounded-xl bg-slate-950/60 border border-slate-800 text-sm text-white outline-none focus:border-violet-500/50"
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer py-2">
            <input
              type="checkbox"
              checked={challengeForm.evidenceRequired}
              onChange={(e) =>
                setChallengeForm({ ...challengeForm, evidenceRequired: e.target.checked })
              }
              className="rounded border-slate-800 bg-slate-900 text-violet-500 focus:ring-0"
            />
            <span className="text-xs font-bold text-slate-400">Evidence Required</span>
          </label>
        </form>
      </Modal>

      <Modal
        isOpen={showProgressModal}
        onClose={() => setShowProgressModal(false)}
        title="Submit Challenge Progress"
        footer={
          <>
            <button
              onClick={() => setShowProgressModal(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white text-xs font-bold transition"
            >
              Cancel
            </button>
            <button
              onClick={handleProgressSubmit}
              disabled={uploadingProof}
              className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition disabled:opacity-55"
            >
              {uploadingProof ? 'Uploading...' : 'Submit Progress'}
            </button>
          </>
        }
      >
        <form onSubmit={handleProgressSubmit} className="space-y-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-400">Progress: {progressValue}%</label>
            <input
              type="range"
              min="0"
              max="100"
              value={progressValue}
              onChange={(e) => setProgressValue(parseInt(e.target.value))}
              className="w-full accent-violet-500 bg-slate-800"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-400">Upload Proof File</label>
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => setProofFile(e.target.files ? e.target.files[0] : null)}
              className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-violet-500/10 file:text-violet-400 hover:file:bg-violet-500/20"
            />
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showRewardModal}
        onClose={() => setShowRewardModal(false)}
        title={editingReward ? 'Edit Reward' : 'Create Reward Item'}
        footer={
          <>
            <button
              onClick={() => setShowRewardModal(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white text-xs font-bold transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveReward}
              className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition"
            >
              Save Reward
            </button>
          </>
        }
      >
        <form onSubmit={handleSaveReward} className="space-y-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-400">Reward Name</label>
            <input
              type="text"
              required
              value={rewardForm.name}
              onChange={(e) => setRewardForm({ ...rewardForm, name: e.target.value })}
              className="px-3.5 py-2 rounded-xl bg-slate-950/60 border border-slate-800 text-sm text-white placeholder-slate-600 outline-none focus:border-violet-500/50"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-400">Description</label>
            <textarea
              value={rewardForm.description}
              onChange={(e) => setRewardForm({ ...rewardForm, description: e.target.value })}
              className="px-3.5 py-2 rounded-xl bg-slate-950/60 border border-slate-800 text-sm text-white placeholder-slate-600 outline-none focus:border-violet-500/50 min-h-[80px]"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-400">Points Required</label>
              <input
                type="number"
                required
                value={rewardForm.pointsRequired}
                onChange={(e) => setRewardForm({ ...rewardForm, pointsRequired: e.target.value })}
                className="px-3.5 py-2 rounded-xl bg-slate-950/60 border border-slate-800 text-sm text-white outline-none focus:border-violet-500/50"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-400">Stock Quantity</label>
              <input
                type="number"
                required
                value={rewardForm.stock}
                onChange={(e) => setRewardForm({ ...rewardForm, stock: e.target.value })}
                className="px-3.5 py-2 rounded-xl bg-slate-950/60 border border-slate-800 text-sm text-white outline-none focus:border-violet-500/50"
              />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Gamification;
