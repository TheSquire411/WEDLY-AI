
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
import { Loader2, Wand2, PlusCircle, Bell, CheckCircle2, Gem } from 'lucide-react';
import { BudgetPieChart, type BudgetItem } from './budget-pie-chart';
import { Badge } from './ui/badge';
import { format } from 'date-fns';
import { useSubscription } from '@/hooks/use-subscription';

const initialExpenses = [
  { category: 'Venue', estimated: 5000, actual: 5500, vendor: 'Sunshine Meadows', dueDate: new Date('2024-10-01'), paid: true, reminder: false },
  { category: 'Catering', estimated: 6000, actual: 5800, vendor: 'Gourmet Delights', dueDate: new Date('2024-10-15'), paid: true, reminder: false },
  { category: 'Photography', estimated: 2500, actual: 2500, vendor: 'Timeless Snaps', dueDate: new Date('2024-09-20'), paid: true, reminder: true },
  { category: 'Flowers', estimated: 1500, actual: 1200, vendor: 'Blooming Creations', dueDate: new Date('2024-11-01'), paid: false, reminder: false },
  { category: 'Attire', estimated: 2000, actual: 2750, vendor: 'Elegant Gowns', dueDate: new Date('2024-08-30'), paid: true, reminder: false },
  { category: 'Entertainment', estimated: 3000, actual: 3000, vendor: 'Groove Band', dueDate: new Date('2024-11-10'), paid: false, reminder: true },
];

export function BudgetTracker() {
  const [suggestions, setSuggestions] = useState<BudgetItem[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [totalBudget, setTotalBudget] = useState(20000);
  const [expenses, setExpenses] = useState(initialExpenses);
  const { toast } = useToast();
  const { isPremium, openDialog } = useSubscription();

  const totalSpent = useMemo(() => {
    return expenses.filter(e => e.paid).reduce((sum, expense) => sum + expense.actual, 0);
  }, [expenses]);

  const remainingBudget = useMemo(() => totalBudget - totalSpent, [totalBudget, totalSpent]);
  const spentPercentage = useMemo(() => (totalSpent / totalBudget) * 100, [totalBudget, totalSpent]);

  async function getSuggestions() {
    if (!isPremium) {
      openDialog();
      return;
    }
    setIsLoading(true);
    setSuggestions(null);
    try {
      const result = await budgetAllocationSuggestions({
        remainingBudget: remainingBudget,
        currentExpenses: expenses.map(e => ({ category: e.category, actual: e.actual, vendor: e.vendor })),
        priorityItems: 'Photography, good food, and an open bar',
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

  const togglePaidStatus = (category: string) => {
    setExpenses(prev =>
      prev.map(e =>
        e.category === category ? { ...e, paid: !e.paid } : e
      )
    );
  };
  
  const toggleReminder = (category: string) => {
    setExpenses(prev =>
        prev.map(e => (e.category === category ? { ...e, reminder: !e.reminder } : e))
    );
  };

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
                    <TableHead>Actual</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map((expense) => (
                    <TableRow key={expense.category} className={`${expense.paid ? 'bg-green-50/50' : ''}`}>
                      <TableCell className="font-medium">{expense.category}<br/><span className="text-xs text-muted-foreground">{expense.vendor}</span></TableCell>
                      <TableCell>${expense.actual.toLocaleString()}</TableCell>
                      <TableCell>{format(expense.dueDate, 'MMM d, yyyy')}</TableCell>
                       <TableCell>
                        <Badge variant={expense.paid ? 'secondary' : 'outline'}>{expense.paid ? 'Paid' : 'Due'}</Badge>
                      </TableCell>
                      <TableCell className="text-right flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleReminder(expense.category)}
                          className={expense.reminder ? 'text-primary' : 'text-muted-foreground'}
                        >
                          <Bell className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => togglePaidStatus(expense.category)}
                          disabled={expense.paid}
                        >
                          <CheckCircle2 className="mr-2 h-4 w-4"/>
                          {expense.paid ? 'Paid' : 'Mark Paid'}
                        </Button>
                      </TableCell>
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
              <div className="flex justify-between items-start">
                  <CardTitle className="font-headline text-2xl flex items-center gap-2">
                    <Wand2 className="h-6 w-6 text-primary" />
                    AI Budget Assistant
                  </CardTitle>
                  {!isPremium && <Badge variant="outline" className="text-primary border-primary"><Gem className="mr-1 h-3 w-3" /> Upgrade to Pro</Badge>}
              </div>
              <CardDescription>
                Get AI suggestions for your remaining budget.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
               <p className="text-sm text-muted-foreground">Based on your spending so far, let our AI help you plan how to best use your remaining <span className="font-bold text-foreground">${remainingBudget.toLocaleString()}</span>.</p>
               <Button onClick={getSuggestions} disabled={isLoading || !isPremium} className="w-full">
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
