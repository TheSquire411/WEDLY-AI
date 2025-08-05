// Budget allocation suggestion flow
'use server';

/**
 * @fileOverview Provides AI-powered budget allocation suggestions for wedding planning.
 *
 * - budgetAllocationSuggestions - A function that generates budget suggestions based on user input.
 * - BudgetAllocationSuggestionsInput - The input type for the budgetAllocationSuggestions function.
 * - BudgetAllocationSuggestionsOutput - The return type for the budgetAllocationSuggestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const BudgetAllocationSuggestionsInputSchema = z.object({
  totalBudget: z
    .number()
    .describe('The total budget for the wedding.'),
  priorityItems: z
    .string()
    .describe('A comma separated list of items the user wants to prioritize for their wedding.'),
});
export type BudgetAllocationSuggestionsInput = z.infer<typeof BudgetAllocationSuggestionsInputSchema>;

const BudgetAllocationSuggestionsOutputSchema = z.object({
  suggestedAllocations: z
    .string()
    .describe('A JSON string of suggested budget allocations for various wedding categories.'),
});
export type BudgetAllocationSuggestionsOutput = z.infer<typeof BudgetAllocationSuggestionsOutputSchema>;

export async function budgetAllocationSuggestions(
  input: BudgetAllocationSuggestionsInput
): Promise<BudgetAllocationSuggestionsOutput> {
  return budgetAllocationSuggestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'budgetAllocationSuggestionsPrompt',
  input: {schema: BudgetAllocationSuggestionsInputSchema},
  output: {schema: BudgetAllocationSuggestionsOutputSchema},
  prompt: `You are a wedding planning assistant that helps couples allocate their budget.

  Based on the total budget and priority items from the user, provide estimated budget allocations for the following categories:

  - Venue
  - Catering
  - Photography
  - Videography
  - Attire
  - Flowers
  - Decorations
  - Entertainment
  - Stationery
  - Wedding Favors

  Total Budget: ${'{{totalBudget}}'}
  Priority Items: ${'{{priorityItems}}'}

  Return the allocations as a JSON string.
`,
});

const budgetAllocationSuggestionsFlow = ai.defineFlow(
  {
    name: 'budgetAllocationSuggestionsFlow',
    inputSchema: BudgetAllocationSuggestionsInputSchema,
    outputSchema: BudgetAllocationSuggestionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
