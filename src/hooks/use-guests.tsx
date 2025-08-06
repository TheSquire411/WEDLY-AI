
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useUser } from './use-user';
import { db } from '@/lib/firebase';
import { collection, addDoc, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore';

export interface Guest {
    id: string;
    name: string;
    rsvp: 'Confirmed' | 'Pending' | 'Declined';
    group: string;
    table: number | null;
}

interface GuestContextType {
  guests: Guest[];
  loading: boolean;
  addGuest: (guest: Omit<Guest, 'id'>) => Promise<void>;
  updateGuestRsvp: (guestId: string, rsvp: Guest['rsvp']) => Promise<void>;
  deleteGuest: (guestId: string) => Promise<void>;
}

const GuestContext = createContext<GuestContextType | undefined>(undefined);

export const GuestProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useUser();

  const getGuestsCollection = useCallback(() => {
    if (!user) return null;
    return collection(db, 'users', user.uid, 'guests');
  }, [user]);

  useEffect(() => {
    const guestsCollection = getGuestsCollection();
    if (!guestsCollection) {
        setGuests([]);
        setLoading(false);
        return;
    }

    setLoading(true);
    const q = query(guestsCollection, orderBy("name", "asc"));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const guestsData: Guest[] = [];
      querySnapshot.forEach((doc) => {
        guestsData.push({ id: doc.id, ...doc.data() } as Guest);
      });
      setGuests(guestsData);
      setLoading(false);
    }, (error) => {
        console.error("Error fetching guests from Firestore: ", error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [getGuestsCollection]);

  const addGuest = async (guest: Omit<Guest, 'id'>) => {
    const guestsCollection = getGuestsCollection();
    if (!guestsCollection) throw new Error("User not authenticated.");
    try {
        await addDoc(guestsCollection, guest);
    } catch (error) {
        console.error("Error adding guest to Firestore: ", error);
    }
  };

  const updateGuestRsvp = async (guestId: string, rsvp: Guest['rsvp']) => {
    if (!user) throw new Error("User not authenticated.");
    const guestDocRef = doc(db, 'users', user.uid, 'guests', guestId);
    try {
        await updateDoc(guestDocRef, { rsvp });
    } catch (error) {
        console.error("Error updating guest RSVP: ", error);
    }
  }

  const deleteGuest = async (guestId: string) => {
    if (!user) throw new Error("User not authenticated.");
    const guestDocRef = doc(db, 'users', user.uid, 'guests', guestId);
    try {
        await deleteDoc(guestDocRef);
    } catch (error) {
        console.error("Error deleting guest: ", error);
    }
  }

  const value = {
    guests,
    loading,
    addGuest,
    updateGuestRsvp,
    deleteGuest,
  };

  return (
    <GuestContext.Provider value={value}>
      {children}
    </GuestContext.Provider>
  );
};

export const useGuests = () => {
  const context = useContext(GuestContext);
  if (context === undefined) {
    throw new Error('useGuests must be used within a GuestProvider');
  }
  return context;
};
