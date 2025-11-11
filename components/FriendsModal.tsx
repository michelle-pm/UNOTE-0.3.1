import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserPlus, UserX, Check, MailQuestion, Search, Loader2 } from 'lucide-react';
import { db } from '../firebase';
import { collection, query, where, getDocs, doc, runTransaction, serverTimestamp, addDoc, updateDoc, writeBatch, getDoc, deleteDoc } from 'firebase/firestore';
import { User, FriendRequest } from '../types';
import GlassButton from './GlassButton';
import Avatar from './Avatar';

interface FriendsModalProps {
  user: User;
  friends: User[];
  loadingFriends: boolean;
  friendsError: string | null;
  requests: FriendRequest[];
  loadingRequests: boolean;
  requestsError: string | null;
  onClose: () => void;
  onAcceptRequest: (request: FriendRequest) => Promise<void>;
  isAcceptingRequest: Record<string, boolean>;
  acceptRequestError: string | null;
  acceptRequestSuccess: string | null;
}

const FriendsModal: React.FC<FriendsModalProps> = ({
  user, friends, loadingFriends, friendsError, requests, loadingRequests, requestsError,
  onClose, onAcceptRequest, isAcceptingRequest, acceptRequestError, acceptRequestSuccess
}) => {
  const [searchEmail, setSearchEmail] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<User | 'not_found' | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');


  const handleSearchUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailToSearch = searchEmail.trim().toLowerCase();
    if (!emailToSearch) return;

    setIsSearching(true);
    setSearchResult(null);
    setError('');

    try {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("email", "==", emailToSearch));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            setSearchResult('not_found');
        } else {
            const userDoc = querySnapshot.docs[0];
            const foundUser = { uid: userDoc.id, ...userDoc.data() } as User;
            setSearchResult(foundUser);
        }
    } catch (err) {
        console.error("Error searching user:", err);
        setError("Произошла ошибка при поиске.");
        setSearchResult(null);
    } finally {
        setIsSearching(false);
    }
  };
  
  const handleSendRequest = async (friend: User) => {
    setError('');
    setSuccess('');

    if (!user.displayName || !user.email || user.displayName.trim() === '') {
      return setError("Информация о вашем профиле неполная.");
    }
    if (friend.uid === user.uid) {
        return setError("Вы не можете добавить себя в друзья.");
    }
    
    try {
      const requestsRef = collection(db, "friend_requests");
      await addDoc(requestsRef, {
        from: user.uid,
        fromName: user.displayName,
        fromEmail: user.email,
        to: friend.uid,
        status: 'pending',
        createdAt: serverTimestamp(),
      });

      setSuccess(`Запрос отправлен пользователю ${friend.email}.`);
      setSearchResult(null);
      setSearchEmail('');
    } catch (err: any) {
      console.error("Error sending request:", err);
      if (err.code === 'permission-denied') {
          setError("Ошибка прав доступа. Не удалось отправить запрос.");
      } else {
          setError("Произошла ошибка при отправке запроса.");
      }
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    try {
      const requestRef = doc(db, "friend_requests", requestId);
      await deleteDoc(requestRef);
    } catch(err) { console.error("Error declining request: ", err); setError("Не удалось отклонить запрос."); }
  };

  const handleRemoveFriend = async (friendId: string) => {
    setError('');
    setSuccess('');
    try {
        const currentUserId = user.uid;
        
        const batch = writeBatch(db);

        // Find and schedule deletion of friendship documents
        const q1 = query(collection(db, "friends"), where("participant1", "==", currentUserId), where("participant2", "==", friendId));
        const q2 = query(collection(db, "friends"), where("participant1", "==", friendId), where("participant2", "==", currentUserId));

        const [snapshot1, snapshot2] = await Promise.all([getDocs(q1), getDocs(q2)]);
        
        snapshot1.forEach(doc => batch.delete(doc.ref));
        snapshot2.forEach(doc => batch.delete(doc.ref));

        await batch.commit();

        setSuccess("Друг удален.");
    } catch (err: any) {
        console.error("Error removing friend:", err);
        setError(err.message || "Произошла ошибка при удалении друга.");
    }
  }

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-40" />
      <motion.div
        key="friends-modal" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="fixed top-4 right-4 w-[360px] bottom-4 origin-top-right bg-black/20 backdrop-blur-2xl z-50 flex flex-col border border-glass-border rounded-3xl text-text-light"
      >
        <div className="flex justify-between items-center flex-shrink-0 p-4 border-b border-glass-border">
          <h2 className="text-xl font-bold">Друзья</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10"><X size={20} /></button>
        </div>

        <div className="flex flex-col flex-grow p-4 min-h-0">
          <form onSubmit={handleSearchUser} className="flex items-center gap-2 mb-2 flex-shrink-0">
            <input type="email" value={searchEmail} onChange={e => setSearchEmail(e.target.value)} placeholder="Поиск по email"
              className="flex-grow w-full p-3 bg-white/5 rounded-lg border-2 border-transparent focus:border-accent focus:outline-none transition-colors" required />
            <GlassButton type="submit" className="p-3 flex-shrink-0 w-[52px]">
              {isSearching ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
            </GlassButton>
          </form>

          <div className="h-20 mb-2 flex-shrink-0">
              {error && <p className="text-red-500 text-sm text-center pt-1">{error}</p>}
              {success && <p className="text-green-500 text-sm text-center pt-1">{success}</p>}
              <AnimatePresence>
              {searchResult && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="p-2 rounded-lg bg-white/5 mt-2">
                  {searchResult === 'not_found' ? (
                      <p className="text-center text-sm text-text-secondary">Пользователь не найден.</p>
                  ) : (
                      <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 overflow-hidden">
                              <Avatar user={searchResult} className="w-9 h-9 flex-shrink-0" />
                              <div className="overflow-hidden">
                                  <p className="font-semibold truncate text-sm">{searchResult.displayName || searchResult.email}</p>
                                  {searchResult.displayName && <p className="text-xs text-text-secondary truncate">{searchResult.email}</p>}
                              </div>
                          </div>
                          <GlassButton onClick={() => handleSendRequest(searchResult)} className="px-3 py-1.5 text-sm"><UserPlus size={16}/></GlassButton>
                      </div>
                  )}
                  </motion.div>
              )}
              </AnimatePresence>
          </div>

          <div className="flex-grow overflow-y-auto pr-2 -mr-2 space-y-4">
              {/* Friend Requests Section */}
              {loadingRequests && (
                <div className="flex justify-center items-center p-4">
                    <Loader2 size={24} className="animate-spin text-text-secondary" />
                </div>
              )}
              {requestsError && (
                <p className="text-red-500 text-sm text-center p-2">{requestsError}</p>
              )}
              {!loadingRequests && !requestsError && requests.length > 0 && (
                <div>
                  <h3 className="font-semibold text-sm text-text-secondary px-2 mb-2">Запросы в друзья ({requests.length})</h3>
                  <div className="bg-white/5 rounded-lg p-2 space-y-1">
                    {requests.map(req => (
                      <div key={req.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/10 transition-colors">
                        <div className="flex items-center gap-3 overflow-hidden">
                           <Avatar user={{ displayName: req.fromName }} className="w-9 h-9 flex-shrink-0" />
                           <div className="overflow-hidden">
                                <p className="font-semibold truncate text-sm">{req.fromName || req.fromEmail}</p>
                                {req.fromName && <p className="text-xs text-text-secondary truncate">{req.fromEmail}</p>}
                            </div>
                        </div>
                        <div className="flex items-center flex-shrink-0">
                          <button onClick={() => onAcceptRequest(req)} disabled={isAcceptingRequest[req.id]} className="p-2 text-green-400 hover:text-green-300 rounded-full hover:bg-green-500/10 disabled:opacity-50">
                            {isAcceptingRequest[req.id] ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                          </button>
                          <button onClick={() => handleDeclineRequest(req.id)} className="p-2 text-red-500/80 hover:text-red-500 rounded-full hover:bg-red-500/10"><X size={18} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Friends List Section */}
              {loadingFriends && (
                  <div className="flex justify-center items-center p-4">
                      <Loader2 size={24} className="animate-spin text-text-secondary" />
                  </div>
              )}
              {friendsError && (
                  <p className="text-red-500 text-sm text-center p-2">{friendsError}</p>
              )}
              {!loadingFriends && !friendsError && friends.length > 0 && (
                  <div>
                      <h3 className="font-semibold text-sm text-text-secondary px-2 mb-2">Друзья ({friends.length})</h3>
                      <div className="bg-white/5 rounded-lg p-2 space-y-1">
                          {friends.map(friend => (
                            <div key={friend.uid} className="group flex items-center justify-between p-2 rounded-lg hover:bg-white/10 transition-colors">
                              <div className="flex items-center gap-3 overflow-hidden">
                                <Avatar user={friend} className="w-9 h-9 flex-shrink-0" />
                                <div className="overflow-hidden">
                                    <p className="font-semibold truncate text-sm">{friend.displayName || friend.email}</p>
                                    {friend.displayName && <p className="text-xs text-text-secondary truncate">{friend.email}</p>}
                                </div>
                              </div>
                              <div className="flex items-center flex-shrink-0">
                                  <button onClick={() => handleRemoveFriend(friend.uid)} className="p-2 text-red-500/80 hover:text-red-500 rounded-full hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"><UserX size={18} /></button>
                              </div>
                            </div>
                          ))}
                      </div>
                  </div>
              )}
              
              {!loadingFriends && !loadingRequests && friends.length === 0 && requests.length === 0 && !searchResult && (
                  <div className="flex flex-col items-center justify-center h-full text-center text-text-secondary">
                     <MailQuestion size={48} className="mb-4 text-text-secondary/50"/>
                     <p className="font-semibold">У вас пока нет друзей.</p>
                     <p className="text-xs mt-1">Ищите друзей по email, чтобы начать общаться.</p>
                  </div>
              )}
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default FriendsModal;
