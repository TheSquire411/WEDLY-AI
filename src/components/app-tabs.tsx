
"use client";

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardOverview } from '@/components/dashboard-overview';
import { BudgetTracker, type Expense } from '@/components/budget-tracker';
import { TaskManager, type Task } from '@/components/task-manager';
import { GuestList } from '@/components/guest-list';
import { VisionBoard } from '@/components/vision-board';
import { SeatingChart } from '@/components/seating-chart';
import { PhotoAlbum } from '@/components/photo-album';
import { LayoutDashboard, CircleDollarSign, ListChecks, Users, GalleryHorizontal, Armchair, Camera } from 'lucide-react';
import { useGuests } from '@/hooks/use-guests';

const initialExpenses = [
  { id: '1', category: 'Venue', estimated: 5000, actual: 5500, vendor: 'Sunshine Meadows', dueDate: new Date('2024-10-01'), paid: true, reminder: false },
  { id: '2', category: 'Catering', estimated: 6000, actual: 5800, vendor: 'Gourmet Delights', dueDate: new Date('2024-10-15'), paid: true, reminder: false },
  { id: '3', category: 'Photography', estimated: 2500, actual: 2500, vendor: 'Timeless Snaps', dueDate: new Date('2024-09-20'), paid: true, reminder: true },
  { id: '4', category: 'Flowers', estimated: 1500, actual: 1200, vendor: 'Blooming Creations', dueDate: new Date('2024-11-01'), paid: false, reminder: false },
  { id: '5', category: 'Attire', estimated: 2000, actual: 2750, vendor: 'Elegant Gowns', dueDate: new Date('2024-08-30'), paid: true, reminder: false },
  { id: '6', category: 'Entertainment', estimated: 3000, actual: 3000, vendor: 'Groove Band', dueDate: new Date('2024-11-10'), paid: false, reminder: true },
];

const initialTasks = [
  { id: '1', title: 'Set a date and book venue', dueDate: '12 months out', completed: true },
  { id: '2', title: 'Finalize guest list', dueDate: '10 months out', completed: true },
  { id: '3', title: 'Book photographer and videographer', dueDate: '9 months out', completed: true },
  { id: '4', title: 'Hire a caterer', dueDate: '8 months out', completed: false },
  { id: '5', title: 'Send save-the-dates', dueDate: '6-8 months out', completed: false },
  { id: '6', title: 'Purchase wedding attire', dueDate: '6 months out', completed: true },
  { id: '7', title: 'Book entertainment', dueDate: '5 months out', completed: false },
  { id: '8', title: 'Order invitations', dueDate: '4 months out', completed: false },
  { id: '9', title: 'Finalize menu and floral selections', dueDate: '3 months out', completed: false },
  { id: '10', title: 'Apply for marriage license', dueDate: '1 month out', completed: false },
  { id: '11', title: 'Confirm final details with vendors', dueDate: '1-2 weeks out', completed: false },
];

export function AppTabs() {
  const [totalBudget, setTotalBudget] = useState(20000);
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const { guests } = useGuests();

  const budgetSummary = {
    total: totalBudget,
    spent: expenses.filter(e => e.paid).reduce((sum, exp) => sum + exp.actual, 0),
  };

  const guestSummary = {
    total: guests.length,
    confirmed: guests.filter(g => g.rsvp === 'Confirmed').length,
  };
  
  const taskSummary = {
    remaining: tasks.filter(t => !t.completed).length,
    // A simple overdue mock logic, can be refined later
    overdue: tasks.filter(t => !t.completed && (t.dueDate.includes('months out') || t.dueDate.includes('weeks out'))).length,
  };


  return (
    <Tabs defaultValue="dashboard" className="w-full">
      <TabsList className="grid w-full grid-cols-2 sm:grid-cols-7 h-auto bg-primary/10 rounded-lg">
        <TabsTrigger value="dashboard" className="py-3 text-sm data-[state=active]:bg-white data-[state=active]:text-primary-foreground data-[state=active]:shadow-md">
          <LayoutDashboard className="mr-2 h-5 w-5" />
          Dashboard
        </TabsTrigger>
        <TabsTrigger value="vision-board" className="py-3 text-sm data-[state=active]:bg-white data-[state=active]:text-primary-foreground data-[state=active]:shadow-md">
          <GalleryHorizontal className="mr-2 h-5 w-5" />
          Vision Board
        </TabsTrigger>
         <TabsTrigger value="photos" className="py-3 text-sm data-[state=active]:bg-white data-[state=active]:text-primary-foreground data-[state=active]:shadow-md">
          <Camera className="mr-2 h-5 w-5" />
          Photos
        </TabsTrigger>
        <TabsTrigger value="budget" className="py-3 text-sm data-[state=active]:bg-white data-[state=active]:text-primary-foreground data-[state=active]:shadow-md">
          <CircleDollarSign className="mr-2 h-5 w-5" />
          Budget
        </TabsTrigger>
        <TabsTrigger value="tasks" className="py-3 text-sm data-[state=active]:bg-white data-[state=active]:text-primary-foreground data-[state=active]:shadow-md">
          <ListChecks className="mr-2 h-5 w-5" />
          Tasks
        </TabsTrigger>
        <TabsTrigger value="guests" className="py-3 text-sm data-[state=active]:bg-white data-[state=active]:text-primary-foreground data-[state=active]:shadow-md">
          <Users className="mr-2 h-5 w-5" />
          Guest List
        </TabsTrigger>
        <TabsTrigger value="seating" className="py-3 text-sm data-[state=active]:bg-white data-[state=active]:text-primary-foreground data-[state=active]:shadow-md">
          <Armchair className="mr-2 h-5 w-5" />
          Seating
        </TabsTrigger>
      </TabsList>
      <TabsContent value="dashboard" className="mt-6">
        <DashboardOverview
            budgetSummary={budgetSummary}
            guestSummary={guestSummary}
            taskSummary={taskSummary}
        />
      </TabsContent>
       <TabsContent value="vision-board" className="mt-6">
        <VisionBoard />
      </TabsContent>
      <TabsContent value="photos" className="mt-6">
        <PhotoAlbum />
      </TabsContent>
      <TabsContent value="budget" className="mt-6">
        <BudgetTracker
            totalBudget={totalBudget}
            setTotalBudget={setTotalBudget}
            expenses={expenses}
            setExpenses={setExpenses}
        />
      </TabsContent>
      <TabsContent value="tasks" className="mt-6">
        <TaskManager tasks={tasks} setTasks={setTasks} />
      </TabsContent>
      <TabsContent value="guests" className="mt-6">
        <GuestList />
      </TabsContent>
      <TabsContent value="seating" className="mt-6">
        <SeatingChart />
      </TabsContent>
    </Tabs>
  );
}
