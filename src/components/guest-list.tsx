
"use client";

import * as React from "react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { PlusCircle, MoreHorizontal, Trash2 } from "lucide-react";

export interface Guest {
    id: string;
    name: string;
    rsvp: 'Confirmed' | 'Pending' | 'Declined';
    group: string;
    table: number | null;
}

interface GuestListProps {
    guests: Guest[];
    setGuests: (guests: Guest[]) => void;
}

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

export function GuestList({ guests, setGuests }: GuestListProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [selectedGuest, setSelectedGuest] = React.useState<Guest | null>(null);
  const [tempRsvp, setTempRsvp] = React.useState<Guest['rsvp'] | undefined>(undefined);

  const handleDeleteGuest = (guestId: string) => {
    setGuests(guests.filter((guest) => guest.id !== guestId));
  };

  const handleEditClick = (guest: Guest) => {
    setSelectedGuest(guest);
    setTempRsvp(guest.rsvp);
    setIsEditDialogOpen(true);
  };
  
  const handleSaveRsvp = () => {
    if (selectedGuest && tempRsvp) {
      setGuests(
        guests.map((g) =>
          g.id === selectedGuest.id ? { ...g, rsvp: tempRsvp } : g
        )
      );
    }
    setIsEditDialogOpen(false);
    setSelectedGuest(null);
  };

  return (
    <>
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
                <TableHead className="hidden sm:table-cell text-right">Table</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {guests.map((guest) => (
                <TableRow key={guest.id}>
                  <TableCell className="font-medium">{guest.name}</TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground">{guest.group}</TableCell>
                  <TableCell>
                    <Badge variant={getRsvpVariant(guest.rsvp) as any}>{guest.rsvp}</Badge>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-right text-muted-foreground">{guest.table ?? 'N/A'}</TableCell>
                  <TableCell className="text-right">
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditClick(guest)}>
                                Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeleteGuest(guest.id)} className="text-destructive">
                                <Trash2 className="mr-2 h-4 w-4"/>
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Guest: {selectedGuest?.name}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label>RSVP Status</Label>
            <RadioGroup
                value={tempRsvp}
                onValueChange={(value) => setTempRsvp(value as Guest['rsvp'])}
                className="mt-2"
            >
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Confirmed" id="r1" />
                    <Label htmlFor="r1">Confirmed</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Pending" id="r2" />
                    <Label htmlFor="r2">Pending</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Declined" id="r3" />
                    <Label htmlFor="r3">Declined</Label>
                </div>
            </RadioGroup>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">Cancel</Button>
            </DialogClose>
            <Button type="button" onClick={handleSaveRsvp}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
