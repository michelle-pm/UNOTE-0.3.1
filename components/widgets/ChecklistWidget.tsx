import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChecklistData, ChecklistItem, User } from '../../types';
import { Plus, Trash2, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';
import Avatar from '../Avatar';


interface ChecklistWidgetProps {
  data: ChecklistData;
  updateData: (data: ChecklistData) => void;
  isEditable: boolean;
  projectUsers: User[];
}

const CustomCheckbox = ({ completed, onToggle, disabled }: { completed: boolean; onToggle: () => void, disabled: boolean }) => {
    return (
        <div
            onClick={!disabled ? onToggle : undefined}
            className={`relative w-5 h-5 rounded-md border-2 flex-shrink-0 flex items-center justify-center transition-colors ${disabled ? 'cursor-not-allowed border-gray-600' : 'cursor-pointer border-gray-500 group-hover:border-accent'}`}
        >
            <AnimatePresence>
                {completed && (
                    <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        className="absolute inset-0 bg-accent rounded-md flex items-center justify-center"
                    >
                        <Check size={14} className="text-accent-text" />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};


const ChecklistWidget: React.FC<ChecklistWidgetProps> = ({ data, updateData, isEditable, projectUsers }) => {
  const { items } = data;
  const [newItemText, setNewItemText] = useState('');
  
  // State for mentions
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionIndex, setMentionIndex] = useState(0);
  const [activeInputId, setActiveInputId] = useState<string | 'new' | null>(null);
  const [cursorPosition, setCursorPosition] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const handleUpdate = (field: keyof ChecklistData, value: any) => {
    updateData({ ...data, [field]: value });
  };

  const addItem = () => {
    if (newItemText.trim() === '') return;
    const newItem: ChecklistItem = {
      id: uuidv4(),
      text: newItemText.trim(),
      completed: false,
    };
    handleUpdate('items', [...items, newItem]);
    setNewItemText('');
    setMentionQuery(null);
  };

  const toggleItem = (id: string) => {
    const newItems = items.map(item =>
      item.id === id ? { ...item, completed: !item.completed } : item
    );
    handleUpdate('items', newItems);
  };

  const deleteItem = (id: string) => {
    handleUpdate('items', items.filter(item => item.id !== id));
  };

  const updateItemText = (id: string, text: string) => {
    const newItems = items.map(item =>
        item.id === id ? { ...item, text } : item
    );
    handleUpdate('items', newItems);
  }
  
  const handleFocus = (event: React.FocusEvent<HTMLInputElement>) => {
      // Don't select all for smoother editing experience
  };

  // --- Mention Logic ---

  const filteredUsers = useMemo(() => {
      if (mentionQuery === null) return [];
      const query = mentionQuery.toLowerCase();
      return projectUsers.filter(u => 
          (u.displayName && u.displayName.toLowerCase().includes(query)) ||
          (u.email && u.email.toLowerCase().includes(query))
      );
  }, [mentionQuery, projectUsers]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, itemId: string | 'new') => {
      const val = e.target.value;
      const selectionStart = e.target.selectionStart || 0;
      setCursorPosition(selectionStart);
      setActiveInputId(itemId);

      if (itemId === 'new') {
          setNewItemText(val);
      } else {
          updateItemText(itemId, val);
      }

      // Detect @mention pattern
      const textBeforeCursor = val.slice(0, selectionStart);
      const match = textBeforeCursor.match(/@(\w*)$/);

      if (match) {
          setMentionQuery(match[1]);
          setMentionIndex(0);
      } else {
          setMentionQuery(null);
      }
  };

  const insertMention = (user: User) => {
      if (!activeInputId) return;

      const currentText = activeInputId === 'new' ? newItemText : items.find(i => i.id === activeInputId)?.text || '';
      
      // Find the last @ before cursor (approximate logic based on query)
      // Since we updated state on change, let's reconstruct where the insertion happens
      const textBeforeMatch = currentText.substring(0, cursorPosition - (mentionQuery?.length || 0) - 1);
      const textAfterMatch = currentText.substring(cursorPosition);
      
      const newText = `${textBeforeMatch}@${user.displayName} ${textAfterMatch}`;
      
      if (activeInputId === 'new') {
          setNewItemText(newText);
      } else {
          updateItemText(activeInputId, newText);
      }
      
      setMentionQuery(null);
      // Focus restoration would ideally happen here, but React re-renders might handle it or we use refs for each input
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, itemId: string | 'new', submitAction?: () => void) => {
      if (mentionQuery !== null && filteredUsers.length > 0) {
          if (e.key === 'ArrowDown') {
              e.preventDefault();
              setMentionIndex(prev => (prev + 1) % filteredUsers.length);
              return;
          }
          if (e.key === 'ArrowUp') {
              e.preventDefault();
              setMentionIndex(prev => (prev - 1 + filteredUsers.length) % filteredUsers.length);
              return;
          }
          if (e.key === 'Enter') {
              e.preventDefault();
              insertMention(filteredUsers[mentionIndex]);
              return;
          }
          if (e.key === 'Escape') {
              e.preventDefault();
              setMentionQuery(null);
              return;
          }
      }

      if (e.key === 'Enter' && submitAction && !mentionQuery) {
          e.preventDefault();
          submitAction();
      }
  };

  // Close mention menu on click outside
  useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
          if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
              setMentionQuery(null);
          }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);


  const MentionPopup = () => {
      if (mentionQuery === null || filteredUsers.length === 0) return null;

      return (
          <div className="absolute left-8 z-50 mt-1 w-64 bg-slate-900/95 backdrop-blur-md rounded-xl shadow-2xl border border-glass-border overflow-hidden">
              <div className="max-h-48 overflow-y-auto p-1">
                  {filteredUsers.map((user, idx) => (
                      <button
                          key={user.uid}
                          onClick={() => insertMention(user)}
                          className={`w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors ${idx === mentionIndex ? 'bg-accent/20' : 'hover:bg-white/5'}`}
                      >
                          <Avatar user={user} className="w-6 h-6" />
                          <div className="overflow-hidden">
                              <p className="text-sm font-semibold truncate text-text-light">{user.displayName}</p>
                              <p className="text-[10px] text-text-secondary truncate">{user.email}</p>
                          </div>
                      </button>
                  ))}
              </div>
          </div>
      );
  };

  return (
    <div ref={wrapperRef} className="h-full flex flex-col text-sm relative">
      <div className="flex-grow overflow-y-auto pr-1 -mr-1">
        <div className="space-y-3 pb-10">
          <AnimatePresence>
              {items.map(item => (
              <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  className="group flex items-start gap-3 relative"
              >
                  <div className="mt-1">
                    <CustomCheckbox completed={item.completed} onToggle={() => toggleItem(item.id)} disabled={!isEditable} />
                  </div>
                  <div className="flex-grow relative">
                      <input 
                          value={item.text}
                          onChange={(e) => handleInputChange(e, item.id)}
                          onKeyDown={(e) => handleKeyDown(e, item.id)}
                          onFocus={handleFocus}
                          disabled={!isEditable}
                          className={`w-full bg-transparent focus:outline-none p-1 -m-1 rounded-md transition-colors font-medium text-sm text-text-primary disabled:opacity-70 disabled:cursor-not-allowed ${item.completed ? 'line-through text-text-secondary' : ''}`}
                      />
                      {activeInputId === item.id && <MentionPopup />}
                  </div>
                  {isEditable &&
                    <button onClick={() => deleteItem(item.id)} className="text-text-secondary/50 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 mt-1">
                        <Trash2 size={16} />
                    </button>
                  }
              </motion.div>
              ))}
          </AnimatePresence>
        </div>
      </div>
      {isEditable &&
        <div className="mt-auto pt-2 flex-shrink-0 relative">
          <div className="relative">
              <input
                type="text"
                value={newItemText}
                onChange={(e) => handleInputChange(e, 'new')}
                onKeyDown={(e) => handleKeyDown(e, 'new', addItem)}
                placeholder="Добавить задачу (@ для отметки)..."
                className="w-full bg-white/5 focus:outline-none py-2 pl-4 pr-10 font-medium text-sm placeholder:text-text-secondary/70 rounded-lg border-2 border-transparent focus:border-accent/50 transition-colors"
              />
              <button onClick={addItem} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-text-secondary/70 hover:text-accent transition-colors">
                <Plus size={18} />
              </button>
          </div>
          {activeInputId === 'new' && (
              <div className="absolute bottom-full left-0 mb-1 w-full">
                  <MentionPopup />
              </div>
          )}
        </div>
      }
    </div>
  );
};

export default React.memo(ChecklistWidget);