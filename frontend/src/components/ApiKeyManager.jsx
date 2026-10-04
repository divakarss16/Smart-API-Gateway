import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Key, Copy, RefreshCw, Loader2, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import GlassCard from './GlassCard';
import { javaGatewayAPI, gatewayAPI } from '../utils/api';

const ApiKeyManager = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [generatingKey, setGeneratingKey] = useState(false);
  const [currentKey, setCurrentKey] = useState(() => {
    try { return JSON.parse(localStorage.getItem('userInfo'))?.apiKey || ''; } catch { return ''; }
  });

  useEffect(() => {
    // Attempt to load profile if we don't have email.
    // The node backend validates the JWT and returns the User profile.
    gatewayAPI.getProfile().then(res => {
      setProfile(res.data);
    }).catch(() => {
      // Ignore
    });
  }, []);

  const generateNewApiKey = async () => {
    const emailToUse = profile?.email || JSON.parse(localStorage.getItem('userInfo'))?.email;
    if (!emailToUse) {
      toast.error('User profile not fully loaded yet.');
      return;
    }

    setGeneratingKey(true);
    try {
      const { data } = await javaGatewayAPI.generateKey(emailToUse);
      if (data?.apiKey) {
        // Auto-fill into the system context
        const info = JSON.parse(localStorage.getItem('userInfo')) || {};
        info.apiKey = data.apiKey;
        localStorage.setItem('userInfo', JSON.stringify(info));
        setCurrentKey(data.apiKey);
        
        toast.success(data.message || 'Key deployed! Redirecting to test Gateway...', { duration: 2000 });
        
        // Auto navigate back to dashboard to see results
        setTimeout(() => {
          navigate('/?autoTest=true');
        }, 1500);
      }
    } catch (err) {
      toast.error(err.userMessage || 'Failed to generate API Key');
    } finally {
      setGeneratingKey(false);
    }
  };

  const copyApiKey = () => {
    if (!currentKey) return;
    navigator.clipboard.writeText(currentKey);
    toast.success('API Key copied to clipboard!');
  };

  return (
    <div className="space-y-8 max-w-[1200px] mx-auto pb-10">
      <header className="mb-10">
        <h2 className="text-4xl font-black text-white glow-text-purple">Security Access</h2>
        <p className="text-slate-400 font-medium">Manage your private credentials for the Java Gateway.</p>
      </header>

      <GlassCard className="max-w-2xl">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-purple-500/20 rounded-xl text-purple-400">
            <Key size={24} />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white">API Key Generation</h3>
            <p className="text-sm text-slate-400">This key is required to authenticate requests hitting the rate-limited Java API surface.</p>
          </div>
        </div>

        <div className="mb-8 p-6 rounded-xl border border-purple-500/20 bg-purple-500/5 relative overflow-hidden">
          <div className="absolute top-0 right-[-50px] w-48 h-48 bg-purple-500/20 blur-[60px]" />
          
          <label className="text-xs font-black uppercase tracking-widest text-slate-500 mb-3 block">
            Current Gateway API Key
          </label>
          
          <div className="flex gap-3 relative z-10">
            <input
              type="text"
              readOnly
              className="cyber-input flex-1 h-12 text-sm font-mono tracking-widest cursor-text"
              placeholder="No active API key. Generate one below."
              value={currentKey ? `ak_************************${currentKey.slice(-4)}` : ''}
              onClick={(e) => {
                 if (currentKey) { e.target.value = currentKey; e.target.select(); }
              }}
              onBlur={(e) => {
                 if (currentKey) { e.target.value = `ak_************************${currentKey.slice(-4)}`; }
              }}
            />
            {currentKey && (
              <button onClick={copyApiKey} title="Copy Key"
                className="px-4 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded-lg flex items-center justify-center hover:bg-blue-500/20 transition-all font-bold text-xs">
                <Copy size={16} className="mr-2"/> COPY
              </button>
            )}
          </div>
          
          {currentKey && (
            <motion.p 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="mt-4 text-xs font-bold text-green-400 flex items-center gap-2"
            >
              <CheckCircle2 size={14} /> Automatically synced to Java Tester Environment
            </motion.p>
          )}
        </div>

        <button 
          onClick={generateNewApiKey}
          disabled={generatingKey}
          className="cyber-btn w-full flex items-center justify-center gap-3 active:scale-95 text-sm py-4"
        >
          {generatingKey ? <Loader2 className="animate-spin" size={20} /> : <RefreshCw size={20} />}
          {currentKey ? 'Revoke & Generate New Key' : 'Generate Secure API Key'}
        </button>

      </GlassCard>
    </div>
  );
};

export default ApiKeyManager;
