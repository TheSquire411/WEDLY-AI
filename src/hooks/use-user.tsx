
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
import { doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';

export interface UserData {
    uid: string;
    email: string | null;
    name1: string;
    name2: string;
    photoURL?: string | null;
    premium?: boolean;
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

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
            try {
                if (firebaseUser) {
                    const userDocRef = doc(db, 'users', firebaseUser.uid);
                    
                    // Set up a real-time listener for the user document
                    const unsubscribeDoc = onSnapshot(userDocRef, (userDoc) => {
                        if (userDoc.exists()) {
                            setUser({ ...userDoc.data(), uid: firebaseUser.uid, email: firebaseUser.email } as UserData);
                        } else {
                            // This case handles a theoretical scenario where auth exists but doc doesn't.
                            // The sign-up/sign-in logic should prevent this.
                             const displayName = firebaseUser.displayName || "Jane,John";
                            const [name1, name2] = displayName.includes(',') ? displayName.split(',') : [displayName, 'Partner'];

                            const newUser: Omit<UserData, 'uid' | 'email'> = {
                                name1,
                                name2,
                                photoURL: firebaseUser.photoURL,
                                premium: false,
                            }
                            setDoc(userDocRef, newUser).then(() => {
                                setUser({ ...newUser, uid: firebaseUser.uid, email: firebaseUser.email });
                            });
                        }
                        setLoading(false);
                    });
                    
                    // Return the unsubscribe function for the document listener
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

        // Return the unsubscribe function for the auth listener
        return () => unsubscribeAuth();
    }, []);

    const getIdToken = async (): Promise<string | null> => {
        if (!auth.currentUser) return null;
        return await auth.currentUser.getIdToken(true); // Force refresh
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

        const userData = {
            email,
            name1,
            name2,
            photoURL: firebaseUser.photoURL,
            premium: false,
        };
        await setDoc(doc(db, "users", firebaseUser.uid), userData);
        
        // No need to setUser here, onAuthStateChanged listener will handle it.
        return userCredential;
    };
    
    const signInWithEmail = (email: string, password: string) => {
        return signInWithEmailAndPassword(auth, email, password);
    };

    const signInWithGoogle = async () => {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        const firebaseUser = result.user;

        // Check if user already exists
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
             const displayName = firebaseUser.displayName || "Jane,John";
             const [name1, name2] = displayName.includes(',') ? displayName.split(',') : [displayName, 'Partner'];
             const userData: Omit<UserData, 'uid' | 'email'> = {
                name1,
                name2,
                photoURL: firebaseUser.photoURL,
                premium: false,
             };
             await setDoc(userDocRef, userData);
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
