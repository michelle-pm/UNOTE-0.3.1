import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy, Firestore } from 'firebase/firestore';
import { FriendRequest } from '../types';

export function useFriendRequests(firestore: Firestore, currentUserId: string | null) {
    const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
    const [loadingRequests, setLoadingRequests] = useState(true);
    const [requestsError, setRequestsError] = useState<string | null>(null);

    useEffect(() => {
        if (!currentUserId) {
            setFriendRequests([]);
            setLoadingRequests(false);
            return;
        }

        setLoadingRequests(true);
        setRequestsError(null);

        const q = query(
            collection(firestore, "friend_requests"),
            where("to", "==", currentUserId),
            where("status", "==", "pending"),
            orderBy("createdAt", "desc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const requestsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as FriendRequest[];
            setFriendRequests(requestsData);
            setLoadingRequests(false);
        }, (error) => {
            console.error("Ошибка при получении заявок в друзья:", error);
            setRequestsError(error.message);
            setLoadingRequests(false);
        });

        return () => unsubscribe();
    }, [firestore, currentUserId]);

    return { friendRequests, loadingRequests, requestsError };
}