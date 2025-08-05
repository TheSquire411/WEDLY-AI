'use client';

import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from './ui/scroll-area';
import { Skeleton } from './ui/skeleton';
import { Button } from './ui/button';
import { type UnsplashImage } from '@/ai/flows/unsplash-image-search';

interface UnsplashSearchDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  isLoading: boolean;
  images: UnsplashImage[];
  onImageSelect: (image: UnsplashImage) => void;
  query: string;
}

export function UnsplashSearchDialog({
  isOpen,
  onOpenChange,
  isLoading,
  images,
  onImageSelect,
  query,
}: UnsplashSearchDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Unsplash Search Results</DialogTitle>
          <DialogDescription>
            Showing results for "{query}". Click an image to add it to your vision board.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-grow">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pr-6">
            {isLoading &&
                Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="w-full h-40 rounded-lg" />
                ))}
            {!isLoading && images.length === 0 && (
                <p className="col-span-full text-center text-muted-foreground">No results found.</p>
            )}
            {images.map((image) => (
                <div key={image.id} className="relative group cursor-pointer" onClick={() => onImageSelect(image)}>
                    <Image
                        src={image.urls.thumb}
                        alt={image.alt_description || 'Unsplash image'}
                        width={200}
                        height={200}
                        className="rounded-lg object-cover w-full h-40"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <p className="text-white text-xs text-center p-2">Add to Board</p>
                    </div>
                </div>
            ))}
            </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
