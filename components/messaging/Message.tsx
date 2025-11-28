import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Message as MessageType } from '../../types';
import { FileText, Download, MoreHorizontal, Edit2, Trash2, Check, X, CheckCheck } from 'lucide-react';

interface MessageProps {
  message: MessageType;
  isOwnMessage: boolean;
  onImageClick: (url: string) => void;
  onDelete?: (id: string) => void;
  onEdit?: (id: string, newText: string) => void;
  isRead?: boolean;
}

const Message: React.FC<MessageProps> = ({ message, isOwnMessage, onImageClick, onDelete, onEdit, isRead }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(message.text);
  
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // We handle alignment in the outer div now
  const bubbleStyles = isOwnMessage
    ? 'bg-accent text-accent-text rounded-br-none rounded-bl-xl rounded-tr-xl rounded-tl-xl'
    : 'bg-white/10 text-text-light rounded-bl-none rounded-br-xl rounded-tr-xl rounded-tl-xl';
  
  const isImage = message.file && (message.file.type.startsWith('image') || message.file.url.match(/\.(jpeg|jpg|gif|png)$/i));

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
      if (isEditing && inputRef.current) {
          inputRef.current.focus();
          inputRef.current.style.height = 'auto';
          inputRef.current.style.height = inputRef.current.scrollHeight + 'px';
      }
  }, [isEditing]);

  const handleSaveEdit = () => {
      if (editedText.trim() !== '' && editedText !== message.text && onEdit) {
          onEdit(message.id, editedText);
      } else {
          setEditedText(message.text);
      }
      setIsEditing(false);
      setIsMenuOpen(false);
  };

  const handleCancelEdit = () => {
      setEditedText(message.text);
      setIsEditing(false);
      setIsMenuOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          handleSaveEdit();
      } else if (e.key === 'Escape') {
          handleCancelEdit();
      }
  };

  const formatTime = (timestamp: any) => {
      if (!timestamp?.toDate) return '';
      return timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={`w-full flex ${isOwnMessage ? 'justify-end' : 'justify-start'} group mb-1`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`flex items-end gap-2 max-w-[85%] md:max-w-md ${isOwnMessage ? 'flex-row' : 'flex-row-reverse'}`}>
        
        {/* Read Receipts (Ticks) - Left of the message for sender */}
        {isOwnMessage && (
            <div className={`flex-shrink-0 mb-1 ${isRead ? 'text-blue-400' : 'text-text-secondary/50'}`}>
                {isRead ? (
                    <CheckCheck size={16} strokeWidth={2.5} />
                ) : (
                    <Check size={16} strokeWidth={2.5} />
                )}
            </div>
        )}

        {/* Message Bubble Wrapper */}
        <div className="relative">
            <div
                className={`px-3 py-2 break-words ${bubbleStyles} overflow-visible shadow-sm min-w-[80px]`}
            >
                {message.file && (
                    <div className="mb-2">
                        {isImage ? (
                            <div onClick={() => onImageClick(message.file!.url)}>
                                <img 
                                    src={message.file.url} 
                                    alt="attachment" 
                                    className="rounded-lg max-h-60 object-cover w-full cursor-pointer hover:opacity-90 transition-opacity" 
                                />
                            </div>
                        ) : (
                            <a 
                                href={message.file.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${isOwnMessage ? 'bg-black/10 hover:bg-black/20' : 'bg-white/10 hover:bg-white/20'}`}
                            >
                                <FileText size={24} />
                                <div className="flex-grow min-w-0 overflow-hidden">
                                    <p className="font-semibold text-sm truncate">{message.file.name}</p>
                                    <p className="text-xs opacity-70">Файл</p>
                                </div>
                                <Download size={16} />
                            </a>
                        )}
                    </div>
                )}
                
                {isEditing ? (
                    <div className="flex flex-col gap-2 min-w-[200px]">
                        <textarea
                            ref={inputRef}
                            value={editedText}
                            onChange={(e) => {
                                setEditedText(e.target.value);
                                e.target.style.height = 'auto';
                                e.target.style.height = e.target.scrollHeight + 'px';
                            }}
                            onKeyDown={handleKeyDown}
                            className="w-full bg-black/10 rounded p-1 text-sm focus:outline-none resize-none overflow-hidden"
                            rows={1}
                        />
                        <div className="flex justify-end gap-2">
                            <button onClick={handleCancelEdit} className="p-1 hover:bg-black/10 rounded-full"><X size={14}/></button>
                            <button onClick={handleSaveEdit} className="p-1 hover:bg-black/10 rounded-full text-green-600"><Check size={14}/></button>
                        </div>
                    </div>
                ) : (
                    <div className="relative pb-1">
                        {message.text && (
                            <p className="text-sm leading-relaxed whitespace-pre-wrap pr-2" style={{ overflowWrap: 'break-word' }}>{message.text}</p>
                        )}
                        
                        <div className={`flex items-center justify-end gap-1 mt-1 ${isOwnMessage ? 'opacity-80' : 'opacity-60'} float-right ml-2`}>
                            {message.editedAt && (
                                <span className="text-[10px] italic mr-1">изм.</span>
                            )}
                            <span className="text-[10px] leading-none">{formatTime(message.createdAt)}</span>
                        </div>
                        {/* Clear float */}
                        <div className="clear-both"></div>
                    </div>
                )}
            </div>

            {/* Message Menu Trigger - Positioned absolutely relative to the bubble wrapper */}
            {isOwnMessage && !isEditing && (
                <div className={`absolute top-0 bottom-0 -left-10 flex items-center justify-end pr-2 transition-opacity duration-200 ${isHovered || isMenuOpen ? 'opacity-100' : 'opacity-0'}`}>
                    <div className="relative" ref={menuRef}>
                        <button 
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="p-1.5 rounded-full bg-slate-800/80 text-text-secondary hover:text-white hover:bg-slate-700 backdrop-blur-sm shadow-sm"
                        >
                            <MoreHorizontal size={14} />
                        </button>
                        <AnimatePresence>
                            {isMenuOpen && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9, x: 10 }}
                                    animate={{ opacity: 1, scale: 1, x: 0 }}
                                    exit={{ opacity: 0, scale: 0.9, x: 10 }}
                                    className="absolute right-full mr-2 top-0 bg-slate-800 rounded-lg shadow-xl border border-glass-border overflow-hidden z-20 flex flex-col py-1 min-w-[120px]"
                                >
                                    <button 
                                        onClick={() => { setIsEditing(true); setIsMenuOpen(false); }}
                                        className="flex items-center gap-2 px-3 py-2 text-xs hover:bg-white/10 text-left text-text-light transition-colors"
                                    >
                                        <Edit2 size={12} /> Редактировать
                                    </button>
                                    <button 
                                        onClick={() => { if(onDelete) onDelete(message.id); setIsMenuOpen(false); }}
                                        className="flex items-center gap-2 px-3 py-2 text-xs hover:bg-red-500/20 text-red-400 text-left transition-colors"
                                    >
                                        <Trash2 size={12} /> Удалить
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            )}
        </div>
      </div>
    </motion.div>
  );
};

export default Message;