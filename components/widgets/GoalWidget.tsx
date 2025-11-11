import React, { useState, useContext, useMemo } from 'react';
import { GoalData } from '../../types';
import { Target, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Confetti from '../Confetti';
import { WidgetSizeContext } from '../WidgetWrapper';

interface GoalWidgetProps {
  data: GoalData;
  updateData: (data: GoalData) => void;
  isEditable: boolean;
}

const GoalWidget: React.FC<GoalWidgetProps> = ({ data, updateData, isEditable }) => {
  const { goal, dueDate, completed } = data;
  const [showConfetti, setShowConfetti] = useState(false);
  const { width, height } = useContext(WidgetSizeContext);

  // Switch to horizontal layout when widget is wide and not very tall
  const isHorizontal = useMemo(() => width > height * 1.5 && height < 150, [width, height]);

  const handleUpdate = (field: keyof GoalData, value: any) => {
    updateData({ ...data, [field]: value });
  };
  
  const toggleCompleted = () => {
    if(!isEditable) return;
    const newCompleted = !completed;
    handleUpdate('completed', newCompleted);
    if(newCompleted) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
    }
  }

  const handleFocus = (event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => event.target.select();

  if (isHorizontal) {
    return (
      <div className="h-full w-full flex items-center justify-start text-left relative p-2 gap-4">
        <AnimatePresence>{showConfetti && <Confetti />}</AnimatePresence>
        <motion.div
          onClick={toggleCompleted}
          className={`relative w-16 h-16 rounded-full border-2 flex items-center justify-center transition-all duration-300 flex-shrink-0 ${
            completed ? 'bg-accent border-accent-dark scale-105' : 'border-text-secondary/30'
          } ${isEditable ? 'cursor-pointer' : 'cursor-default'}`}
          whileTap={isEditable ? { scale: 0.95 } : {}}
        >
          <Target size={24} className={`transition-colors duration-300 ${completed ? 'text-accent-text' : 'text-text-secondary/50'}`} />
          <AnimatePresence>
          {completed && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30, delay: 0.1 }}
              className="absolute -top-1 -right-1 w-6 h-6 bg-slate-800 rounded-full flex items-center justify-center shadow-md border-2 border-glass-border"
            >
              <Check size={14} className="text-accent" />
            </motion.div>
          )}
          </AnimatePresence>
        </motion.div>
        <div className="flex-grow min-w-0">
           <textarea
              value={goal}
              onChange={(e) => handleUpdate('goal', e.target.value)}
              onFocus={handleFocus}
              disabled={!isEditable}
              rows={1}
              className="text-base font-semibold bg-transparent text-left focus:outline-none resize-none w-full p-1 -m-1 rounded-md hover:bg-white/5 disabled:cursor-not-allowed disabled:hover:bg-transparent"
              placeholder="Опишите вашу цель..."
            />
            <div className="mt-1 text-xs text-text-secondary text-left">
              <input
                type="date"
                value={dueDate || ''}
                onChange={(e) => handleUpdate('dueDate', e.target.value)}
                disabled={!isEditable}
                className="bg-transparent text-left focus:outline-none p-1 -m-1 rounded-md hover:bg-white/5 disabled:cursor-not-allowed disabled:hover:bg-transparent"
              />
            </div>
        </div>
      </div>
    )
  }

  // Default Vertical Layout
  return (
    <div className="h-full flex flex-col items-center justify-center text-center relative p-2">
      <AnimatePresence>{showConfetti && <Confetti />}</AnimatePresence>
      <motion.div
        onClick={toggleCompleted}
        className={`relative w-24 h-24 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
          completed ? 'bg-accent border-accent-dark scale-105' : 'border-text-secondary/30'
        } ${isEditable ? 'cursor-pointer' : 'cursor-default'}`}
        whileTap={isEditable ? { scale: 0.95 } : {}}
      >
        <Target size={36} className={`transition-colors duration-300 ${completed ? 'text-accent-text' : 'text-text-secondary/50'}`} />
        <AnimatePresence>
        {completed && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30, delay: 0.1 }}
            className="absolute -top-1 -right-1 w-7 h-7 bg-slate-800 rounded-full flex items-center justify-center shadow-md border-2 border-glass-border"
          >
            <Check size={16} className="text-accent" />
          </motion.div>
        )}
        </AnimatePresence>
      </motion.div>

      <textarea
        value={goal}
        onChange={(e) => handleUpdate('goal', e.target.value)}
        onFocus={handleFocus}
        disabled={!isEditable}
        rows={2}
        className="mt-4 text-base font-semibold bg-transparent text-center focus:outline-none resize-none w-full p-1 rounded-md hover:bg-white/5 disabled:cursor-not-allowed disabled:hover:bg-transparent"
        placeholder="Опишите вашу цель..."
      />
      
      <div className="mt-1 text-xs text-text-secondary">
        <input
          type="date"
          value={dueDate || ''}
          onChange={(e) => handleUpdate('dueDate', e.target.value)}
          disabled={!isEditable}
          className="bg-transparent text-center focus:outline-none p-1 rounded-md hover:bg-white/5 disabled:cursor-not-allowed disabled:hover:bg-transparent"
        />
      </div>
    </div>
  );
};

export default React.memo(GoalWidget);