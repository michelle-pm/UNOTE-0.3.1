import React, { useState } from 'react';
import { ChecklistData, ChecklistItem } from '../../types';
import { Plus, Trash2, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';


interface ChecklistWidgetProps {
  data: ChecklistData;
  updateData: (data: ChecklistData) => void;
  isEditable: boolean;
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


const ChecklistWidget: React.FC<ChecklistWidgetProps> = ({ data, updateData, isEditable }) => {
  const { items } = data;
  const [newItemText, setNewItemText] = useState('');

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
  
  const handleFocus = (event: React.FocusEvent<HTMLInputElement>) => event.target.select();

  return (
    <div className="h-full flex flex-col text-sm">
      <div className="flex-grow overflow-y-auto pr-1 -mr-1">
        <div className="space-y-3">
          <AnimatePresence>
              {items.map(item => (
              <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  className="group flex items-center gap-3"
              >
                  <CustomCheckbox completed={item.completed} onToggle={() => toggleItem(item.id)} disabled={!isEditable} />
                  <input 
                      value={item.text}
                      onChange={(e) => updateItemText(item.id, e.target.value)}
                      onFocus={handleFocus}
                      disabled={!isEditable}
                      className={`flex-grow bg-transparent focus:outline-none p-1 -m-1 rounded-md transition-colors font-medium text-sm text-text-primary disabled:opacity-70 disabled:cursor-not-allowed ${item.completed ? 'line-through text-text-secondary' : ''}`}
                  />
                  {isEditable &&
                    <button onClick={() => deleteItem(item.id)} className="text-text-secondary/50 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                        <Trash2 size={16} />
                    </button>
                  }
              </motion.div>
              ))}
          </AnimatePresence>
        </div>
      </div>
      {isEditable &&
        <form
          onSubmit={(e) => {
              e.preventDefault();
              addItem();
          }}
          className="mt-3 flex-shrink-0"
        >
          <div className="relative">
              <input
              type="text"
              value={newItemText}
              onChange={(e) => setNewItemText(e.target.value)}
              placeholder="Добавить задачу..."
              className="w-full bg-white/5 focus:outline-none py-2 pl-4 pr-10 font-medium text-sm placeholder:text-text-secondary/70 rounded-lg border-2 border-transparent focus:border-accent/50 transition-colors"
              />
              <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-text-secondary/70 hover:text-accent transition-colors">
                <Plus size={18} />
              </button>
          </div>
        </form>
      }
    </div>
  );
};

export default React.memo(ChecklistWidget);