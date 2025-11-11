import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { User, Project } from '../types';
import { getRandomEmoji } from '../utils/emojis';
import { auth, db, storage } from '../firebase';
import { 
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    updateProfile,
    updatePassword,
    reauthenticateWithCredential,
    EmailAuthProvider
} from 'firebase/auth';
// FIX: Import `serverTimestamp` and `Timestamp` to correctly handle date fields.
import { doc, setDoc, getDoc, addDoc, collection, serverTimestamp, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";


interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password?: string, remember?: boolean) => Promise<void>;
  logout: () => void;
  register: (name: string, email: string, password?: string) => Promise<void>;
  updateUserProfile: (updates: { displayName?: string, photoFile?: File }) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
            const userDocRef = doc(db, "users", firebaseUser.uid);
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
                // FIX: Ensure the `id` from the document snapshot is included in the user object.
                setUser({ id: userDoc.id, uid: firebaseUser.uid, ...userDoc.data() } as User);
            } else {
                 // This might happen if Firestore doc creation failed after auth creation
                // FIX: Create a complete `User` object for the local state, including `id` and `createdAt`.
                const newUser: User = { 
                    id: firebaseUser.uid,
                    uid: firebaseUser.uid, 
                    displayName: firebaseUser.displayName || 'Пользователь', 
                    email: firebaseUser.email!,
                    photoURL: firebaseUser.photoURL || undefined,
                    createdAt: Timestamp.now(),
                };
                // FIX: Write a server-side timestamp to Firestore for consistency.
                await setDoc(userDocRef, { displayName: newUser.displayName, email: newUser.email, photoURL: newUser.photoURL, createdAt: serverTimestamp() });
                setUser(newUser);
            }
        } else {
            setUser(null);
        }
        setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password?: string) => {
    if (!password) throw new Error("Пароль не указан.");
    await signInWithEmailAndPassword(auth, email, password);
  };

  const register = async (name: string, email: string, password?: string) => {
    if (!password) throw new Error("Пароль не указан.");
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;
    
    await updateProfile(firebaseUser, { displayName: name });
    
    // FIX: Remove incorrect type annotation and add `createdAt` to ensure the object matches Firestore expectations.
    const newUser = { 
        displayName: name, 
        email,
        createdAt: serverTimestamp(),
    };
    await setDoc(doc(db, "users", firebaseUser.uid), newUser);
    
    // Create a default project for the new user in Firestore
    const newProject: Omit<Project, 'id'> = {
        name: 'Мой проект',
        emoji: getRandomEmoji(),
        isTeamProject: false,
        owner_uid: firebaseUser.uid,
        member_uids: {},
        participant_uids: [firebaseUser.uid],
        widgets: [],
        layouts: {},
    };
    await addDoc(collection(db, 'projects'), newProject);
  };

  const updateUserProfile = async (updates: { displayName?: string, photoFile?: File }) => {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error("Пользователь не авторизован.");

    const { displayName, photoFile } = updates;
    let photoURL: string | undefined = undefined;
    const userDocRef = doc(db, "users", currentUser.uid);
    const firestoreUpdates: { displayName?: string, photoURL?: string } = {};

    try {
        // 1. Upload photo if it exists
        if (photoFile) {
            const storageRef = ref(storage, `avatars/${currentUser.uid}`);
            await uploadBytes(storageRef, photoFile);
            photoURL = await getDownloadURL(storageRef);
        }
        
        // 2. Prepare updates for Auth and Firestore
        const authUpdates: { displayName?: string, photoURL?: string } = {};
        if (displayName && displayName !== currentUser.displayName) {
            authUpdates.displayName = displayName;
            firestoreUpdates.displayName = displayName;
        }
        if (photoURL && photoURL !== currentUser.photoURL) {
            authUpdates.photoURL = photoURL;
            firestoreUpdates.photoURL = photoURL;
        }
        
        // 3. Update Firebase Auth profile only if there are changes
        if (Object.keys(authUpdates).length > 0) {
            await updateProfile(currentUser, authUpdates);
        }
        
        // 4. Update Firestore user document only if there are changes
        if (Object.keys(firestoreUpdates).length > 0) {
            await setDoc(userDocRef, firestoreUpdates, { merge: true });
        }
        
        // 5. Update local state immediately for instant feedback
        if (Object.keys(firestoreUpdates).length > 0) {
            setUser(prev => prev ? { 
                ...prev, 
                ...firestoreUpdates
            } : null);
        }
    } catch(error) {
        console.error("Error updating profile:", error);
        throw new Error("Не удалось обновить профиль.");
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    if (!auth.currentUser || !auth.currentUser.email) {
        throw new Error("Пользователь не авторизован.");
    }
     if (newPassword.length < 6) {
        throw new Error("Новый пароль должен содержать не менее 6 символов.");
    }

    try {
        const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
        await reauthenticateWithCredential(auth.currentUser, credential);
        await updatePassword(auth.currentUser, newPassword);

    } catch (error: any) {
        console.error("Password change error:", error.code);
        if (error.code === 'auth/wrong-password') {
            throw new Error('Неверный текущий пароль.');
        }
        throw new Error('Произошла ошибка при смене пароля.');
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const value = {
    user,
    isAuthenticated: !!user,
    login,
    logout,
    register,
    updateUserProfile,
    changePassword
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
