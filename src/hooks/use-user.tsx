
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
    UserCredential
} from 'firebase/auth';
import { doc, getDoc, onSnapshot, writeBatch } from 'firebase/firestore';

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
  signUp: (email:string, password:string, name1:string, name2:string) => Promise<UserCredential>;
  signInWithEmail: (email:string, password:string) => Promise<UserCredential>;
  signInWithGoogle: () => Promise<UserCredential>;
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
                    
                    const idTokenResult = await firebaseUser.getIdTokenResult();
                    const isAdmin = idTokenResult.claims.isAdmin === true;

                    const unsubscribeDoc = onSnapshot(userDocRef, (userDoc) => {
                        if (userDoc.exists()) {
                            const userData = { ...userDoc.data(), uid: firebaseUser.uid, email: firebaseUser.email } as UserData;
                            
                            userData.isAdmin = isAdmin;
                            if (isAdmin) {
                                userData.premium = true;
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

        // Force a token refresh to get custom claims.
        await result.user.getIdToken(true);

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
