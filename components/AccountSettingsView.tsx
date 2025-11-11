import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Upload, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import GlassButton from './GlassButton';
import Avatar from './Avatar';

const AccountSettingsView: React.FC = () => {
  const { user, updateUserProfile, changePassword } = useAuth();
  
  // Profile State
  const [name, setName] = useState(user?.displayName || '');
  const [profileMessage, setProfileMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.photoURL || null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });
  const [passwordMessage, setPasswordMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  

  // Sync local state if user context changes from outside
  useEffect(() => {
    if (user) {
        if (!avatarFile) {
            setName(user.displayName || '');
            setAvatarPreview(user.photoURL || null);
        }
    }
  }, [user, avatarFile]);
  
  // Clear messages after a few seconds
  useEffect(() => {
      if (profileMessage) {
          const timer = setTimeout(() => setProfileMessage(null), 3000);
          return () => clearTimeout(timer);
      }
  }, [profileMessage]);

  useEffect(() => {
      if (passwordMessage) {
          const timer = setTimeout(() => setPasswordMessage(null), 3000);
          return () => clearTimeout(timer);
      }
  }, [passwordMessage]);


  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setProfileMessage(null);
    const nameChanged = name.trim() !== "" && name.trim() !== user.displayName;
    const avatarChanged = !!avatarFile;

    if (!nameChanged && !avatarChanged) return;

    setIsUploading(true);
    try {
        await updateUserProfile({
            displayName: name.trim(),
            ...(avatarFile && { photoFile: avatarFile })
        });
        setAvatarFile(null); // Clear file after successful upload
        setProfileMessage({ type: 'success', text: 'Профиль сохранен!' });
    } catch (error: any) {
        setProfileMessage({ type: 'error', text: error.message || 'Ошибка обновления.' });
    } finally {
        setIsUploading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);

    if (newPassword !== confirmPassword) {
        setPasswordMessage({type: 'error', text: 'Новые пароли не совпадают.'});
        return;
    }

    setIsChangingPassword(true);
    try {
        await changePassword(currentPassword, newPassword);
        setPasswordMessage({type: 'success', text: 'Пароль успешно изменен!'});
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
    } catch (err: any) {
        setPasswordMessage({type: 'error', text: err.message || 'Ошибка смены пароля.'});
    } finally {
        setIsChangingPassword(false);
    }
  };
  
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          setAvatarFile(file);
          setAvatarPreview(URL.createObjectURL(file));
      }
  };

  const isProfileChanged = (name.trim() !== (user?.displayName || '')) || !!avatarFile;

  return (
    <div className="flex flex-col h-full">
        <div className="flex-grow overflow-y-auto pr-2 -mr-2">
            <form onSubmit={handleProfileSubmit}>
                <div className="flex items-center gap-4 mb-6">
                    <div className="relative group flex-shrink-0">
                       <Avatar user={{...user, photoURL: avatarPreview }} className="w-20 h-20" />
                       <button
                         type="button"
                         onClick={() => fileInputRef.current?.click()}
                         className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                       >
                         <Upload size={24} />
                       </button>
                       <input
                         type="file"
                         ref={fileInputRef}
                         onChange={handleAvatarChange}
                         accept="image/*"
                         className="hidden"
                       />
                    </div>
                    <div className="flex-grow min-w-0">
                        <label htmlFor="name" className="block text-sm font-medium mb-2">Имя</label>
                        <input
                            id="name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full p-3 bg-white/10 rounded-lg border-2 border-transparent focus:border-accent focus:outline-none transition-colors"
                        />
                    </div>
                </div>
                <div className="mb-6">
                    <label htmlFor="email" className="block text-sm font-medium mb-2">Email</label>
                    <input
                        id="email"
                        type="email"
                        value={user?.email || ''}
                        disabled
                        className="w-full p-3 bg-white/10 rounded-lg border-2 border-transparent focus:outline-none transition-colors opacity-60 cursor-not-allowed"
                    />
                </div>

                <div className="flex items-center justify-end gap-4 h-10">
                    <AnimatePresence>
                        {profileMessage && (
                            <motion.p
                                initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
                                className={`text-sm font-semibold ${profileMessage.type === 'success' ? 'text-green-400' : 'text-red-400'}`}
                            >
                                {profileMessage.text}
                            </motion.p>
                        )}
                    </AnimatePresence>
                    <GlassButton type="submit" disabled={isUploading || !isProfileChanged}>
                        {isUploading ? <Loader2 className="animate-spin" /> : "Сохранить"}
                    </GlassButton>
                </div>
            </form>

            <div className="my-6 border-t border-glass-border"></div>

              <h3 className="text-xl font-bold mb-4">Смена пароля</h3>
              <form onSubmit={handlePasswordSubmit}>
                  <div className="mb-4">
                      <label className="block text-sm font-medium mb-2">Текущий пароль</label>
                      <div className="relative">
                          <input
                              type={showPasswords.current ? 'text' : 'password'}
                              value={currentPassword}
                              onChange={e => setCurrentPassword(e.target.value)}
                              className="w-full p-3 bg-white/10 rounded-lg border-2 border-transparent focus:border-accent focus:outline-none transition-colors pr-10"
                              required
                          />
                           <button type="button" onClick={() => setShowPasswords(prev => ({...prev, current: !prev.current}))} className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-white">
                              {showPasswords.current ? <EyeOff size={20} /> : <Eye size={20} />}
                          </button>
                      </div>
                  </div>
                   <div className="mb-4">
                      <label className="block text-sm font-medium mb-2">Новый пароль</label>
                      <div className="relative">
                          <input
                              type={showPasswords.new ? 'text' : 'password'}
                              value={newPassword}
                              onChange={e => setNewPassword(e.target.value)}
                              className="w-full p-3 bg-white/10 rounded-lg border-2 border-transparent focus:border-accent focus:outline-none transition-colors pr-10"
                              required
                          />
                           <button type="button" onClick={() => setShowPasswords(prev => ({...prev, new: !prev.new}))} className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-white">
                              {showPasswords.new ? <EyeOff size={20} /> : <Eye size={20} />}
                          </button>
                      </div>
                  </div>
                   <div className="mb-6">
                      <label className="block text-sm font-medium mb-2">Подтвердите пароль</label>
                      <div className="relative">
                          <input
                              type={showPasswords.confirm ? 'text' : 'password'}
                              value={confirmPassword}
                              onChange={e => setConfirmPassword(e.target.value)}
                              className="w-full p-3 bg-white/10 rounded-lg border-2 border-transparent focus:border-accent focus:outline-none transition-colors pr-10"
                              required
                          />
                          <button type="button" onClick={() => setShowPasswords(prev => ({...prev, confirm: !prev.confirm}))} className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-white">
                              {showPasswords.confirm ? <EyeOff size={20} /> : <Eye size={20} />}
                          </button>
                      </div>
                  </div>

                  <div className="flex items-center justify-end gap-4 h-10">
                      <AnimatePresence>
                        {passwordMessage && (
                            <motion.p
                                initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
                                className={`text-sm font-semibold flex-grow text-left ${passwordMessage.type === 'success' ? 'text-green-400' : 'text-red-400'}`}
                            >
                                {passwordMessage.text}
                            </motion.p>
                        )}
                      </AnimatePresence>
                      <GlassButton type="submit" disabled={isChangingPassword}>
                          {isChangingPassword ? <Loader2 className="animate-spin" /> : "Сменить пароль"}
                      </GlassButton>
                  </div>
              </form>
          </div>
    </div>
  );
};

export default AccountSettingsView;