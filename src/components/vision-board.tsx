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

const STORAGE_KEY = 'visionBoardImages';

export function VisionBoard() {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<VisionImage[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<UnsplashImage[]>([]);
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const { toast } = useToast();

  // Handle client-side hydration
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Load images from localStorage on client-side mount
  useEffect(() => {
    if (isClient) {
      try {
        const savedImages = localStorage.getItem(STORAGE_KEY);
        if (savedImages) {
          const parsedImages = JSON.parse(savedImages);
          console.log("Loading images from localStorage:", parsedImages);
          setImages(parsedImages);
        }
      } catch (error) {
        console.error("Error loading images from localStorage:", error);
      }
    }
  }, [isClient]);

  // Save images to localStorage whenever images change (but only on client-side)
  useEffect(() => {
    if (isClient && images.length >= 0) {
      try {
        console.log("Saving images to localStorage:", images);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(images));
      } catch (error) {
        console.error("Error saving images to localStorage:", error);
      }
    }
  }, [images, isClient]);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };
  
  const addImage = (src: string, prompt: string) => {
    const newImage: VisionImage = {
        id: `image-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        src,
        alt: prompt,
        hint: prompt.split(' ').slice(0, 2).join(' '),
    };
    console.log("Adding new generated image:", newImage);
    setImages(prev => {
        const updated = [newImage, ...prev];
        console.log("Updated images array:", updated);
        return updated;
    });
  }
  
  const addUnsplashImage = (image: UnsplashImage) => {
    const newImage: VisionImage = {
        id: `unsplash-${image.id}`,
        src: image.urls.regular,
        alt: image.alt_description || "Unsplash image",
        hint: image.alt_description?.split(' ').slice(0, 2).join(' ') || "wedding",
    };
    console.log("Adding new Unsplash image:", newImage);
    setImages(prev => {
        const updated = [newImage, ...prev];
        console.log("Updated images array:", updated);
        return updated;
    });
    setIsSearchDialogOpen(false);
  }

  const removeImage = (imageId: string) => {
    setImages(prev => {
        const updated = prev.filter(img => img.id !== imageId);
        console.log("Removed image, updated array:", updated);
        return updated;
    });
  }

  const onDragEnd = (result: DropResult) => {
    const { source, destination } = result;
    if (!destination) return;
    
    const reorderedImages = Array.from(images);
    const [movedImage] = reorderedImages.splice(source.index - 1, 1);
    reorderedImages.splice(destination.index - 1, 0, movedImage);
    
    console.log("Reordered images:", reorderedImages);
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
            title: "Search Failed",
            description: "Could not fetch images from Unsplash. Please try again later.",
            variant: "destructive",
          });
      } finally {
          setIsSearching(false);
      }
  }

  // Don't render the drag and drop until we're on the client side
  if (!isClient) {
    return (
        <div>
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start mb-8">
                <div>
                    <h2 className="text-4xl font-headline text-gray-800">Vision Board</h2>
                    <p className="text-muted-foreground">Your wedding inspiration in one place. Drag to rearrange.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleUploadClick}>
                        <Upload className="mr-2" />
                        Upload Image
                    </Button>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input 
                            placeholder="Search Unsplash..." 
                            className="pl-10" 
                            disabled
                        />
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <VisionBoardGenerator onImageGenerated={addImage} />
            </div>
        </div>
    );
  }

  return (
    <div>
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start mb-8">
            <div>
                <h2 className="text-4xl font-headline text-gray-800">Vision Board</h2>
                <p className="text-muted-foreground">Your wedding inspiration in one place. Drag to rearrange.</p>
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
