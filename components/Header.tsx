import React, { useState, useRef, useEffect } from 'react';
import { Menu, Plus, Undo2, Users, Palette, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassButton from './GlassButton';
import { User } from '../types';
import GradientColorPicker from './GradientColorPicker';
import Avatar from './Avatar';
import UserTooltip from './UserTooltip';

interface HeaderProps {
  title: string;
  onToggleSidebar: () => void;
  onAddWidget: () => void;
  showAddWidgetButton: boolean;
  onUndo: () => void;
  canUndo: boolean;
  onUpdateGradients: (color1: string, color2: string) => void;
  projectColors: { color1: string; color2: string };
  onToggleFriendsModal: () => void;
  hasPendingRequests: boolean;
  hasUnreadMessages: boolean;
  projectUsers: User[];
  ownerUid: string;
  isTeamProject: boolean;
}

const UserAvatar: React.FC<{ user: User, isOwner: boolean }> = ({ user, isOwner }) => (
    <div className={`relative ${isOwner ? 'ring-2 ring-accent-dark rounded-full' : ''}`}>
        <Avatar user={user} className="w-8 h-8" />
    </div>
);

const Header: React.FC<HeaderProps> = ({ 
    title, onToggleSidebar, onAddWidget, showAddWidgetButton, onUndo, canUndo, 
    onUpdateGradients, projectColors, onToggleFriendsModal, hasPendingRequests, hasUnreadMessages,
    projectUsers, ownerUid, isTeamProject
}) => {
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const colorPickerRef = useRef<HTMLDivElement>(null);

  const usersToShow = isTeamProject ? projectUsers : projectUsers.filter(u => u.uid === ownerUid);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (
        colorPickerRef.current && 
        !colorPickerRef.current.contains(target) &&
        !target.closest('#palette-button')
      ) {
        setIsColorPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSync = (c1: string, c2: string) => {
    onUpdateGradients(c1, c2);
    setIsColorPickerOpen(false);
  }

  return (
    <header className="sticky top-0 flex-shrink-0 flex items-center justify-between h-16 px-4 z-20 bg-slate-900/20 backdrop-blur-xl border-b border-glass-border text-text-light">
      <div className="flex items-center gap-2">
        <motion.button 
          whileTap={{ scale: 0.9 }}
          onClick={onToggleSidebar} 
          className="p-2 rounded-full hover:bg-black/10 transition-colors"
          aria-label="Toggle Sidebar"
          data-tour="sidebar-toggle"
        >
          <Menu size={20} />
        </motion.button>
        <h1 className="text-lg font-bold truncate" data-tour="header-title">{title}</h1>
         <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onUndo}
          disabled={!canUndo}
          className="p-2 rounded-full hover:bg-black/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Undo"
        >
          <Undo2 size={18} />
        </motion.button>
        <div ref={colorPickerRef} className="relative">
            <motion.button
                id="palette-button"
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsColorPickerOpen(prev => !prev)}
                className="p-2 rounded-full hover:bg-black/10 transition-colors"
                aria-label="Sync Gradients"
                data-tour="palette-button"
            >
                <Palette size={18} />
            </motion.button>
            <AnimatePresence>
            {isColorPickerOpen && (
                <GradientColorPicker 
                    initialColor1={projectColors.color1}
                    initialColor2={projectColors.color2}
                    onSync={handleSync}
                />
            )}
            </AnimatePresence>
        </div>
      </div>
      <div className="flex items-center gap-1">
         <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onToggleFriendsModal}
          className="p-2 rounded-full hover:bg-white/10 transition-colors relative"
          aria-label="Friends"
          data-tour="friends-button"
        >
          <Users size={18} />
          {hasPendingRequests && (
             <span className="absolute top-1.5 right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent"></span>
             </span>
          )}
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onToggleFriendsModal} // Reuses friend modal for now as it contains Chat
          className="p-2 rounded-full hover:bg-white/10 transition-colors relative mr-2"
          aria-label="Messages"
        >
          <MessageCircle size={18} />
          {hasUnreadMessages && (
             <span className="absolute top-1.5 right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.8)]"></span>
             </span>
          )}
        </motion.button>
        
        <div className="flex items-center -space-x-2 ml-2">
            {usersToShow.slice(0, 5).map(user => (
              <UserTooltip key={user.uid} user={user} position="bottom">
                <UserAvatar user={user} isOwner={user.uid === ownerUid} />
              </UserTooltip>
            ))}
            {usersToShow.length > 5 && (
              <div className="w-8 h-8 rounded-full bg-slate-700 text-text-light flex items-center justify-center text-xs font-bold border-2 border-slate-800">
                +{usersToShow.length - 5}
              </div>
            )}
        </div>
        
        {showAddWidgetButton && (
          <div data-tour="add-widget-btn">
            <GlassButton onClick={onAddWidget} aria-label="Add Widget" className="ml-2">
                <Plus size={18} />
                <span className="hidden sm:inline">Виджет</span>
            </GlassButton>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;