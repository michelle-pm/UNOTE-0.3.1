import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader2, AlertTriangle } from 'lucide-react';
import { db } from '../../firebase';
import { collection, query, onSnapshot, orderBy, serverTimestamp, doc, writeBatch } from 'firebase/firestore';
import { User, Message as MessageType } from '../../types';
import Message from './Message';
import Avatar from '../Avatar';

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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const chatId = getChatId(currentUser.uid, chatPartner.uid);

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
      // Игнорируем ошибку permission-denied, так как она означает, 
      // что чат еще не создан (документ отсутствует), и мы создадим его при отправке первого сообщения.
      if (error.code === 'permission-denied') {
        console.log("Chat not created yet (permission denied for missing doc), ready to create.");
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

  useEffect(() => {
    // Scroll to bottom on new messages
    if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]); // Add isLoading to scroll after initial load

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === '' || isSending) return;

    setIsSending(true);
    setSendError(null);
    const textToSend = newMessage.trim();
    setNewMessage(''); // Optimistic clear

    try {
      const batch = writeBatch(db);
      
      const chatDocRef = doc(db, 'chats', chatId);
      
      // ВАЖНО: Мы всегда делаем merge для документа чата.
      // Если его нет, он создастся с массивом participants.
      // Это даст права доступа для чтения сообщений сразу после создания.
      batch.set(chatDocRef, {
        participants: [currentUser.uid, chatPartner.uid],
        lastMessageText: textToSend,
        lastMessageTimestamp: serverTimestamp(),
      }, { merge: true });

      const messageDocRef = doc(collection(db, 'chats', chatId, 'messages'));
      batch.set(messageDocRef, {
        senderId: currentUser.uid,
        text: textToSend,
        createdAt: serverTimestamp(),
      });
      
      await batch.commit();
      
    } catch (error: any) {
      console.error("Error sending message:", error);
      setNewMessage(textToSend); // Revert optimistic clear
      if (error.code === 'permission-denied') {
        setSendError("Ошибка прав доступа. Попробуйте обновить страницу.");
      } else {
        setSendError("Не удалось отправить сообщение.");
      }
    } finally {
      setIsSending(false);
    }
  };
  
  return (
    <div className="flex flex-col h-full bg-black/10">
      <div className="flex items-center p-4 border-b border-glass-border flex-shrink-0">
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
                {messages.map((msg) => (
                    <Message
                    key={msg.id}
                    message={msg}
                    isOwnMessage={msg.senderId === currentUser.uid}
                    />
                ))}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className="p-4 border-t border-glass-border flex-shrink-0 bg-black/10">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Напишите сообщение..."
            className="flex-grow w-full p-3 bg-white/5 rounded-lg border-2 border-transparent focus:border-accent focus:outline-none transition-colors disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isSending || !newMessage.trim()}
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
    </div>
  );
};

export default ChatView;