
"use client";

import React from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { VisionBoardGenerator } from './vision-board-generator';
import { Upload, Search } from 'lucide-react';

export function VisionBoard() {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div>
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start mb-8">
            <div>
                <h2 className="text-4xl font-headline text-gray-800">Vision Board</h2>
                <p className="text-muted-foreground">Your wedding inspiration in one place.</p>
            </div>
             <div className="flex gap-2">
                <Input type="file" ref={fileInputRef} className="hidden" />
                <Button variant="outline" onClick={handleUploadClick}>
                    <Upload className="mr-2" />
                    Upload Image
                </Button>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input placeholder="Search Unsplash..." className="pl-10" />
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <VisionBoardGenerator />
            <div className="overflow-hidden rounded-lg shadow-md aspect-square">
                <Image src="https://placehold.co/400x400.png" alt="Wedding inspiration 1" data-ai-hint="wedding dress" width={400} height={400} className="object-cover w-full h-full hover:scale-105 transition-transform duration-300 ease-in-out" />
            </div>
            <div className="overflow-hidden rounded-lg shadow-md aspect-square">
                <Image src="https://placehold.co/400x400.png" alt="Wedding inspiration 2" data-ai-hint="wedding venue" width={400} height={400} className="object-cover w-full h-full hover:scale-105 transition-transform duration-300 ease-in-out" />
            </div>
             <div className="overflow-hidden rounded-lg shadow-md aspect-square">
                <Image src="https://placehold.co/400x400.png" alt="Wedding inspiration 3" data-ai-hint="wedding cake" width={400} height={400} className="object-cover w-full h-full hover:scale-105 transition-transform duration-300 ease-in-out" />
            </div>
             <div className="overflow-hidden rounded-lg shadow-md aspect-square">
                <Image src="https://placehold.co/400x400.png" alt="Wedding inspiration 4" data-ai-hint="flower bouquet" width={400} height={400} className="object-cover w-full h-full hover:scale-105 transition-transform duration-300 ease-in-out" />
            </div>
        </div>
    </div>
  );
}
