import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy, Firestore, Timestamp } from 'firebase/firestore';
import { Friend } from '../types';

export function useFriends(firestore: Firestore, currentUserId: string | null) {
    const [friends, setFriends] = useState<Friend[]>([]);
    const [loadingFriends, setLoadingFriends] = useState(true);
    const [friendsError, setFriendsError] = useState<string | null>(null);

    useEffect(() => {
        if (!currentUserId) {
            setFriends([]);
            setLoadingFriends(false);
            return;
        }

        setLoadingFriends(true);
        setFriendsError(null);

        // Using a Map is more robust for merging two real-time sources
        const friendsMap = new Map<string, Friend>();

        const processChanges = () => {
            const sortedList = Array.from(friendsMap.values()).sort(
                (a, b) => (b.createdAt as Timestamp).toMillis() - (a.createdAt as Timestamp).toMillis()
            );
            setFriends(sortedList);
            setLoadingFriends(false);
        };

        const q1 = query(
            collection(firestore, "friends"),
            where("participant1", "==", currentUserId),
            where("status", "==", "accepted")
        );

        const q2 = query(
            collection(firestore, "friends"),
            where("participant2", "==", currentUserId),
            where("status", "==", "accepted")
        );

        const unsubscribe1 = onSnapshot(q1, (snapshot) => {
            snapshot.docChanges().forEach(change => {
                const friendData = { id: change.doc.id, ...change.doc.data() } as Friend;
                if (change.type === "removed") {
                    friendsMap.delete(friendData.id);
                } else {
                    friendsMap.set(friendData.id, friendData);
                }
            });
            processChanges();
        }, (error) => {
            console.error("Ошибка при получении списка друзей (participant1):", error);
            setFriendsError(error.message);
            setLoadingFriends(false);
        });

        const unsubscribe2 = onSnapshot(q2, (snapshot) => {
            snapshot.docChanges().forEach(change => {
                const friendData = { id: change.doc.id, ...change.doc.data() } as Friend;
                if (change.type === "removed") {
                    friendsMap.delete(friendData.id);
                } else {
                    friendsMap.set(friendData.id, friendData);
                }
            });
            processChanges();
        }, (error) => {
            console.error("Ошибка при получении списка друзей (participant2):", error);
            setFriendsError(error.message);
            setLoadingFriends(false);
        });

        return () => {
            unsubscribe1();
            unsubscribe2();
        };
    }, [firestore, currentUserId]);

    return { friends, loadingFriends, friendsError };
}