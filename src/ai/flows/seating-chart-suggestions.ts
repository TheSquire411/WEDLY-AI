'use server';

/**
 * @fileOverview Provides AI-powered seating chart suggestions for weddings.
 *
 * - seatingChartSuggestions - A function that generates seating arrangements.
 * - SeatingChartSuggestionsInput - The input type for the function.
 * - SeatingChartSuggestionsOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

const GuestSchema = z.object({
  name: z.string(),
  group: z.string(),
});

const SeatingChartSuggestionsInputSchema = z.object({
  guests: z.array(GuestSchema).describe('The list of guests to be seated.'),
  tables: z.number().describe('The number of tables available.'),
  guestsPerTable: z.number().describe('The maximum number of guests per table.'),
});
export type SeatingChartSuggestionsInput = z.infer<typeof SeatingChartSuggestionsInputSchema>;

const TableSchema = z.object({
  table: z.number(),
  guests: z.array(z.string()),
});

const SeatingChartSuggestionsOutputSchema = z.object({
  seatingChart: z.array(TableSchema).describe('The suggested seating chart with guests assigned to tables.'),
});
export type SeatingChartSuggestionsOutput = z.infer<typeof SeatingChartSuggestionsOutputSchema>;


export async function seatingChartSuggestions(
  input: SeatingChartSuggestionsInput
): Promise<SeatingChartSuggestionsOutput> {
  return seatingChartSuggestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'seatingChartSuggestionsPrompt',
  input: { schema: SeatingChartSuggestionsInputSchema },
  output: { schema: SeatingChartSuggestionsOutputSchema },
  model: googleAI.model('gemini-1.5-flash-latest'),
  prompt: `You are an expert wedding planner specializing in creating harmonious seating charts.

You need to seat the following guests into {{tables}} tables, with a maximum of {{guestsPerTable}} guests per table.

Guests list (with their group affiliation):
{{#each guests}}
- {{name}} ({{group}})
{{/each}}

Your task is to create a seating chart that considers the guests' groups. Try to seat guests from the same group together, but also mix tables to encourage mingling where appropriate. Avoid leaving anyone isolated.

Return the seating arrangement as a JSON object adhering to the output schema.
`,
});

const seatingChartSuggestionsFlow = ai.defineFlow(
  {
    name: 'seatingChartSuggestionsFlow',
    inputSchema: SeatingChartSuggestionsInputSchema,
    outputSchema: SeatingChartSuggestionsOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
