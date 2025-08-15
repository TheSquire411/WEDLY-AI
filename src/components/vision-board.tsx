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
  console.log('VisionBoard component is loading...');
  
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<VisionImage[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<UnsplashImage[]>([]);
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false);
  const { toast } = useToast();

  // Simple test - add a dummy image on first load
  useEffect(() => {
    console.log('Component mounted! Testing...');
    
    // Test localStorage immediately
    try {
      localStorage.setItem('test', 'hello');
      const testValue = localStorage.getItem('test');
      console.log('localStorage test result:', testValue);
      localStorage.removeItem('test');
    } catch (error) {
      console.error('localStorage not working:', error);
    }

    // Load saved images
    try {
      const saved = localStorage.getItem('visionBoardImages');
      console.log('Saved data from localStorage:', saved);
      if (saved) {
        const parsed = JSON.parse(saved);
        console.log('Parsed saved images:', parsed);
        setImages(parsed);
      }
    } catch (error) {
      console.error('Error loading saved images:', error);
    }
  }, []);

  // Save images whenever they change
  useEffect(() => {
    console.log('Images changed! New count:', images.length);
    console.log('Current images:', images);
    
    try {
      localStorage.setItem('visionBoardImages', JSON.stringify(images));
      console.log('Successfully saved to localStorage');
      
      // Immediately verify
      const verification = localStorage.getItem('visionBoardImages');
      console.log('Verification - what was actually saved:', verification);
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }, [images]);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };
  
  const addImage = (src: string, prompt: string) => {
    console.log('addImage called with:', src, prompt);
    
    const newImage: VisionImage = {
        id: `image-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        src,
        alt: prompt,
        hint: prompt.split(' ').slice(0, 2).join(' '),
    };
    
    console.log('Created new image object:', newImage);
    
    setImages(prev => {
        const newArray = [newImage, ...prev];
        console.log('Setting new images array:', newArray);
        return newArray;
    });
  }
  
  const addUnsplashImage = (image: UnsplashImage) => {
    console.log('addUnsplashImage called with:', image);
    
    const newImage: VisionImage = {
        id: `unsplash-${image.id}`,
        src: image.urls.regular,
        alt: image.alt_description || "Unsplash image",
        hint: image.alt_description?.split(' ').slice(0, 2).join(' ') || "wedding",
    };
    
    console.log('Created new Unsplash image object:', newImage);
    
    setImages(prev => {
        const newArray = [newImage, ...prev];
        console.log('Setting new images array:', newArray);
        return newArray;
    });
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
            title: "Search Failed",
            description: "Could not fetch images from Unsplash. Please try again later.",
            variant: "destructive",
          });
      } finally {
          setIsSearching(false);
      }
  }

  // Add a test button
  const addTestImage = () => {
    console.log('Test button clicked!');
    addImage('https://via.placeholder.com/400x400/ff6b6b/ffffff?text=Test+Image', 'Test image for debugging');
  };

  console.log('Rendering VisionBoard with', images.length, 'images');

  return (
    <div>
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start mb-8">
            <div>
                <h2 className="text-4xl font-headline text-gray-800">Vision Board</h2>
                <p className="text-muted-foreground">Your wedding inspiration in one place. Drag to rearrange.</p>
                <p className="text-xs text-gray-500 mt-1">Images in state: {images.length}</p>
                <Button onClick={addTestImage} size="sm" variant="outline" className="mt-2">
                    Add Test Image
                </Button>
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
                                         className="overflow-hidden rounded-lg shadow-md aspect-square"
                                     >
                                         <Image src={image.src} alt={image.alt} data-ai-hint={image.hint} width={400} height={400} className="object-cover w-full h-full hover:scale-105 transition-transform duration-300 ease-in-out" />
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
