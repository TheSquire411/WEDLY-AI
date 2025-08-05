
"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { VisionBoardGenerator } from './vision-board-generator';
import { Upload, Search } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { unsplashImageSearch, type UnsplashImage } from '@/ai/flows/unsplash-image-search';
import { UnsplashSearchDialog } from './unsplash-search-dialog';

interface VisionImage {
    id: string;
    src: string;
    alt: string;
    hint: string;
}

const initialImages: VisionImage[] = [
    { id: 'image-1', src: "https://placehold.co/400x400.png", alt: "Wedding inspiration 1", hint: "wedding dress" },
    { id: 'image-2', src: "https://placehold.co/400x400.png", alt: "Wedding inspiration 2", hint: "wedding venue" },
    { id: 'image-3', src: "https://placehold.co/400x400.png", alt: "Wedding inspiration 3", hint: "wedding cake" },
    { id: 'image-4', src: "https://placehold.co/400x400.png", alt: "Wedding inspiration 4", hint: "flower bouquet" },
];


export function VisionBoard() {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<VisionImage[]>(initialImages);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<UnsplashImage[]>([]);
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false);

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
    setImages(prev => [newImage, ...prev]);
  }
  
  const addUnsplashImage = (image: UnsplashImage) => {
    const newImage: VisionImage = {
        id: image.id,
        src: image.urls.regular,
        alt: image.alt_description || "Unsplash image",
        hint: image.alt_description?.split(' ').slice(0, 2).join(' ') || "wedding",
    };
    setImages(prev => [newImage, ...prev]);
    setIsSearchDialogOpen(false);
  }

  const onDragEnd = (result: DropResult) => {
    const { source, destination } = result;
    if (!destination) return;

    // Draggable IDs are "generator" and "image-..."
    // Draggable indices are 0 for generator, 1+ for images
    // `react-beautiful-dnd` indices are 0-based for the list.
    // So the generator is at index 0, and images are at indices 1 and up.
    
    const reorderedImages = Array.from(images);
    // The `source.index` from dnd accounts for the generator at index 0
    // but our `images` array does not. So we adjust by 1.
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
      } finally {
          setIsSearching(false);
      }
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
            <Droppable droppableId="vision-board-grid" direction="horizontal" isDropDisabled={false} isCombineEnabled={false} ignoreContainerClipping={false}>
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
