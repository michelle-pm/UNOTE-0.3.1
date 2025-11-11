import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, UserPlus, Crown, ChevronDown } from 'lucide-react';
import { Project, ProjectMemberRole, User } from '../types';
import GlassButton from './GlassButton';
import Avatar from './Avatar';

interface ManageAccessModalProps {
  project: Project;
  projectUsers: User[];
  onClose: () => void;
  onInviteUser: (email: string, role: ProjectMemberRole) => Promise<void>;
  onRemoveUser: (uid: string) => Promise<void>;
  onChangeUserRole: (uid: string, role: ProjectMemberRole) => Promise<void>;
}

const ManageAccessModal: React.FC<ManageAccessModalProps> = ({ 
    project, projectUsers, onClose, onInviteUser, onRemoveUser, onChangeUserRole 
}) => {
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<ProjectMemberRole>('visitor');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const owner = projectUsers.find(u => u.uid === project.owner_uid);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
        await onInviteUser(inviteEmail, inviteRole);
        setSuccess(`Пользователь ${inviteEmail} приглашен.`);
        setInviteEmail('');
    } catch (err: any) {
        setError(err.message);
    }
  };

  const handleRemove = async (uid: string) => {
    if (window.confirm("Вы уверены, что хотите удалить этого пользователя из проекта?")) {
        await onRemoveUser(uid);
    }
  };

  const members = projectUsers.filter(u => u.uid !== project.owner_uid);

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 50, scale: 0.9 }}
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg"
      >
        <div className="bg-black/20 backdrop-blur-2xl rounded-3xl shadow-2xl border border-glass-border text-text-light">
          <div className="flex justify-between items-center p-6 border-b border-glass-border">
            <div>
                <h2 className="text-2xl font-bold">Управление доступом "{project.name}"</h2>
                <p className="text-sm text-text-secondary">Приглашайте, удаляйте и меняйте роли</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10">
              <X size={24} />
            </button>
          </div>
          
          <div className="p-6">
            <form onSubmit={handleInvite} className="flex items-center gap-2 mb-6">
              <input
                type="email"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                placeholder="Email пользователя"
                className="flex-grow w-full p-3 bg-white/5 rounded-lg border-2 border-transparent focus:border-accent focus:outline-none transition-colors"
                required
              />
              <div className="relative">
                  <select value={inviteRole} onChange={e => setInviteRole(e.target.value as ProjectMemberRole)} className="appearance-none w-full p-3 bg-white/5 rounded-lg border-2 border-transparent focus:border-accent focus:outline-none transition-colors pr-8">
                      <option value="visitor">Посетитель</option>
                      <option value="manager">Менеджер</option>
                      <option value="editor">Редактор</option>
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
              <GlassButton type="submit" className="p-3">
                <UserPlus size={18} />
              </GlassButton>
            </form>

            {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
            {success && <p className="text-green-500 text-sm mb-4 text-center">{success}</p>}

            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
              {/* Owner */}
              {owner && (
                  <div className="flex items-center justify-between p-2 rounded-md">
                      <div className="flex items-center gap-3">
                          <Avatar user={owner} className="w-10 h-10" />
                          <div>
                              <p className="font-semibold">{owner.displayName}</p>
                              <p className="text-xs text-text-secondary">{owner.email}</p>
                          </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm font-semibold text-text-secondary">
                        <Crown size={16} className="text-accent" />
                        <span>Владелец</span>
                      </div>
                  </div>
              )}

              {/* Members */}
              {members.map((user) => (
                <div key={user.uid} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5">
                  <div className="flex items-center gap-3">
                      <Avatar user={user} className="w-10 h-10" />
                      <div>
                          <p className="font-semibold">{user.displayName}</p>
                          <p className="text-xs text-text-secondary">{user.email}</p>
                      </div>
                  </div>
                  <div className="flex items-center gap-2">
                      <div className="relative">
                          <select value={project.member_uids[user.uid]} onChange={e => onChangeUserRole(user.uid, e.target.value as ProjectMemberRole)} className="appearance-none text-sm p-2 bg-white/10 rounded-lg border-2 border-transparent focus:border-accent focus:outline-none transition-colors pr-8">
                              <option value="visitor">Посетитель</option>
                              <option value="manager">Менеджер</option>
                              <option value="editor">Редактор</option>
                          </select>
                          <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                      <button onClick={() => handleRemove(user.uid)} className="p-2 text-red-500/80 hover:text-red-500 rounded-full hover:bg-red-500/10">
                          <X size={16} />
                      </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default ManageAccessModal;
