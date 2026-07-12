import React, { useState, useEffect } from 'react';
import { StatCard } from '../components/StatCard';
import { apiRequest } from '../utils/api';
import { Activity, ShieldAlert, Award, Footprints } from 'lucide-react';
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [overviewData, envData, challengesData, complianceData] = await Promise.all([
          apiRequest('/api/dashboard/esg-overview').catch(() => null),
          apiRequest('/api/dashboard/environmental').catch(() => null),
          apiRequest('/api/challenges').catch(() => []),
          apiRequest('/api/compliance-issues').catch(() => [])
        ]);

        setOverview(overviewData);
        setEnvironmental(envData);
        setChallenges(challengesData || []);
        setComplianceIssues(complianceData || []);
      } catch (err) {
        console.error('Dashboard data fetch failed', err);
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

  const trendData = overview?.trendOverTime || [
    { period: '2026-05', overallScore: 78 },
    { period: '2026-06', overallScore: 88 },
    { period: '2026-07', overallScore: overallScore }
  ];

  const columns = [
    { header: 'Department', accessor: (row: any) => row.department?.name || 'Unknown' },
    { header: 'Environmental', accessor: (row: any) => `${row.environmentalScore?.toFixed(1) ?? '100.0'}` },
    { header: 'Social', accessor: (row: any) => `${row.socialScore?.toFixed(1) ?? '100.0'}` },
    { header: 'Governance', accessor: (row: any) => `${row.governanceScore?.toFixed(1) ?? '100.0'}` },
    { header: 'Total ESG Score', accessor: (row: any) => `${row.totalScore?.toFixed(1) ?? '100.0'}` }
  ];

  const departmentScores = overview?.departmentScores || [];

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 rounded-2xl bg-[#161d30]/40 border border-white/5 shadow-xl backdrop-blur-md space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white">ESG Score Trend</h3>
            <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
              Positive Growth
            </span>
          </div>
          <div className="h-[300px] w-full">
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

        <div className="p-6 rounded-2xl bg-[#161d30]/40 border border-white/5 shadow-xl backdrop-blur-md space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-white mb-2">Platform Summary</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Overall scores aggregate calculations across all registered departments. Adjust subscore weights and thresholds within administrative settings to align metric rollups to organizational guidelines.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-900 space-y-3">
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Environmental Weight:</span>
              <span className="font-semibold text-slate-300">40%</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Social Weight:</span>
              <span className="font-semibold text-slate-300">30%</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Governance Weight:</span>
              <span className="font-semibold text-slate-300">30%</span>
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
