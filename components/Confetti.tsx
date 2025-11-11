

import React from 'react';
import { motion } from 'framer-motion';

const Confetti: React.FC = () => {
  const colors = ['#FFFFFF', '#f3f4f6', '#e5e7eb', '#d1d5db'];

  const particles = Array.from({ length: 50 });

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
      {particles.map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            backgroundColor: colors[Math.floor(Math.random() * colors.length)],
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            width: `${Math.random() * 8 + 4}px`,
            height: `${Math.random() * 8 + 4}px`,
          }}
          initial={{ opacity: 0, y: 0, scale: 0.5 }}
          animate={{
            opacity: [0, 1, 0],
            y: Math.random() * 200 - 100,
            x: Math.random() * 200 - 100,
            scale: [0.5, 1, 0],
            rotate: Math.random() * 360,
          }}
          transition={{
            duration: Math.random() * 1.5 + 0.5,
            ease: "easeOut",
            delay: Math.random() * 0.2,
          }}
        />
      ))}
      <motion.div
        className="absolute inset-0 bg-gradient-to-radial from-transparent to-transparent from-white/20"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: [0, 1, 0], scale: [0, 2, 0] }}
        transition={{ duration: 1.0, ease: "easeOut" }}
      >
        <div className="text-6xl absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">🎁</div>
      </motion.div>
    </div>
  );
};

export default Confetti;