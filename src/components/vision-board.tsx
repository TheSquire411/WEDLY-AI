"use client";

import React, { useState, useEffect, useCallback } from 'react';
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

const STORAGE_KEY = 'visionBoardImages';

// Helper functions for localStorage
const saveToLocalStorage = (images: VisionImage[]) => {
  try {
    console.log('🔄 Attempting to save to localStorage:', images.length, 'images');
    console.log('📝 Data being saved:', JSON.stringify(images, null, 2));
    
    if (typeof window === 'undefined') {
      console.log('❌ Window is undefined - skipping save');
      return false;
    }
    
    if (!window.localStorage) {
      console.log('❌ localStorage not available - skipping save');
      return false;
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(images));
    console.log('✅ Successfully saved to localStorage');
    
    // Verify the save worked
    const verification = localStorage.getItem(STORAGE_KEY);
    console.log('🔍 Verification - data in localStorage:', verification ? JSON.parse(verification).length + ' images' : 'null');
    
    return true;
  } catch (error) {
    console.error('❌ Error saving to localStorage:', error);
    return false;
  }
};

const loadFromLocalStorage = (): VisionImage[] => {
  try {
    console.log('🔄 Attempting to load from localStorage');
    
    if (typeof window === 'undefined') {
      console.log('❌ Window is undefined - returning empty array');
      return [];
    }
    
    if (!window.localStorage) {
      console.log('❌ localStorage not available - returning empty array');
      return [];
    }
    
    const saved = localStorage.getItem(STORAGE_KEY);
    console.log('📖 Raw data from localStorage:', saved);
    
    if (!saved) {
      console.log('📭 No saved data found - returning empty array');
      return [];
    }
    
    const parsed = JSON.parse(saved);
    console.log('✅ Successfully loaded from localStorage:', parsed.length, 'images');
    console.log('📋 Loaded data:', parsed);
    
    return parsed;
  } catch (error) {
    console.error('❌ Error loading from localStorage:', error);
    return [];
  }
};

export function VisionBoard() {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<VisionImage[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<UnsplashImage[]>([]);
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { toast } = useToast();

  // Handle mounting
  useEffect(() => {
    console.log('🚀 Component mounting...');
    setMounted(true);
    
    // Load data immediately when mounted
    const savedImages = loadFromLocalStorage();
    if (savedImages.length > 0) {
      console.log('🔄 Setting loaded images:', savedImages.length);
      setImages(savedImages);
    }
  }, []);

  // Save to localStorage whenever images change
  const saveImages = useCallback((imagesToSave: VisionImage[]) => {
    if (mounted) {
      console.log('💾 saveImages called with:', imagesToSave.length, 'images');
      saveToLocalStorage(imagesToSave);
    }
  }, [mounted]);

  // Save whenever images change
  useEffect(() => {
    if (mounted) {
      console.log('🔄 Images changed, triggering save. Images count:', images.length);
      saveImages(images);
    }
  }, [imag
