import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User } from '../types';

interface UserTooltipProps {
  children: React.ReactNode;
  user: Partial<User> | null | undefined;
  position?: 'top' | 'bottom';
}

const UserTooltip: React.FC<UserTooltipProps> = ({ children, user, position = 'top' }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [hoverTimeout, setHoverTimeout] = useState<number | null>(null);

  if (!user) {
    return <>{children}</>;
  }

  const handleMouseEnter = () => {
    if (hoverTimeout) clearTimeout(hoverTimeout);
    setIsHovered(true);
  };
  
  const handleMouseLeave = () => {
    const timeout = window.setTimeout(() => setIsHovered(false), 100);
    setHoverTimeout(timeout);
  };

  return (
    <div
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: position === 'top' ? 10 : -10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: position === 'top' ? 10 : -10, scale: 0.9 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className={`absolute left-1/2 -translate-x-1/2 w-max max-w-xs z-50 ${
              position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'
            }`}
          >
            <div className="bg-slate-900/80 backdrop-blur-lg rounded-lg shadow-xl p-3 text-sm border border-glass-border text-left">
              <p className="font-bold text-text-light">{user.displayName}</p>
              {user.email && <p className="text-text-secondary">{user.email}</p>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserTooltip;