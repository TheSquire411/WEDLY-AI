
"use client"

import { ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function AdminHeader() {
  return (
    <header className="border-b bg-card shadow-sm">
      <div className="container mx-auto flex h-20 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <ShieldCheck className="text-primary h-8 w-8" />
          <h1 className="text-3xl font-headline font-bold text-foreground">Wedly Admin</h1>
        </div>
        <div className="flex items-center gap-4">
            <Button asChild variant="outline">
                <Link href="/dashboard">
                    Back to App
                </Link>
            </Button>
        </div>
      </div>
    </header>
  );
}
