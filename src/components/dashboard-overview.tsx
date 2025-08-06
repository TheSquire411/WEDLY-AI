

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, ListChecks, Gem, Loader2 } from "lucide-react";
import { VowGenerator } from './vow-generator';
import { WeddingAssistant } from "./wedding-assistant";
import { useUser } from "@/hooks/use-user";
import { useGuests } from "@/hooks/use-guests";
import { useTasks } from "@/hooks/use-tasks";
import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface BudgetSummary {
    spent: number;
    total: number;
}

export function DashboardOverview() {
  const { user } = useUser();
  const { guests } = useGuests();
  const { tasks } = useTasks();
  const [budgetSummary, setBudgetSummary] = useState<BudgetSummary | null>(null);

  useEffect(() => {
    if (user?.uid) {
        const budgetDocRef = doc(db, 'users', user.uid, 'budget', 'summary');
        const unsubscribe = onSnapshot(budgetDocRef, (doc) => {
            if (doc.exists()) {
                const data = doc.data();
                setBudgetSummary({ total: data.total, spent: data.spent });
            }
        });
        return () => unsubscribe();
    }
  }, [user?.uid]);
  
  const guestSummary = {
    confirmed: guests.filter(g => g.rsvp === 'Confirmed').length,
    total: guests.length,
  };

  const taskSummary = {
    remaining: tasks.filter(t => !t.completed).length,
    overdue: tasks.filter(t => !t.completed && (t.dueDate.includes('months out') || t.dueDate.includes('weeks out'))).length,
  };
  
  const budgetSpentPercent = budgetSummary && budgetSummary.total > 0 ? (budgetSummary.spent / budgetSummary.total) * 100 : 0;

  if (!user?.name1) {
    return null; // or a loading spinner
  }

  return (
    <div>
      <h2 className="text-4xl font-headline mb-2 text-gray-800">Welcome, {user.name1} &amp; {user.name2}!</h2>
      <p className="text-muted-foreground mb-8">Here's a snapshot of your wedding planning progress.</p>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget Status</CardTitle>
            <Gem className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            {budgetSummary ? (
                <>
                    <div className="text-2xl font-bold">${budgetSummary.spent.toLocaleString()} / ${budgetSummary.total.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">{budgetSpentPercent.toFixed(0)}% of budget spent</p>
                </>
            ) : (
                <Loader2 className="h-5 w-5 animate-spin" />
            )}
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Guests</CardTitle>
            <Users className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{guestSummary.confirmed} / {guestSummary.total}</div>
            <p className="text-xs text-muted-foreground">RSVPs confirmed</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks Remaining</CardTitle>
            <ListChecks className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{taskSummary.remaining}</div>
            <p className="text-xs text-muted-foreground">{taskSummary.overdue > 0 ? `${taskSummary.overdue} overdue` : "No tasks overdue"}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 mt-8 md:grid-cols-2">
        <WeddingAssistant />
        <VowGenerator />
      </div>

    </div>
  );
}
