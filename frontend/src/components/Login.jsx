import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Eye, EyeOff, AlertCircle, Hexagon } from 'lucide-react';
import { javaAuthAPI, authAPI } from '../utils/api';

// ────────────────────────────────────────────────────────────
// Floating label input (Dark Theme)
// ────────────────────────────────────────────────────────────
const FloatInput = ({ id, type = 'text', label, value, onChange, autoFocus, error, right }) => {
  const [focused, setFocused] = useState(false);
  const raised = focused || !!value;
  return (
    <div className="relative">
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        autoFocus={autoFocus}
        required
        placeholder=" "
        autoComplete={type === 'password' ? 'current-password' : type === 'email' ? 'email' : 'off'}
        className={`peer w-full px-4 pt-[24px] pb-[8px] text-sm text-white bg-black/40 rounded-2xl border backdrop-blur-md outline-none transition-all duration-300 shadow-inner ${
          error
            ? 'border-red-500/50 focus:border-red-500 bg-red-500/5'
            : focused
            ? 'border-blue-500/60 shadow-[0_0_15px_rgba(59,130,246,0.15)] bg-black/60'
            : 'border-white/10 hover:border-white/20'
        } ${right ? 'pr-12' : ''}`}
      />
      <label
        htmlFor={id}
        className={`absolute left-4 pointer-events-none font-medium transition-all duration-300 select-none ${
          raised ? 'top-[8px] text-[10px]' : 'top-[16px] text-[13.5px]'
        } ${error ? 'text-red-400' : raised ? 'text-blue-400' : 'text-gray-400'}`}
      >
        {label}
      </label>
      {right && <div className="absolute right-4 top-1/2 -translate-y-1/2">{right}</div>}
    </div>
  );
};

