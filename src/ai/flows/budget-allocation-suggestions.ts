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

const ExpenseSchema = z.object({
  category: z.string(),
  actual: z.number(),
  vendor: z.string(),
});

const BudgetAllocationSuggestionsInputSchema = z.object({
  remainingBudget: z
    .number()
    .describe('The remaining budget for the wedding.'),
  currentExpenses: z.array(ExpenseSchema).describe('A list of expenses already incurred.'),
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
  prompt: `You are a wedding planning assistant that helps couples allocate their remaining budget.

  The user has already spent on some items. Here is a list of their current expenses:
  {{#each currentExpenses}}
  - Category: {{category}}, Amount: {{actual}}, Vendor: {{vendor}}
  {{/each}}

  Their remaining budget is \${{remainingBudget}}.
  Their priorities are: {{priorityItems}}.

  Based on their remaining budget, current spending, and priorities, provide estimated budget allocations for the following categories. Do not include categories they have already spent on.
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
