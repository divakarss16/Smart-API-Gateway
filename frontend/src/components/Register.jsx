import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, AlertCircle, Eye, EyeOff, CheckCircle2, Hexagon } from 'lucide-react';
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
        autoComplete={type === 'password' ? 'new-password' : type === 'email' ? 'email' : 'name'}
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
// Password strength bar
// ────────────────────────────────────────────────────────────
const PasswordStrength = ({ password }) => {
  if (!password) return null;
  const score = [password.length >= 8, /[A-Z]/.test(password), /[0-9]/.test(password), /[^A-Za-z0-9]/.test(password)].filter(Boolean).length;
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['', 'bg-red-500', 'bg-orange-400', 'bg-emerald-400', 'bg-emerald-500'];
  const textColors = ['', 'text-red-400', 'text-orange-400', 'text-emerald-400', 'text-emerald-500'];
  return (
    <div className="mt-2 px-1">
      <div className="flex gap-1.5 mb-1.5">
        {[1,2,3,4].map(i => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= score ? colors[score] : 'bg-white/10'}`} />
        ))}
      </div>
      <p className={`text-[11px] font-medium tracking-wide ${textColors[score]}`}>{labels[score]}</p>
    </div>
  );
};

// ════════════════════════════════════════════════════════════
// MAIN REGISTER COMPONENT
// ════════════════════════════════════════════════════════════
const Register = () => {
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors]     = useState({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading]   = useState(false);
  const [success, setSuccess]   = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem('userInfo')) navigate('/');
  }, [navigate]);

  const validate = () => {
    const e = {};
    if (!name.trim())                       e.name = 'Name is required';
    if (!email.trim())                      e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Enter a valid email';
    if (!password)                          e.password = 'Password is required';
    else if (password.length < 4)          e.password = 'Must be at least 4 characters';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setFormError('');
    setLoading(true);

    let userData = null;

    // ── PRIMARY: Java Servlet → MySQL ──────────────────────────────
    try {
      const { data } = await javaAuthAPI.register(email.trim(), password, name.trim());
      if (data?.status === 'success') {
        userData = {
          email: data.email,
          name:  data.name || name.trim(),
          role:  (data.role || 'USER').toLowerCase(),
          id:    data.id,
          source: 'java',
        };
      }
    } catch (javaErr) {
      if (javaErr.status === 409) {
        setFormError('An account with this email already exists.');
        setLoading(false);
        return;
      }
      if (javaErr.status === 400) {
        setFormError(javaErr.responseData?.message || 'Invalid input. Check your details.');
        setLoading(false);
        return;
      }
    }

    // ── FALLBACK: Node.js → MongoDB ────────────────────────────────
    if (!userData) {
      try {
        const { data } = await authAPI.register(name.trim(), email.trim(), password);
        userData = { ...data, source: 'node' };
      } catch (nodeErr) {
        const msg =
          nodeErr.status === 400  ? nodeErr.responseData?.message || 'Invalid form data.' :
          nodeErr.status === 409  ? 'An account with this email already exists.' :
          !nodeErr.response       ? 'Network error. Cannot reach backend.' :
          nodeErr.userMessage     || 'Registration failed.';
        setFormError(msg);
        setLoading(false);
        return;
      }
    }

    // ── Success animation → redirect ───────────────
    setSuccess(true);
    localStorage.setItem('userInfo', JSON.stringify(userData));
    setTimeout(() => navigate('/'), 1400);
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-[#09090b] px-4 py-10 overflow-hidden font-sans">
      
      {/* ── Ambient Background Mesh ── */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none mix-blend-screen" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-600/20 blur-[130px] rounded-full pointer-events-none mix-blend-screen" />

      {/* Grid Pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_20%,transparent_100%)]"></div>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-[400px]"
      >
        <div className="bg-white/[0.04] backdrop-blur-3xl border border-white/[0.08] rounded-[2rem] shadow-2xl p-8 sm:p-10 relative overflow-hidden">
          
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>

          {/* Logo */}
          <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring" }} className="flex justify-center mb-6">
            <div className="relative w-14 h-14 flex items-center justify-center">
              <div className="absolute inset-0 bg-blue-500/20 rounded-2xl blur-xl animate-pulse"></div>
              <div className="relative w-full h-full bg-gradient-to-br from-blue-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg border border-white/10">
                <Hexagon size={28} className="text-white drop-shadow-md" strokeWidth={2.5} />
              </div>
            </div>
          </motion.div>

          <AnimatePresence mode="wait">
            {success ? (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center py-6 gap-4">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.1 }}>
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                    <CheckCircle2 size={32} className="text-emerald-400 drop-shadow-lg" />
                  </div>
                </motion.div>
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-white mb-1 tracking-tight">Access Granted</h2>
                  <p className="text-sm text-gray-400">Initializing your console environment…</p>
                </div>
              </motion.div>
            ) : (
              <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="text-center mb-8">
                  <h1 className="text-[1.85rem] font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70 mb-2 tracking-tight">
                    Create account
                  </h1>
                  <p className="text-[13.5px] text-gray-400 font-medium tracking-wide">
                    Join the <span className="text-blue-400">SmartGate</span> developer platform
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                  <FloatInput
                    id="reg-name" type="text" label="Full Name" value={name}
                    onChange={e => { setName(e.target.value); setErrors(p => ({ ...p, name: '' })); }}
                    autoFocus error={errors.name}
                  />
                  <FloatInput
                    id="reg-email" type="email" label="Email Address" value={email}
                    onChange={e => { setEmail(e.target.value); setErrors(p => ({ ...p, email: '' })); }}
                    error={errors.email}
                  />
                  <div>
                    <FloatInput
                      id="reg-password" type={showPass ? 'text' : 'password'} label="Password" value={password}
                      onChange={e => { setPassword(e.target.value); setErrors(p => ({ ...p, password: '' })); }}
                      error={errors.password}
                      right={
                        <button type="button" onClick={() => setShowPass(s => !s)}
                          className="text-gray-400 hover:text-white transition-colors p-1 focus:outline-none focus:text-blue-400">
                          {showPass ? <EyeOff size={16}/> : <Eye size={16}/>}
                        </button>
                      }
                    />
                    <PasswordStrength password={password} />
                  </div>

                  <AnimatePresence>
                    {formError && (
                      <motion.div initial={{ opacity: 0, height: 0, y: -10 }} animate={{ opacity: 1, height: 'auto', y: 0 }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                        <div className="flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-[12.5px] font-medium mt-1 backdrop-blur-sm">
                          <AlertCircle size={15} className="shrink-0" /> {formError}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <motion.button
                    type="submit" disabled={loading}
                    whileHover={!loading ? { scale: 1.015, rotate: 0.5 } : {}}
                    whileTap={!loading ? { scale: 0.98 } : {}}
                    className="group relative w-full py-4 mt-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 overflow-hidden font-semibold text-white shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_30px_rgba(79,70,229,0.5)] transition-all duration-300 outline-none focus:ring-2 focus:ring-white/20 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    <div className="absolute inset-0 -translate-x-[120%] group-hover:translate-x-[120%] bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 ease-in-out"></div>
                    <div className="relative flex items-center justify-center gap-2 text-[14.5px]">
                      {loading ? <><Loader2 size={18} className="animate-spin" /> Provisioning…</>  : 'Create Account'}
                    </div>
                  </motion.button>
                </form>

              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Links underneath the card */}
        <div className="text-center mt-8 space-y-4">
          <p className="text-[14px] text-gray-400 font-medium">
            Already have an account?{' '}
            <Link to="/login" className="text-white hover:text-blue-400 transition-colors inline-block relative after:absolute after:bottom-0 after:left-0 after:w-full after:h-[1px] auto-underline after:bg-blue-400 after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:origin-left">
              Sign in here
            </Link>
          </p>
          <p className="text-[11.5px] text-gray-500 max-w-[280px] mx-auto leading-relaxed">
            By registering, you agree to the <a href="#" className="underline hover:text-white transition-colors">Terms of Service</a> & <a href="#" className="underline hover:text-white transition-colors">Privacy Policy</a>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
