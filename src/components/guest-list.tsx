import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PlusCircle } from "lucide-react";

const guests = [
  { name: 'Alice Johnson', rsvp: 'Confirmed', group: 'Bride\'s Family', table: 2 },
  { name: 'Bob Williams', rsvp: 'Confirmed', group: 'Bride\'s Family', table: 2 },
  { name: 'Charlie Brown', rsvp: 'Pending', group: 'Groom\'s Friends', table: null },
  { name: 'Diana Miller', rsvp: 'Declined', group: 'Bride\'s Friends', table: null },
  { name: 'Ethan Davis', rsvp: 'Confirmed', group: 'Groom\'s Family', table: 5 },
  { name: 'Fiona Garcia', rsvp: 'Confirmed', group: 'Work Colleagues', table: 8 },
  { name: 'George Rodriguez', rsvp: 'Pending', group: 'Work Colleagues', table: null },
  { name: 'Hannah Smith', rsvp: 'Confirmed', group: 'Groom\'s Family', table: 5 },
];

const getRsvpVariant = (rsvp: string) => {
  switch (rsvp) {
    case 'Confirmed':
      return 'default';
    case 'Pending':
      return 'secondary';
    case 'Declined':
      return 'destructive';
    default:
      return 'outline';
  }
};


export function GuestList() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
            <CardTitle className="font-headline text-2xl">Guest List</CardTitle>
            <CardDescription>Manage your invited guests and track RSVPs.</CardDescription>
        </div>
        <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Guest
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="hidden sm:table-cell">Group</TableHead>
              <TableHead>RSVP Status</TableHead>
              <TableHead className="text-right">Table</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {guests.map((guest) => (
              <TableRow key={guest.name}>
                <TableCell className="font-medium">{guest.name}</TableCell>
                <TableCell className="hidden sm:table-cell text-muted-foreground">{guest.group}</TableCell>
                <TableCell>
                  <Badge variant={getRsvpVariant(guest.rsvp) as any}>{guest.rsvp}</Badge>
                </TableCell>
                <TableCell className="text-right text-muted-foreground">{guest.table ?? 'N/A'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
