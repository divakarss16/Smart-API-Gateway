import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, LayoutDashboard, LogOut, Settings } from 'lucide-react';

const Navbar = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('userInfo'));

  const logoutHandler = () => {
    localStorage.removeItem('userInfo');
    navigate('/login');
  };

  if (!user) return null;

  return (
    <nav className="glass-card m-4 p-4 flex justify-between items-center sticky top-4 z-50">
      <Link to="/" className="flex items-center gap-2 text-xl font-bold text-white">
        <Shield className="text-purple-500" />
        <span>SmartGate</span>
      </Link>

      <div className="flex items-center gap-6">
        <Link to="/" className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors">
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </Link>
        
        {user.role === 'admin' && (
          <Link to="/admin" className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors">
            <Settings size={20} />
            <span>Admin</span>
          </Link>
        )}

        <button 
          onClick={logoutHandler}
          className="flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors cursor-pointer"
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
