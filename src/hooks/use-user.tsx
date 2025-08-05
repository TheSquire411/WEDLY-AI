
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
import { doc, setDoc, getDoc } from 'firebase/firestore';

interface UserData {
    uid: string;
    email: string | null;
    name1: string;
    name2: string;
    photoURL?: string | null;
}

interface UserContextType {
  user: UserData | null;
  loading: boolean;
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
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                const userDocRef = doc(db, 'users', firebaseUser.uid);
                const userDoc = await getDoc(userDocRef);
                
                if (userDoc.exists()) {
                     setUser({ ...userDoc.data(), email: firebaseUser.email } as UserData);
                } else {
                    // This happens with social sign-ins for the first time
                    const displayName = firebaseUser.displayName || "Jane,John";
                    const [name1, name2] = displayName.includes(',') ? displayName.split(',') : [displayName, 'Partner'];

                    const newUser: UserData = {
                        uid: firebaseUser.uid,
                        email: firebaseUser.email,
                        name1,
                        name2,
                        photoURL: firebaseUser.photoURL,
                    }
                    await setDoc(userDocRef, newUser);
                    setUser(newUser);
                }
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

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
            uid: firebaseUser.uid,
            email,
            name1,
            name2,
            photoURL: firebaseUser.photoURL,
        };
        await setDoc(doc(db, "users", firebaseUser.uid), userData);
        setUser(userData as UserData);
        return userCredential;
    };
    
    const signInWithEmail = (email: string, password: string) => {
        return signInWithEmailAndPassword(auth, email, password);
    };

    const signInWithGoogle = async () => {
        const provider = new GoogleAuthProvider();
        return signInWithPopup(auth, provider);
    };
    
    const resetPassword = (email: string) => {
        return sendPasswordResetEmail(auth, email);
    }

  const value = {
    user,
    loading,
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
