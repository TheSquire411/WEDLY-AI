'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const includedFeatures = [
  'AI-Powered Checklists',
  'Smart Guest Management',
  'Basic Budget Tracking',
  'Community Support',
];

export function Upgrade() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleUpgrade = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Something went wrong');
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl sm:text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Upgrade for Unlimited Planning</h2>
          <p className="mt-6 text-lg leading-8 text-gray-300">
            Unlock premium features like the AI Vow Writer, advanced budgeting, and direct vendor messaging to make your planning effortless.
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-2xl rounded-3xl ring-1 ring-white/10 sm:mt-20 lg:mx-0 lg:flex lg:max-w-none">
          <div className="p-8 sm:p-10 lg:flex-auto">
            <h3 className="text-2xl font-bold tracking-tight">Lifetime membership</h3>
            <p className="mt-6 text-base leading-7 text-gray-300">
              Get full access to all of Wedly’s premium features, forever. One payment, endless peace of mind.
            </p>
            <div className="mt-10 flex items-center gap-x-4">
              <h4 className="flex-none text-sm font-semibold leading-6 text-primary">What’s included</h4>
              <div className="h-px flex-auto bg-white/10" />
            </div>
            <ul
              role="list"
              className="mt-8 grid grid-cols-1 gap-4 text-sm leading-6 text-gray-300 sm:grid-cols-2 sm:gap-6"
            >
              {includedFeatures.map((feature) => (
                <li key={feature} className="flex gap-x-3">
                  <Check className="h-6 w-5 flex-none text-primary" aria-hidden="true" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
          <div className="-mt-2 p-2 lg:mt-0 lg:w-full lg:max-w-md lg:flex-shrink-0">
            <div className="rounded-2xl bg-white/5 py-10 text-center ring-1 ring-inset ring-white/10 lg:flex lg:flex-col lg:justify-center lg:py-16">
              <div className="mx-auto max-w-xs px-8">
                <p className="text-base font-semibold">One-time payment</p>
                <p className="mt-6 flex items-baseline justify-center gap-x-2">
                  <span className="text-5xl font-bold tracking-tight">$49.99</span>
                  <span className="text-sm font-semibold leading-6 tracking-wide">AUD</span>
                </p>
                <Button
                  onClick={handleUpgrade}
                  disabled={isLoading}
                  size="lg"
                  className="mt-10 w-full"
                >
                  {isLoading ? 'Processing...' : 'Get full access'}
                </Button>
                <p className="mt-6 text-xs leading-5 text-gray-400">
                  Invoices and receipts available for easy company reimbursement.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
