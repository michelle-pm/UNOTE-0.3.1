import React, { useState, useRef, useEffect, useMemo, createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GripVertical, Trash2, Plus, ChevronDown, ChevronUp, User, Copy, Edit3, MessageSquare, MoreHorizontal, ChevronRight, ArrowLeft, UserX, Check, Folder } from 'lucide-react';
import { FolderData, Widget, User as UserType, ProjectMemberRole, WidgetType } from '../types';
import useResizeObserver from '../hooks/useResizeObserver';
import { UnreadStatusContext } from './Dashboard';
import Avatar from './Avatar';
import UserTooltip from './UserTooltip';


export const WidgetSizeContext = createContext({ width: 0, height: 0 });

const UserAvatar: React.FC<{ user: UserType | undefined }> = ({ user }) => (
    <>
      {user && <Avatar user={user} className="w-5 h-5" />}
    </>
);

interface WidgetWrapperProps {
  children: React.ReactNode;
  widget: Widget;
  onRemove: () => void;
  onCopy: () => void;
  onUpdateWidgetData: (id: string, data: any, assignedUserUid?: string | null) => void;
  onToggleFolder?: () => void;
  onInitiateAddWidget?: (parentId: string) => void;
  isNested?: boolean;
  currentUser: UserType | null;
  currentUserRole: ProjectMemberRole | 'owner' | null;
  projectUsers: UserType[];
  isTeamProject: boolean;
  isWidgetEditable: boolean;
  onToggleCommentPane: (widgetId: string | null) => void;
  onMoveWidget: (widgetId: string, newParentId: string | null) => void;
  allFolders?: Widget[];
}

