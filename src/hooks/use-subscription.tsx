
"use client";

import { UpgradeDialog } from '@/components/upgrade-dialog';
import React, { createContext, useContext, useState } from 'react';

interface SubscriptionContextType {
  isPremium: boolean;
  isDialogOpen: boolean;
  upgrade: () => void;
  openDialog: () => void;
  closeDialog: () => void;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isPremium, setIsPremium] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const upgrade = () => {
    setIsPremium(true);
    setIsDialogOpen(false);
  };

  const openDialog = () => setIsDialogOpen(true);
  const closeDialog = () => setIsDialogOpen(false);
  

  const value = {
    isPremium,
    isDialogOpen,
    upgrade,
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
