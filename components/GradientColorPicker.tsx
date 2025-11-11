import React, { useState } from 'react';
import { motion } from 'framer-motion';
import GlassButton from './GlassButton';

interface ColorCircleProps {
  color: string;
  onChange: (color: string) => void;
}

const gradientTemplates = [
  { color1: '#6E85B7', color2: '#B2C8DF' }, // Dusty Blue
  { color1: '#98DDCA', color2: '#D5F5E3' }, // Mint & Light Green
  { color1: '#C3B1E1', color2: '#E0BBE4' }, // Lavender & Orchid Pink
  { color1: '#FFDAB9', color2: '#FFE4B5' }, // Peach & Moccasin
  { color1: '#7f8c8d', color2: '#bdc3c7' }, // Slate & Steel
  { color1: '#2c3e50', color2: '#4ca1af' }, // Ocean Blue & Teal
  { color1: '#D7BDE2', color2: '#A9CCE3' }, // Soft Lilac & Sky
  { color1: '#ff7e5f', color2: '#feb47b' }, // Sunset & Sky
];

const ColorCircle: React.FC<ColorCircleProps> = ({ color, onChange }) => (
  <div className="relative w-8 h-8 rounded-full shadow-inner shadow-black/20 cursor-pointer">
    <div className="absolute inset-0 rounded-full border border-white/20" style={{ backgroundColor: color }} />
    <input
      type="color"
      value={color}
      onChange={(e) => onChange(e.target.value)}
      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer no-drag"
    />
  </div>
);

interface GradientColorPickerProps {
  initialColor1: string;
  initialColor2: string;
  onSync: (color1: string, color2: string) => void;
}

const GradientColorPicker: React.FC<GradientColorPickerProps> = ({ initialColor1, initialColor2, onSync }) => {
  const [color1, setColor1] = useState(initialColor1);
  const [color2, setColor2] = useState(initialColor2);

  const handleSyncClick = () => {
    onSync(color1, color2);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className="absolute top-full left-0 mt-2 w-auto bg-slate-800/80 backdrop-blur-lg rounded-xl shadow-xl p-4 border border-glass-border"
    >
      <div>
        <h4 className="text-xs font-semibold text-text-secondary mb-2 px-1">Шаблоны</h4>
        <div className="grid grid-cols-4 gap-2 mb-3">
          {gradientTemplates.map((template, index) => (
            <motion.button
              key={index}
              onClick={() => {
                setColor1(template.color1);
                setColor2(template.color2);
              }}
              className="w-10 h-10 rounded-full p-0.5 border-2 border-transparent focus:outline-none focus:border-accent"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <div
                style={{ background: `linear-gradient(to right, ${template.color1}, ${template.color2})` }}
                className="w-full h-full rounded-full"
              />
            </motion.button>
          ))}
        </div>
      </div>
      <div className="h-px bg-glass-border -mx-4 my-3" />
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <ColorCircle color={color1} onChange={setColor1} />
          <ColorCircle color={color2} onChange={setColor2} />
        </div>
        <GlassButton
          onClick={handleSyncClick}
          className="px-3 py-1.5 text-sm"
        >
          Применить
        </GlassButton>
      </div>
    </motion.div>
  );
};

export default GradientColorPicker;