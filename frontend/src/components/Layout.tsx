import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../utils/api';
import {
  LayoutDashboard,
  Leaf,
  Users,
  Building,
  Trophy,
  BarChart2,
  Settings as SettingsIcon,
  Bell,
  LogOut,
  User as UserIcon,
  Menu,
  X
} from 'lucide-react';

export const Layout: React.FC = () => {
  const { user, logout, refreshUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const fetchNotifications = async () => {
    try {
      const data = await apiRequest('/api/me/notifications');
      if (Array.isArray(data)) {
        setNotifications(data);
      }
    } catch {}
  };

  useEffect(() => {
    fetchNotifications();
    refreshUser();
    const interval = setInterval(() => {
      fetchNotifications();
      refreshUser();
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkRead = async (id: string) => {
    try {
      await apiRequest(`/api/notifications/${id}/read`, { method: 'PATCH' });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch {}
  };

  const navItems = [
    { label: 'Dashboard', path: '/', icon: <LayoutDashboard className="w-5 h-5" />, role: 'ALL' },
    { label: 'Environmental', path: '/environmental', icon: <Leaf className="w-5 h-5 text-emerald-400" />, role: 'ALL' },
    { label: 'Social', path: '/social', icon: <Users className="w-5 h-5 text-amber-400" />, role: 'ALL' },
    { label: 'Governance', path: '/governance', icon: <Building className="w-5 h-5 text-indigo-400" />, role: 'ALL' },
    { label: 'Gamification', path: '/gamification', icon: <Trophy className="w-5 h-5 text-violet-400" />, role: 'ALL' },
    { label: 'Reports', path: '/reports', icon: <BarChart2 className="w-5 h-5" />, role: 'ALL' },
    { label: 'Settings', path: '/settings', icon: <SettingsIcon className="w-5 h-5" />, role: 'ADMIN' }
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] flex">
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-[#111726]/60 border-r border-white/5 backdrop-blur-md transition-transform duration-300 transform md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/25">
              <Leaf className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="text-lg font-extrabold text-white tracking-wide">EcoSphere</span>
          </Link>
          <button className="md:hidden text-slate-400 hover:text-white" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            if (item.role === 'ADMIN' && user?.role !== 'ADMIN') return null;
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold tracking-wide transition-all duration-200 ${
                  active
                    ? 'bg-[#161d30] text-white shadow-md border border-white/5'
                    : 'text-slate-400 hover:bg-[#161d30]/50 hover:text-white'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex-1 md:pl-64 flex flex-col">
        <header className="h-16 bg-[#111726]/30 border-b border-white/5 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-20">
          <button className="md:hidden text-slate-400 hover:text-white" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-6 h-6" />
          </button>

          <div className="hidden md:block">
            <span className="text-xs font-semibold text-slate-500 tracking-wider uppercase">
              Period: July 2026
            </span>
          </div>

          <div className="flex items-center gap-6">
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-1.5 rounded-lg text-slate-400 hover:bg-white/5 hover:text-white transition"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 w-4 h-4 rounded-full bg-rose-500 text-[10px] font-bold text-white flex items-center justify-center animate-bounce">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 rounded-2xl bg-[#111726] border border-white/5 shadow-2xl p-4 space-y-3 z-50">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="text-xs font-bold text-white">Notifications</span>
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="text-xs text-slate-400 hover:text-white"
                    >
                      Close
                    </button>
                  </div>
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-slate-500 italic text-center py-4">No notifications</p>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => handleMarkRead(n.id)}
                          className={`p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                            n.read
                              ? 'bg-slate-900/20 border-white/5 text-slate-400'
                              : 'bg-indigo-500/5 border-indigo-500/10 text-slate-200'
                          }`}
                        >
                          <p className="font-semibold">{n.type?.replace('_', ' ')}</p>
                          <p className="mt-0.5 leading-relaxed">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 px-3 py-1.5 rounded-xl text-xs font-bold text-violet-400">
              <Trophy className="w-4 h-4 text-violet-400" />
              <span>{user?.pointsBalance ?? 0} XP</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center">
                <UserIcon className="w-5 h-5 text-slate-400" />
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold text-white leading-tight">{user?.name}</p>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  {user?.role}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 transition"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        <main className="p-8 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
