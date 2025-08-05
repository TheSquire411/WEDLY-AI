
"use client";

import * as React from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Upload, Link as LinkIcon, Download, Copy, Gem } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSubscription } from '@/hooks/use-subscription';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { usePhotos } from '@/hooks/use-photos';

const FREE_TIER_LIMIT = 10;

export function PhotoAlbum() {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [guestUploadLink, setGuestUploadLink] = React.useState('');
  const { isPremium, openDialog } = useSubscription();
  const { photos, addPhoto } = usePhotos();

  const limitReached = !isPremium && photos.length >= FREE_TIER_LIMIT;

  React.useEffect(() => {
    // Generate a unique link when the component mounts
    setGuestUploadLink(`${window.location.origin}/guest-upload?id=${Math.random().toString(36).substring(2, 10)}`);
  }, []);

  const handleUploadClick = () => {
    if (limitReached) {
        openDialog();
        return;
    }
    fileInputRef.current?.click();
  };
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
        if (!isPremium && (photos.length + files.length) > FREE_TIER_LIMIT) {
             toast({
                variant: 'destructive',
                title: 'Upload Limit Reached',
                description: `The free plan is limited to ${FREE_TIER_LIMIT} photos. You can upgrade for unlimited uploads.`,
            });
            return;
        }

        Array.from(files).forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                if (e.target?.result) {
                     addPhoto({
                        src: e.target.result as string,
                        alt: file.name,
                        hint: 'user upload'
                    });
                }
            };
            reader.readAsDataURL(file);
        });
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(guestUploadLink);
    toast({
        title: "Link Copied!",
        description: "The guest upload link has been copied to your clipboard.",
    });
  };

  return (
    <div>
        <Card className="mb-8 shadow-md">
            <CardHeader>
                <CardTitle className="font-headline text-2xl">Share Your Album</CardTitle>
                <CardDescription>Share the link or QR code below with your guests so they can upload their photos directly to your album!</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col md:flex-row items-center gap-6">
                <div className="flex-shrink-0">
                    <Image src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(guestUploadLink)}`} alt="QR Code for guest upload" width={150} height={150} data-ai-hint="qr code" />
                </div>
                <div className="flex-grow w-full space-y-4">
                    <p className="text-sm text-muted-foreground">Your unique guest upload link:</p>
                    <div className="flex items-center gap-2">
                        <LinkIcon className="h-5 w-5 text-muted-foreground" />
                        <Input value={guestUploadLink} readOnly className="bg-muted" />
                        <Button variant="outline" size="icon" onClick={copyToClipboard}>
                            <Copy className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start mb-8">
            <div>
                <h2 className="text-4xl font-headline text-gray-800">Wedding Photos ({photos.length})</h2>
                <p className="text-muted-foreground">A collection of memories from your special day.</p>
            </div>
             <div className="flex gap-2">
                <Input type="file" ref={fileInputRef} className="hidden" accept="image/*" multiple onChange={handleFileChange} />
                <Button variant="outline" onClick={handleUploadClick} disabled={limitReached}>
                    <Upload className="mr-2" />
                    Upload Your Photos
                </Button>
                <Button>
                    <Download className="mr-2" />
                    Download All
                </Button>
            </div>
        </div>

        {limitReached && (
            <Alert className="mb-8">
                <Gem className="h-4 w-4" />
                <AlertTitle>You've reached your photo limit!</AlertTitle>
                <AlertDescription>
                   Upgrade to the Pro plan to upload unlimited photos.
                   <Button variant="link" onClick={openDialog} className="p-1 h-auto">Upgrade now.</Button>
                </AlertDescription>
            </Alert>
        )}

        <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-4 space-y-4">
            {photos.map((image, index) => (
                <div key={index} className="overflow-hidden rounded-lg shadow-md break-inside-avoid">
                    <Image 
                        src={image.src} 
                        alt={image.alt} 
                        data-ai-hint={image.hint} 
                        width={600} 
                        height={600} 
                        className="object-cover w-full h-auto hover:scale-105 transition-transform duration-300 ease-in-out" 
                    />
                </div>
            ))}
        </div>
    </div>
  );
}