const WidgetWrapper: React.FC<WidgetWrapperProps> = ({
  children, widget, onRemove, onCopy, onUpdateWidgetData,
  onToggleFolder, onInitiateAddWidget, isNested,
  currentUser, currentUserRole, projectUsers, isTeamProject, isWidgetEditable,
  onToggleCommentPane, onMoveWidget, allFolders
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(widget.data.title || '');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuView, setMenuView] = useState<'main' | 'assign' | 'move'>('main');
  
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const { width, height } = useResizeObserver(contentRef);
  
  const unreadStatusByWidget = useContext(UnreadStatusContext);
  const hasUnreadComments = unreadStatusByWidget[widget.id] || false;


  const isFolder = widget.type === 'folder';
  const isTitleWidget = widget.type === 'title';
  const folderData = isFolder ? (widget.data as FolderData) : undefined;
  
  const isCommentable = ![WidgetType.Title, WidgetType.Goal].includes(widget.type);

  useEffect(() => {
    setTempTitle(widget.data.title || '');
  }, [widget.data.title]);

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        menuButtonRef.current &&
        !menuButtonRef.current.contains(event.target as Node)
      ) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMenuClose = () => {
    setIsMenuOpen(false);
    // Delay resetting view to allow for exit animation
    setTimeout(() => setMenuView('main'), 200);
  }
  
  const handleUpdate = (field: string, value: any) => {
      onUpdateWidgetData(widget.id, { ...widget.data, [field]: value });
  };
  
  const handleAssignUser = (uid: string | null) => {
      onUpdateWidgetData(widget.id, widget.data, uid);
      setMenuView('main');
      handleMenuClose();
  }

  const handleMoveToDashboard = () => {
    onMoveWidget(widget.id, null);
    handleMenuClose();
  };

  const handleMoveToFolder = (folderId: string) => {
      onMoveWidget(widget.id, folderId);
      handleMenuClose();
  };

  const availableFolders = allFolders?.filter(f => f.id !== widget.id) || [];

  const handleTitleBlur = () => {
    if (tempTitle.trim() !== '') {
      handleUpdate('title', tempTitle);
    } else {
      setTempTitle(widget.data.title || ''); // Revert if empty
    }
    setIsEditingTitle(false);
  };
  
  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
          handleTitleBlur();
      } else if (e.key === 'Escape') {
          setTempTitle(widget.data.title || '');
          setIsEditingTitle(false);
      }
  };
  
  const handleDoubleClick = () => {
    if (isWidgetEditable && !isTitleWidget) {
      setIsEditingTitle(true);
    }
  };

  const assignedUser = useMemo(() => projectUsers.find(u => u.uid === widget.assignedUser), [projectUsers, widget.assignedUser]);
  
  return (
    <div 
        className={`relative w-full h-full transition-shadow duration-300 rounded-3xl widget-grain-container text-text-light ${isMenuOpen ? 'z-30' : 'z-10'}`}
    >
        <div
            className="absolute inset-0 w-full h-full rounded-3xl -z-10"
            style={{
                backgroundColor: 'rgba(22, 27, 41, 0.4)', // Darker background
                border: '1px solid rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(48px)',
            }}
        />

        <div className="relative z-0 flex flex-col w-full h-full">
            <div className={`drag-handle flex items-center h-12 px-4 ${isWidgetEditable ? 'cursor-grab' : 'cursor-default'} flex-shrink-0 border-b border-white/10`}>
              <div className={`flex-grow flex items-center gap-2 min-w-0 ${isFolder && folderData?.isCollapsed ? 'justify-center' : ''}`} onDoubleClick={handleDoubleClick}>
                {isFolder && onToggleFolder && (
                    <button onClick={onToggleFolder} className="p-1 -ml-1 rounded-full hover:bg-white/10 no-drag flex-shrink-0">
                      {folderData?.isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                    </button>
                )}
                {assignedUser && (
                  <UserTooltip user={assignedUser} position={isNested ? 'bottom' : 'top'}>
                      <div className="flex-shrink-0">
                        <UserAvatar user={assignedUser} />
                      </div>
                  </UserTooltip>
                )}
                
                {!isTitleWidget && (
                  <div className="overflow-hidden flex-grow min-w-0">
                    {isEditingTitle && isWidgetEditable ? (
                      <input
                        ref={titleInputRef}
                        type="text"
                        value={tempTitle}
                        onChange={(e) => setTempTitle(e.target.value)}
                        onBlur={handleTitleBlur}
                        onKeyDown={handleTitleKeyDown}
                        className="w-full text-base font-semibold bg-transparent focus:outline-none p-1 -m-1 rounded-md bg-white/10 no-drag"
                      />
                    ) : (
                      <h3 className={`font-semibold truncate select-none transition-all duration-300 ${isFolder && folderData?.isCollapsed ? 'text-lg text-text-light' : 'text-base text-text-light'}`}>{widget.data.title}</h3>
                    )}
                  </div>
                )}
              </div>
                <div className="flex items-center gap-1 ml-auto">
                    <div className="relative">
                        <button 
                            ref={menuButtonRef}
                            onClick={() => setIsMenuOpen(prev => !prev)} 
                            className="no-drag p-1.5 rounded-full text-text-secondary hover:text-text-light hover:bg-white/10 transition-colors"
                        >
                            <MoreHorizontal size={16} />
                        </button>
                        <AnimatePresence>
                        {isMenuOpen && (
                            <motion.div
                                ref={menuRef}
                                initial={{ opacity: 0, y: -5, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -5, scale: 0.95 }}
                                transition={{ duration: 0.1, ease: 'easeOut' }}
                                className="absolute top-full right-0 mt-1 w-56 bg-[#2c3344]/90 backdrop-blur-xl rounded-lg shadow-xl z-50 overflow-auto border border-glass-border"
                            >
                                <AnimatePresence mode="wait">
                                {menuView === 'main' ? (
                                    <motion.div
                                        key="main"
                                        initial={{ x: -10, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        exit={{ x: -10, opacity: 0 }}
                                        transition={{ duration: 0.15 }}
                                        className="p-2 space-y-1"
                                    >
                                        {!isTitleWidget && isWidgetEditable && (
                                            <button onClick={() => { setIsEditingTitle(true); handleMenuClose(); }} className="w-full flex items-center gap-3 text-left px-3 py-1.5 text-sm hover:bg-white/5 rounded-md"><Edit3 size={14} />Переименовать</button>
                                        )}
                                        {isFolder && isWidgetEditable && onInitiateAddWidget && !folderData?.isCollapsed && (
                                            <button onClick={() => { onInitiateAddWidget(widget.id); handleMenuClose(); }} className="w-full flex items-center gap-3 text-left px-3 py-1.5 text-sm hover:bg-white/5 rounded-md"><Plus size={14} />Добавить виджет</button>
                                        )}
                                        {isWidgetEditable && isTeamProject && (
                                            <button onClick={() => setMenuView('assign')} className="w-full flex items-center justify-between text-left px-3 py-1.5 text-sm hover:bg-white/5 rounded-md">
                                                <span className="flex items-center gap-3"><User size={14} />Назначить</span>
                                                <ChevronRight size={14} />
                                            </button>
                                        )}
                                         {isWidgetEditable && !isFolder && (
                                            <>
                                                {widget.parentId ? (
                                                    <button onClick={handleMoveToDashboard} className="w-full flex items-center gap-3 text-left px-3 py-1.5 text-sm hover:bg-white/5 rounded-md">
                                                        <ArrowLeft size={14} /> Переместить из папки
                                                    </button>
                                                ) : availableFolders.length > 0 && (
                                                    <button onClick={() => setMenuView('move')} className="w-full flex items-center justify-between text-left px-3 py-1.5 text-sm hover:bg-white/5 rounded-md">
                                                        <span className="flex items-center gap-3"><Folder size={14} /> Переместить в папку</span>
                                                        <ChevronRight size={14} />
                                                    </button>
                                                )}
                                            </>
                                        )}
                                        {isCommentable && (
                                            <button onClick={() => { onToggleCommentPane(widget.id); handleMenuClose(); }} className="w-full flex items-center gap-3 text-left px-3 py-1.5 text-sm hover:bg-white/5 rounded-md relative">
                                                <MessageSquare size={14} />Комментарии
                                                {hasUnreadComments && <div className="absolute top-1/2 right-2 -translate-y-1/2 w-2 h-2 bg-accent rounded-full"></div>}
                                            </button>
                                        )}
                                        <div className="h-px bg-white/10 my-1"></div>
                                        <button onClick={() => { onCopy(); handleMenuClose(); }} className="w-full flex items-center gap-3 text-left px-3 py-1.5 text-sm hover:bg-white/5 rounded-md"><Copy size={14} />Копировать</button>
                                        {isWidgetEditable && (
                                            <button onClick={() => { onRemove(); handleMenuClose(); }} className="w-full flex items-center gap-3 text-left px-3 py-1.5 text-sm text-red-400 hover:bg-red-500/10 rounded-md"><Trash2 size={14} />Удалить</button>
                                        )}
                                    </motion.div>
                                ) : menuView === 'assign' ? (
                                    <motion.div
                                        key="assign"
                                        initial={{ x: 10, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        exit={{ x: 10, opacity: 0 }}
                                        transition={{ duration: 0.15 }}
                                        className="p-2"
                                    >
                                        <button onClick={() => setMenuView('main')} className="w-full flex items-center gap-2 text-left px-2 py-1.5 text-xs text-text-secondary hover:text-text-light rounded-md mb-2">
                                            <ArrowLeft size={14} /> Назад
                                        </button>
                                        <div className="space-y-1 max-h-40 overflow-y-auto">
                                            <button onClick={() => handleAssignUser(null)} className="w-full flex items-center gap-3 text-left px-3 py-1.5 text-sm hover:bg-white/5 rounded-md">
                                                <UserX size={14} className="text-red-400" /> Снять назначение
                                            </button>
                                            {projectUsers.map(user => (
                                                <button key={user.uid} onClick={() => handleAssignUser(user.uid)} className="w-full flex items-center justify-between text-left px-3 py-1.5 text-sm hover:bg-white/5 rounded-md">
                                                    <span className="flex items-center gap-2">
                                                        <Avatar user={user} className="w-5 h-5" />
                                                        <span className="truncate">{user.displayName}</span>
                                                    </span>
                                                    {widget.assignedUser === user.uid && <Check size={14} className="text-accent" />}
                                                </button>
                                            ))}
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="move"
                                        initial={{ x: 10, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        exit={{ x: 10, opacity: 0 }}
                                        transition={{ duration: 0.15 }}
                                        className="p-2"
                                    >
                                        <button onClick={() => setMenuView('main')} className="w-full flex items-center gap-2 text-left px-2 py-1.5 text-xs text-text-secondary hover:text-text-light rounded-md mb-2">
                                            <ArrowLeft size={14} /> Назад
                                        </button>
                                        <div className="space-y-1 max-h-40 overflow-y-auto">
                                            {availableFolders.map(folder => (
                                                <button key={folder.id} onClick={() => handleMoveToFolder(folder.id)} className="w-full flex items-center gap-3 text-left px-3 py-1.5 text-sm hover:bg-white/5 rounded-md">
                                                    <Folder size={14} />
                                                    <span className="truncate">{folder.data.title}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                                </AnimatePresence>
                            </motion.div>
                        )}
                        </AnimatePresence>
                    </div>
                    {isWidgetEditable && (<GripVertical className="cursor-grab text-text-secondary/30" size={18} />)}
                </div>
            </div>
            <div className={`px-4 ${isFolder && folderData?.isCollapsed ? 'pb-0' : 'pb-4'} flex-grow overflow-hidden`}>
              <div ref={contentRef} className="w-full h-full">
                <WidgetSizeContext.Provider value={{ width, height }}>
                  {children}
                </WidgetSizeContext.Provider>
              </div>
            </div>
        </div>
    </div>
  );
};

export default React.memo(WidgetWrapper);