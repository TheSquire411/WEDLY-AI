
"use client";

import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { askWeddingAssistant } from '@/ai/flows/wedding-assistant';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Bot, Send } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { Avatar, AvatarFallback } from './ui/avatar';
import { cn } from '@/lib/utils';
import { useUser } from '@/hooks/use-user';

const formSchema = z.object({
  question: z.string().min(5, { message: "Please ask a complete question." }),
});

interface Message {
    role: 'user' | 'assistant';
    text: string;
}

export function WeddingAssistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useUser();
  const scrollAreaRef = useRef<HTMLDivElement>(null);


  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      question: '',
    },
  });

  useEffect(() => {
    // Scroll to bottom when messages change
    if (scrollAreaRef.current) {
        scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
        toast({
            variant: 'destructive',
            title: 'Not Logged In',
            description: 'You need to be logged in to use the assistant.',
        });
        return;
    }

    setIsLoading(true);
    setMessages(prev => [...prev, { role: 'user', text: values.question }]);
    form.reset();

    try {
      const result = await askWeddingAssistant({question: values.question, userId: user.uid });
      setMessages(prev => [...prev, { role: 'assistant', text: result.answer }]);
    } catch (error) {
      console.error('AI Assistant Error:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'The assistant is currently unavailable. Please try again later.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="font-headline text-2xl flex items-center gap-2">
          <Bot className="h-6 w-6 text-primary" />
          AI Wedding Assistant
        </CardTitle>
        <CardDescription>
          Ask me anything about your wedding plan!
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col gap-4">
        <ScrollArea className="flex-grow h-64 pr-4" ref={scrollAreaRef}>
           <div className="space-y-4">
            {messages.length === 0 && (
                <div className="text-center text-muted-foreground pt-10">
                    <p>I can answer questions like:</p>
                    <ul className="text-sm list-inside list-disc mt-2">
                        <li>How much of my budget have I spent?</li>
                        <li>How many guests have confirmed?</li>
                        <li>What tasks do I have left?</li>
                    </ul>
                </div>
            )}
            {messages.map((message, index) => (
              <div key={index} className={cn("flex items-start gap-3", message.role === 'user' ? 'justify-end' : '')}>
                {message.role === 'assistant' && (
                    <Avatar className="h-8 w-8 bg-primary text-primary-foreground">
                        <AvatarFallback>AI</AvatarFallback>
                    </Avatar>
                )}
                <div className={cn(
                    "p-3 rounded-lg max-w-sm",
                    message.role === 'user' ? 'bg-muted' : 'bg-primary/10'
                )}>
                  <p className="text-sm">{message.text}</p>
                </div>
              </div>
            ))}
            {isLoading && (
                <div className="flex items-start gap-3">
                    <Avatar className="h-8 w-8 bg-primary text-primary-foreground">
                        <AvatarFallback>AI</AvatarFallback>
                    </Avatar>
                     <div className="p-3 rounded-lg bg-primary/10">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    </div>
                </div>
            )}
          </div>
        </ScrollArea>
        <div className="mt-auto">
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-start gap-2">
                <FormField
                control={form.control}
                name="question"
                render={({ field }) => (
                    <FormItem className="flex-grow">
                    <FormControl>
                        <Input placeholder="Ask about your budget, guests, tasks..." {...field} disabled={isLoading}/>
                    </FormControl>
                    <FormMessage className="text-xs px-1" />
                    </FormItem>
                )}
                />
                <Button type="submit" size="icon" disabled={isLoading} className="shrink-0">
                    <Send className="h-4 w-4" />
                    <span className="sr-only">Send</span>
                </Button>
            </form>
            </Form>
        </div>
      </CardContent>
    </Card>
  );
}
