"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { generateImage } from '@/ai/flows/image-generator';
import Image from 'next/image';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Wand2, ImagePlus } from 'lucide-react';
import { Skeleton } from './ui/skeleton';

const formSchema = z.object({
  prompt: z.string().min(5, { message: "Please enter a more detailed prompt." }),
});

interface VisionBoardGeneratorProps {
    onImageGenerated: (src: string, prompt: string) => void;
}

export function VisionBoardGenerator({ onImageGenerated }: VisionBoardGeneratorProps) {
  const [lastGeneratedImage, setLastGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prompt: 'A romantic, rustic wedding centerpiece',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setLastGeneratedImage(null);
    try {
      const result = await generateImage(values);
      setLastGeneratedImage(result.image);
      onImageGenerated(result.image, values.prompt);
      form.reset({ prompt: '' });
    } catch (error) {
      console.error('AI Image Generator Error:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to generate image. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="overflow-hidden shadow-md aspect-square flex flex-col">
        <div className="bg-muted/30 h-full flex items-center justify-center p-4">
            {isLoading ? (
                <div className="flex flex-col items-center gap-4">
                    <Skeleton className="h-24 w-24 rounded-lg" />
                    <p className="text-sm text-muted-foreground animate-pulse">Generating your vision...</p>
                </div>
            ) : lastGeneratedImage ? (
                 <div className="relative w-full h-full">
                    {/* CORRECTED THIS LINE: "layout='fill'" is outdated */}
                    <Image src={lastGeneratedImage} alt="Last generated image" fill sizes="25vw" className="object-cover rounded-md" />
                 </div>
            ) : (
                <div className="text-center text-muted-foreground">
                    <ImagePlus className="mx-auto h-12 w-12 opacity-50" />
                    <p className="mt-2 text-sm">Generate an image for your vision board</p>
                </div>
            )}
        </div>
        <CardContent className="p-3 bg-background/80 backdrop-blur-sm mt-auto">
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-start gap-2">
                <FormField
                control={form.control}
                name="prompt"
                render={({ field }) => (
                    <FormItem className="flex-grow">
                    <FormControl>
                        <Input placeholder="Describe your vision..." {...field} disabled={isLoading}/>
                    </FormControl>
                    <FormMessage className="text-xs px-1"/>
                    </FormItem>
                )}
                />
                <Button type="submit" size="icon" disabled={isLoading} className="shrink-0">
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                    <span className="sr-only">Generate</span>
                </Button>
            </form>
            </Form>
        </CardContent>
    </Card>
  );
}
