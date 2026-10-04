import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, LayoutDashboard, Settings, LogOut, Terminal, Activity, Users, Key } from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('userInfo'));

  const logoutHandler = () => {
    localStorage.removeItem('userInfo');
    navigate('/login');
  };

  if (!user) return null;

  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/', roles: ['user', 'admin'] },
    { name: 'API Access', icon: Key, path: '/api-keys', roles: ['user', 'admin'] },
    { name: 'Admin Control', icon: Shield, path: '/admin', roles: ['admin'] },
  ];

  return (
    <motion.div 
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="sidebar-glass flex flex-col p-6"
    >
      <div className="flex items-center gap-3 mb-12 px-2">
        <div className="p-2 bg-purple-500 rounded-lg shadow-[0_0_15px_rgba(168,85,247,0.5)]">
          <Terminal className="text-white" size={24} />
        </div>
        <h1 className="text-2xl font-black tracking-tighter text-white glow-text-purple">
          SMART<span className="text-purple-500">GATE</span>
        </h1>
      </div>

      <nav className="flex-grow space-y-2">
        {menuItems.filter(item => item.roles.includes(user.role)).map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link key={item.path} to={item.path}>
              <motion.div
                whileHover={{ x: 5 }}
                className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 ${
                  isActive 
                    ? 'bg-purple-500/20 text-white border border-purple-500/30 glow-border-blue' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <item.icon size={20} className={isActive ? 'text-purple-400' : ''} />
                <span className="font-semibold">{item.name}</span>
                {isActive && (
                  <motion.div 
                    layoutId="activeTab"
                    className="ml-auto w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]"
                  />
                )}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-6 border-t border-white/10">
        <div className="flex items-center gap-3 mb-6 px-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center font-bold text-white shadow-lg overflow-hidden">
            {user.name.charAt(0)}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-bold text-white truncate">{user.name}</p>
            <p className="text-xs text-slate-500 truncate capitalize">{user.role}</p>
          </div>
        </div>

        <button 
          onClick={logoutHandler}
          className="w-full flex items-center gap-4 px-4 py-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all"
        >
          <LogOut size={20} />
          <span className="font-bold">Sign Out</span>
        </button>
      </div>
    </motion.div>
  );
};

export default Sidebar;
