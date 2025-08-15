"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, onSnapshot, query, where, orderBy, doc, setDoc } from 'firebase/firestore';
import { useUser } from '@/hooks/use-user';
import { type UnsplashImage } from '@/ai/flows/unsplash-image-search';

export interface VisionImage {
    id: string;
    src: string;
    alt: string;
    hint: string;
    order: number;
    userId?: string;
}

interface VisionBoardContextType {
  images: VisionImage[];
  loading: boolean;
  addImage: (src: string, prompt: string) => Promise<void>;
  addUnsplashImage: (image: UnsplashImage) => Promise<void>;
  reorderImages: (reorderedImages: VisionImage[]) => Promise<void>;
}

const VisionBoardContext = createContext<VisionBoardContextType | undefined>(undefined);

export const VisionBoardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useUser();
  const [images, setImages] = useState<VisionImage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
        setImages([]);
        setLoading(false);
        return;
    };

    const visionBoardCollectionRef = collection(db, 'visionboard');
    const q = query(visionBoardCollectionRef, where('userId', '==', user.uid), orderBy('order', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedImages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as VisionImage[];
      setImages(fetchedImages);
      setLoading(false);
    }, (error) => {
        console.error("Error fetching vision board images:", error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const addImage = async (src: string, prompt: string) => {
    if (!user) return;

    const newImage: Omit<VisionImage, 'id'> = {
      src,
      alt: prompt,
      hint: prompt.split(' ').slice(0, 2).join(' '),
      order: images.length > 0 ? Math.max(...images.map(im => im.order)) + 1 : 0,
      userId: user.uid,
    };

    try {
      await addDoc(collection(db, 'visionboard'), newImage);
    } catch (error) {
      console.error("Error adding image to vision board:", error);
    }
  };

  const addUnsplashImage = async (image: UnsplashImage) => {
    if (!user) return;

    const newImage: Omit<VisionImage, 'id'> = {
        src: image.urls.regular,
        alt: image.alt_description || "Unsplash image",
        hint: image.alt_description?.split(' ').slice(0, 2).join(' ') || "wedding",
        order: images.length > 0 ? Math.max(...images.map(im => im.order)) + 1 : 0,
        userId: user.uid,
    };

    try {
      await addDoc(collection(db, 'visionboard'), newImage);
    } catch (error) {
      console.error("Error adding Unsplash image to vision board:", error);
    }
  };

  const reorderImages = async (reorderedImages: VisionImage[]) => {
    if (!user) return;

    // Optimistically update the local state
    setImages(reorderedImages);

    const promises = reorderedImages.map((image, index) => {
        const imageRef = doc(db, 'visionboard', image.id);
        return setDoc(imageRef, { order: index }, { merge: true });
    });

    try {
        await Promise.all(promises);
    } catch (error) {
        console.error("Error reordering images:", error);
        // If the update fails, you might want to revert the state
        // to the one from Firestore, but that's a more complex UI pattern.
    }
  };

  const value = { images, loading, addImage, addUnsplashImage, reorderImages };

  return (
    <VisionBoardContext.Provider value={value}>
      {children}
    </VisionBoardContext.Provider>
  );
};

export const useVisionBoard = () => {
  const context = useContext(VisionBoardContext);
  if (context === undefined) {
    throw new Error('useVisionBoard must be used within a VisionBoardProvider');
  }
  return context;
};
