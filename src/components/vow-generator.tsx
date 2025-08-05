
"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { generateVows } from '@/ai/flows/vow-generator';
import { useSubscription } from '@/hooks/use-subscription';
import { useUser } from '@/hooks/use-user';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles, Wand2, Gem } from 'lucide-react';
import { Badge } from './ui/badge';

const formSchema = z.object({
  partnerName: z.string().min(1, { message: "Partner's name is required." }),
  keyMemories: z.string().min(10, { message: 'Please share a few memories (at least 10 characters).' }),
  tone: z.enum(['humorous', 'romantic', 'sentimental', 'traditional']),
});

export function VowGenerator() {
  const [generatedVows, setGeneratedVows] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { isPremium, openDialog } = useSubscription();
  const { user } = useUser();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      partnerName: user.name2,
      keyMemories: 'Our first trip to the beach, the time we built a pillow fort and watched movies all day, and when we adopted our puppy, Sparky.',
      tone: 'romantic',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!isPremium) {
      openDialog();
      return;
    }
    setIsLoading(true);
    setGeneratedVows(null);
    try {
      const result = await generateVows(values);
      setGeneratedVows(result.vows);
    } catch (error) {
      console.error('AI Vow Generator Error:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to generate vows. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-start">
            <CardTitle className="font-headline text-2xl flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            AI Vow Generator
            </CardTitle>
            {!isPremium && <Badge variant="outline" className="text-primary border-primary"><Gem className="mr-1 h-3 w-3" /> Upgrade to Pro</Badge>}
        </div>
        <CardDescription>
          Struggling to find the right words? Let our AI help you craft the perfect vows.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
               <FormField
                control={form.control}
                name="partnerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Partner's Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Alex" {...field} disabled={!isPremium} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="tone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Desired Tone</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!isPremium}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a tone" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="romantic">Romantic</SelectItem>
                        <SelectItem value="humorous">Humorous</SelectItem>
                        <SelectItem value="sentimental">Sentimental</SelectItem>
                        <SelectItem value="traditional">Traditional</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="keyMemories"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Share some key memories</FormLabel>
                  <FormControl>
                    <Textarea placeholder="e.g. Our first date, a special trip, an inside joke..." {...field} rows={3} disabled={!isPremium} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isLoading || !isPremium} className="w-full">
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Wand2 className="mr-2 h-4 w-4" />
              )}
              Generate Vows
            </Button>
          </form>
        </Form>

        {generatedVows && (
          <div className="mt-6 border-t pt-6">
            <h3 className="font-headline text-xl text-center mb-4">Your AI-Drafted Vows</h3>
            <div className="prose prose-sm max-w-none bg-primary/5 p-4 rounded-lg text-foreground/90 flex-grow">
                <p className="whitespace-pre-wrap">{generatedVows}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
