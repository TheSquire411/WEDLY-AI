
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, ListChecks, Gem } from "lucide-react";
import { VowGenerator } from './vow-generator';
import { WeddingAssistant } from "./wedding-assistant";
import { useUser } from "@/hooks/use-user";

interface DashboardOverviewProps {
    budgetSummary: {
        spent: number;
        total: number;
    };
    guestSummary: {
        confirmed: number;
        total: number;
    };
    taskSummary: {
        remaining: number;
        overdue: number;
    };
}

export function DashboardOverview({ budgetSummary, guestSummary, taskSummary }: DashboardOverviewProps) {
  const budgetSpentPercent = budgetSummary.total > 0 ? (budgetSummary.spent / budgetSummary.total) * 100 : 0;
  const { user } = useUser();

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
            <div className="text-2xl font-bold">${budgetSummary.spent.toLocaleString()} / ${budgetSummary.total.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{budgetSpentPercent.toFixed(0)}% of budget spent</p>
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
            <p className="text-xs text-muted-foreground">{taskSummary.overdue} overdue</p>
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
