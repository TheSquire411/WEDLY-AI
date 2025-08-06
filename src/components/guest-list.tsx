
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
  DialogDescription
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { PlusCircle, MoreHorizontal, Trash2, Loader2 } from "lucide-react";
import { useGuests, type Guest } from "@/hooks/use-guests";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "./ui/form";


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

const addGuestSchema = z.object({
    name: z.string().min(1, "Name is required"),
    group: z.string().min(1, "Group is required"),
});

export function GuestList() {
  const { guests, loading, addGuest, updateGuestRsvp, deleteGuest } = useGuests();
  const [isEditRsvpOpen, setIsEditRsvpOpen] = React.useState(false);
  const [isAddGuestOpen, setIsAddGuestOpen] = React.useState(false);
  const [selectedGuest, setSelectedGuest] = React.useState<Guest | null>(null);
  const [tempRsvp, setTempRsvp] = React.useState<Guest['rsvp'] | undefined>(undefined);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof addGuestSchema>>({
    resolver: zodResolver(addGuestSchema),
    defaultValues: {
      name: "",
      group: "",
    },
  });

  const handleDeleteGuest = async (guestId: string) => {
    await deleteGuest(guestId);
    toast({ title: "Guest removed." });
  };

  const handleEditClick = (guest: Guest) => {
    setSelectedGuest(guest);
    setTempRsvp(guest.rsvp);
    setIsEditRsvpOpen(true);
  };
  
  const handleSaveRsvp = async () => {
    if (selectedGuest && tempRsvp) {
      await updateGuestRsvp(selectedGuest.id, tempRsvp);
      toast({ title: `RSVP for ${selectedGuest.name} updated.` });
    }
    setIsEditRsvpOpen(false);
    setSelectedGuest(null);
  };
  
  async function onAddGuest(values: z.infer<typeof addGuestSchema>) {
    await addGuest({
        name: values.name,
        group: values.group,
        rsvp: 'Pending',
        table: null,
    });
    toast({
        title: "Guest Added",
        description: `${values.name} has been added to your guest list.`,
    });
    form.reset();
    setIsAddGuestOpen(false);
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="font-headline text-2xl">Guest List</CardTitle>
            <CardDescription>Manage your invited guests and track RSVPs.</CardDescription>
          </div>
          <Button onClick={() => setIsAddGuestOpen(true)}>
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
              {loading ? (
                <TableRow>
                    <TableCell colSpan={5} className="text-center">
                        <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                    </TableCell>
                </TableRow>
              ) : guests.map((guest) => (
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
                                Edit RSVP
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
      
      <Dialog open={isEditRsvpOpen} onOpenChange={setIsEditRsvpOpen}>
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
      <Dialog open={isAddGuestOpen} onOpenChange={setIsAddGuestOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Add New Guest</DialogTitle>
                <DialogDescription>Enter the details for your new guest.</DialogDescription>
            </DialogHeader>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onAddGuest)} className="space-y-4 py-4">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Full Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g. John Doe" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="group"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Group</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g. Bride's Family" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="secondary">Cancel</Button>
                        </DialogClose>
                        <Button type="submit">Add Guest</Button>
                    </DialogFooter>
                </form>
            </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
