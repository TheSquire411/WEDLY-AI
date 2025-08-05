
"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, onSnapshot, query, orderBy } from 'firebase/firestore';

interface Photo {
  id: string;
  src: string;
  alt: string;
  hint: string;
  createdAt: Date;
}

interface PhotoContextType {
  photos: Photo[];
  addPhoto: (photo: Omit<Photo, 'id' | 'createdAt'>) => Promise<void>;
}

const PhotoContext = createContext<PhotoContextType | undefined>(undefined);

export const PhotoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [photos, setPhotos] = useState<Photo[]>([]);

  useEffect(() => {
    const q = query(collection(db, "photos"), orderBy("createdAt", "desc"));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const photosData: Photo[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        photosData.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt.toDate(), // Convert Firestore Timestamp to JS Date
        } as Photo);
      });
      setPhotos(photosData);
    }, (error) => {
        console.error("Error fetching photos from Firestore: ", error);
    });

    return () => unsubscribe();
  }, []);

  const addPhoto = async (photo: Omit<Photo, 'id' | 'createdAt'>) => {
    try {
        await addDoc(collection(db, "photos"), {
            ...photo,
            createdAt: new Date(),
        });
    } catch (error) {
        console.error("Error adding photo to Firestore: ", error);
    }
  };

  const value = {
    photos,
    addPhoto,
  };

  return (
    <PhotoContext.Provider value={value}>
      {children}
    </PhotoContext.Provider>
  );
};

export const usePhotos = () => {
  const context = useContext(PhotoContext);
  if (context === undefined) {
    throw new Error('usePhotos must be used within a PhotoProvider');
  }
  return context;
};
