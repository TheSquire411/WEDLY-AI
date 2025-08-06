
"use client";

import { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { db } from '@/lib/firebase';
import { collection, doc, onSnapshot, updateDoc, addDoc, Timestamp, runTransaction } from 'firebase/firestore';
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
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogClose,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
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
import { useUser } from '@/hooks/use-user';

export interface Expense {
    id: string;
    category: string;
    estimated: number;
    actual: number;
    vendor: string;
    dueDate: Date;
    paid: boolean;
    reminder: boolean;
}

const expenseSchema = z.object({
    category: z.string().min(1, "Category is required"),
    vendor: z.string().min(1, "Vendor is required"),
    actual: z.coerce.number().min(0, "Amount must be positive"),
    dueDate: z.coerce.date(),
});


export function BudgetTracker() {
  const [suggestions, setSuggestions] = useState<BudgetItem[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [totalBudget, setTotalBudget] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);

  const { toast } = useToast();
  const { isPremium, openDialog } = useSubscription();
  const { user } = useUser();
  
  const form = useForm<z.infer<typeof expenseSchema>>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      category: "",
      vendor: "",
      actual: 0,
      dueDate: new Date(),
    },
  });

  const budgetDocRef = useMemo(() => {
    if (!user) return null;
    return doc(db, 'users', user.uid, 'budget', 'summary');
  }, [user]);

  const expensesCollectionRef = useMemo(() => {
    if (!user) return null;
    return collection(db, 'users', user.uid, 'expenses');
  }, [user]);


  useEffect(() => {
    if (!budgetDocRef || !expensesCollectionRef) {
      setIsDataLoading(false);
      return;
    }
    setIsDataLoading(true);

    const unsubscribeBudget = onSnapshot(budgetDocRef, (doc) => {
        if (doc.exists()) {
            const data = doc.data();
            setTotalBudget(data.total || 0);
            setTotalSpent(data.spent || 0);
        }
    });
    
    const unsubscribeExpenses = onSnapshot(expensesCollectionRef, (snapshot) => {
        const expensesData = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                dueDate: (data.dueDate as Timestamp).toDate()
            } as Expense;
        });
        setExpenses(expensesData);
        setIsDataLoading(false);
    });

    return () => {
        unsubscribeBudget();
        unsubscribeExpenses();
    }
  }, [budgetDocRef, expensesCollectionRef]);


  const remainingBudget = useMemo(() => totalBudget - totalSpent, [totalBudget, totalSpent]);
  const spentPercentage = useMemo(() => (totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0), [totalBudget, totalSpent]);

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

  const togglePaidStatus = async (id: string, currentStatus: boolean, amount: number) => {
    if (!user || !budgetDocRef) return;
    const expenseDocRef = doc(db, 'users', user.uid, 'expenses', id);
    
    try {
        await runTransaction(db, async (transaction) => {
            const budgetSummaryDoc = await transaction.get(budgetDocRef);
            if (!budgetSummaryDoc.exists()) {
                throw "Budget summary does not exist!";
            }
            const newSpent = currentStatus 
                ? budgetSummaryDoc.data().spent - amount // un-paying
                : budgetSummaryDoc.data().spent + amount; // paying
            
            transaction.update(budgetDocRef, { spent: newSpent });
            transaction.update(expenseDocRef, { paid: !currentStatus });
        });
    } catch (e) {
        console.error("Transaction failed: ", e);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not update payment status.'});
    }
  };
  
  const toggleReminder = async (id: string) => {
    if (!user) return;
    const expenseDocRef = doc(db, 'users', user.uid, 'expenses', id);
    const expense = expenses.find(e => e.id === id);
    if(expense) {
        await updateDoc(expenseDocRef, { reminder: !expense.reminder });
    }
  };

  async function handleAddExpense(values: z.infer<typeof expenseSchema>) {
    if (!expensesCollectionRef) return;
    await addDoc(expensesCollectionRef, {
        ...values,
        estimated: values.actual,
        paid: false,
        reminder: false,
        dueDate: Timestamp.fromDate(values.dueDate),
    });

    toast({
        title: "Expense Added",
        description: `${values.category} for $${values.actual} has been added to your budget.`,
    });
    form.reset();
    setIsAddExpenseOpen(false);
  }

  const handleBudgetChange = async (newTotal: number) => {
      setTotalBudget(newTotal);
      if(budgetDocRef) {
          await updateDoc(budgetDocRef, { total: newTotal }, { merge: true });
      }
  }

  if (isDataLoading) {
    return <div className="flex justify-center items-center p-8"><Loader2 className="h-8 w-8 animate-spin"/></div>
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
                            onChange={(e) => handleBudgetChange(Number(e.target.value))}
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
               <Button variant="outline" onClick={() => setIsAddExpenseOpen(true)}>
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
                    <TableRow key={expense.id} className={`${expense.paid ? 'bg-green-50/50' : ''}`}>
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
                          onClick={() => toggleReminder(expense.id)}
                          className={expense.reminder ? 'text-primary' : 'text-muted-foreground'}
                        >
                          <Bell className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => togglePaidStatus(expense.id, expense.paid, expense.actual)}
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
       <Dialog open={isAddExpenseOpen} onOpenChange={setIsAddExpenseOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Expense</DialogTitle>
            <DialogDescription>
              Enter the details of your new expense below.
            </DialogDescription>
          </DialogHeader>
            <Form {...form}>
            <form onSubmit={form.handleSubmit(handleAddExpense)} className="space-y-4 py-4">
                <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Category</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g. Catering" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="vendor"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Vendor</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g. Gourmet Delights" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="actual"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Amount</FormLabel>
                        <FormControl>
                             <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                                <Input type="number" placeholder="1200" {...field} className="pl-7"/>
                            </div>
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="dueDate"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Due Date</FormLabel>
                        <FormControl>
                            <Input type="date" {...field} 
                             onChange={e => field.onChange(new Date(e.target.value))}
                             value={field.value ? format(field.value, 'yyyy-MM-dd') : ''}
                            />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <DialogFooter>
                    <DialogClose asChild>
                    <Button type="button" variant="secondary">Cancel</Button>
                    </DialogClose>
                    <Button type="submit">Add Expense</Button>
                </DialogFooter>
            </form>
            </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
