
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useUser } from './use-user';
import { db } from '@/lib/firebase';
import { collection, addDoc, onSnapshot, query, orderBy, doc, updateDoc, writeBatch } from 'firebase/firestore';

export interface Task {
    id: string;
    title: string;
    dueDate: string;
    completed: boolean;
    createdAt: Date;
}

const initialTasks = [
  { title: 'Set a date and book venue', dueDate: '12 months out', completed: true },
  { title: 'Finalize guest list', dueDate: '10 months out', completed: true },
  { title: 'Book photographer and videographer', dueDate: '9 months out', completed: true },
  { title: 'Hire a caterer', dueDate: '8 months out', completed: false },
  { title: 'Send save-the-dates', dueDate: '6-8 months out', completed: false },
  { title: 'Purchase wedding attire', dueDate: '6 months out', completed: true },
  { title: 'Book entertainment', dueDate: '5 months out', completed: false },
  { title: 'Order invitations', dueDate: '4 months out', completed: false },
  { title: 'Finalize menu and floral selections', dueDate: '3 months out', completed: false },
  { title: 'Apply for marriage license', dueDate: '1 month out', completed: false },
  { title: 'Confirm final details with vendors', dueDate: '1-2 weeks out', completed: false },
];

interface TaskContextType {
  tasks: Task[];
  loading: boolean;
  addTask: (title: string) => Promise<void>;
  toggleTask: (taskId: string, completed: boolean) => Promise<void>;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useUser();

  const getTasksCollection = useCallback(() => {
    if (!user) return null;
    return collection(db, 'users', user.uid, 'tasks');
  }, [user]);

  useEffect(() => {
    const tasksCollection = getTasksCollection();
    if (!tasksCollection) {
        setTasks([]);
        setLoading(false);
        return;
    }

    setLoading(true);
    const q = query(tasksCollection, orderBy("createdAt", "asc"));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      if (querySnapshot.empty && user) {
        // First-time user, populate with initial tasks
        const batch = writeBatch(db);
        const now = new Date();
        initialTasks.forEach((task, index) => {
            const taskRef = doc(tasksCollection);
            batch.set(taskRef, { ...task, createdAt: new Date(now.getTime() + index) });
        });
        batch.commit().then(() => setLoading(false));
      } else {
        const tasksData: Task[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            tasksData.push({ 
                id: doc.id, 
                ...data,
                createdAt: data.createdAt.toDate(),
            } as Task);
        });
        setTasks(tasksData);
        setLoading(false);
      }
    }, (error) => {
        console.error("Error fetching tasks from Firestore: ", error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [getTasksCollection, user]);

  const addTask = async (title: string) => {
    const tasksCollection = getTasksCollection();
    if (!tasksCollection) throw new Error("User not authenticated.");
    try {
        await addDoc(tasksCollection, {
            title,
            dueDate: 'Just added',
            completed: false,
            createdAt: new Date(),
        });
    } catch (error) {
        console.error("Error adding task to Firestore: ", error);
    }
  };

  const toggleTask = async (taskId: string, completed: boolean) => {
    if (!user) throw new Error("User not authenticated.");
    const taskDocRef = doc(db, 'users', user.uid, 'tasks', taskId);
    try {
        await updateDoc(taskDocRef, { completed });
    } catch (error) {
        console.error("Error toggling task: ", error);
    }
  }

  const value = {
    tasks,
    loading,
    addTask,
    toggleTask,
  };

  return (
    <TaskContext.Provider value={value}>
      {children}
    </TaskContext.Provider>
  );
};

export const useTasks = () => {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error('useTasks must be used within a TaskProvider');
  }
  return context;
};
