
"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, onSnapshot, query, orderBy, writeBatch, doc } from 'firebase/firestore';

interface Photo {
  id: string;
  src: string;
  alt: string;
  hint: string;
  createdAt: Date;
  order: number;
}

interface PhotoContextType {
  photos: Photo[];
  addPhoto: (photo: Omit<Photo, 'id' | 'createdAt' | 'order'>) => Promise<void>;
  updatePhotoOrder: (photos: Photo[]) => Promise<void>;
}

const PhotoContext = createContext<PhotoContextType | undefined>(undefined);

export const PhotoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [photos, setPhotos] = useState<Photo[]>([]);

  useEffect(() => {
    const q = query(collection(db, "photos"), orderBy("order", "asc"));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const photosData: Photo[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        photosData.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt.toDate(),
        } as Photo);
      });
      setPhotos(photosData);
    }, (error) => {
        console.error("Error fetching photos from Firestore: ", error);
    });

    return () => unsubscribe();
  }, []);

  const addPhoto = async (photo: Omit<Photo, 'id' | 'createdAt' | 'order'>) => {
    try {
        const newOrder = photos.length;
        await addDoc(collection(db, "photos"), {
            ...photo,
            createdAt: new Date(),
            order: newOrder,
        });
    } catch (error) {
        console.error("Error adding photo to Firestore: ", error);
    }
  };

  const updatePhotoOrder = async (newPhotos: Photo[]) => {
    try {
      const batch = writeBatch(db);
      newPhotos.forEach((photo, index) => {
        const docRef = doc(db, "photos", photo.id);
        batch.update(docRef, { order: index });
      });
      await batch.commit();
    } catch (error) {
      console.error("Error updating photo order: ", error);
    }
  };

  const value = {
    photos,
    addPhoto,
    updatePhotoOrder,
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
