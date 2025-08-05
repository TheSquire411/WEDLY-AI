
"use client";

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { UploadCloud, CheckCircle, XCircle, Gem } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { Header } from '@/components/header';
import { useSubscription } from '@/hooks/use-subscription';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface UploadedFile extends File {
  preview: string;
}

const FREE_TIER_LIMIT = 10;

export default function GuestUploadPage() {
  const { toast } = useToast();
  const [files, setFiles] = React.useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = React.useState(false);
  const [existingImageCount, setExistingImageCount] = React.useState(6); // Simulate existing images in album
  
  // In a real app, this would be determined by the couple's subscription status
  const { isPremium, openDialog } = useSubscription();

  const onDrop = React.useCallback((acceptedFiles: File[]) => {
    if (!isPremium && (files.length + existingImageCount + acceptedFiles.length) > FREE_TIER_LIMIT) {
        toast({
            variant: 'destructive',
            title: 'Upload Limit Reached',
            description: `The free plan is limited to ${FREE_TIER_LIMIT} photos. The couple can upgrade for unlimited uploads.`,
        });
        return;
    }

    const newFiles = acceptedFiles.map(file => Object.assign(file, {
        preview: URL.createObjectURL(file)
    }));
    setFiles(prev => [...prev, ...newFiles]);
  }, [files, isPremium, existingImageCount, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    disabled: !isPremium && (files.length + existingImageCount) >= FREE_TIER_LIMIT
  });

  const removeFile = (fileName: string) => {
    setFiles(prev => prev.filter(file => file.name !== fileName));
  };
  
  const handleUpload = () => {
    if (files.length === 0) {
        toast({ variant: 'destructive', title: "No files selected", description: "Please add some photos to upload." });
        return;
    }
    setIsUploading(true);
    toast({ title: "Uploading...", description: `Uploading ${files.length} photos.` });
    
    // Simulate upload process
    setTimeout(() => {
        setIsUploading(false);
        setExistingImageCount(prev => prev + files.length);
        setFiles([]);
        toast({
            title: "Upload Successful!",
            description: "Thank you for sharing your photos.",
            action: (
                <div className="p-1 rounded-full bg-green-500">
                    <CheckCircle className="h-5 w-5 text-white" />
                </div>
            ),
        });
    }, 2000);
  };
  
  const limitReached = !isPremium && (files.length + existingImageCount) >= FREE_TIER_LIMIT;


  return (
    <div className="flex flex-col bg-background">
      <Header />
      <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8 flex items-center justify-center">
        <Card className="w-full max-w-2xl shadow-xl">
          <CardHeader>
            <CardTitle className="text-center font-headline text-3xl">Share Your Photos</CardTitle>
            <CardDescription className="text-center">Upload your photos from Jane & John's wedding!</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {limitReached && (
                <Alert variant="destructive">
                    <Gem className="h-4 w-4" />
                    <AlertTitle>Photo Limit Reached</AlertTitle>
                    <AlertDescription>
                        This wedding's photo album has reached the limit for the free plan. The couple can upgrade to allow for more photo uploads.
                    </AlertDescription>
                </Alert>
            )}
            <div
              {...getRootProps()}
              className={`p-10 border-2 border-dashed rounded-lg text-center transition-colors ${
                isDragActive ? 'border-primary bg-primary/10' : 'border-border'
              } ${limitReached ? 'cursor-not-allowed bg-muted/50' : 'cursor-pointer hover:border-primary/50'}`}
            >
              <input {...getInputProps()} />
              <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4">
                {isDragActive ? 'Drop the files here...' : 'Drag & drop photos here, or click to select files'}
              </p>
            </div>
            
            {files.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-medium">Selected Photos ({files.length}):</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {files.map(file => (
                    <div key={file.name} className="relative group">
                      <img src={file.preview} alt={file.name} className="rounded-md object-cover aspect-square" />
                      <button onClick={() => removeFile(file.name)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <XCircle className="h-4 w-4"/>
                      </button>
                    </div>
                  ))}
                </div>
                <Button onClick={handleUpload} disabled={isUploading || limitReached} className="w-full">
                  {isUploading ? "Uploading..." : `Upload ${files.length} Photo(s)`}
                </Button>
              </div>
            )}

          </CardContent>
        </Card>
      </main>
    </div>
  );
}
