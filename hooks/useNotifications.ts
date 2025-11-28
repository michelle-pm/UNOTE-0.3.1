import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, orderBy, DocumentData } from 'firebase/firestore';
import { db } from '../firebase';
import { User, Chat } from '../types';
import { useToast } from '../contexts/ToastContext';

export function useNotifications(user: User | null) {
  const { addToast } = useToast();
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  const [chats, setChats] = useState<DocumentData[]>([]);

  // 1. Listen for Friend Requests
  useEffect(() => {
    if (!user) return;

    const qRequests = query(
      collection(db, 'friend_requests'),
      where('to', '==', user.uid),
      where('status', '==', 'pending')
    );

    const unsubscribeRequests = onSnapshot(qRequests, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const data = change.doc.data();
          if (!snapshot.metadata.fromCache) {
             addToast(`Пользователь ${data.fromName || 'Неизвестный'} хочет добавить вас в друзья.`, 'info', 'Новая заявка в друзья');
          }
        }
      });
    }, (error) => {
        console.error("Notifications (Requests) Error:", error);
    });

    return () => unsubscribeRequests();
  }, [user, addToast]);

  // 2. Listen for Chats & Check Read Status
  useEffect(() => {
    if (!user) return;

    const qChats = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', user.uid),
      orderBy('lastMessageTimestamp', 'desc')
    );
    
    let isInitialLoad = true;

    const unsubscribeChats = onSnapshot(qChats, (snapshot) => {
      const currentChats = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Chat[];
      setChats(currentChats);

      snapshot.docChanges().forEach((change) => {
        const data = change.doc.data() as Chat;
        if (change.type === 'modified' && !isInitialLoad) {
            // If the last message wasn't sent by me, notify
            if (data.lastSenderId && data.lastSenderId !== user.uid) {
                // If the message is NEWER than my read time, notify
                const msgTime = data.lastMessageTimestamp?.toMillis() || 0;
                const readTime = data.readStatus?.[user.uid]?.toMillis() || 0;
                
                if (msgTime > readTime) {
                     addToast(data.lastMessageText || 'Новое сообщение', 'message', 'Новое сообщение');
                }
            }
        }
      });
      
      isInitialLoad = false;
    }, (error) => {
        if (error.code === 'failed-precondition') {
            console.warn("Firestore Index Required for Notifications. Check console link to create index.");
        } else {
            console.error("Notifications (Chats) Error:", error);
        }
    });

    return () => unsubscribeChats();
  }, [user, addToast]);

  // 3. Calculate Unread Status based on Firestore readStatus
  useEffect(() => {
      if (!user) {
          setHasUnreadMessages(false);
          return;
      }

      const hasUnread = chats.some(chat => {
          // If I sent the last message, it is conceptually "read" by me (or I don't need a dot).
          if (chat.lastSenderId === user.uid) return false;
          
          const lastMsgTime = chat.lastMessageTimestamp?.toMillis() || 0;
          // Get my read timestamp from the map
          const myReadTime = chat.readStatus?.[user.uid]?.toMillis() || 0;
          
          // It is unread if the message time is strictly greater than my read time
          return lastMsgTime > myReadTime;
      });

      setHasUnreadMessages(hasUnread);
  }, [chats, user]);

  return { hasUnreadMessages };
}