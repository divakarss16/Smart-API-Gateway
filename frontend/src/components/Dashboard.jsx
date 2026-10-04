import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, BarChart2, Activity, FileText, Gauge,
  FolderOpen, Settings, LogOut, Zap, Play, Copy,
  RefreshCw, CheckCircle2, XCircle, Loader2, ChevronDown,
  Database, Key, Plus, Trash2, Eye, EyeOff, Shield,
  TrendingUp, TrendingDown, Clock, AlertTriangle,
  Download, Search, ArrowUpDown, Bell, Filter,
  Cpu, Server, Globe, Flame, Users, Terminal
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, ReferenceLine
} from 'recharts';
import { gatewayAPI, javaGatewayAPI } from '../utils/api';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// ═══════════════════════════════════════════════════════════
// CONSTANTS & HELPERS
// ═══════════════════════════════════════════════════════════
const getUser = () => { try { return JSON.parse(localStorage.getItem('userInfo')) || {}; } catch { return {}; } };
const fmtTime = () => new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
const fmtMs   = (n) => `${n}ms`;
const methodColor = { GET: '#22d3ee', POST: '#fb923c', PUT: '#facc15', DELETE: '#f87171' };

// ═══════════════════════════════════════════════════════════
// JSON SYNTAX HIGHLIGHTER
// ═══════════════════════════════════════════════════════════
function JsonHighlight({ raw }) {
  if (!raw) return <span className="text-slate-600 italic text-xs">No response yet</span>;
  const html = raw.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
    (m) => {
      let c = 'color:#7dd3fc'; // number
      if (/^"/.test(m)) c = /:$/.test(m) ? 'color:#c084fc;font-weight:600' : 'color:#6ee7b7';
      else if (/true|false/.test(m)) c = 'color:#fde047';
      else if (/null/.test(m))       c = 'color:#f87171';
      return `<span style="${c}">${m}</span>`;
    }
  );
  return <pre className="text-xs font-mono leading-5.5 whitespace-pre-wrap break-words" dangerouslySetInnerHTML={{ __html: html }} />;
}

// ═══════════════════════════════════════════════════════════
// STATUS PILL
// ═══════════════════════════════════════════════════════════
const Pill = ({ code }) => {
  const map = {
    200: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    429: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
    401: 'bg-red-600/15 text-red-400 border-red-600/30',
    500: 'bg-red-500/15 text-red-400 border-red-500/30',
  };
  const label = { 200: '200 OK', 429: '429 LIMITED', 401: '401 DENIED', 500: '500 ERR' };
  const cls = map[code] ?? 'bg-slate-700/40 text-slate-400 border-slate-600/40';
  return <span className={`px-2 py-0.5 rounded border text-[10px] font-black tracking-wider whitespace-nowrap ${cls}`}>{label[code] ?? code}</span>;
};

// ═══════════════════════════════════════════════════════════
// SIDEBAR NAV CONFIG
// ═══════════════════════════════════════════════════════════
const NAV_ITEMS = [
  { id: 'overview',    icon: LayoutDashboard, label: 'Overview' },
  { id: 'analytics',  icon: BarChart2,        label: 'API Analytics' },
  { id: 'realtime',   icon: Activity,         label: 'Realtime' },
  { id: 'logs',       icon: FileText,         label: 'Request Logs' },
  { id: 'ratelimit',  icon: Gauge,            label: 'Rate Limit' },
  { id: 'collections',icon: FolderOpen,       label: 'Collections' },
  { id: 'settings',   icon: Key,              label: 'API Key Generate' },
];

const COLLECTIONS = [
  { id: 1, method: 'GET',  path: '/api/request',     label: 'Fire Request',    desc: 'Main gateway endpoint' },
  { id: 2, method: 'GET',  path: '/api/health',       label: 'Health Check',    desc: 'DB + Java status' },
  { id: 3, method: 'POST', path: '/api/generate-key', label: 'Generate API Key',desc: 'Create new auth key' },
];

// ═══════════════════════════════════════════════════════════
// CUSTOM TOOLTIP
// ═══════════════════════════════════════════════════════════
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0f172a] border border-slate-700 rounded-xl p-3 shadow-2xl text-xs font-mono">
      <p className="text-slate-400 mb-2 font-bold">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span style={{ color: p.color }} className="font-black">{p.name}:</span>
          <span className="text-white">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// GENERATE MOCK CHART DATA SEEDED WITH REAL SESSION DATA
// ═══════════════════════════════════════════════════════════
const genChartPoint = (i, sessionTotal, sessionBlocked) => {
  const base = Math.max(0, Math.round(sessionTotal * 0.12) + Math.round(Math.random() * 4));
  const blocked = Math.max(0, Math.round(sessionBlocked * 0.12) + Math.round(Math.random() * 2));
  const errors  = Math.round(Math.random() * 1);
  const t = new Date(Date.now() - (11 - i) * 5 * 60_000);
  const label = t.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  return { label, allowed: base, blocked, errors, latency: Math.round(Math.random() * 80 + 40) };
};

