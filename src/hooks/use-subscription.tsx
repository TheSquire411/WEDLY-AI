
"use client";

import React, { createContext, useContext, useState } from 'react';
import { useUser } from './use-user';

interface SubscriptionContextType {
  isPremium: boolean;
  isDialogOpen: boolean;
  openDialog: () => void;
  closeDialog: () => void;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { user } = useUser();

  const isPremium = !!user?.premium;

  const openDialog = () => setIsDialogOpen(true);
  const closeDialog = () => setIsDialogOpen(false);
  

  const value = {
    isPremium,
    isDialogOpen,
    openDialog,
    closeDialog
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};
