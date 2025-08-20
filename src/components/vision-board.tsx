
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
import { useToast } from '@/hooks/use-toast';
import { usePhotos, PhotoProvider } from '@/hooks/use-photos';

function VisionBoardContent() {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { photos, addPhoto, updatePhotoOrder } = usePhotos();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<UnsplashImage[]>([]);
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleAddImage = (src: string, prompt: string) => {
    addPhoto({
        src,
        alt: prompt,
        hint: prompt.split(' ').slice(0, 2).join(' '),
    });
  }
  
  const addUnsplashImage = (image: UnsplashImage) => {
    addPhoto({
        src: image.urls.regular,
        alt: image.alt_description || "Unsplash image",
        hint: image.alt_description?.split(' ').slice(0, 2).join(' ') || "wedding",
    });
    setIsSearchDialogOpen(false);
  }

  const onDragEnd = (result: DropResult) => {
    const { source, destination } = result;
    if (!destination) return;

    const reorderedPhotos = Array.from(photos);
    const [movedPhoto] = reorderedPhotos.splice(source.index - 1, 1);
    reorderedPhotos.splice(destination.index - 1, 0, movedPhoto);
    
    updatePhotoOrder(reorderedPhotos);
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
                                    <VisionBoardGenerator onImageGenerated={handleAddImage} />
                                </div>
                            )}
                        </Draggable>
                        {photos.map((image, index) => (
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

export function VisionBoard() {
    return (
        <PhotoProvider>
            <VisionBoardContent />
        </PhotoProvider>
    )
}
