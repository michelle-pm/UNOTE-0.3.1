import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { User, Project } from '../types';
import { getRandomEmoji } from '../utils/emojis';
import { auth, db, storage } from '../firebase';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import { doc, setDoc, getDoc, addDoc, collection, serverTimestamp, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";


interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password?: string, remember?: boolean) => Promise<void>;
  logout: () => void;
  register: (name: string, email: string, password?: string) => Promise<void>;
  updateUserProfile: (updates: { displayName?: string, photoFile?: File, photoURL?: string }) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithYandex: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
        if (firebaseUser) {
            const userDocRef = doc(db, "users", firebaseUser.uid);
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
                setUser({ id: userDoc.id, uid: firebaseUser.uid, ...userDoc.data() } as User);
            } else {
                const newUser: User = { 
                    id: firebaseUser.uid,
                    uid: firebaseUser.uid, 
                    displayName: firebaseUser.displayName || 'Пользователь', 
                    email: firebaseUser.email!,
                    photoURL: firebaseUser.photoURL || undefined,
                    createdAt: Timestamp.now(),
                };
                await setDoc(userDocRef, { displayName: newUser.displayName, email: newUser.email, photoURL: newUser.photoURL, createdAt: serverTimestamp() });
                setUser(newUser);
                
                // Create initial project for social login users if they are new
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
    await auth.signInWithEmailAndPassword(email, password);
  };

  const register = async (name: string, email: string, password?: string) => {
    if (!password) throw new Error("Пароль не указан.");
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    const firebaseUser = userCredential.user;
    
    if (firebaseUser) {
        await firebaseUser.updateProfile({ displayName: name });
        
        const newUser = { 
            displayName: name, 
            email,
            createdAt: serverTimestamp(),
        };
        await setDoc(doc(db, "users", firebaseUser.uid), newUser);
        
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
    }
  };
  
  const loginWithGoogle = async () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    await auth.signInWithPopup(provider);
  };

  const loginWithYandex = async () => {
    // Requires Yandex provider to be enabled in Firebase Console
    const provider = new firebase.auth.OAuthProvider('yandex.ru');
    await auth.signInWithPopup(provider);
  };

  const updateUserProfile = async (updates: { displayName?: string, photoFile?: File, photoURL?: string }) => {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error("Пользователь не авторизован.");

    const { displayName, photoFile, photoURL: directPhotoURL } = updates;
    let finalPhotoURL: string | undefined = directPhotoURL;
    const userDocRef = doc(db, "users", currentUser.uid);
    const firestoreUpdates: { displayName?: string, photoURL?: string } = {};

    try {
        if (photoFile) {
            const storageRef = ref(storage, `avatars/${currentUser.uid}`);
            await uploadBytes(storageRef, photoFile);
            finalPhotoURL = await getDownloadURL(storageRef);
        }
        
        const authUpdates: { displayName?: string, photoURL?: string } = {};
        if (displayName && displayName !== currentUser.displayName) {
            authUpdates.displayName = displayName;
            firestoreUpdates.displayName = displayName;
        }
        if (finalPhotoURL && finalPhotoURL !== currentUser.photoURL) {
            authUpdates.photoURL = finalPhotoURL;
            firestoreUpdates.photoURL = finalPhotoURL;
        }
        
        if (Object.keys(authUpdates).length > 0) {
            await currentUser.updateProfile(authUpdates);
        }
        
        if (Object.keys(firestoreUpdates).length > 0) {
            await setDoc(userDocRef, firestoreUpdates, { merge: true });
        }
        
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
        const credential = firebase.auth.EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
        await auth.currentUser.reauthenticateWithCredential(credential);
        await auth.currentUser.updatePassword(newPassword);

    } catch (error: any) {
        console.error("Password change error:", error.code);
        if (error.code === 'auth/wrong-password') {
            throw new Error('Неверный текущий пароль.');
        }
        throw new Error('Произошла ошибка при смене пароля.');
    }
  };

  const logout = async () => {
    await auth.signOut();
  };

  const value = {
    user,
    isAuthenticated: !!user,
    login,
    logout,
    register,
    updateUserProfile,
    changePassword,
    loginWithGoogle,
    loginWithYandex
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