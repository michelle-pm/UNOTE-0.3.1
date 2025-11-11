
import React from 'react';
import { motion } from 'framer-motion';

interface ThemeToggleProps {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ theme, toggleTheme }) => {
  const isDark = theme === 'dark';

  return (
    <div
      onClick={toggleTheme}
      className={`flex items-center w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${
        isDark ? 'bg-accent' : 'bg-gray-300'
      }`}
    >
      <motion.div
        className="w-4 h-4 bg-white rounded-full shadow-md"
        layout
        transition={{ type: 'spring', stiffness: 700, damping: 30 }}
        style={{ marginLeft: isDark ? 'auto' : '0' }}
      />
    </div>
  );
};

export default ThemeToggle;
