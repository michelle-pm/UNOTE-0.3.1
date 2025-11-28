import React from 'react';
import { motion } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info, MessageSquare } from 'lucide-react';
import { ToastMessage } from '../contexts/ToastContext';

interface ToastProps {
  toast: ToastMessage;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  const icons = {
    info: <Info className="text-blue-400" size={20} />,
    success: <CheckCircle className="text-green-400" size={20} />,
    error: <AlertCircle className="text-red-400" size={20} />,
    message: <MessageSquare className="text-accent" size={20} />,
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 50, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      layout
      className="pointer-events-auto w-80 bg-slate-900/90 backdrop-blur-md border border-glass-border rounded-xl shadow-2xl p-4 flex items-start gap-3 relative overflow-hidden"
    >
      <div className="flex-shrink-0 mt-0.5">
        {icons[toast.type]}
      </div>
      <div className="flex-grow min-w-0">
        {toast.title && <h4 className="font-bold text-sm text-text-light mb-1">{toast.title}</h4>}
        <p className="text-sm text-text-secondary leading-snug break-words">{toast.message}</p>
      </div>
      <button 
        onClick={onClose}
        className="flex-shrink-0 p-1 rounded-full hover:bg-white/10 text-text-secondary transition-colors -mr-1 -mt-1"
      >
        <X size={16} />
      </button>
      
      {/* Progress bar animation could go here */}
      <motion.div 
        initial={{ scaleX: 1 }}
        animate={{ scaleX: 0 }}
        transition={{ duration: 5, ease: "linear" }}
        className="absolute bottom-0 left-0 right-0 h-0.5 bg-current opacity-20 origin-left"
        style={{ color: toast.type === 'error' ? '#ef4444' : toast.type === 'success' ? '#4ade80' : '#ffffff' }}
      />
    </motion.div>
  );
};

export default Toast;