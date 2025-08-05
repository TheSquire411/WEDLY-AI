
"use client";

import * as React from 'react';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

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

export function TaskManager() {
  const [tasks, setTasks] = React.useState(initialTasks);

  const handleTaskToggle = (taskId: string) => {
    setTasks(currentTasks =>
      currentTasks.map(task =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Wedding Checklist</CardTitle>
        <CardDescription>Stay on top of your wedding planning with this timeline.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {tasks.map((task) => (
            <div key={task.id} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-primary/5 transition-colors">
              <Checkbox
                id={`task-${task.id}`}
                checked={task.completed}
                onCheckedChange={() => handleTaskToggle(task.id)}
                aria-label={`Mark "${task.title}" as complete`}
              />
              <div className="flex-1">
                <label
                  htmlFor={`task-${task.id}`}
                  className={`text-sm font-medium leading-none ${task.completed ? 'line-through text-muted-foreground' : ''} cursor-pointer`}
                >
                  {task.title}
                </label>
              </div>
              <Badge variant={task.completed ? "secondary" : "outline"} className="hidden sm:inline-flex">{task.dueDate}</Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
