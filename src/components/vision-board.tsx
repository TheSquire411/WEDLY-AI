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
  }, [images, mounted, saveImages]);es, mounted, saveImages]);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };
  
  const addImage = useCallback((src: string, prompt: string) => {
    const newImage: VisionImage = {
        id: `gen-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        src,
        alt: prompt,
        hint: prompt.split(' ').slice(0, 2).join(' '),
    };
    console.log('➕ Adding new generated image:', newImage);
    
    setImages(prevImages => {
        const newImages = [newImage, ...prevImages];
        console.log('🔄 New images array will be:', newImages.length, 'items');
        return newImages;
    });
  }, []);
  
  const addUnsplashImage = useCallback((image: UnsplashImage) => {
    const newImage: VisionImage = {
        id: `unsplash-${image.id}`,
        src: image.urls.regular,
        alt: image.alt_description || "Unsplash image",
        hint: image.alt_description?.split(' ').slice(0, 2).join(' ') || "wedding",
    };
    console.log('➕ Adding new Unsplash image:', newImage);
    
    setImages(prevImages => {
        const newImages = [newImage, ...prevImages];
        console.log('🔄 New images array will be:', newImages.length, 'items');
        return newImages;
    });
    setIsSearchDialogOpen(false);
  }, []);

  const removeImage = useCallback((imageId: string) => {
    console.log('🗑️ Removing image:', imageId);
    setImages(prevImages => {
        const newImages = prevImages.filter(img => img.id !== imageId);
        console.log('🔄 After removal, images array will be:', newImages.length, 'items');
        return newImages;
    });
  }, []);

  const onDragEnd = useCallback((result: DropResult) => {
    const { source, destination } = result;
    if (!destination) return;
    
    console.log('🔀 Reordering images...');
    setImages(prevImages => {
        const reorderedImages = Array.from(prevImages);
        const [movedImage] = reorderedImages.splice(source.index - 1, 1);
        reorderedImages.splice(destination.index - 1, 0, movedImage);
        console.log('🔄 Reordered images array will be:', reorderedImages.length, 'items');
        return reorderedImages;
    });
  }, []);
  
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
            title: "Search Failed",
            description: "Could not fetch images from Unsplash. Please try again later.",
            variant: "destructive",
          });
      } finally {
          setIsSearching(false);
      }
  }

  // Debug button to manually check localStorage
  const debugLocalStorage = () => {
    console.log('🔍 DEBUG: Manual localStorage check');
    const data = loadFromLocalStorage();
    console.log('🔍 DEBUG: Current localStorage data:', data);
    console.log('🔍 DEBUG: Current state images:', images);
    alert(`localStorage has ${data.length} images, state has ${images.length} images`);
  };

  console.log('🎨 VisionBoard render - mounted:', mounted, 'images count:', images.length);

  return (
    <div>
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start mb-8">
            <div>
                <h2 className="text-4xl font-headline text-gray-800">Vision Board</h2>
                <p className="text-muted-foreground">Your wedding inspiration in one place. Drag to rearrange.</p>
                {/* Debug info */}
                <div className="mt-2 text-xs text-gray-500">
                    Mounted: {mounted ? '✅' : '❌'} | Images: {images.length} | 
                    <button onClick={debugLocalStorage} className="ml-2 underline">Debug Storage</button>
                </div>
            </div>
             <div className="flex gap-2">
                <Input type="file" ref={fileInputRef} className="hidden" />
                <Button variant="outline" onClick={handleUploadClick}>
                    <Upload className="mr-2" />
                    Upload Image
                </Button>
                <form onSubmit={handleSearch} className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input 
                        placeholder="Search Unsplash..." 
                        className="pl-10" 
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        disabled={isSearching}
                    />
                </form>
            </div>
        </div>
        
        {mounted ? (
            <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="vision-board-grid" direction="horizontal">
                    {(provided) => (
                        <div 
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
                        >
                            <Draggable key="generator" draggableId="generator" index={0} isDragDisabled={true}>
                                {(provided) => (
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        {...provided.dragHandleProps}
                                    >
                                        <VisionBoardGenerator onImageGenerated={addImage} />
                                    </div>
                                )}
                            </Draggable>
                            {images.map((image, index) => (
                                 <Draggable key={image.id} draggableId={image.id} index={index + 1}>
                                    {(provided) => (
                                         <div
                                             ref={provided.innerRef}
                                             {...provided.draggableProps}
                                             {...provided.dragHandleProps}
                                             className="overflow-hidden rounded-lg shadow-md aspect-square relative group"
                                         >
                                             <Image 
                                                src={image.src} 
                                                alt={image.alt} 
                                                data-ai-hint={image.hint} 
                                                width={400} 
                                                height={400} 
                                                className="object-cover w-full h-full hover:scale-105 transition-transform duration-300 ease-in-out" 
                                            />
                                            <button
                                                onClick={() => removeImage(image.id)}
                                                className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm opacity-0 group-hover:opacity-100 transition-opacity"
                                                title="Remove image"
                                            >
                                                ×
                                            </button>
                                         </div>
                                    )}
                                </Draggable>
                            ))}
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
            </DragDropContext>
        ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <VisionBoardGenerator onImageGenerated={addImage} />
                {/* Skeleton loading for saved images */}
                <div className="animate-pulse bg-gray-200 aspect-square rounded-lg"></div>
            </div>
        )}
        
        <UnsplashSearchDialog 
            isOpen={isSearchDialogOpen}
            onOpenChange={setIsSearchDialogOpen}
            isLoading={isSearching}
            images={searchResults}
            onImageSelect={addUnsplashImage}
            query={searchQuery}
        />
    </div>
  );
}
