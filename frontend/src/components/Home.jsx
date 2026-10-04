import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Activity, Key, BarChart3, Lock, Zap, ChevronRight, Server, Database, Globe } from 'lucide-react';

// Reusable motion variants
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const staggerContainer = {
  hidden: { opacity: 1 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const Home = () => {
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));

  return (
    <div className="min-h-screen bg-[#09090b] text-slate-300 font-sans selection:bg-blue-500/30 overflow-x-hidden">
      
      {/* ── Ambient Background Mesh ── */}
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[150px] rounded-full pointer-events-none mix-blend-screen" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-600/10 blur-[150px] rounded-full pointer-events-none mix-blend-screen" />
      <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none mix-blend-overlay"></div>
      
      {/* ── Navigation ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-black/20 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.5)]">
              <Shield size={18} className="text-white" />
            </div>
            <span className="text-white font-bold tracking-wider text-lg">SMARTGATE</span>
          </div>
          <div>
            {userInfo ? (
              <Link to="/dashboard" className="px-5 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white font-medium text-sm transition-colors border border-white/5">
                Dashboard
              </Link>
            ) : (
              <Link to="/login" className="px-5 py-2 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition-colors shadow-[0_0_15px_rgba(37,99,235,0.4)]">
                Log In
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="flex flex-col items-center">
            
            <motion.div variants={fadeIn} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-blue-400 text-xs font-semibold uppercase tracking-widest mb-8">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              Enterprise Gateway
            </motion.div>

            <motion.h1 variants={fadeIn} className="text-5xl lg:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-100 to-gray-400 tracking-tight leading-[1.1] mb-6 max-w-4xl">
              SMARTGATE API PLATFORM
            </motion.h1>
            
            <motion.p variants={fadeIn} className="text-lg lg:text-xl text-gray-400 mb-10 max-w-2xl leading-relaxed">
              Secure, Monitor, and Control API Traffic with Advanced Rate Limiting. Scale your services effortlessly with intelligent infrastructure.
            </motion.p>
            
            <motion.div variants={fadeIn} className="flex flex-col sm:flex-row items-center gap-4">
              {userInfo ? (
                <Link to="/dashboard" className="flex items-center gap-2 px-8 py-3.5 rounded-full bg-white text-black font-semibold hover:bg-gray-200 transition-all active:scale-95">
                  View Dashboard <ChevronRight size={18} />
                </Link>
              ) : (
                <Link to="/register" className="flex items-center gap-2 px-8 py-3.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-all shadow-[0_0_20px_rgba(37,99,235,0.4)] active:scale-95">
                  Get Started <ChevronRight size={18} />
                </Link>
              )}
              {/* If not logged in, show a secondary login button. If logged in, maybe show documentation link */}
              {!userInfo && (
                <Link to="/login" className="px-8 py-3.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-white font-semibold transition-all active:scale-95">
                  Login to Console
                </Link>
              )}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── Features Grid ── */}
      <section className="py-24 bg-black/30 border-y border-white/5 relative z-10 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">Enterprise-grade Features</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">Everything you need to secure and monitor your API endpoints in production.</p>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.6 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {[
              { icon: Activity, title: 'API Rate Limiting', desc: 'Prevent overwhelming your servers with intelligent rate limiting protocols.' },
              { icon: Key, title: 'Key Authentication', desc: 'Secure endpoints with instant API key validation and revocation.' },
              { icon: BarChart3, title: 'Real-time Analytics', desc: 'Monitor traffic patterns and errors with sub-second latency.' },
              { icon: Database, title: 'Token Bucket', desc: 'Industry standard token bucket algorithm for fair request distribution.' },
              { icon: Shield, title: 'Abuse Protection', desc: 'Automatically block suspicious IPs and prevent DDoS attacks.' },
              { icon: Zap, title: 'High Performance', desc: 'Built for speed, adding less than 5ms overhead to your requests.' },
            ].map((Feature, i) => (
              <div key={i} className="bg-white/[0.02] border border-white/5 p-8 rounded-3xl hover:bg-white/[0.04] transition-colors group">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Feature.icon size={24} className="text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{Feature.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{Feature.desc}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="py-24 px-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-3xl font-bold text-white mb-4">How SmartGate Works</h2>
            <p className="text-gray-400">A seamless integration into your existing infrastructure.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-[45px] left-10 right-10 h-0.5 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            
            {[
              { step: '01', icon: Key, title: 'Generate Key', desc: 'Create a highly secure API key from your dashboard.' },
              { step: '02', icon: Globe, title: 'Send Request', desc: 'Attach the key to headers of your incoming API requests.' },
              { step: '03', icon: Server, title: 'Validation', desc: 'SmartGate intercepts and verifies credentials instantly.' },
              { step: '04', icon: Lock, title: 'Traffic Control', desc: 'Rate limiter passes or rejects requests based on quotas.' },
            ].map((item, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="relative flex flex-col items-center text-center"
              >
                <div className="w-24 h-24 rounded-full bg-[#09090b] border-4 border-black relative z-10 flex items-center justify-center mb-6 shadow-xl">
                  <div className="absolute inset-0 rounded-full border border-white/10"></div>
                  <item.icon size={32} className="text-violet-400" />
                  <div className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs font-bold w-8 h-8 rounded-full flex items-center justify-center shadow-lg border-2 border-[#09090b]">
                    {item.step}
                  </div>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 max-w-[200px]">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Security Section ── */}
      <section className="py-24 bg-white/[0.02] border-t border-white/5 px-6 relative z-10 overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">
          <motion.div initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="flex-1">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6 leading-tight">
              Uncompromising <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-violet-500">Security</span>
            </h2>
            <ul className="space-y-6">
              {[
                { title: 'Secure API Access', desc: 'All requests are cryptographically verified before touching your backend.' },
                { title: 'Prevent Abuse (429)', desc: 'Violators are automatically blocked and flagged dynamically to prevent system strain.' },
                { title: 'Track User Activity', desc: 'Every endpoint call is securely logged and auditable in the dashboard.' }
              ].map((item, i) => (
                <li key={i} className="flex gap-4">
                  <div className="w-6 h-6 mt-1 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                    <Shield size={12} className="text-blue-400" />
                  </div>
                  <div>
                    <h4 className="text-white font-semibold mb-1">{item.title}</h4>
                    <p className="text-sm text-gray-400">{item.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </motion.div>
          
          <motion.div initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="flex-1 w-full max-w-lg lg:max-w-none relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/10 to-violet-500/10 blur-3xl rounded-full"></div>
            {/* Visual representation of blocked traffic */}
            <div className="bg-[#0f0f13] border border-white/10 rounded-2xl p-6 shadow-2xl relative z-10">
              <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
                <span className="text-white font-medium text-sm">Live Traffic Stream</span>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
              </div>
              <div className="space-y-3 font-mono text-[11px] sm:text-xs">
                <div className="flex justify-between items-center bg-emerald-500/10 text-emerald-400 p-2 rounded">
                  <span>GET /api/v1/users</span> <span className="bg-emerald-500/20 px-2 py-0.5 rounded">200 OK</span>
                </div>
                <div className="flex justify-between items-center bg-emerald-500/10 text-emerald-400 p-2 rounded">
                  <span>POST /api/v1/data</span> <span className="bg-emerald-500/20 px-2 py-0.5 rounded">200 OK</span>
                </div>
                <div className="flex justify-between items-center bg-red-500/10 text-red-400 p-2 rounded border border-red-500/20">
                  <span>GET /api/v1/users</span> <span className="bg-red-500/20 px-2 py-0.5 rounded">429 TOO MANY REQ</span>
                </div>
                <div className="flex justify-between items-center bg-emerald-500/10 text-emerald-400 p-2 rounded">
                  <span>GET /api/v1/status</span> <span className="bg-emerald-500/20 px-2 py-0.5 rounded">200 OK</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── CTA Section ── */}
      <section className="py-24 px-6 relative z-10">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="max-w-4xl mx-auto text-center bg-gradient-to-b from-white/10 to-transparent p-[1px] rounded-[2.5rem]">
          <div className="bg-[#09090b] rounded-[2.5rem] py-16 px-6 relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-[200px] bg-blue-500/20 blur-[100px] rounded-full pointer-events-none" />
            <h2 className="text-3xl lg:text-5xl font-bold text-white mb-6 relative z-10">Ready to secure your APIs?</h2>
            <p className="text-gray-400 mb-10 max-w-xl mx-auto relative z-10">Join developers enforcing state-of-the-art rate limits and real-time observability in minutes.</p>
            <div className="relative z-10">
              <Link to="/login" className="inline-block px-10 py-4 rounded-full bg-white text-black font-bold text-lg hover:bg-gray-200 transition-all active:scale-95 shadow-[0_0_30px_rgba(255,255,255,0.2)]">
                Start using SmartGate today
              </Link>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/10 py-8 px-6 text-center relative z-10 bg-black backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 text-white font-bold opacity-80">
            <Shield size={16} /> SMARTGATE
          </div>
          <p className="text-xs text-gray-600">© 2026 SmartGate API Platform. All rights reserved.</p>
          <div className="flex gap-6 text-xs text-gray-500">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Documentation</a>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default Home;
