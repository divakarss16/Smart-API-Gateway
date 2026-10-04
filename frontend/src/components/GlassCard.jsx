import React from 'react';
import { motion } from 'framer-motion';

const GlassCard = ({ children, className = '', delay = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.8, 
        delay, 
        type: 'spring', 
        stiffness: 100, 
        damping: 20 
      }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      className={`glass-panel glass-panel-hover p-6 rounded-2xl ${className}`}
    >
      {children}
    </motion.div>
  );
};

export default GlassCard;
