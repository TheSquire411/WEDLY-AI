"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { VisionBoardGenerator } from './vision-board-generator';
import { Upload, Search } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { unsplashImageSearch, type UnsplashImage } from '@/ai/flows/unsplash-image-search';
import { UnsplashSearchDialog } from './unsplash-search-dialog';
import { useToast } from '@/hooks/use-toast';

interface VisionImage {
    id: string;
    src: string;
    alt: string;
    hint: string;
}

export function VisionBoard() {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<VisionImage[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<UnsplashImage[]>([]);
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedImages = localStorage.getItem('visionBoardImages');
      if (savedImages) {
        console.log("Loading images from localStorage.");
        setImages(JSON.parse(savedImages));
      }
    }
  }, []);

  useEffect(() => {
    console.log("Saving images to localStorage:", images);
    if (typeof window !== 'undefined') {
      localStorage.setItem('visionBoardImages', JSON.stringify(images));
    }
  }, [images]);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };
  
  const addImage = (src: string, prompt: string) => {
    const newImage: VisionImage = {
        id: `image-${Date.now()}`,
        src,
        alt: prompt,
        hint: prompt.split(' ').slice(0, 2).join(' '),
    };
    console.log("Adding new generated image:", newImage);
    setImages(prev => [newImage, ...prev]);
  }
  
  const addUnsplashImage = (image: UnsplashImage) => {
    const newImage: VisionImage = {
        id: image.id,
        src: image.urls.regular,
        alt: image.alt_description || "Unsplash image",
        hint: image.alt_description?.split(' ').slice(0, 2).join(' ') || "wedding",
    };
    console.log("Adding new Unsplash image:", newImage);
    setImages(prev => [newImage, ...prev]);
    setIsSearchDialogOpen(false);
  }

  const onDragEnd = (result: DropResult) => {
    const { source, destination } = result;
    if (!destination) return;
    
    const reorderedImages = Array.from(images);
    const [movedImage] = reorderedImages.splice(source.index - 1, 1);
    reorderedImages.splice(destination.index - 1, 0, movedImage);
    
    setImages(reorderedImages);
  }
  
  const handleSearch = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!searchQuery.trim()) return;
      
      setIsSearching(true);
      setSearchResults([]);
      try {
          const results = await unsplashImageSearch({ query: searchQuery });
          setSearchResults(results.images);
          setIsSearchDialogOpen(true);
      } catch (error) {
          console.error("Unsplash search error:", error);
          toast({
            title: "Search
