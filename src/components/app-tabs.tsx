"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardOverview } from '@/components/dashboard-overview';
import { BudgetTracker } from '@/components/budget-tracker';
import { TaskManager } from '@/components/task-manager';
import { GuestList } from '@/components/guest-list';
import { VisionBoard } from '@/components/vision-board';
import { SeatingChart } from '@/components/seating-chart';
import { LayoutDashboard, CircleDollarSign, ListChecks, Users, GalleryHorizontal, Armchair } from 'lucide-react';

export function AppTabs() {
  return (
    <Tabs defaultValue="dashboard" className="w-full">
      <TabsList className="grid w-full grid-cols-2 sm:grid-cols-6 h-auto bg-primary/10 rounded-lg">
        <TabsTrigger value="dashboard" className="py-3 text-sm data-[state=active]:bg-white data-[state=active]:text-primary-foreground data-[state=active]:shadow-md">
          <LayoutDashboard className="mr-2 h-5 w-5" />
          Dashboard
        </TabsTrigger>
        <TabsTrigger value="vision-board" className="py-3 text-sm data-[state=active]:bg-white data-[state=active]:text-primary-foreground data-[state=active]:shadow-md">
          <GalleryHorizontal className="mr-2 h-5 w-5" />
          Vision Board
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
        <DashboardOverview />
      </TabsContent>
       <TabsContent value="vision-board" className="mt-6">
        <VisionBoard />
      </TabsContent>
      <TabsContent value="budget" className="mt-6">
        <BudgetTracker />
      </TabsContent>
      <TabsContent value="tasks" className="mt-6">
        <TaskManager />
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
