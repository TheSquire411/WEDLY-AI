
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { SubscriptionProvider } from '@/hooks/use-subscription';
import { UserProvider } from '@/hooks/use-user';
import { PhotoProvider } from '@/hooks/use-photos';
import Link from 'next/link';
import { GuestProvider } from '@/hooks/use-guests';
import { TaskProvider } from '@/hooks/use-tasks';
import { Footer } from '@/components/footer';

export const metadata: Metadata = {
  title: {
    default: 'Wedly - Your AI-Powered Wedding Planning Assistant',
    template: '%s | Wedly',
  },
  description: 'Wedly is a modern, feature-rich web app that uses AI to simplify your wedding planning. From budget tracking and guest lists to AI vow generation and vision boards, Wedly has everything you need to plan your perfect day.',
  keywords: ['wedding planner', 'ai wedding planner', 'wedding budget', 'guest list manager', 'vow generator', 'wedding checklist', 'seating chart maker'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased flex flex-col min-h-screen">
        <UserProvider>
          <SubscriptionProvider>
            <PhotoProvider>
              <GuestProvider>
                <TaskProvider>
                  <div className="flex-grow">
                    {children}
                  </div>
                  <Toaster />
                  <Footer />
                </TaskProvider>
              </GuestProvider>
            </PhotoProvider>
          </SubscriptionProvider>
        </UserProvider>
      </body>
    </html>
  );
}
