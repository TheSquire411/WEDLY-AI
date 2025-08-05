
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users, Gem, Image as ImageIcon } from "lucide-react";

// Mock data for the admin dashboard
const mockUsers = [
  { id: '1', name1: 'Jane', name2: 'John', email: 'jane.doe@example.com', plan: 'Premium', signupDate: '2024-07-20' },
  { id: '2', name1: 'Sarah', name2: 'Mike', email: 'sarah.k@example.com', plan: 'Free', signupDate: '2024-07-18' },
  { id: '3', name1: 'Emily', name2: 'Chris', email: 'em.and.chris@example.com', plan: 'Free', signupDate: '2024-07-15' },
  { id: '4', name1: 'Jessica', name2: 'David', email: 'jd.wedding@example.com', plan: 'Premium', signupDate: '2024-07-12' },
  { id: '5', name1: 'Laura', name2: 'Tom', email: 'laura.t@example.com', plan: 'Free', signupDate: '2024-07-10' },
];

const mockStats = {
    totalUsers: 125,
    premiumUsers: 38,
    totalPhotos: 1478,
};


export function AdminDashboard() {

  const premiumPercentage = ((mockStats.premiumUsers / mockStats.totalUsers) * 100).toFixed(1);

  return (
    <div className="space-y-8">
        <div className="text-center">
            <h1 className="text-4xl font-headline text-gray-800">Dashboard</h1>
            <p className="mt-2 text-lg text-muted-foreground">A high-level overview of your application's activity.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                    <Users className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{mockStats.totalUsers.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">All registered couples</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Premium Subscriptions</CardTitle>
                    <Gem className="h-5 w-5 text-primary" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{mockStats.premiumUsers.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">{premiumPercentage}% conversion rate</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Photos Uploaded</CardTitle>
                    <ImageIcon className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{mockStats.totalPhotos.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">Across all user albums</p>
                </CardContent>
            </Card>
        </div>

        <Card>
            <CardHeader>
                <CardTitle className="font-headline text-2xl">Recent Users</CardTitle>
                <CardDescription>A list of the most recently signed-up users.</CardDescription>
            </CardHeader>
            <CardContent>
                 <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Couple</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead className="text-right">Sign-up Date</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {mockUsers.map((user) => (
                        <TableRow key={user.id}>
                            <TableCell className="font-medium">{user.name1} & {user.name2}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>
                                <Badge variant={user.plan === 'Premium' ? 'default' : 'secondary'}>
                                    {user.plan}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right">{new Date(user.signupDate).toLocaleDateString()}</TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>

    </div>
  );
}
