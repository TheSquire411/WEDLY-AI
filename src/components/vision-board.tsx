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
        console.log("Loading images from localStorage."); // ADDED THIS LOG
        setImages(JSON.parse(savedImages));
      }
    }
  }, []);

  useEffect(() => {
    // This is the important one to check!
    console.log("Saving images to localStorage:", images); // ADDED THIS LOG
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
    console.log("Adding new generated image:", newImage); // ADDED THIS LOG
    setImages(prev => [newImage, ...prev]);
  }
  
  const addUnsplashImage = (image: UnsplashImage) => {
    const newImage: VisionImage = {
        id: image.id,
        src: image.urls.regular,
        alt: image.alt_description || "Unsplash image",
        hint: image.alt_description?.split(' ').slice(0, 2).join(' ') || "wedding",
    };
    console.log("Adding new Unsplash image:", newImage); // ADDED THIS LOG
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
            title: "Search Failed",
            description: "Could not fetch images from Unsplash. Please try again later.",
            variant: "destructive",
          });
      } finally {
          setIsSearching(false);
      }
  }

  // ... rest of your component's return statement (no changes needed there)
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
            </a-droppable>
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
