import React, { useState, useEffect, useRef } from 'react';
import { TitleData } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import { AlignLeft, AlignCenter, AlignRight } from 'lucide-react';

interface TitleWidgetProps {
  data: TitleData;
  updateData: (data: TitleData) => void;
  isEditable: boolean;
}

const TitleWidget: React.FC<TitleWidgetProps> = ({ data, updateData, isEditable }) => {
  const { title, fontSize = 'lg', textAlign = 'center' } = data;
  const [isEditing, setIsEditing] = useState(false);
  const [currentTitle, setCurrentTitle] = useState(title);
  const [isHovered, setIsHovered] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setCurrentTitle(title);
  }, [title]);


  useEffect(() => {
    if (isEditing && inputRef.current) {
        inputRef.current.select();
    }
  }, [isEditing]);

  const handleUpdate = (newData: Partial<TitleData>) => {
    updateData({ ...data, ...newData });
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (currentTitle.trim() !== '') {
        updateData({ ...data, title: currentTitle });
    } else {
        setCurrentTitle(title); // revert
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleBlur();
    } else if (e.key === 'Escape') {
      setCurrentTitle(title);
      setIsEditing(false);
    }
  };

  const handleDoubleClick = () => {
    if (isEditable) {
      setIsEditing(true);
    }
  };

  const FONT_SIZES = {
    sm: 'text-2xl',
    md: 'text-4xl',
    lg: 'text-5xl',
    xl: 'text-7xl',
  };

  const TEXT_ALIGNMENTS = {
    left: 'text-left justify-start',
    center: 'text-center justify-center',
    right: 'text-right justify-end',
  };

  return (
    <div 
      ref={containerRef} 
      className={`h-full w-full flex items-center relative ${TEXT_ALIGNMENTS[textAlign]}`} 
      onDoubleClick={handleDoubleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
        <AnimatePresence>
        {isEditable && isHovered && !isEditing && (
            <motion.div 
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.2 }}
                className="absolute top-0 right-0 flex items-center gap-1 bg-black/30 p-1 rounded-lg z-10 backdrop-blur-sm border border-glass-border"
            >
                <button onClick={() => handleUpdate({ textAlign: 'left' })} className={`p-1 rounded-md transition-colors ${textAlign === 'left' ? 'bg-accent text-accent-text' : 'hover:bg-white/10'}`}><AlignLeft size={14} /></button>
                <button onClick={() => handleUpdate({ textAlign: 'center' })} className={`p-1 rounded-md transition-colors ${textAlign === 'center' ? 'bg-accent text-accent-text' : 'hover:bg-white/10'}`}><AlignCenter size={14} /></button>
                <button onClick={() => handleUpdate({ textAlign: 'right' })} className={`p-1 rounded-md transition-colors ${textAlign === 'right' ? 'bg-accent text-accent-text' : 'hover:bg-white/10'}`}><AlignRight size={14} /></button>
                <div className="w-px h-5 bg-white/10 mx-1"></div>
                {Object.keys(FONT_SIZES).map(sizeKey => (
                    <button key={sizeKey} onClick={() => handleUpdate({ fontSize: sizeKey as keyof typeof FONT_SIZES })} className={`p-1 w-6 text-xs font-bold rounded-md transition-colors ${fontSize === sizeKey ? 'bg-accent text-accent-text' : 'hover:bg-white/10'}`}>
                        {sizeKey.toUpperCase()}
                    </button>
                ))}
            </motion.div>
        )}
        </AnimatePresence>

      {isEditable && isEditing ? (
        <textarea
          ref={inputRef}
          value={currentTitle}
          onChange={(e) => setCurrentTitle(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className={`w-full h-full font-bold bg-transparent focus:outline-none p-1 -m-1 rounded-md bg-white/10 resize-none flex items-center ${FONT_SIZES[fontSize]} ${TEXT_ALIGNMENTS[textAlign].split(' ')[0]}`}
        />
      ) : (
        <h2 className={`font-bold select-none leading-tight ${FONT_SIZES[fontSize]}`} style={{ overflowWrap: 'break-word', hyphens: 'auto' }}>{title}</h2>
      )}
    </div>
  );
};

export default React.memo(TitleWidget);