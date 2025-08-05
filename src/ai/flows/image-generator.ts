'use server';
/**
 * @fileOverview Provides AI-powered image generation.
 *
 * - generateImage - A function that generates an image based on a user's text prompt.
 * - ImageGeneratorInput - The input type for the generateImage function.
 * - ImageGeneratorOutput - The return type for the generateImage function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ImageGeneratorInputSchema = z.object({
  prompt: z
    .string()
    .describe('The text prompt for image generation.'),
});
export type ImageGeneratorInput = z.infer<typeof ImageGeneratorInputSchema>;

const ImageGeneratorOutputSchema = z.object({
  image: z
    .string()
    .describe("The generated image as a data URI. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
});
export type ImageGeneratorOutput = z.infer<typeof ImageGeneratorOutputSchema>;

export async function generateImage(
  input: ImageGeneratorInput
): Promise<ImageGeneratorOutput> {
  return imageGeneratorFlow(input);
}

const imageGeneratorFlow = ai.defineFlow(
  {
    name: 'imageGeneratorFlow',
    inputSchema: ImageGeneratorInputSchema,
    outputSchema: ImageGeneratorOutputSchema,
  },
  async (input) => {
    const { media } = await ai.generate({
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt: input.prompt,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    if (!media?.url) {
      throw new Error('Image generation failed.');
    }

    return { image: media.url };
  }
);
