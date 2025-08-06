
"use client";

import * as React from 'react';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, PlusCircle } from 'lucide-react';
import { useTasks, type Task } from '@/hooks/use-tasks';

export function TaskManager() {
  const [newTaskTitle, setNewTaskTitle] = React.useState("");
  const { tasks, loading, addTask, toggleTask } = useTasks();

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTaskTitle.trim() === "") return;

    addTask(newTaskTitle.trim());
    setNewTaskTitle("");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Wedding Checklist</CardTitle>
        <CardDescription>Stay on top of your wedding planning with this timeline.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleAddTask} className="flex items-center gap-2 mb-4">
            <Input
                placeholder="Add a new to-do..."
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                className="flex-grow"
            />
            <Button type="submit" variant="outline">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Task
            </Button>
        </form>
        <div className="space-y-4">
          {loading ? (
             <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            tasks.map((task) => (
                <div key={task.id} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-primary/5 transition-colors">
                <Checkbox
                    id={`task-${task.id}`}
                    checked={task.completed}
                    onCheckedChange={() => toggleTask(task.id, !task.completed)}
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
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
