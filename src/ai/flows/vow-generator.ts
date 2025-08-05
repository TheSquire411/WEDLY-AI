'use server';
/**
 * @fileOverview Provides AI-powered wedding vow generation.
 *
 * - generateVows - A function that generates wedding vows based on user input.
 * - VowGeneratorInput - The input type for the generateVows function.
 * - VowGeneratorOutput - The return type for the generateVows function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const VowGeneratorInputSchema = z.object({
  partnerName: z
    .string()
    .describe("The name of the user's partner."),
  keyMemories: z
    .string()
    .describe('A few key memories or moments the user shares with their partner.'),
    tone: z.enum(['humorous', 'romantic', 'sentimental', 'traditional'])
    .describe('The desired tone for the vows.')
});
export type VowGeneratorInput = z.infer<typeof VowGeneratorInputSchema>;

const VowGeneratorOutputSchema = z.object({
  vows: z
    .string()
    .describe('The generated wedding vows.'),
});
export type VowGeneratorOutput = z.infer<typeof VowGeneratorOutputSchema>;

export async function generateVows(
  input: VowGeneratorInput
): Promise<VowGeneratorOutput> {
  return vowGeneratorFlow(input);
}

const prompt = ai.definePrompt({
  name: 'vowGeneratorPrompt',
  input: {schema: VowGeneratorInputSchema},
  output: {schema: VowGeneratorOutputSchema},
  prompt: `You are a creative and heartfelt writer who specializes in crafting personalized wedding vows.

  A user wants to write vows for their partner, {{partnerName}}.

  Here are some key memories they've shared:
  {{keyMemories}}

  The user wants the vows to have a {{tone}} tone.

  Based on this information, please draft a beautiful and personal set of wedding vows. The vows should be touching, personal, and reflect the tone requested.

  Return the generated vows in the 'vows' field.
`,
});

const vowGeneratorFlow = ai.defineFlow(
  {
    name: 'vowGeneratorFlow',
    inputSchema: VowGeneratorInputSchema,
    outputSchema: VowGeneratorOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