// ────────────────────────────────────────────────────────────
// Error banner
// ────────────────────────────────────────────────────────────
const ErrorBanner = ({ msg }) => (
  <AnimatePresence>
    {msg && (
      <motion.div initial={{ opacity: 0, height: 0, y: -10 }} animate={{ opacity: 1, height: 'auto', y: 0 }} exit={{ opacity: 0, height: 0 }}
        className="overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-[12.5px] font-medium mb-4 backdrop-blur-sm shadow-[0_0_15px_rgba(239,68,68,0.1)]">
          <AlertCircle size={15} className="shrink-0" /> {msg}
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);

// ════════════════════════════════════════════════════════════
// MAIN LOGIN COMPONENT
// ════════════════════════════════════════════════════════════
const Login = () => {
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [showPass, setShowPass]   = useState(false);
  const [formError, setFormError] = useState('');
  const [loading, setLoading]     = useState(false);
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (localStorage.getItem('userInfo')) navigate('/');
  }, [navigate]);

  const validate = () => {
    if (!email.trim()) return 'Email address is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Enter a valid email address.';
    if (!password.trim()) return 'Please enter your password.';
    return '';
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) {
      setFormError(err);
      return;
    }
    
    setFormError('');
    setLoading(true);

    let userData = null;

    // ── PRIMARY: Java Servlet → MySQL ──────────────────────
    try {
      const { data } = await javaAuthAPI.login(email.trim(), password);
      if (data?.status === 'success') {
        userData = {
          email:    data.email,
          name:     data.name  || data.email,
          role:     (data.role || 'USER').toLowerCase(),
          id:       data.id,
          source:   'java',
        };
        console.log('[Login] Java auth SUCCESS:', userData.email);
      }
    } catch (javaErr) {
      if (javaErr.status === 401) {
        setFormError(javaErr.responseData?.message || 'Invalid email or password.');
        setLoading(false);
        return;
      }
      console.warn('[Login] Java backend unavailable, trying Node.js fallback…', javaErr.status);
    }

    // ── FALLBACK: Node.js → MongoDB ────────────────────────
    if (!userData) {
      try {
        const { data } = await authAPI.login(email.trim(), password);
        userData = {
          ...data,
          source: 'node',
        };
        console.log('[Login] Node.js auth SUCCESS:', userData.email);
      } catch (nodeErr) {
        const msg =
          nodeErr.status === 401
            ? 'Invalid email or password.'
            : nodeErr.status === 0 || !nodeErr.response
            ? 'Cannot reach authentication server. Is the backend running?'
            : nodeErr.userMessage || 'Login failed. Please try again.';
        setFormError(msg);
        setLoading(false);
        return;
      }
    }

    // ── Store session & redirect ───────────────────────────
    localStorage.setItem('userInfo', JSON.stringify(userData));
    navigate('/');
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-[#09090b] px-4 py-10 overflow-hidden font-sans">
      
      {/* ── Ambient Background Mesh ── */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none mix-blend-screen" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-600/20 blur-[130px] rounded-full pointer-events-none mix-blend-screen" />
      <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none mix-blend-screen" />

      {/* Grid Pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_20%,transparent_100%)]"></div>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-[400px]"
      >
        {/* Card */}
        <div className="bg-white/[0.04] backdrop-blur-3xl border border-white/[0.08] rounded-[2rem] shadow-2xl p-8 sm:p-10 relative overflow-hidden">
          
          {/* Shine effect */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>

          {/* Logo */}
          <motion.div 
            initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring" }}
            className="flex justify-center mb-6"
          >
            <div className="relative w-14 h-14 flex items-center justify-center">
              <div className="absolute inset-0 bg-blue-500/20 rounded-2xl blur-xl animate-pulse"></div>
              <div className="relative w-full h-full bg-gradient-to-br from-blue-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg border border-white/10">
                <Hexagon size={28} className="text-white drop-shadow-md" strokeWidth={2.5} />
              </div>
            </div>
          </motion.div>

          {/* Heading */}
          <div className="text-center mb-8">
            <h1 className="text-[1.85rem] font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70 mb-2 tracking-tight">
              Welcome back
            </h1>
            <p className="text-[13.5px] text-gray-400 font-medium tracking-wide">
              Sign in to your <span className="text-blue-400">SmartGate</span> console
            </p>
          </div>

          <ErrorBanner msg={formError} />

          <form onSubmit={handleSignIn} className="space-y-4">
            <FloatInput
              id="login-email"
              type="email"
              label="Email Address"
              value={email}
              onChange={e => { setEmail(e.target.value); setFormError(''); }}
              autoFocus
            />

            <div>
              <FloatInput
                id="login-password"
                type={showPass ? 'text' : 'password'}
                label="Password"
                value={password}
                onChange={e => { setPassword(e.target.value); setFormError(''); }}
                right={
                  <button type="button" onClick={() => setShowPass(s => !s)}
                    className="text-gray-400 hover:text-white transition-colors p-1 focus:outline-none focus:text-blue-400">
                    {showPass ? <EyeOff size={16}/> : <Eye size={16}/>}
                  </button>
                }
              />
              <div className="flex justify-end mt-2">
                <a href="#" onClick={(e) => { e.preventDefault(); alert("Password reset is not configured."); }}
                  className="text-[12px] text-gray-400 hover:text-blue-400 font-medium transition-colors">
                  Forgot password?
                </a>
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={!loading ? { scale: 1.015, rotate: 0.5 } : {}}
              whileTap={!loading ? { scale: 0.98 } : {}}
              className="group relative w-full py-4 mt-4 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 overflow-hidden font-semibold text-white shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_30px_rgba(79,70,229,0.5)] transition-all duration-300 outline-none focus:ring-2 focus:ring-white/20 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {/* Button shine */}
              <div className="absolute inset-0 -translate-x-[120%] group-hover:translate-x-[120%] bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 ease-in-out"></div>
              
              <div className="relative flex items-center justify-center gap-2 text-[14.5px]">
                {loading
                  ? <><Loader2 size={18} className="animate-spin" /> Authenticating…</>
                  : 'Sign in to Console'
                }
              </div>
            </motion.button>
          </form>

        </div>
        
        {/* Sign up link underneath the card */}
        <div className="text-center mt-8">
          <p className="text-[14px] text-gray-400 font-medium">
            New to SmartGate?{' '}
            <Link to="/register" className="text-white hover:text-blue-400 transition-colors inline-block relative after:absolute after:bottom-0 after:left-0 after:w-full after:h-[1px] auto-underline after:bg-blue-400 after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:origin-left">
              Create an account
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
