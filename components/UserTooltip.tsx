import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  const anchorRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const [placedPosition, setPlacedPosition] = useState(position);

  if (!user) {
    return <>{children}</>;
  }

  const handleMouseEnter = () => {
    if (hoverTimeout) clearTimeout(hoverTimeout);
    updatePosition();
    setIsHovered(true);
  };
  
  const handleMouseLeave = () => {
    const timeout = window.setTimeout(() => setIsHovered(false), 100);
    setHoverTimeout(timeout);
  };

  const updatePosition = () => {
      if (anchorRef.current) {
          const rect = anchorRef.current.getBoundingClientRect();
          const tooltipHeight = 60; // Approximate
          const tooltipWidth = 150; // Approximate max width
          const gap = 8;
          const HEADER_HEIGHT = 70;

          let top = 0;
          let left = rect.left + rect.width / 2;
          let newPosition = position;

          // Vertical logic
          if (position === 'top') {
              if (rect.top - tooltipHeight - gap < HEADER_HEIGHT) {
                  newPosition = 'bottom';
                  top = rect.bottom + gap;
              } else {
                  top = rect.top - gap;
              }
          } else {
              if (rect.bottom + tooltipHeight + gap > window.innerHeight) {
                  newPosition = 'top';
                  top = rect.top - gap;
              } else {
                  top = rect.bottom + gap;
              }
          }

          setPlacedPosition(newPosition);
          setCoords({ top, left });
      }
  };

  useEffect(() => {
      if (isHovered) {
          window.addEventListener('scroll', updatePosition, true);
          window.addEventListener('resize', updatePosition);
          return () => {
              window.removeEventListener('scroll', updatePosition, true);
              window.removeEventListener('resize', updatePosition);
          }
      }
  }, [isHovered]);

  return (
    <>
        <div
        ref={anchorRef}
        className="relative flex items-center justify-center cursor-pointer"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        >
        {children}
        </div>
        {isHovered && createPortal(
            <AnimatePresence>
                <motion.div
                    initial={{ opacity: 0, y: placedPosition === 'top' ? 10 : -10, scale: 0.9, x: '-50%' }}
                    animate={{ opacity: 1, y: 0, scale: 1, x: '-50%' }}
                    exit={{ opacity: 0, y: placedPosition === 'top' ? 10 : -10, scale: 0.9, x: '-50%' }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                    style={{
                        position: 'fixed',
                        top: coords.top,
                        left: coords.left,
                        transform: 'translateX(-50%)',
                        // Adjust Y based on position for correct anchor point logic if using top/left coords
                        marginTop: placedPosition === 'top' ? '-100%' : '0', 
                    }}
                    className="z-[9999] w-max max-w-[200px] pointer-events-none"
                >
                    <div className="bg-slate-900/95 backdrop-blur-lg rounded-lg shadow-2xl p-3 text-sm border border-glass-border text-left">
                        <p className="font-bold text-text-light truncate">{user.displayName}</p>
                        {user.email && <p className="text-text-secondary truncate text-xs opacity-70">{user.email}</p>}
                    </div>
                </motion.div>
            </AnimatePresence>,
            document.body
        )}
    </>
  );
};

export default UserTooltip;