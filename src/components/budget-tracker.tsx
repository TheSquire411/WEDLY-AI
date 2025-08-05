"use client";

import { useState, useMemo } from 'react';
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
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Wand2, PlusCircle, Pen } from 'lucide-react';
import { BudgetPieChart, type BudgetItem } from './budget-pie-chart';

const initialExpenses = [
  { category: 'Venue', estimated: 5000, actual: 5500, vendor: 'Sunshine Meadows' },
  { category: 'Catering', estimated: 6000, actual: 5800, vendor: 'Gourmet Delights' },
  { category: 'Photography', estimated: 2500, actual: 2500, vendor: 'Timeless Snaps' },
  { category: 'Flowers', estimated: 1500, actual: 1200, vendor: 'Blooming Creations' },
  { category: 'Attire', estimated: 2000, actual: 2750, vendor: 'Elegant Gowns' },
];

export function BudgetTracker() {
  const [suggestions, setSuggestions] = useState<BudgetItem[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [totalBudget, setTotalBudget] = useState(20000);
  const [expenses, setExpenses] = useState(initialExpenses);
  const { toast } = useToast();

  const totalSpent = useMemo(() => {
    return expenses.reduce((sum, expense) => sum + expense.actual, 0);
  }, [expenses]);

  const remainingBudget = useMemo(() => totalBudget - totalSpent, [totalBudget, totalSpent]);
  const spentPercentage = useMemo(() => (totalSpent / totalBudget) * 100, [totalBudget, totalSpent]);

  async function getSuggestions() {
    setIsLoading(true);
    setSuggestions(null);
    try {
      const result = await budgetAllocationSuggestions({
        remainingBudget: remainingBudget,
        currentExpenses: expenses.map(e => ({ category: e.category, actual: e.actual, vendor: e.vendor })),
        priorityItems: 'Photography, good food, and an open bar', // This could be made dynamic
      });
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
    <div className="space-y-8">
      <Card>
        <CardHeader>
            <CardTitle className="font-headline text-2xl">Budget Overview</CardTitle>
            <CardDescription>Set your total budget and see your progress.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="grid gap-1.5">
                    <Label htmlFor="totalBudget" className="text-base">Total Budget</Label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                        <Input
                            id="totalBudget"
                            type="number"
                            value={totalBudget}
                            onChange={(e) => setTotalBudget(Number(e.target.value))}
                            className="w-48 pl-7 text-lg font-bold"
                        />
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-sm text-muted-foreground">Remaining</p>
                    <p className="text-2xl font-bold text-green-600">${remainingBudget.toLocaleString()}</p>
                </div>
            </div>
            <div>
                <div className="flex justify-between mb-1 text-sm">
                    <span className="font-medium text-muted-foreground">Spent: ${totalSpent.toLocaleString()}</span>
                    <span className="font-medium text-muted-foreground">{spentPercentage.toFixed(1)}%</span>
                </div>
                <Progress value={spentPercentage} className="h-3" />
            </div>
        </CardContent>
      </Card>

      <div className="grid gap-8 md:grid-cols-5">
        <div className="md:col-span-3">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle className="font-headline text-2xl">Expense Tracker</CardTitle>
                <CardDescription>Keep track of your wedding expenses.</CardDescription>
              </div>
               <Button variant="outline">
                <PlusCircle className="mr-2" />
                Add Expense
              </Button>
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
                      <TableCell>${expense.estimated.toLocaleString()}</TableCell>
                      <TableCell className="text-right">${expense.actual.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
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
                Get AI suggestions for your remaining budget.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
               <p className="text-sm text-muted-foreground">Based on your spending so far, let our AI help you plan how to best use your remaining <span className="font-bold text-foreground">${remainingBudget.toLocaleString()}</span>.</p>
               <Button onClick={getSuggestions} disabled={isLoading} className="w-full">
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Wand2 className="mr-2 h-4 w-4" />
                )}
                Generate Suggestions
              </Button>

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
    </div>
  );
}
