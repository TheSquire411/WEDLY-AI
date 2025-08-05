import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, ListChecks, Gem } from "lucide-react";
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
            <div className="text-2xl font-bold">$17,750 / $20,000</div>
            <p className="text-xs text-muted-foreground">88% of budget spent</p>
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

      <div className="mt-8">
        <VowGenerator />
      </div>
    </div>
  );
}
