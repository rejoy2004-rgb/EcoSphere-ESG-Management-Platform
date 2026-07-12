import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Leaf, Lock, Mail } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    setError('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!res.ok) {
        let msg = 'Invalid credentials';
        try {
          const errData = await res.json();
          msg = errData.error || errData.message || msg;
        } catch {}
        throw new Error(msg);
      }

      const data = await res.json();
      login(data.token, data.user);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] flex flex-col justify-center items-center p-6 relative overflow-hidden">
      <div className="absolute top-[-15%] left-[-15%] w-[60%] h-[60%] bg-emerald-500/10 rounded-full blur-[150px]" />
      <div className="absolute bottom-[-15%] right-[-15%] w-[60%] h-[60%] bg-blue-500/10 rounded-full blur-[150px]" />

      <div className="w-full max-w-md bg-[#161d30]/80 backdrop-blur-md border border-white/5 rounded-2xl p-8 relative z-10 shadow-2xl space-y-6">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/25 mb-4 animate-pulse">
            <Leaf className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">EcoSphere</h1>
          <p className="text-slate-400 text-xs mt-1.5 font-medium tracking-wide uppercase">
            ESG Management Platform
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-400 text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="email"
                placeholder="name@ecosphere.local"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-sm text-white placeholder-slate-600 outline-none focus:border-emerald-500/50 transition-all duration-200"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-sm text-white placeholder-slate-600 outline-none focus:border-emerald-500/50 transition-all duration-200"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-semibold tracking-wide shadow-lg shadow-emerald-500/10 transition-all duration-200 hover:shadow-emerald-500/20 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none mt-2"
          >
            {submitting ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};
