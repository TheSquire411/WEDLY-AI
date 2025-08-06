
"use client";

import Link from 'next/link';
import { useUser } from '@/hooks/use-user';

export function Footer() {
  const { user } = useUser();

  return (
    <footer className="text-center p-4 text-muted-foreground text-sm border-t">
      <div className="container mx-auto flex justify-between items-center">
        <p>Wedly &copy; {new Date().getFullYear()}</p>
        <div className="flex gap-4">
          <Link href="/blog" className="hover:text-primary transition-colors">Blog</Link>
          <Link href="/faq" className="hover:text-primary transition-colors">FAQ</Link>
          {user?.isAdmin && (
            <Link href="/admin" className="hover:text-primary transition-colors">Admin</Link>
          )}
        </div>
      </div>
    </footer>
  );
}
