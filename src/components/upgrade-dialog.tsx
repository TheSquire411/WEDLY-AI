
"use client";

import { useSubscription } from '@/hooks/use-subscription';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { CheckCircle2, Gem } from 'lucide-react';

const proFeatures = [
    "AI Vow Generator",
    "AI Budget Assistant",
    "AI Seating Chart Assistant",
    "Unlimited Vision Board Generation",
    "Shared Photo Album for Guests",
];

export function UpgradeDialog() {
  const { isDialogOpen, closeDialog, upgrade } = useSubscription();

  return (
    <Dialog open={isDialogOpen} onOpenChange={closeDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center justify-center text-2xl font-headline gap-2">
            <Gem className="h-6 w-6 text-primary" />
            Upgrade to Wedly Pro
          </DialogTitle>
          <DialogDescription className="text-center pt-2">
            Unlock all the powerful AI features to make your wedding planning effortless.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
            <h3 className="text-center font-semibold mb-4">Pro features include:</h3>
            <ul className="space-y-2">
                {proFeatures.map((feature, index) => (
                    <li key={index} className="flex items-center gap-3">
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                        <span className="text-sm">{feature}</span>
                    </li>
                ))}
            </ul>
        </div>
        <DialogFooter>
          <Button onClick={upgrade} className="w-full" size="lg">
            Upgrade Now for $49
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
