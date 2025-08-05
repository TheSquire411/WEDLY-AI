
"use client";

import * as React from 'react';
import { seatingChartSuggestions, type SeatingChartSuggestionsOutput } from '@/ai/flows/seating-chart-suggestions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Wand2, Armchair } from 'lucide-react';
import { Badge } from './ui/badge';

const guests = [
  { name: 'Alice Johnson', group: "Bride's Family" },
  { name: 'Bob Williams', group: "Bride's Family" },
  { name: 'Charlie Brown', group: "Groom's Friends" },
  { name: 'Diana Miller', group: "Bride's Friends" },
  { name: 'Ethan Davis', group: "Groom's Family" },
  { name: 'Fiona Garcia', group: 'Work Colleagues' },
  { name: 'George Rodriguez', group: 'Work Colleagues' },
  { name: 'Hannah Smith', group: "Groom's Family" },
  { name: 'Ian Taylor', group: "Bride's Friends" },
  { name: 'Jane Wilson', group: "Groom's Friends" },
  { name: 'Karen Moore', group: "Bride's Family" },
  { name: 'Leo Anderson', group: "Groom's Family" },
];

export function SeatingChart() {
  const [seatingChart, setSeatingChart] = React.useState<SeatingChartSuggestionsOutput['seatingChart'] | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const { toast } = useToast();

  const handleGenerateChart = async () => {
    setIsLoading(true);
    setSeatingChart(null);
    try {
      const result = await seatingChartSuggestions({
        guests: guests.map(g => ({ name: g.name, group: g.group })),
        tables: 2,
        guestsPerTable: 6,
      });
      setSeatingChart(result.seatingChart);
    } catch (error) {
      console.error('AI Seating Chart Error:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to generate seating chart. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start mb-8">
            <div>
                <h2 className="text-4xl font-headline text-gray-800">AI Seating Assistant</h2>
                <p className="text-muted-foreground">Let AI help you arrange the perfect seating plan.</p>
            </div>
            <Button onClick={handleGenerateChart} disabled={isLoading} size="lg">
                {isLoading ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                    <Wand2 className="mr-2 h-5 w-5" />
                )}
                Generate Seating Chart
            </Button>
        </div>

        {isLoading && (
            <div className="text-center p-8">
                <Loader2 className="mx-auto h-12 w-12 text-primary animate-spin" />
                <p className="mt-4 text-muted-foreground">Analyzing guest list and arranging tables...</p>
            </div>
        )}

        {seatingChart ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {seatingChart.map((table) => (
                    <Card key={table.table} className="shadow-lg">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3 font-headline text-2xl">
                                <Armchair className="h-6 w-6 text-primary" />
                                Table {table.table}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-3">
                                {table.guests.map((guestName) => {
                                    const guestInfo = guests.find(g => g.name === guestName);
                                    return (
                                        <li key={guestName} className="flex items-center justify-between">
                                            <span>{guestName}</span>
                                            {guestInfo && <Badge variant="secondary">{guestInfo.group}</Badge>}
                                        </li>
                                    );
                                })}
                            </ul>
                        </CardContent>
                    </Card>
                ))}
            </div>
        ) : (
            !isLoading && (
                 <Card className="text-center py-20 px-6 bg-muted/20 border-dashed border-2">
                    <Armchair className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-xl font-semibold">Ready to create your seating plan?</h3>
                    <p className="mt-2 text-muted-foreground">Click the "Generate Seating Chart" button to get started.</p>
                </Card>
            )
        )}
    </div>
  );
}
