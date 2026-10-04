import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, BarChart3, ShieldCheck, Edit3, Loader2, Save, X,
  Search, Activity, Clock, AlertTriangle, RefreshCw, CheckCircle2
} from 'lucide-react';
import toast from 'react-hot-toast';
import StatCard from './StatCard';
import GlassCard from './GlassCard';
import { adminAPI } from '../utils/api';

const AdminPanel = () => {
  const [users, setUsers]           = useState([]);
  const [stats, setStats]           = useState(null);
  const [loading, setLoading]       = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [editingId, setEditingId]   = useState(null);
  const [newLimit, setNewLimit]     = useState('');
  const [savingId, setSavingId]     = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // ── Fetch all admin data ────────────────────────────────────────────────────
  const fetchData = useCallback(async (silent = false) => {
    if (!silent) { setLoading(true); setFetchError(null); }
    try {
      const [usersRes, statsRes] = await Promise.all([
        adminAPI.getUsers(),
        adminAPI.getStats(),
      ]);
      setUsers(usersRes.data);
      setStats(statsRes.data);
    } catch (error) {
      const msg = error.userMessage || 'Failed to load admin data';
      if (!silent) {
        setFetchError(msg);
        toast.error(msg);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // Auto-refresh every 20 s for live log activity
    const interval = setInterval(() => fetchData(true), 20_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // ── Update a user's rate limit ─────────────────────────────────────────────
  const updateRateLimit = async (userId) => {
    const parsed = parseInt(newLimit, 10);
    if (!parsed || parsed < 1) {
      toast.error('Enter a valid rate limit (minimum 1)');
      return;
    }
    setSavingId(userId);
    try {
      await adminAPI.updateRateLimit(userId, parsed);
      toast.success('Rate limit updated', {
        icon: <CheckCircle2 size={16} className="text-green-400" />
      });
      setEditingId(null);
      fetchData(true);
    } catch (error) {
      toast.error(error.userMessage || 'Protocol update failed');
    } finally {
      setSavingId(null);
    }
  };

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (loading) return (
    <div className="h-[80vh] flex flex-col items-center justify-center gap-4 text-slate-400">
      <Loader2 className="animate-spin text-purple-500" size={48} />
      <span className="font-bold tracking-widest text-xs uppercase">Loading Core Assets…</span>
    </div>
  );

  // ── Error screen ──────────────────────────────────────────────────────────
  if (fetchError && !stats) return (
    <div className="h-[80vh] flex flex-col items-center justify-center gap-6 text-slate-400">
      <div className="p-5 bg-red-500/10 border border-red-500/20 rounded-2xl">
        <AlertTriangle className="text-red-400" size={48} />
      </div>
      <div className="text-center">
        <p className="text-white font-bold text-lg mb-1">Connection Failed</p>
        <p className="text-slate-500 text-sm max-w-sm">{fetchError}</p>
      </div>
      <button onClick={() => fetchData()} className="cyber-btn flex items-center gap-2">
        <RefreshCw size={16} /> Retry
      </button>
    </div>
  );

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto pb-12">

      {/* ── Header ── */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-4xl font-black text-white glow-text-purple">Command Center</h2>
          <p className="text-slate-400 font-medium">Administrative access to core gateway protocols.</p>
        </div>
        <button
          onClick={() => fetchData()}
          className="self-start md:self-auto flex items-center gap-2 px-4 py-2 glass-panel rounded-xl text-slate-400 hover:text-white text-sm font-bold transition-colors"
        >
          <RefreshCw size={14} /> Sync Data
        </button>
      </header>

      {/* ── Global Stats Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total Traffic"       value={stats.totalRequests}   icon={BarChart3}   colorClass="bg-purple-500" delay={0.1} />
        <StatCard title="Rate-Limited Hits"   value={stats.limitedRequests} icon={ShieldCheck} colorClass="bg-orange-500" delay={0.2} />
        <StatCard title="Active Nodes"        value={users.length}          icon={Users}       colorClass="bg-blue-500"   delay={0.3} />
      </div>

      {/* ── User Registry Table ── */}
      <GlassCard className="!p-0 overflow-hidden" delay={0.4}>
        {/* Table header bar */}
        <div className="p-6 border-b border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 bg-white/5">
          <h3 className="text-xl font-bold text-white uppercase tracking-wider flex items-center gap-3">
            <Users className="text-purple-500" />
            Registry Management
          </h3>
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-3 text-slate-500" size={18} />
            <input
              id="admin-search"
              type="text"
              placeholder="Search by name or email…"
              className="cyber-input w-full pl-10 h-11"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-black/20 text-slate-400 text-xs font-black uppercase tracking-[0.2em]">
                <th className="p-5">Entity</th>
                <th className="p-5">Credentials</th>
                <th className="p-5">Classification</th>
                <th className="p-5">Rate Matrix /hr</th>
                <th className="p-5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              <AnimatePresence mode="popLayout">
                {filteredUsers.map((user) => (
                  <motion.tr
                    key={user._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-slate-300 hover:bg-white/5 transition-colors group"
                  >
                    {/* Name */}
                    <td className="p-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center font-bold text-purple-400">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-bold text-white group-hover:text-purple-400 transition-colors uppercase italic tracking-tight">
                          {user.name}
                        </span>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="p-5 text-sm font-mono text-slate-400">{user.email}</td>

                    {/* Role badge */}
                    <td className="p-5">
                      <span className={`px-3 py-1 rounded-md text-[10px] font-black tracking-[0.1em] border ${
                        user.role === 'admin'
                          ? 'bg-purple-500/10 border-purple-500/30 text-purple-400'
                          : 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                      }`}>
                        {user.role.toUpperCase()}
                      </span>
                    </td>

                    {/* Rate limit (editable) */}
                    <td className="p-5">
                      {editingId === user._id ? (
                        <input
                          id={`rate-input-${user._id}`}
                          type="number"
                          min="1"
                          className="cyber-input w-24 h-9 text-xs"
                          value={newLimit}
                          onChange={(e) => setNewLimit(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') updateRateLimit(user._id);
                            if (e.key === 'Escape') setEditingId(null);
                          }}
                          autoFocus
                        />
                      ) : (
                        <span className="font-mono text-white text-lg font-black">{user.rateLimit}</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="p-5 text-center">
                      {editingId === user._id ? (
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => updateRateLimit(user._id)}
                            disabled={savingId === user._id}
                            className="p-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-all disabled:opacity-50"
                            title="Save"
                          >
                            {savingId === user._id
                              ? <Loader2 size={18} className="animate-spin" />
                              : <Save size={18} />
                            }
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="p-2 bg-white/5 text-slate-500 rounded-lg hover:bg-white/10"
                            title="Cancel"
                          >
                            <X size={18} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setEditingId(user._id); setNewLimit(user.rateLimit); }}
                          className="p-2 opacity-0 group-hover:opacity-100 bg-purple-500/20 text-purple-400 rounded-xl hover:scale-110 transition-all"
                          title="Edit rate limit"
                        >
                          <Edit3 size={18} />
                        </button>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>

          {filteredUsers.length === 0 && (
            <div className="p-10 text-center text-slate-500 uppercase font-black tracking-widest text-xs">
              No matching records found in database
            </div>
          )}
        </div>
      </GlassCard>

      {/* ── Real-Time Activity Log ── */}
      <GlassCard className="!p-0 overflow-hidden" delay={0.6}>
        <div className="p-4 bg-white/5 border-b border-white/5 flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
            <Activity size={14} className="text-purple-500" />
            Real-Time Activity Log
          </h3>
          <span className="text-[10px] text-slate-600 font-mono">auto-refresh 20s</span>
        </div>

        <div className="max-h-[400px] overflow-y-auto divide-y divide-white/5">
          {stats.recentLogs.length === 0 ? (
            <div className="p-8 text-center text-slate-600 text-xs uppercase font-black tracking-widest">
              No activity logged yet
            </div>
          ) : (
            stats.recentLogs.map((log, i) => (
              <motion.div
                key={log._id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center justify-between p-4 last:border-0 hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-5">
                  {/* Status pill */}
                  <div className={`text-[10px] font-black w-16 py-1 text-center rounded border ${
                    log.status === 200
                      ? 'bg-green-500/10 border-green-500/20 text-green-400'
                      : 'bg-red-500/10 border-red-500/20 text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.15)]'
                  }`}>
                    {log.status === 200 ? 'OK 200' : `${log.status}`}
                  </div>

                  {/* Method + endpoint */}
                  <div>
                    <p className="text-sm font-bold text-white flex items-center gap-2 italic">
                      <span className="text-slate-400 not-italic">{log.method}</span>
                      <span className="text-purple-400 not-italic uppercase tracking-tighter">{log.endpoint}</span>
                    </p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">
                      Origin: {log.userId?.name || 'External Node'}
                    </p>
                  </div>
                </div>

                {/* Timestamp */}
                <div className="text-right shrink-0">
                  <p className="text-[10px] text-slate-500 flex items-center gap-1 font-mono">
                    <Clock size={10} />
                    {new Date(log.createdAt).toLocaleTimeString()}
                  </p>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </GlassCard>

    </div>
  );
};

export default AdminPanel;
