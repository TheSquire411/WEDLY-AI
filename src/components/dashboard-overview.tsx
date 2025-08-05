import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, ListChecks, Gem } from "lucide-react";
import Image from 'next/image';
import { VowGenerator } from './vow-generator';

export function DashboardOverview() {
  return (
    <div>
      <h2 className="text-4xl font-headline mb-2 text-gray-800">Welcome, Jane &amp; John!</h2>
      <p className="text-muted-foreground mb-8">Here's a snapshot of your wedding planning progress.</p>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget Status</CardTitle>
            <Gem className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$15,750 / $20,000</div>
            <p className="text-xs text-muted-foreground">78% of budget spent</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Guests</CardTitle>
            <Users className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">128 / 150</div>
            <p className="text-xs text-muted-foreground">RSVPs confirmed</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks Remaining</CardTitle>
            <ListChecks className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23</div>
            <p className="text-xs text-muted-foreground">12 overdue</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 mt-8 md:grid-cols-5">
        <div className="md:col-span-3">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-2xl">Vision Board</CardTitle>
                    <CardDescription>Your wedding inspiration in one place. Drag-and-drop coming soon!</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="overflow-hidden rounded-lg shadow-md">
                            <Image src="https://placehold.co/300x400.png" alt="Wedding inspiration 1" data-ai-hint="wedding dress" width={300} height={400} className="object-cover aspect-[3/4] hover:scale-105 transition-transform duration-300 ease-in-out" />
                        </div>
                        <div className="overflow-hidden rounded-lg shadow-md">
                            <Image src="https://placehold.co/300x400.png" alt="Wedding inspiration 2" data-ai-hint="wedding venue" width={300} height={400} className="object-cover aspect-[3/4] hover:scale-105 transition-transform duration-300 ease-in-out" />
                        </div>
                        <div className="overflow-hidden rounded-lg shadow-md">
                            <Image src="https://placehold.co/300x400.png" alt="Wedding inspiration 3" data-ai-hint="flower arrangement" width={300} height={400} className="object-cover aspect-[3/4] hover:scale-105 transition-transform duration-300 ease-in-out" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
        <div className="md:col-span-2">
            <VowGenerator />
        </div>
      </div>
    </div>
  );
}
