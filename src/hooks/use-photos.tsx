
"use client";

import React, { createContext, useContext, useState } from 'react';

interface Photo {
  src: string;
  alt: string;
  hint: string;
}

interface PhotoContextType {
  photos: Photo[];
  addPhoto: (photo: Photo) => void;
}

const PhotoContext = createContext<PhotoContextType | undefined>(undefined);

const initialImages = [
  { src: "https://placehold.co/600x400.png", alt: "Guest photo 1", hint: "wedding guests" },
  { src: "https://placehold.co/400x600.png", alt: "Guest photo 2", hint: "bride groom" },
  { src: "https://placehold.co/600x400.png", alt: "Guest photo 3", hint: "wedding dance" },
  { src: "https://placehold.co/600x400.png", alt: "Guest photo 4", hint: "wedding toast" },
  { src: "https://placehold.co/400x600.png", alt: "Guest photo 5", hint: "wedding cake" },
  { src: "https://placehold.co/600x400.png", alt: "Guest photo 6", hint: "newlyweds kissing" },
];


export const PhotoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [photos, setPhotos] = useState<Photo[]>(initialImages);

  const addPhoto = (photo: Photo) => {
    setPhotos(prevPhotos => [photo, ...prevPhotos]);
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
