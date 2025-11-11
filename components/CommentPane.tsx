import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, AlertTriangle, Loader2 } from 'lucide-react';
import { Comment, User, Widget } from '../types';
import Avatar from './Avatar';

interface CommentPaneProps {
  widget: Widget;
  comments: Comment[];
  projectUsers: User[];
  currentUser: User | null;
  onAddComment: (widgetId: string, content: string, mentions: string[]) => Promise<void>;
  onClose: () => void;
  position: { top: number; left: number; transformOrigin: string };
  error: string | null;
}

const formatDate = (timestamp: any) => {
    if (!timestamp?.toDate) return '';
    const date = timestamp.toDate();
    const now = new Date();
    const diffSeconds = Math.round((now.getTime() - date.getTime()) / 1000);

    if (diffSeconds < 60) return `${diffSeconds}с назад`;
    const diffMinutes = Math.round(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes}м назад`;
    const diffHours = Math.round(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}ч назад`;
    
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

const CommentPane: React.FC<CommentPaneProps> = ({ widget, comments, projectUsers, currentUser, onAddComment, onClose, position, error }) => {
  const [newComment, setNewComment] = useState('');
  const [mentions, setMentions] = useState<string[]>([]);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const commentsEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const filteredUsers = useMemo(() => {
    if (mentionQuery === null) return [];
    return projectUsers.filter(u => 
        u.displayName.toLowerCase().includes(mentionQuery.toLowerCase()) && 
        u.uid !== currentUser?.uid
    );
  }, [mentionQuery, projectUsers, currentUser]);

  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'auto' });
  }, [comments, error]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setNewComment(text);

    const match = text.match(/@(\w*)$/);
    if (match) {
        setMentionQuery(match[1]);
    } else {
        setMentionQuery(null);
    }
  };
  
  const handleSelectMention = (user: User) => {
    const text = newComment;
    const atIndex = text.lastIndexOf('@');
    const newText = text.substring(0, atIndex) + `@${user.displayName} `;
    
    setNewComment(newText);
    setMentions(prev => [...prev, user.uid]);
    setMentionQuery(null);
    textareaRef.current?.focus();
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setSubmitError(null);
    try {
        await onAddComment(widget.id, newComment.trim(), mentions);
        setNewComment('');
        setMentions([]);
    } catch (err: any) {
        setSubmitError(err.message || 'Неизвестная ошибка');
    } finally {
        setIsSubmitting(false);
    }
  };
  
  return (
    <>
      <div
        className="fixed inset-0 z-30"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ ease: "easeOut", duration: 0.2 }}
        style={{
          top: position.top,
          left: position.left,
          transformOrigin: position.transformOrigin,
        }}
        className="fixed z-40 w-[340px] max-h-[480px] bg-[#161B29]/95 rounded-3xl shadow-2xl border border-glass-border flex flex-col text-text-light"
      >
        <div className="flex-shrink-0 p-4 border-b border-glass-border flex justify-between items-center">
          <h3 className="font-bold truncate pr-4">Комментарии: {widget.data.title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/10 transition-colors">
            <X size={18} />
          </button>
        </div>
        
        <div className="flex-grow p-4 overflow-y-auto space-y-4">
          {error && (
            <div className="text-center p-4 bg-red-900/30 text-red-400 rounded-lg text-sm border border-red-500/30 flex flex-col items-center gap-2">
                <AlertTriangle size={24} />
                <p className="font-bold">Ошибка загрузки</p>
                <p>{error}</p>
            </div>
          )}
          {!error && comments.map(comment => {
              const author = projectUsers.find(u => u.uid === comment.authorUid) || { displayName: comment.authorName, uid: comment.authorUid };
              return (
                <div key={comment.id} className="flex items-start gap-3">
                  <Avatar user={author} className="w-8 h-8 flex-shrink-0" />
                  <div className="flex-grow">
                    <div className="flex items-baseline gap-2">
                      <p className="font-semibold text-sm">{author.displayName}</p>
                      <p className="text-xs text-text-secondary">{formatDate(comment.createdAt)}</p>
                    </div>
                    <p className="text-sm text-text-light/90 whitespace-pre-wrap break-words">{comment.content}</p>
                  </div>
                </div>
              )
           })}
           {!error && comments.length === 0 && (
            <div className="text-center text-text-secondary text-sm p-8">
                Комментариев пока нет.
            </div>
           )}
          <div ref={commentsEndRef} />
        </div>

        <div className="flex-shrink-0 p-4 border-t border-glass-border relative">
            <AnimatePresence>
                {mentionQuery !== null && filteredUsers.length > 0 && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute bottom-full left-4 mb-2 w-[calc(100%-2rem)] max-h-40 overflow-y-auto bg-[#1a202c] rounded-lg shadow-xl z-50 p-2 border border-glass-border"
                    >
                       {filteredUsers.map(user => (
                           <button key={user.uid} onClick={() => handleSelectMention(user)} className="w-full text-left px-3 py-2 text-sm hover:bg-white/5 rounded-md flex items-center gap-2">
                               <Avatar user={user} className="w-6 h-6" />
                               <span>{user.displayName}</span>
                           </button>
                       ))}
                    </motion.div>
                )}
            </AnimatePresence>
            <AnimatePresence>
            {submitError && (
                <motion.p 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="text-red-400 text-xs text-center mb-2"
                >
                    {submitError}
                </motion.p>
            )}
            </AnimatePresence>
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <textarea
              ref={textareaRef}
              value={newComment}
              onChange={handleInputChange}
              placeholder="Написать комментарий..."
              rows={1}
              className="flex-grow w-full p-3 bg-white/5 rounded-lg border-2 border-transparent focus:border-accent focus:outline-none transition-colors resize-none disabled:opacity-50"
              disabled={!!error || isSubmitting}
            />
            <button type="submit" className="p-3 bg-accent/80 hover:bg-accent text-accent-text rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-12 h-12 flex items-center justify-center" disabled={!newComment.trim() || isSubmitting || !!error}>
                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </form>
        </div>
      </motion.div>
    </>
  );
};

export default CommentPane;
