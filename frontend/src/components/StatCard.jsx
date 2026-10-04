import React from 'react';
import { motion } from 'framer-motion';

const StatCard = ({ title, value, icon: Icon, colorClass, delay = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay }}
      className="glass-panel p-6 flex items-start justify-between relative overflow-hidden group"
    >
      <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full blur-3xl opacity-20 ${colorClass}`}></div>
      
      <div>
        <p className="text-sm font-medium text-slate-400 mb-1">{title}</p>
        <h3 className="text-3xl font-black text-white">{value}</h3>
      </div>

      <div className={`p-3 rounded-2xl bg-white/5 border border-white/10 text-white ${colorClass} group-hover:scale-110 transition-transform`}>
        <Icon size={24} />
      </div>
    </motion.div>
  );
};

export default StatCard;
