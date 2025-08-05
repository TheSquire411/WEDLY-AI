"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { budgetAllocationSuggestions } from '@/ai/flows/budget-allocation-suggestions';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Wand2 } from 'lucide-react';
import { BudgetPieChart, type BudgetItem } from './budget-pie-chart';

const formSchema = z.object({
  totalBudget: z.coerce.number().min(1000, {
    message: 'Total budget must be at least $1,000.',
  }),
  priorityItems: z.string().min(3, {
    message: 'Please list at least one priority.',
  }),
});

const expenses = [
  { category: 'Venue', estimated: '$5,000', actual: '$5,500', vendor: 'Sunshine Meadows' },
  { category: 'Catering', estimated: '$6,000', actual: '$5,800', vendor: 'Gourmet Delights' },
  { category: 'Photography', estimated: '$2,500', actual: '$2,500', vendor: 'Timeless Snaps' },
  { category: 'Flowers', estimated: '$1,500', actual: '$1,200', vendor: 'Blooming Creations' },
  { category: 'Attire', estimated: '$2,000', actual: '$2,750', vendor: 'Elegant Gowns' },
];

export function BudgetTracker() {
  const [suggestions, setSuggestions] = useState<BudgetItem[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      totalBudget: 20000,
      priorityItems: 'Photography, good food, and an open bar',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setSuggestions(null);
    try {
      const result = await budgetAllocationSuggestions(values);
      const parsedSuggestions = JSON.parse(result.suggestedAllocations);
      const chartData = Object.entries(parsedSuggestions).map(([name, value]) => ({
        name,
        value: Number(String(value).replace(/[^0-9.-]+/g,"")),
      }));
      setSuggestions(chartData);
    } catch (error) {
      console.error('AI Budget Assistant Error:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to get budget suggestions. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="grid gap-8 md:grid-cols-5">
      <div className="md:col-span-3">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline text-2xl">Budget Tracker</CardTitle>
            <CardDescription>Keep track of your wedding expenses.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Estimated</TableHead>
                  <TableHead className="text-right">Actual</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((expense) => (
                  <TableRow key={expense.category}>
                    <TableCell className="font-medium">{expense.category}</TableCell>
                    <TableCell className="text-muted-foreground">{expense.vendor}</TableCell>
                    <TableCell>{expense.estimated}</TableCell>
                    <TableCell className="text-right">{expense.actual}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button>Add Expense</Button>
          </CardFooter>
        </Card>
      </div>
      <div className="md:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline text-2xl flex items-center gap-2">
              <Wand2 className="h-6 w-6 text-primary" />
              AI Budget Assistant
            </CardTitle>
            <CardDescription>
              Get AI-powered budget allocation suggestions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="totalBudget"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Budget ($)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g. 20000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="priorityItems"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>What's most important to you?</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. photography, food, venue" {...field} />
                      </FormControl>
                      <FormDescription>
                        Separate items with a comma.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Wand2 className="mr-2 h-4 w-4" />
                  )}
                  Generate Suggestions
                </Button>
              </form>
            </Form>

            {suggestions && (
              <div className="mt-6">
                <h3 className="font-bold text-center mb-2">Suggested Allocations</h3>
                <BudgetPieChart data={suggestions} />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
