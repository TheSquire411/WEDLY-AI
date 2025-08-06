
"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { 
    onAuthStateChanged, 
    signOut, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    GoogleAuthProvider, 
    signInWithPopup,
    sendPasswordResetEmail,
    updateProfile,
    type User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, getDoc, onSnapshot, writeBatch } from 'firebase/firestore';

export interface UserData {
    uid: string;
    email: string | null;
    name1: string;
    name2: string;
    photoURL?: string | null;
    premium?: boolean;
    isAdmin?: boolean;
}

interface UserContextType {
  user: UserData | null;
  loading: boolean;
  getIdToken: () => Promise<string | null>;
  signOutUser: () => Promise<void>;
  signUp: (email:string, password:string, name1:string, name2:string) => Promise<any>;
  signInWithEmail: (email:string, password:string) => Promise<any>;
  signInWithGoogle: () => Promise<any>;
  resetPassword: (email: string) => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const initializeNewUserData = async (uid: string, userData: Omit<UserData, 'uid' | 'email' | 'isAdmin'>) => {
    const batch = writeBatch(db);
    
    const userDocRef = doc(db, 'users', uid);
    batch.set(userDocRef, userData);

    const budgetSummaryRef = doc(db, 'users', uid, 'budget', 'summary');
    batch.set(budgetSummaryRef, { total: 20000, spent: 0 });

    await batch.commit();
}


export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
            try {
                if (firebaseUser) {
                    const userDocRef = doc(db, 'users', firebaseUser.uid);
                    
                    const unsubscribeDoc = onSnapshot(userDocRef, (userDoc) => {
                        if (userDoc.exists()) {
                            const userData = { ...userDoc.data(), uid: firebaseUser.uid, email: firebaseUser.email } as UserData;
                            
                            // Check for Admin override
                            if (process.env.NEXT_PUBLIC_ADMIN_EMAIL && userData.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
                                userData.premium = true;
                                userData.isAdmin = true;
                            }
                            
                            setUser(userData);
                        }
                        setLoading(false);
                    });
                    
                    return () => unsubscribeDoc();

                } else {
                    setUser(null);
                    setLoading(false);
                }
            } catch (error) {
                console.error("Error during auth state change: ", error);
                setUser(null);
                setLoading(false);
            }
        });

        return () => unsubscribeAuth();
    }, []);

    const getIdToken = async (): Promise<string | null> => {
        if (!auth.currentUser) return null;
        return await auth.currentUser.getIdToken(true);
    };

    const signOutUser = async () => {
        await signOut(auth);
        setUser(null);
    };

    const signUp = async (email: string, password: string, name1: string, name2: string) => {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const firebaseUser = userCredential.user;

        await updateProfile(firebaseUser, {
            displayName: `${name1},${name2}`
        });

        const userData: Omit<UserData, 'uid' | 'email' | 'isAdmin'> = {
            name1,
            name2,
            photoURL: firebaseUser.photoURL,
            premium: false,
        };
        await initializeNewUserData(firebaseUser.uid, userData);
        
        return userCredential;
    };
    
    const signInWithEmail = (email: string, password: string) => {
        return signInWithEmailAndPassword(auth, email, password);
    };

    const signInWithGoogle = async () => {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        const firebaseUser = result.user;

        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
             const displayName = firebaseUser.displayName || "Jane,John";
             const [name1, name2] = displayName.includes(',') ? displayName.split(',') : [displayName, 'Partner'];
             const userData: Omit<UserData, 'uid' | 'email' | 'isAdmin'> = {
                name1,
                name2,
                photoURL: firebaseUser.photoURL,
                premium: false,
             };
             await initializeNewUserData(firebaseUser.uid, userData);
        }
        return result;
    };
    
    const resetPassword = (email: string) => {
        return sendPasswordResetEmail(auth, email);
    }

  const value = {
    user,
    loading,
    getIdToken,
    signOutUser,
    signUp,
    signInWithEmail,
    signInWithGoogle,
    resetPassword
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
