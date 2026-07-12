import React, { useState, useEffect } from 'react';
import { Leaf, Activity, CheckCircle, AlertCircle } from 'lucide-react';

export default function App() {
  const [health, setHealth] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/health')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setHealth(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-[#0b0f19] flex flex-col justify-center items-center p-6 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[120px]" />

      <div className="w-full max-w-md bg-[#161d30]/75 backdrop-blur-md border border-white/5 rounded-2xl p-8 relative z-10 shadow-2xl space-y-6">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 mb-4 animate-bounce">
            <Leaf className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="text-3xl font-extrabold text-white">Hello EcoSphere</h1>
          <p className="text-slate-400 text-xs mt-1.5 font-medium tracking-wide uppercase">ESG Management Platform</p>
        </div>

        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3">
          <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
            <span className="text-slate-400 font-semibold flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-emerald-400" /> API Health Status
            </span>
            {loading ? (
              <span className="text-slate-400 font-semibold animate-pulse">Checking...</span>
            ) : error ? (
              <span className="text-red-400 font-bold flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> Error
              </span>
            ) : (
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> Connected
              </span>
            )}
          </div>

          <div className="text-xs">
            {loading ? (
              <p className="text-slate-500 italic py-2 text-center">Contacting backend API...</p>
            ) : error ? (
              <div className="text-red-400/90 leading-relaxed py-1">
                <p className="font-semibold">Failed to fetch api/health:</p>
                <p className="text-[10px] mt-0.5 break-all">{error}</p>
              </div>
            ) : (
              <div className="space-y-1.5 py-1 text-slate-300">
                <div>
                  <span className="text-slate-500">Status:</span>{' '}
                  <span className="font-bold text-white uppercase">{health?.status}</span>
                </div>
                <div>
                  <span className="text-slate-500">Message:</span> <span className="text-slate-200">{health?.message}</span>
                </div>
                <div>
                  <span className="text-slate-500">Timestamp:</span>{' '}
                  <span className="text-[10px] font-mono text-slate-400">{health?.timestamp}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <p className="text-[10px] text-slate-500 text-center font-medium">
          EcoSphere Scaffolding Complete • Port 5173
        </p>
      </div>
    </div>
  );
}
