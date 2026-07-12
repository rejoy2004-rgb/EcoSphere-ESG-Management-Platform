import React, { useState, useEffect } from 'react';
import { StatCard } from '../components/StatCard';
import { apiRequest } from '../utils/api';
import { Activity, ShieldAlert, Award, Footprints, Shield, Eye, Info } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { DataTable } from '../components/DataTable';

export const Dashboard: React.FC = () => {
  const [overview, setOverview] = useState<any>(null);
  const [environmental, setEnvironmental] = useState<any>(null);
  const [challenges, setChallenges] = useState<any[]>([]);
  const [complianceIssues, setComplianceIssues] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [overviewData, envData, challengesData, complianceData, activitiesData] = await Promise.all([
          apiRequest('/api/dashboard/esg-overview').catch(() => null),
          apiRequest('/api/dashboard/environmental').catch(() => null),
          apiRequest('/api/challenges').catch(() => []),
          apiRequest('/api/compliance-issues').catch(() => []),
          apiRequest('/api/me/notifications').catch(() => [])
        ]);
        setOverview(overviewData);
        setEnvironmental(envData);
        setChallenges(challengesData || []);
        setComplianceIssues(complianceData || []);
        setActivities(activitiesData || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const overallScore = overview?.overallESGScore ?? 100;
  const totalEmissions = environmental?.totalEmissions ?? 0;
  const activeChallengesCount = challenges.filter((c: any) => c.status === 'ACTIVE').length;
  const openComplianceCount = complianceIssues.filter((i: any) => i.status !== 'RESOLVED' && i.status !== 'CLOSED').length;

  const departmentScores = [...(overview?.departmentScores || [])].sort((a: any, b: any) => (b.totalScore || 0) - (a.totalScore || 0));

  const envAvg = departmentScores.reduce((acc, curr) => acc + (curr.environmentalScore || 0), 0) / (departmentScores.length || 1);
  const socAvg = departmentScores.reduce((acc, curr) => acc + (curr.socialScore || 0), 0) / (departmentScores.length || 1);
  const govAvg = departmentScores.reduce((acc, curr) => acc + (curr.governanceScore || 0), 0) / (departmentScores.length || 1);

  const trendData = overview?.trendOverTime || [
    { period: '2026-05', overallScore: 78 },
    { period: '2026-06', overallScore: 88 },
    { period: '2026-07', overallScore: overallScore }
  ];

  const columns = [
    { header: 'Rank', accessor: (_row: any, index?: number) => `#${(index ?? 0) + 1}` },
    { header: 'Department', accessor: (row: any) => row.department?.name || 'Unknown' },
    { header: 'Environmental', accessor: (row: any) => `${row.environmentalScore?.toFixed(1) ?? '100.0'}` },
    { header: 'Social', accessor: (row: any) => `${row.socialScore?.toFixed(1) ?? '100.0'}` },
    { header: 'Governance', accessor: (row: any) => `${row.governanceScore?.toFixed(1) ?? '100.0'}` },
    { header: 'Total ESG Score', accessor: (row: any) => `${row.totalScore?.toFixed(1) ?? '100.0'}` }
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">ESG Performance Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">Real-time Environmental, Social, and Governance rollups and gamified progress.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Overall ESG Score"
          value={loading ? '...' : overallScore.toFixed(1)}
          icon={<Activity className="w-5 h-5" />}
          color="indigo"
          trend={{ value: '+4.2%', positive: true }}
        />
        <StatCard
          title="Total Carbon Emissions"
          value={loading ? '...' : `${totalEmissions.toFixed(1)} kg`}
          icon={<Footprints className="w-5 h-5" />}
          color="emerald"
        />
        <StatCard
          title="Active Challenges"
          value={loading ? '...' : activeChallengesCount}
          icon={<Award className="w-5 h-5" />}
          color="violet"
        />
        <StatCard
          title="Open Compliance Issues"
          value={loading ? '...' : openComplianceCount}
          icon={<ShieldAlert className="w-5 h-5" />}
          color="rose"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-[#161d30]/30 border border-white/5 shadow-xl flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">Environmental (E)</span>
            <span className="text-2xl font-extrabold text-emerald-400 mt-1 block">{loading ? '...' : envAvg.toFixed(1)}</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Footprints className="w-5 h-5 text-emerald-400" />
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-[#161d30]/30 border border-white/5 shadow-xl flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">Social (S)</span>
            <span className="text-2xl font-extrabold text-amber-400 mt-1 block">{loading ? '...' : socAvg.toFixed(1)}</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <Activity className="w-5 h-5 text-amber-400" />
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-[#161d30]/30 border border-white/5 shadow-xl flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">Governance (G)</span>
            <span className="text-2xl font-extrabold text-indigo-400 mt-1 block">{loading ? '...' : govAvg.toFixed(1)}</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
            <Shield className="w-5 h-5 text-indigo-400" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 rounded-2xl bg-[#161d30]/30 border border-white/5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white">ESG Score Trend</h3>
            <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
              Positive Growth
            </span>
          </div>
          <div className="h-[250px] w-full">
            {loading ? (
              <div className="h-full flex items-center justify-center text-slate-500 italic text-sm">
                Loading charts...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f293d" vertical={false} />
                  <XAxis dataKey="period" stroke="#475569" fontSize={11} tickLine={false} />
                  <YAxis stroke="#475569" fontSize={11} domain={[0, 100]} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#111726',
                      borderColor: 'rgba(255,255,255,0.08)',
                      borderRadius: '12px'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="overallScore"
                    stroke="#6366f1"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorScore)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-[#161d30]/30 border border-white/5 shadow-xl flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white">Recent Activity</h3>
            <div className="space-y-3">
              {activities.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No recent system updates</p>
              ) : (
                activities.slice(0, 4).map((act) => (
                  <div key={act.id} className="p-3 bg-slate-950/40 border border-white/5 rounded-xl text-xs flex gap-2">
                    <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-white uppercase text-[10px] tracking-wider">{act.type?.replace('_', ' ')}</p>
                      <p className="text-slate-400 mt-0.5 leading-relaxed">{act.message}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-bold text-white">Department ESG Rankings</h3>
        <DataTable columns={columns} data={departmentScores} loading={loading} />
      </div>
    </div>
  );
};

export default Dashboard;
