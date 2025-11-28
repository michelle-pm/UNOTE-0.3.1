import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader2, AlertTriangle, Paperclip, X, File as FileIcon } from 'lucide-react';
import { db } from '../../firebase';
import { collection, query, onSnapshot, orderBy, serverTimestamp, doc, writeBatch, deleteDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { User, Message as MessageType, Chat } from '../../types';
import Message from './Message';
import Avatar from '../Avatar';
import { uploadToCloudinary } from '../../utils/cloudinary';
import ImageViewer from '../ImageViewer';
import { useToast } from '../../contexts/ToastContext';

interface ChatViewProps {
  currentUser: User;
  chatPartner: User;
}

const getChatId = (uid1: string, uid2: string): string => {
  return [uid1, uid2].sort().join('_');
};

const ChatView: React.FC<ChatViewProps> = ({ currentUser, chatPartner }) => {
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  // Read Receipts
  const [partnerLastRead, setPartnerLastRead] = useState<Timestamp | null>(null);

  const { addToast } = useToast();
  
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const chatId = getChatId(currentUser.uid, chatPartner.uid);

  // 1. Fetch Messages
  useEffect(() => {
    setIsLoading(true);
    setFetchError(null);
    const messagesQuery = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const fetchedMessages: MessageType[] = [];
      snapshot.forEach((doc) => {
        fetchedMessages.push({ id: doc.id, ...doc.data() } as MessageType);
      });
      setMessages(fetchedMessages);
      setFetchError(null);
      setIsLoading(false);
    }, (error) => {
      if (error.code === 'permission-denied') {
        setMessages([]);
        setFetchError(null);
      } else {
        console.error("Error fetching messages:", error);
        setFetchError("Не удалось загрузить сообщения.");
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [chatId]);

  // 2. Fetch Chat Metadata (Read Status) & Mark as Read logic
  useEffect(() => {
      const chatDocRef = doc(db, 'chats', chatId);
      
      const unsubscribe = onSnapshot(chatDocRef, (docSnap) => {
          if (docSnap.exists()) {
              const data = docSnap.data() as Chat;
              // Get partner's read timestamp
              if (data.readStatus && data.readStatus[chatPartner.uid]) {
                  setPartnerLastRead(data.readStatus[chatPartner.uid]);
              }
          }
      });

      return () => unsubscribe();
  }, [chatId, chatPartner.uid]);

  // Function to update MY read status
  const markAsRead = async () => {
      try {
          // Only update if we have messages
          if (messages.length === 0) return;
          
          await updateDoc(doc(db, 'chats', chatId), {
              [`readStatus.${currentUser.uid}`]: serverTimestamp()
          });
      } catch (err: any) {
          // Ignore errors if doc doesn't exist yet or permission issues on initial load
          console.log("Could not mark as read", err);
      }
  };

  // Trigger markAsRead when messages change
  useEffect(() => {
      if (!isLoading && messages.length > 0) {
          markAsRead();
      }
  }, [messages.length, isLoading, chatId]);


  useEffect(() => {
    if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        setAttachedFile(e.target.files[0]);
    }
  };

  const handleRemoveFile = () => {
      setAttachedFile(null);
      if (fileInputRef.current) {
          fileInputRef.current.value = '';
      }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((newMessage.trim() === '' && !attachedFile) || isSending) return;

    setIsSending(true);
    setSendError(null);
    const textToSend = newMessage.trim();
    
    try {
      let uploadedFileData = undefined;

      if (attachedFile) {
          const uploadResult = await uploadToCloudinary(attachedFile);
          uploadedFileData = {
              url: uploadResult.url,
              name: uploadResult.name,
              type: uploadResult.type || attachedFile.type
          };
      }

      setNewMessage('');
      setAttachedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

      const batch = writeBatch(db);
      const chatDocRef = doc(db, 'chats', chatId);
      
      // Update chat meta + Set my read status to now
      batch.set(chatDocRef, {
        participants: [currentUser.uid, chatPartner.uid],
        lastMessageText: attachedFile ? (textToSend ? `📎 ${textToSend}` : '📎 Файл') : textToSend,
        lastMessageTimestamp: serverTimestamp(),
        lastSenderId: currentUser.uid, 
        [`readStatus.${currentUser.uid}`]: serverTimestamp() // I read my own message implicitly
      }, { merge: true });

      const messageDocRef = doc(collection(db, 'chats', chatId, 'messages'));
      const messageData: any = {
        senderId: currentUser.uid,
        text: textToSend,
        createdAt: serverTimestamp(),
      };

      if (uploadedFileData) {
          messageData.file = uploadedFileData;
      }

      batch.set(messageDocRef, messageData);
      await batch.commit();
      
    } catch (error: any) {
      console.error("Error sending message:", error);
      if (error.code === 'permission-denied') {
        setSendError("Ошибка прав доступа.");
      } else {
        setSendError("Не удалось отправить сообщение.");
      }
      setNewMessage(textToSend);
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
      if (window.confirm("Удалить сообщение?")) {
          try {
              await deleteDoc(doc(db, 'chats', chatId, 'messages', messageId));
          } catch (err: any) {
              if (err.code === 'permission-denied') {
                  addToast("Ошибка: Нет прав на удаление.", "error");
              } else {
                  addToast("Не удалось удалить сообщение.", "error");
              }
          }
      }
  };

  const handleEditMessage = async (messageId: string, newText: string) => {
      try {
          await updateDoc(doc(db, 'chats', chatId, 'messages', messageId), {
              text: newText,
              editedAt: serverTimestamp()
          });
      } catch (err: any) {
          if (err.code === 'permission-denied') {
              addToast("Ошибка: Нет прав на редактирование.", "error");
          } else {
              addToast("Не удалось изменить сообщение.", "error");
          }
      }
  };
  
  return (
    <div className="flex flex-col h-full bg-black/10 relative">
      <div className="flex items-center p-4 border-b border-glass-border flex-shrink-0 bg-white/5 backdrop-blur-sm">
        <Avatar user={chatPartner} className="w-10 h-10" />
        <div className="ml-3">
          <h3 className="font-bold">{chatPartner.displayName}</h3>
          <p className="text-xs text-text-secondary">{chatPartner.email}</p>
        </div>
      </div>

      <div className="flex-grow p-4 overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <Loader2 size={24} className="animate-spin text-text-secondary" />
          </div>
        ) : fetchError ? (
           <div className="flex flex-col justify-center items-center h-full text-center text-text-secondary opacity-70">
                <AlertTriangle size={32} className="mb-2" />
                <p className="font-semibold">{fetchError}</p>
            </div>
        ) : (
          <div className="space-y-4 flex flex-col justify-end min-h-0">
             {messages.length === 0 && (
                <div className="text-center text-text-secondary text-sm py-10 opacity-50">
                    Нет сообщений. Напишите первое!
                </div>
             )}
            <AnimatePresence initial={false}>
                {messages.map((msg) => {
                    const isOwn = msg.senderId === currentUser.uid;
                    // Determine if read by partner
                    let isRead = false;
                    if (isOwn && partnerLastRead && msg.createdAt) {
                        // Compare timestamps. If msg time <= partner read time, it's read.
                        // Handle potential null/pending timestamps from optimistic writes
                        const msgTime = msg.createdAt.toMillis ? msg.createdAt.toMillis() : Date.now();
                        const readTime = partnerLastRead.toMillis();
                        isRead = msgTime <= readTime;
                    }

                    return (
                        <Message
                            key={msg.id}
                            message={msg}
                            isOwnMessage={isOwn}
                            onImageClick={setSelectedImage}
                            onDelete={handleDeleteMessage}
                            onEdit={handleEditMessage}
                            isRead={isRead}
                        />
                    );
                })}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className="p-4 border-t border-glass-border flex-shrink-0 bg-white/5 backdrop-blur-md">
        {attachedFile && (
            <div className="flex items-center gap-2 mb-2 p-2 bg-white/10 rounded-lg max-w-fit">
                <FileIcon size={16} className="text-accent" />
                <span className="text-xs truncate max-w-[200px]">{attachedFile.name}</span>
                <button onClick={handleRemoveFile} className="p-1 hover:text-red-400">
                    <X size={14} />
                </button>
            </div>
        )}
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
           <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
           />
           <button
             type="button"
             onClick={() => fileInputRef.current?.click()}
             className="p-3 text-text-secondary hover:text-accent hover:bg-white/5 rounded-lg transition-colors"
           >
             <Paperclip size={20} />
           </button>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Напишите сообщение..."
            className="flex-grow w-full p-3 bg-white/5 rounded-lg border-2 border-transparent focus:border-accent focus:outline-none transition-colors disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isSending || (newMessage.trim() === '' && !attachedFile)}
            className="p-3 bg-accent/80 hover:bg-accent text-accent-text rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-12 h-12 flex items-center justify-center flex-shrink-0"
          >
            {isSending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </form>
         <AnimatePresence>
            {sendError && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-red-400 text-xs text-center pt-2">
                    {sendError}
                </motion.p>
            )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {selectedImage && (
            <ImageViewer src={selectedImage} onClose={() => setSelectedImage(null)} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatView;