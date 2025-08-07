

"use client"

import Link from 'next/link';
import { Heart, Gem, LogOut, User as UserIcon, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useSubscription } from '@/hooks/use-subscription';
import { UpgradeDialog } from './upgrade-dialog';
import { useUser } from '@/hooks/use-user';
import { useRouter } from 'next/navigation';

export function Header() {
  const { isPremium, openDialog } = useSubscription();
  const { user, signOutUser } = useUser();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOutUser();
    router.push('/');
  };

  const getInitials = (name1?: string, name2?: string) => {
    if (!name1 || !name2) return "U";
    return `${name1.charAt(0)}${name2.charAt(0)}`;
  }

  return (
    <header className="border-b bg-card shadow-sm">
      <div className="container mx-auto flex h-20 items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
            <Heart className="text-primary h-8 w-8" />
            <h1 className="text-3xl font-headline font-bold text-foreground">Wedly</h1>
        </Link>
        <div className="flex items-center gap-4">
          {!user ? (
             <Button asChild>
                <Link href="/login">Login</Link>
            </Button>
          ) : (
            <>
              {!isPremium && (
                <Button onClick={openDialog}>
                    <Gem className="mr-2 h-4 w-4" />
                    Upgrade
                </Button>
              )}
               <Button asChild variant="outline">
                <Link href="/dashboard">
                    <LayoutDashboard className="mr-2 h-4 w-4"/>
                    Dashboard
                </Link>
            </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-12 w-12 rounded-full">
                    <Avatar className="h-12 w-12 border-2 border-primary/50">
                      <AvatarImage src={user.photoURL || `https://placehold.co/100x100.png`} alt="User avatar" data-ai-hint="woman smiling" />
                      <AvatarFallback>{getInitials(user.name1, user.name2)}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.name1} & {user.name2}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                   <DropdownMenuItem>
                    <UserIcon className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4"/>
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </div>
      <UpgradeDialog />
    </header>
  );
}
