import React from 'react';
import { motion, Variants } from 'framer-motion';
import { WidgetType } from '../types';
import { LayoutDashboard, Type, BarChart2, PieChart, ListChecks, Image, FileText, Newspaper, Columns, Folder, Target, Paperclip } from 'lucide-react';

interface WidgetMenuProps {
  onSelect: (type: WidgetType) => void;
  onClose: () => void;
}

const widgetOptions = [
  { type: WidgetType.Plan, label: 'План', icon: LayoutDashboard },
  { type: WidgetType.Pie, label: 'Диаграмма', icon: PieChart },
  { type: WidgetType.Line, label: 'График', icon: BarChart2 },
  { type: WidgetType.Goal, label: 'Цель', icon: Target },
  { type: WidgetType.Checklist, label: 'Список дел', icon: ListChecks },
  { type: WidgetType.Text, label: 'Заметка', icon: Type },
  { type: WidgetType.Title, label: 'Заголовок', icon: FileText },
  { type: WidgetType.Image, label: 'Изображение', icon: Image },
  { type: WidgetType.File, label: 'Файл', icon: Paperclip },
  { type: WidgetType.Article, label: 'Статья', icon: Newspaper },
  { type: WidgetType.Table, label: 'Таблица', icon: Columns },
  { type: WidgetType.Folder, label: 'Папка', icon: Folder },
];

// Optimized animation variants for the menu and its items
const menuVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { ease: 'easeOut', duration: 0.2 } 
  },
  exit: { 
    opacity: 0, 
    y: 20,
    transition: { ease: 'easeIn', duration: 0.15 }
  }
};

const gridContainerVariants: Variants = {
  visible: {
    transition: {
      staggerChildren: 0.03, // Faster stagger
    }
  },
  hidden: {}
};

const gridItemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { ease: 'easeOut', duration: 0.2 }
  }
};

const WidgetMenu: React.FC<WidgetMenuProps> = ({ onSelect, onClose }) => {
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        onClick={onClose}
        className="fixed inset-0 bg-black/30 z-40 backdrop-blur-sm"
      />
      <motion.div
        variants={menuVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-4"
      >
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-4 shadow-2xl border border-glass-border">
          <h3 className="text-lg font-semibold mb-4 px-2">Выберите виджет</h3>
          <motion.div 
            className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4"
            variants={gridContainerVariants}
            initial="hidden"
            animate="visible"
          >
            {widgetOptions.map(option => (
              <motion.button
                key={option.type}
                onClick={() => onSelect(option.type as WidgetType)}
                className="flex flex-col items-center justify-center p-4 rounded-lg text-center hover:bg-white/10 transition-colors group focus:outline-none focus:ring-2 focus:ring-accent"
                variants={gridItemVariants}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="p-3 bg-white/10 group-hover:bg-white/20 rounded-full mb-2 transition-colors">
                    <option.icon size={24} className="text-accent" />
                </div>
                <span className="text-sm font-medium">{option.label}</span>
              </motion.button>
            ))}
          </motion.div>
        </div>
      </motion.div>
    </>
  );
};

export default WidgetMenu;