// ═══════════════════════════════════════════════════════════
// MAIN DASHBOARD
// ═══════════════════════════════════════════════════════════
const Dashboard = () => {
  const navigate = useNavigate();
  const [view, setView]           = useState('overview');
  const [profile, setProfile]     = useState(null);
  const [loading, setLoading]     = useState(true);
  const [dbHealth, setDbHealth]   = useState('idle');

  // API key state
  const [apiKey, setApiKey]       = useState(() => getUser().apiKey || '');
  const [showKey, setShowKey]     = useState(false);

  // Request state
  const [method, setMethod]       = useState('GET');
  const [endpoint, setEndpoint]   = useState('/api/request');
  const [bodyText, setBodyText]   = useState('{\n  \n}');
  const [sending, setSending]     = useState(false);
  const [response, setResponse]   = useState(null);
  const [reqTab, setReqTab]       = useState('headers');

  // Session analytics
  const [logs, setLogs]           = useState([]);
  const [analytics, setAnalytics] = useState({ total: 0, blocked: 0, avgMs: 0, active: 1 });
  const latBuf                    = useRef([]);
  const [chartData, setChartData] = useState(() => Array.from({ length: 12 }, (_, i) => genChartPoint(i, 0, 0)));
  const [realtimeFeed, setRealtimeFeed] = useState([]);

  // Filters
  const [timeRange, setTimeRange] = useState('30m');
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [env, setEnv]             = useState('production');

  // Table
  const [tableSearch, setTableSearch]   = useState('');
  const [tableSortCol, setTableSortCol] = useState('requests');
  const [tableSortAsc, setTableSortAsc] = useState(false);

  // Token
  const liveRemaining = response?.data?.remaining_requests ?? ((profile?.rateLimit ?? 100) - (profile?.requestsThisHour ?? 0));
  const liveCapacity  = response?.data?.rate_limit ?? profile?.rateLimit ?? 100;
  const tokenPct      = liveCapacity > 0 ? Math.max(0, Math.min(100, (liveRemaining / liveCapacity) * 100)) : 0;

  // ── Data fetching ─────────────────────────────────────────
  const fetchProfile = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try { const { data } = await gatewayAPI.getProfile(); setProfile(data); } catch { if (!silent) toast.error('Cannot reach backend.'); }
    finally { if (!silent) setLoading(false); }
  }, []);

  const fetchHealth = useCallback(async () => {
    try {
      const { data } = await javaGatewayAPI.checkHealth();
      // Support both response shapes: { db: "UP" } and { database_connected: true }
      const isUp = data?.db === 'UP' || data?.database_connected === true;
      setDbHealth(isUp ? 'success' : 'error');
    }
    catch { setDbHealth('error'); }
  }, []);

  useEffect(() => {
    fetchProfile();
    fetchHealth();
    const i1 = setInterval(() => fetchProfile(true), 30_000);
    const i2 = setInterval(fetchHealth, 20_000);
    return () => { clearInterval(i1); clearInterval(i2); };
  }, [fetchProfile, fetchHealth]);

  // ── Push log + analytics ────────────────────────────────
  const pushEntry = useCallback((entry) => {
    setLogs(prev => [entry, ...prev].slice(0, 200));
    latBuf.current = [...latBuf.current, entry.latency].slice(-100);
    const avg = Math.round(latBuf.current.reduce((a, b) => a + b, 0) / latBuf.current.length);
    setAnalytics(prev => ({
      total:   prev.total + 1,
      blocked: entry.code !== 200 ? prev.blocked + 1 : prev.blocked,
      avgMs:   avg,
      active:  1,
    }));
    setChartData(prev => {
      const last = prev[prev.length - 1];
      if (entry.code === 200) return [...prev.slice(-11), { ...last, label: fmtTime(), allowed: (last.allowed||0)+1 }];
      if (entry.code === 429) return [...prev.slice(-11), { ...last, label: fmtTime(), blocked: (last.blocked||0)+1 }];
      return [...prev.slice(-11), { ...last, label: fmtTime(), errors: (last.errors||0)+1 }];
    });
    setRealtimeFeed(prev => [entry, ...prev].slice(0, 20));
  }, []);

  // ── SEND ────────────────────────────────────────────────
  const sendRequest = async (overrideMethod = null, overrideEndpoint = null) => {
    if (sending) return;
    const key = apiKey.trim() || getUser().apiKey;
    if (!key) { toast.error('Generate or paste an API key first.'); return; }
    const useMethod   = overrideMethod   ?? method;
    const useEndpoint = overrideEndpoint ?? endpoint;
    setSending(true);
    const t0 = Date.now();
    try {
      let res;
      if (useMethod === 'GET') res = await javaGatewayAPI.fireRequest(key);
      else res = await javaGatewayAPI.firePostRequest(key, {});
      const latency = Date.now() - t0;
      setResponse({ code: 200, data: res.data, raw: JSON.stringify(res.data, null, 2), latency });
      pushEntry({ ts: fmtTime(), method: useMethod, code: 200, latency, endpoint: useEndpoint, remaining: res.data?.remaining_requests });
      toast.success(`200 OK — ${latency}ms`, { icon: '✔' });
      fetchProfile(true);
    } catch (err) {
      const latency = Date.now() - t0;
      const errData = err.responseData ?? { error: err.userMessage ?? 'Unknown error' };
      const code    = err.status ?? 500;
      setResponse({ code, data: errData, raw: JSON.stringify(errData, null, 2), latency });
      pushEntry({ ts: fmtTime(), method: useMethod, code, latency, endpoint: useEndpoint });
      if (code === 429) toast.error('Rate limit exceeded');
      else if (code === 401) toast.error('Invalid API Key');
      else toast.error(`Server Error ${code}`);
    } finally { setSending(false); }
  };

  // ── Load test ───────────────────────────────────────────
  const [loadTesting, setLoadTesting] = useState(false);
  const runLoadTest = async () => {
    setLoadTesting(true);
    toast('⚡ Load test: 8 requests', { duration: 2000 });
    for (let i = 0; i < 8; i++) { await new Promise(r => setTimeout(r, 400)); await sendRequest(); }
    setLoadTesting(false);
    toast.success('Load test complete');
  };

  // ── Generate key ────────────────────────────────────────
  const generateKey = async () => {
    const email = getUser().email;
    if (!email) { toast.error('Profile not loaded.'); return; }
    try {
      const { data } = await javaGatewayAPI.generateKey(email);
      if (data?.apiKey) {
        const info = getUser(); info.apiKey = data.apiKey;
        localStorage.setItem('userInfo', JSON.stringify(info));
        setApiKey(data.apiKey);
        toast.success('New API key generated & activated!');
      }
    } catch (err) { toast.error(err.userMessage || 'Generation failed.'); }
  };

  const copyKey = () => { if (!apiKey) return; navigator.clipboard.writeText(apiKey); toast.success('Copied!'); };
  const copyResponse = () => { if (response?.raw) { navigator.clipboard.writeText(response.raw); toast.success('Copied!'); } };

  const exportLogs = () => {
    if (logs.length === 0) {
      toast.error('No logs to export');
      return;
    }
    const doc = new jsPDF();
    doc.text('SmartGate API Logs', 14, 15);
    
    const tableColumn = ["Time", "Method", "Status", "Latency", "Endpoint", "Tokens"];
    const tableRows = logs.map(l => [
      l.ts,
      l.method,
      l.code,
      `${l.latency}ms`,
      l.endpoint,
      l.remaining || '-'
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [124, 58, 237] }
    });
    
    doc.save('gateway-logs.pdf');
    toast.success('Exported logs.pdf');
  };

  // ── Table data derived from logs ─────────────────────────
  const tableRows = (() => {
    const map = {};
    logs.forEach(l => {
      if (!map[l.endpoint]) map[l.endpoint] = { endpoint: l.endpoint, requests: 0, blocked: 0, latencies: [], statuses: {} };
      const r = map[l.endpoint];
      r.requests++;
      if (l.code !== 200) r.blocked++;
      r.latencies.push(l.latency);
      r.statuses[l.code] = (r.statuses[l.code] || 0) + 1;
    });
    return Object.values(map).map(r => ({
      ...r,
      avgLatency: Math.round(r.latencies.reduce((a, b) => a + b, 0) / r.latencies.length) || 0,
      minLatency: Math.min(...r.latencies),
      maxLatency: Math.max(...r.latencies),
      topStatus: Object.entries(r.statuses).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 200,
    }));
  })();

  const filteredTable = tableRows
    .filter(r => r.endpoint.toLowerCase().includes(tableSearch.toLowerCase()))
    .sort((a, b) => {
      const v = tableSortAsc ? 1 : -1;
      if (tableSortCol === 'requests') return v * (a.requests - b.requests);
      if (tableSortCol === 'avgLatency') return v * (a.avgLatency - b.avgLatency);
      return 0;
    });

  const filteredLogs = logs.filter(l =>
    (statusFilter === 'all' || String(l.code) === statusFilter) &&
    (methodFilter === 'all' || l.method === methodFilter)
  );

  // ── Loading screen ──────────────────────────────────────
  if (loading) return (
    <div className="flex h-screen items-center justify-center" style={{ background: '#060912' }}>
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-t-2 border-violet-500 animate-spin" />
          <Zap size={18} className="absolute inset-0 m-auto text-violet-400" />
        </div>
        <p className="text-xs text-slate-600 font-mono tracking-widest uppercase">Loading Platform…</p>
      </div>
    </div>
  );

  // ════════════════════════════════════════════════════════
  // VIEWS
  // ════════════════════════════════════════════════════════

  // ── OVERVIEW ─────────────────────────────────────────────
  const ViewOverview = () => (
    <div className="flex flex-col gap-5 h-full overflow-y-auto pr-1 pb-4">
      {/* Metric cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { icon: TrendingUp,  label: 'Total Requests',  val: analytics.total,                     sub: 'this session',          grad: 'from-violet-600 to-indigo-600', glow: '#7c3aed' },
          { icon: AlertTriangle,label: 'Blocked (429/4xx)',val: analytics.blocked,                  sub: `${analytics.total ? Math.round(analytics.blocked/analytics.total*100) : 0}% error rate`, grad: 'from-rose-600 to-red-600', glow: '#dc2626' },
          { icon: Clock,        label: 'Avg Latency',    val: analytics.avgMs ? `${analytics.avgMs}ms` : '—', sub: 'across requests',       grad: 'from-cyan-600 to-sky-600',  glow: '#0284c7' },
          { icon: Zap,          label: 'Tokens Remaining',val: liveRemaining,                       sub: `of ${liveCapacity} capacity`,grad: 'from-emerald-600 to-teal-600',glow: '#059669' },
        ].map(({ icon: Icon, label, val, sub, grad, glow }, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className="rounded-xl border border-slate-800 p-4 flex items-center gap-3 relative overflow-hidden"
            style={{ background: '#0a0f1e' }}>
            <div className="absolute inset-0 opacity-[0.06]" style={{ background: `radial-gradient(circle at 0% 0%, ${glow}, transparent 70%)` }} />
            <div className={`p-2.5 rounded-xl bg-gradient-to-br ${grad} shrink-0`}><Icon size={16} className="text-white" /></div>
            <div className="min-w-0">
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">{label}</p>
              <p className="text-2xl font-black text-white leading-tight">{val ?? '—'}</p>
              <p className="text-[10px] text-slate-600 font-mono">{sub}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Multi-line chart */}
      <div className="rounded-xl border border-slate-800 p-5" style={{ background: '#0a0f1e' }}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-sm font-black text-white">Request Traffic Over Time</h3>
            <p className="text-xs text-slate-500 mt-0.5">Allowed · Blocked · Errors — last 60 min</p>
          </div>
          <div className="flex gap-3 text-[10px] font-bold">
            {[['#a78bfa','Allowed'],['#f97316','Blocked'],['#f87171','Errors']].map(([c, l]) => (
              <span key={l} className="flex items-center gap-1 text-slate-400"><span className="w-2 h-2 rounded-full inline-block" style={{background:c}}/>{l}</span>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
            <defs>
              {[['allowed','#a78bfa'],['blocked','#f97316'],['errors','#f87171']].map(([k,c]) => (
                <linearGradient key={k} id={`g-${k}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={c} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={c} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis dataKey="label" stroke="#334155" fontSize={10} tickLine={false} axisLine={false} />
            <YAxis stroke="#334155" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip content={<ChartTooltip />} />
            <Area type="monotone" dataKey="allowed" stroke="#a78bfa" strokeWidth={2} fill="url(#g-allowed)" name="Allowed" dot={false} />
            <Area type="monotone" dataKey="blocked" stroke="#f97316" strokeWidth={2} fill="url(#g-blocked)" name="Blocked" dot={false} />
            <Area type="monotone" dataKey="errors"  stroke="#f87171" strokeWidth={2} fill="url(#g-errors)"  name="Errors"  dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Analytics table */}
      <div className="rounded-xl border border-slate-800 overflow-hidden" style={{ background: '#0a0f1e' }}>
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800">
          <h3 className="text-sm font-black text-white">Endpoint Breakdown</h3>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-1.5">
              <Search size={11} className="text-slate-500" />
              <input value={tableSearch} onChange={e => setTableSearch(e.target.value)}
                className="bg-transparent text-xs text-slate-300 outline-none placeholder-slate-600 w-28"
                placeholder="Search endpoint…" />
            </div>
            <button onClick={exportLogs}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 text-slate-400 hover:text-white text-xs font-bold transition-all">
              <Download size={12} /> Export PDF
            </button>
          </div>
        </div>

        {filteredTable.length === 0 ? (
          <div className="py-12 text-center text-slate-700 text-sm font-mono">Fire requests to populate endpoint data.</div>
        ) : (
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-slate-600 border-b border-slate-800 bg-[#080d18]/60">
                {[['Endpoint','endpoint'],['Requests','requests'],['Avg Latency','avgLatency'],['Min','min'],['Max','max'],['Status','status']].map(([h, col]) => (
                  <th key={col} onClick={() => { setTableSortCol(col === 'min' || col === 'max' ? col+'Latency' : col); setTableSortAsc(a => !a); }}
                    className="text-left px-4 py-2.5 cursor-pointer hover:text-slate-300 transition-colors select-none">
                    <span className="flex items-center gap-1">{h}<ArrowUpDown size={9}/></span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredTable.map((row, i) => (
                <motion.tr key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="border-b border-slate-800/40 hover:bg-white/[0.03] transition-colors">
                  <td className="px-4 py-2.5 text-violet-300 font-bold">{row.endpoint}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-bold">{row.requests}</span>
                      {row.blocked > 0 && <span className="text-orange-400 text-[10px]">({row.blocked} blocked)</span>}
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`font-bold ${row.avgLatency > 200 ? 'text-red-400' : row.avgLatency > 100 ? 'text-yellow-400' : 'text-emerald-400'}`}>{row.avgLatency}ms</span>
                  </td>
                  <td className="px-4 py-2.5 text-slate-400">{row.minLatency}ms</td>
                  <td className="px-4 py-2.5 text-slate-400">{row.maxLatency}ms</td>
                  <td className="px-4 py-2.5"><Pill code={Number(row.topStatus)} /></td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );

  // ── ANALYTICS ───────────────────────────────────────────
  const ViewAnalytics = () => (
    <div className="flex flex-col gap-5 overflow-y-auto pb-4">
      <div className="grid grid-cols-2 gap-5">
        {/* Latency bar chart */}
        <div className="rounded-xl border border-slate-800 p-5" style={{ background: '#0a0f1e' }}>
          <h3 className="text-sm font-black text-white mb-1">Latency Distribution</h3>
          <p className="text-xs text-slate-500 mb-4">Per-request latency trend</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="label" stroke="#334155" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="#334155" fontSize={10} tickLine={false} axisLine={false} unit="ms" />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="latency" fill="#7c3aed" radius={[3, 3, 0, 0]} name="Latency (ms)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Success vs Error ratio */}
        <div className="rounded-xl border border-slate-800 p-5" style={{ background: '#0a0f1e' }}>
          <h3 className="text-sm font-black text-white mb-1">Success vs Blocked</h3>
          <p className="text-xs text-slate-500 mb-4">Request outcome over time</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="label" stroke="#334155" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="#334155" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip content={<ChartTooltip />} />
              <Line type="monotone" dataKey="allowed" stroke="#22d3ee" strokeWidth={2} dot={false} name="Allowed" />
              <Line type="monotone" dataKey="blocked" stroke="#f97316" strokeWidth={2} dot={false} name="Blocked" strokeDasharray="4 4" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Insights panel */}
      <div className="rounded-xl border border-slate-800 p-5" style={{ background: '#0a0f1e' }}>
        <h3 className="text-sm font-black text-white mb-4">Request Insights</h3>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Most Used API', val: logs[0]?.endpoint ?? '—' },
            { label: 'Peak Requests', val: `${Math.max(...chartData.map(d => (d.allowed||0) + (d.blocked||0)), 0)} req` },
            { label: 'Abuse Signal', val: analytics.blocked > 3 ? '⚠ High block rate' : '✓ Normal traffic' },
            { label: 'Top Method', val: logs.filter(l => l.method==='GET').length >= logs.filter(l=>l.method==='POST').length ? 'GET' : 'POST' },
            { label: 'Avg Token Burn', val: `${liveCapacity - liveRemaining} / session` },
            { label: 'Session Duration', val: `${Math.round(logs.length * 0.4)}m est.` },
          ].map(({ label, val }, i) => (
            <div key={i} className="p-3 rounded-lg border border-slate-800 bg-[#080d18]">
              <p className="text-[10px] text-slate-600 uppercase tracking-widest font-bold">{label}</p>
              <p className="text-sm font-black text-white mt-1 truncate">{val}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ── REALTIME ─────────────────────────────────────────────
  const ViewRealtime = () => (
    <div className="flex flex-col gap-5 overflow-y-auto pb-4">
      <div className="flex gap-4">
        <div className="flex-1 rounded-xl border border-slate-800 p-4 flex items-center gap-3" style={{ background: '#0a0f1e' }}>
          <Activity size={20} className="text-violet-400 shrink-0 animate-pulse" />
          <div><p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Requests / Session</p>
            <p className="text-2xl font-black text-white">{analytics.total}</p></div>
        </div>
        <div className="flex-1 rounded-xl border border-slate-800 p-4 flex items-center gap-3" style={{ background: '#0a0f1e' }}>
          <Gauge size={20} className="text-cyan-400 shrink-0" />
          <div><p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Token Usage</p>
            <p className="text-2xl font-black text-white">{liveCapacity - liveRemaining} used</p></div>
        </div>
        <div className="flex-1 rounded-xl border border-slate-800 p-4 flex items-center gap-3" style={{ background: '#0a0f1e' }}>
          <Bell size={20} className={`shrink-0 ${analytics.blocked > 3 ? 'text-red-400 animate-pulse' : 'text-slate-500'}`} />
          <div><p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Alert Status</p>
            <p className={`text-sm font-black ${analytics.blocked > 3 ? 'text-red-400' : 'text-emerald-400'}`}>
              {analytics.blocked > 3 ? '⚠ Rate abuse detected' : '✓ Normal'}</p></div>
        </div>
      </div>

      {/* Live log stream */}
      <div className="rounded-xl border border-slate-800 overflow-hidden flex flex-col" style={{ background: '#0a0f1e', height: '50vh' }}>
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800 bg-[#080d18]/60">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-black text-white tracking-wider">LIVE LOG STREAM</span>
          </div>
          <span className="text-[10px] text-slate-600 font-mono">{realtimeFeed.length} events</span>
        </div>
        <div className="flex-1 overflow-y-auto p-3 font-mono text-xs space-y-1">
          <AnimatePresence>
            {realtimeFeed.length === 0
              ? <p className="text-center text-slate-700 py-8">No live events. Fire a request to see real-time data.</p>
              : realtimeFeed.map((e, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                  className={`flex items-center gap-3 px-3 py-1.5 rounded border ${e.code === 200 ? 'border-emerald-500/15 bg-emerald-500/[0.05]' : e.code === 429 ? 'border-orange-500/15 bg-orange-500/[0.05]' : 'border-red-500/15 bg-red-500/[0.05]'}`}>
                  <span className="text-slate-600 w-20 shrink-0">{e.ts}</span>
                  <span style={{ color: methodColor[e.method] ?? '#94a3b8' }} className="font-black w-10 shrink-0">{e.method}</span>
                  <Pill code={e.code} />
                  <span className="text-slate-500 w-14 shrink-0 text-right">{e.latency}ms</span>
                  <span className="text-slate-600 flex-1 truncate">{e.endpoint}</span>
                  {e.remaining !== undefined && <span className="text-violet-400 text-[10px] shrink-0">{e.remaining} tok</span>}
                </motion.div>
              ))
            }
          </AnimatePresence>
        </div>
      </div>
    </div>
  );

  // ── LOGS ────────────────────────────────────────────────
  const ViewLogs = () => (
    <div className="flex flex-col gap-4 overflow-y-auto pb-4">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2">
          <Search size={12} className="text-slate-500" />
          <input value={tableSearch} onChange={e => setTableSearch(e.target.value)}
            className="bg-transparent text-xs text-slate-300 outline-none placeholder-slate-600 w-40" placeholder="Search logs…" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="bg-[#0a0f1e] border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 outline-none">
          <option value="all">All Status</option><option value="200">200 OK</option><option value="429">429 Limited</option><option value="401">401 Denied</option>
        </select>
        <select value={methodFilter} onChange={e => setMethodFilter(e.target.value)}
          className="bg-[#0a0f1e] border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 outline-none">
          <option value="all">All Methods</option><option value="GET">GET</option><option value="POST">POST</option>
        </select>
        <button onClick={exportLogs}
          className="ml-auto flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-700 text-slate-400 hover:text-white text-xs font-bold transition-all">
          <Download size={12} /> Export PDF
        </button>
        <button onClick={() => setLogs([])}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-700 text-slate-400 hover:text-red-400 text-xs font-bold transition-all">
          <Trash2 size={12} /> Clear
        </button>
      </div>

      <div className="rounded-xl border border-slate-800 overflow-hidden" style={{ background: '#0a0f1e' }}>
        {filteredLogs.length === 0 ? (
          <div className="py-16 text-center text-slate-700 font-mono text-sm">No logs yet. Fire requests to populate.</div>
        ) : (
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-slate-600 border-b border-slate-800 bg-[#080d18]/80">
                <th className="text-left px-4 py-3">Time</th>
                <th className="text-left px-4 py-3">Method</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Latency</th>
                <th className="text-left px-4 py-3">Endpoint</th>
                <th className="text-right px-4 py-3">Tokens</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log, i) => (
                <motion.tr key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className={`border-b border-slate-800/40 hover:bg-white/[0.03] transition-colors ${log.code === 200 ? '' : log.code === 429 ? 'bg-orange-500/[0.03]' : 'bg-red-500/[0.03]'}`}>
                  <td className="px-4 py-2.5 text-slate-600">{log.ts}</td>
                  <td className="px-4 py-2.5"><span style={{ color: methodColor[log.method] ?? '#94a3b8' }} className="font-black">{log.method}</span></td>
                  <td className="px-4 py-2.5"><Pill code={log.code} /></td>
                  <td className="px-4 py-2.5 text-slate-400">{log.latency}ms</td>
                  <td className="px-4 py-2.5 text-slate-400">{log.endpoint}</td>
                  <td className="px-4 py-2.5 text-right text-violet-400">{log.remaining ?? '—'}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );

  // ── RATE LIMIT ──────────────────────────────────────────
  const ViewRateLimit = () => {
    const pct = tokenPct;
    const color = pct > 60 ? '#a78bfa' : pct > 25 ? '#f97316' : '#ef4444';
    return (
      <div className="flex flex-col gap-5 overflow-y-auto pb-4">
        <div className="rounded-xl border border-slate-800 p-6" style={{ background: '#0a0f1e' }}>
          <h3 className="text-sm font-black text-white mb-6">Token Bucket Status</h3>
          <div className="flex items-center gap-8">
            {/* Circular indicator */}
            <div className="relative w-36 h-36 shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="50" fill="none" stroke="#1e293b" strokeWidth="12" />
                <motion.circle cx="60" cy="60" r="50" fill="none" stroke={color} strokeWidth="12"
                  strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 50}`}
                  animate={{ strokeDashoffset: 2 * Math.PI * 50 * (1 - pct / 100) }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  style={{ filter: `drop-shadow(0 0 8px ${color}66)` }} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-white">{liveRemaining}</span>
                <span className="text-[10px] text-slate-500 uppercase tracking-widest">tokens</span>
              </div>
            </div>

            <div className="flex-1 space-y-4">
              {[
                ['Capacity', liveCapacity, '100%', '#a78bfa'],
                ['Remaining', liveRemaining, `${Math.round(pct)}%`, color],
                ['Consumed', liveCapacity - liveRemaining, `${Math.round(100 - pct)}%`, '#f97316'],
              ].map(([label, val, pctStr, c]) => (
                <div key={label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-500 font-bold uppercase tracking-wider">{label}</span>
                    <span className="font-black" style={{ color: c }}>{val} <span className="text-slate-600">({pctStr})</span></span>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div className="h-full rounded-full" style={{ background: c, width: pctStr }} transition={{ duration: 0.6 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 p-4 rounded-xl border border-slate-800 bg-[#080d18] text-xs font-mono">
            <p className="text-slate-400">Algorithm: <span className="text-violet-400 font-bold">Token Bucket</span></p>
            <p className="text-slate-400 mt-1">Refill Rate: <span className="text-cyan-400 font-bold">5 tokens / minute</span></p>
            <p className="text-slate-400 mt-1">Status: <span className={`font-bold ${liveRemaining > 0 ? 'text-emerald-400' : 'text-red-400'}`}>{liveRemaining > 0 ? 'ACCEPTING REQUESTS' : 'RATE LIMITED'}</span></p>
          </div>
        </div>

        {/* Violation timeline */}
        <div className="rounded-xl border border-slate-800 p-5" style={{ background: '#0a0f1e' }}>
          <h3 className="text-sm font-black text-white mb-4">Rate Limit Violations Over Time</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="label" stroke="#334155" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="#334155" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip content={<ChartTooltip />} />
              <ReferenceLine y={3} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'Alert', fill: '#ef4444', fontSize: 10 }} />
              <Bar dataKey="blocked" fill="#f97316" radius={[3,3,0,0]} name="Violations" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  // ── COLLECTIONS ─────────────────────────────────────────
  const ViewCollections = () => (
    <div className="flex flex-col gap-4 overflow-y-auto pb-4">
      <div className="grid grid-cols-1 gap-3">
        {COLLECTIONS.map(c => (
          <div key={c.id} className="flex items-center gap-4 p-4 rounded-xl border border-slate-800 hover:border-slate-600 transition-all group cursor-pointer"
            style={{ background: '#0a0f1e' }}
            onClick={() => { setMethod(c.method); setEndpoint(c.path); setView('overview'); toast(`Loaded: ${c.method} ${c.path}`, { icon: '📋' }); }}>
            <span className="text-xs font-black w-12 text-center py-1 rounded border"
              style={{ color: methodColor[c.method], borderColor: `${methodColor[c.method]}40`, background: `${methodColor[c.method]}10` }}>
              {c.method}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white">{c.label}</p>
              <p className="text-xs text-slate-600 font-mono">{c.path}</p>
              <p className="text-[11px] text-slate-600 mt-0.5">{c.desc}</p>
            </div>
            <button onClick={e => { e.stopPropagation(); setMethod(c.method); setEndpoint(c.path); sendRequest(c.method, c.path); }}
              className="opacity-0 group-hover:opacity-100 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all">
              <Play size={11} className="fill-current" /> Run
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  // ── SETTINGS ────────────────────────────────────────────
  const ViewSettings = () => (
    <div className="flex flex-col gap-5 overflow-y-auto pb-4 max-w-xl">
      <div className="rounded-xl border border-slate-800 p-5" style={{ background: '#0a0f1e' }}>
        <h3 className="text-sm font-black text-white mb-4 flex items-center gap-2"><Key size={15} className="text-violet-400"/> API Key Management</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-2 bg-[#080d18] border border-slate-700 rounded-lg px-3 py-2.5">
            <input type={showKey ? 'text' : 'password'} value={apiKey} onChange={e => setApiKey(e.target.value)}
              className="flex-1 bg-transparent text-xs font-mono text-emerald-300 outline-none placeholder-slate-600"
              placeholder="No API key — generate one below" />
            <button onClick={() => setShowKey(s => !s)} className="text-slate-500 hover:text-slate-300 transition-colors shrink-0">
              {showKey ? <EyeOff size={13}/> : <Eye size={13}/>}
            </button>
          </div>
          <div className="flex gap-2">
            <button onClick={generateKey}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg border border-violet-500/40 bg-violet-500/10 text-violet-300 hover:bg-violet-500/20 text-xs font-bold transition-all">
              <Plus size={13}/> Generate New Key
            </button>
            <button onClick={copyKey}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg border border-cyan-500/40 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 text-xs font-bold transition-all">
              <Copy size={13}/> Copy Key
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 p-5" style={{ background: '#0a0f1e' }}>
        <h3 className="text-sm font-black text-white mb-4 flex items-center gap-2"><Globe size={15} className="text-cyan-400"/> Environment</h3>
        <div className="flex rounded-lg overflow-hidden border border-slate-700">
          {['development','production'].map(e => (
            <button key={e} onClick={() => setEnv(e)}
              className={`flex-1 py-2.5 text-xs font-black capitalize transition-all ${env===e ? 'bg-violet-600 text-white' : 'text-slate-500 hover:text-slate-300 bg-[#080d18]'}`}>
              {e}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 p-5" style={{ background: '#0a0f1e' }}>
        <h3 className="text-sm font-black text-white mb-4 flex items-center gap-2"><Server size={15} className="text-emerald-400"/> Backend Status</h3>
        <div className="space-y-2 text-xs font-mono">
          {[
            ['Java Gateway', env === 'production' ? 'http://localhost:8080' : 'http://localhost:8080/dev', dbHealth === 'success'],
            ['Node.js Auth', 'http://localhost:5000', true],
            ['MySQL DB', 'localhost:3306', dbHealth === 'success'],
          ].map(([svc, url, online]) => (
            <div key={svc} className="flex items-center justify-between p-2.5 rounded-lg bg-[#080d18] border border-slate-800">
              <div>
                <p className="text-slate-300 font-bold">{svc}</p>
                <p className="text-slate-600">{url}</p>
              </div>
              <span className={`flex items-center gap-1.5 text-[10px] font-black px-2 py-1 rounded-full border ${online ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' : 'text-red-400 border-red-500/30 bg-red-500/10'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${online ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                {online ? 'ONLINE' : 'OFFLINE'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const viewMap = {
    overview: <ViewOverview />,
    analytics: <ViewAnalytics />,
    realtime: <ViewRealtime />,
    logs: <ViewLogs />,
    ratelimit: <ViewRateLimit />,
    collections: <ViewCollections />,
    settings: <ViewSettings />,
  };

  // ════════════════════════════════════════════════════════
  // MAIN RENDER
  // ════════════════════════════════════════════════════════
  const user = getUser();
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#060912', fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ─── LEFT SIDEBAR ─── */}
      <div className="w-52 shrink-0 flex flex-col border-r border-slate-800/80" style={{ background: '#07091400' }}>
        {/* Logo */}
        <div className="px-4 py-4 border-b border-slate-800 flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg" style={{ boxShadow: '0 0 14px rgba(124,58,237,.4)' }}>
            <Zap size={14} className="text-white fill-white" />
          </div>
          <div>
            <p className="font-black text-xs text-white tracking-tight leading-none">SmartGate</p>
            <p className="text-[9px] text-slate-600 tracking-widest uppercase">API Platform</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
          <p className="text-[9px] text-slate-700 uppercase tracking-widest font-bold px-3 py-2">Insights</p>
          {NAV_ITEMS.map(({ id, icon: Icon, label }) => (
            <button key={id} onClick={() => setView(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left text-xs font-semibold ${
                view === id
                  ? 'bg-violet-600/20 text-violet-300 border border-violet-500/25'
                  : 'text-slate-500 hover:text-slate-200 hover:bg-white/[0.04]'
              }`}>
              <Icon size={14} className={view === id ? 'text-violet-400' : 'text-slate-600'} />
              {label}
              {view === id && <motion.div layoutId="indicator" className="ml-auto w-1.5 h-1.5 rounded-full bg-violet-500" style={{ boxShadow: '0 0 6px #7c3aed' }} />}
            </button>
          ))}
          <p className="text-[9px] text-slate-700 uppercase tracking-widest font-bold px-3 pt-3 pb-2">Manage</p>
          {user.role === 'admin' && (
            <button onClick={() => navigate('/admin')}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/[0.04] text-xs font-semibold transition-all">
              <Shield size={14} className="text-slate-600" /> Admin Panel
            </button>
          )}
          <button onClick={() => { localStorage.removeItem('userInfo'); navigate('/login'); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/[0.07] text-xs font-semibold transition-all">
            <LogOut size={14} /> Sign Out
          </button>
        </nav>

        {/* User */}
        <div className="p-3 border-t border-slate-800 flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-[11px] font-black text-white shrink-0">
            {(user.name?.[0] ?? 'U').toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-white truncate">{user.name ?? 'User'}</p>
            <p className="text-[9px] text-slate-600 capitalize">{user.role ?? 'user'} · {env}</p>
          </div>
        </div>
      </div>

      {/* ─── MAIN AREA ─── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top control bar */}
        <div className="shrink-0 flex items-center gap-3 px-5 py-2.5 border-b border-slate-800" style={{ background: '#07091466' }}>
          {/* Title */}
          <span className="text-sm font-black text-white capitalize">{NAV_ITEMS.find(n => n.id === view)?.label ?? 'Overview'}</span>

          {/* Time range */}
          <div className="flex rounded-lg overflow-hidden border border-slate-800 text-[10px] font-black ml-4">
            {['30m','1h','24h'].map(r => (
              <button key={r} onClick={() => setTimeRange(r)}
                className={`px-3 py-1.5 transition-all ${timeRange===r ? 'bg-violet-600 text-white' : 'text-slate-600 hover:text-slate-300'}`}>{r}</button>
            ))}
          </div>

          {/* Status filter */}
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="bg-transparent border border-slate-800 rounded-lg px-3 py-1.5 text-[10px] text-slate-400 outline-none cursor-pointer hover:border-slate-700 transition-colors">
            <option value="all">All Status</option><option value="200">200 OK</option><option value="429">429</option><option value="401">401</option>
          </select>

          {/* Method filter */}
          <select value={methodFilter} onChange={e => setMethodFilter(e.target.value)}
            className="bg-transparent border border-slate-800 rounded-lg px-3 py-1.5 text-[10px] text-slate-400 outline-none cursor-pointer hover:border-slate-700 transition-colors">
            <option value="all">All Methods</option><option value="GET">GET</option><option value="POST">POST</option>
          </select>

          {/* Env switch */}
          <div className="flex rounded-lg overflow-hidden border border-slate-800 text-[10px] font-black">
            {['development','production'].map(e => (
              <button key={e} onClick={() => setEnv(e)}
                className={`px-3 py-1.5 capitalize transition-all ${env===e ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-300'}`}>{e}</button>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-2">
            {/* DB badge */}
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[9px] font-black tracking-widest ${dbHealth==='success'?'text-emerald-400 border-emerald-500/25 bg-emerald-500/10':dbHealth==='error'?'text-red-400 border-red-500/25 bg-red-500/10':'text-yellow-400 border-yellow-500/25'}`}>
              <Database size={9}/>{dbHealth==='success'?'DB ONLINE':dbHealth==='error'?'DB OFFLINE':'PINGING'}
            </div>
            {/* Node badge */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-emerald-500/25 bg-emerald-500/10 text-[9px] font-black text-emerald-400">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"/>NODE LIVE
            </div>
            <button onClick={() => { fetchProfile(true); fetchHealth(); }}
              className="p-1.5 rounded-lg border border-slate-800 text-slate-600 hover:text-white hover:border-slate-600 transition-all">
              <RefreshCw size={12}/>
            </button>
          </div>
        </div>

        {/* Content + Request sidebar */}
        <div className="flex-1 flex overflow-hidden">
          {/* Main content canvas */}
          <div className="flex-1 overflow-hidden p-4">
            <AnimatePresence mode="wait">
              <motion.div key={view} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="h-full">
                {viewMap[view]}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* RIGHT: Request panel (always visible, compact) */}
          <div className="w-72 shrink-0 flex flex-col border-l border-slate-800 overflow-hidden" style={{ background: '#07091480' }}>
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-800">
              <Terminal size={12} className="text-violet-400" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Request Panel</span>
            </div>

            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
              {/* API Key strip */}
              <div>
                <label className="text-[9px] text-slate-600 uppercase tracking-widest font-bold block mb-1">API Key</label>
                <div className="flex items-center gap-1.5 bg-[#080d18] border border-slate-800 rounded-lg px-2.5 py-1.5">
                  <input type={showKey ? 'text' : 'password'} value={apiKey} onChange={e => setApiKey(e.target.value)}
                    className="flex-1 bg-transparent text-[11px] font-mono text-emerald-300 outline-none placeholder-slate-700 min-w-0"
                    placeholder="paste or generate…" />
                  <button onClick={() => setShowKey(s=>!s)} className="text-slate-600 hover:text-slate-400 transition-colors shrink-0"><EyeOff size={11}/></button>
                  <button onClick={copyKey} className="text-slate-600 hover:text-cyan-400 transition-colors shrink-0"><Copy size={11}/></button>
                </div>
              </div>

              {/* Method + URL */}
              <div>
                <label className="text-[9px] text-slate-600 uppercase tracking-widest font-bold block mb-1">Request</label>
                <div className="flex rounded-lg overflow-hidden border border-slate-800">
                  <select value={method} onChange={e=>setMethod(e.target.value)}
                    className={`bg-[#080d18] text-[11px] font-black px-2 py-2 outline-none appearance-none border-r border-slate-800 cursor-pointer ${method==='GET'?'text-cyan-400':method==='POST'?'text-orange-400':'text-yellow-400'}`}>
                    <option>GET</option><option>POST</option><option>PUT</option><option>DELETE</option>
                  </select>
                  <input value={endpoint} onChange={e=>setEndpoint(e.target.value)}
                    className="flex-1 bg-[#080d18] text-[10px] font-mono text-slate-400 px-2 outline-none min-w-0" />
                </div>
              </div>

              {/* Send button */}
              <button id="send-btn" onClick={() => sendRequest()} disabled={sending}
                className="w-full py-2.5 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-black flex items-center justify-center gap-2 transition-all disabled:opacity-50 active:scale-95">
                {sending ? <Loader2 size={13} className="animate-spin"/> : <Play size={13} className="fill-current"/>} SEND
              </button>

              {/* Load test */}
              <button onClick={runLoadTest} disabled={loadTesting}
                className="w-full py-2 rounded-lg border border-orange-500/30 bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all disabled:opacity-50">
                {loadTesting ? <Loader2 size={11} className="animate-spin"/> : <Flame size={11}/>} Load Test ×8
              </button>

              {/* Gen key */}
              <button onClick={generateKey}
                className="w-full py-2 rounded-lg border border-violet-500/30 bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all">
                <Key size={11}/> Generate New Key
              </button>

              {/* Token bar */}
              <div className="p-3 rounded-lg border border-slate-800 bg-[#080d18]">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[9px] text-slate-600 uppercase tracking-widest font-bold">Token Bucket</span>
                  <span className="text-[11px] font-black" style={{ color: tokenPct > 60 ? '#a78bfa' : tokenPct > 25 ? '#f97316' : '#ef4444' }}>
                    {liveRemaining}/{liveCapacity}
                  </span>
                </div>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <motion.div className="h-full rounded-full" style={{ background: tokenPct > 60 ? '#a78bfa' : tokenPct > 25 ? '#f97316' : '#ef4444' }}
                    animate={{ width: `${tokenPct}%` }} transition={{ duration: 0.7, ease: 'easeOut' }} />
                </div>
              </div>

              {/* Response preview */}
              {response && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[9px] text-slate-600 uppercase tracking-widest font-bold">Last Response</label>
                    <div className="flex items-center gap-1.5">
                      <Pill code={response.code} />
                      <span className="text-[9px] text-slate-600 font-mono">{response.latency}ms</span>
                      <button onClick={copyResponse} className="text-slate-600 hover:text-slate-400"><Copy size={10}/></button>
                    </div>
                  </div>
                  <div className="bg-[#080d18] border border-slate-800 rounded-lg p-2.5 max-h-40 overflow-auto">
                    <JsonHighlight raw={response.raw} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
