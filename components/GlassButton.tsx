import React from 'react';
import { motion } from 'framer-motion';

interface GlassButtonProps extends Omit<React.ComponentProps<typeof motion.button>, 'children'> {
  children: React.ReactNode;
  className?: string;
}

const GlassButton: React.FC<GlassButtonProps> = ({ children, className = '', ...props }) => {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      whileHover={{ scale: 1.02 }}
      className={`relative inline-flex items-center justify-center px-4 py-2 font-semibold rounded-lg transition-all duration-300 overflow-hidden
                  border border-white/20 bg-white/10 text-text-primary shadow-md shadow-black/20
                  hover:bg-white/20 hover:border-white/30 hover:shadow-lg
                  disabled:opacity-50 disabled:cursor-not-allowed
                  ${className}`}
      {...props}
    >
        <div className="absolute inset-0 backdrop-blur-sm"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
        <span className="relative z-10 flex items-center justify-center gap-2">{children}</span>
    </motion.button>
  );
};

export default GlassButton;