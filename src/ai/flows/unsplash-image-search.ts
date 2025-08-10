'use server';
import 'server-only';

/**
 * @fileOverview Provides image search functionality via the Unsplash API.
 *
 * - unsplashImageSearch - A function that searches for images on Unsplash.
 * - UnsplashImageSearchInput - The input type for the function.
 * - UnsplashImageSearchOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { createApi } from 'unsplash-js';

// ---------- Schemas ----------
const UnsplashImageSearchInputSchema = z.object({
  query: z.string().min(1, 'Query is required').describe('The search query for images.'),
});
export type UnsplashImageSearchInput = z.infer<typeof UnsplashImageSearchInputSchema>;

const UnsplashImageSchema = z.object({
  id: z.string(),
  alt_description: z.string().nullable(),
  urls: z.object({
    regular: z.string(),
    thumb: z.string(),
  }),
  user: z.object({
    name: z.string(),
  }),
});
export type UnsplashImage = z.infer<typeof UnsplashImageSchema>;

const UnsplashImageSearchOutputSchema = z.object({
  images: z.array(UnsplashImageSchema),
});
export type UnsplashImageSearchOutput = z.infer<typeof UnsplashImageSearchOutputSchema>;

// ---------- Env & Client (server-side only) ----------
const accessKey =
  process.env.UNSPLASH_ACCESS_KEY ??
  // Optional fallback for dev if someone still has the public var set.
  process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY ??
  '';

if (!accessKey) {
  // Fail fast on the server; easier to catch during build/previews
  throw new Error(
    'Unsplash API key is not configured. Set UNSPLASH_ACCESS_KEY in your environment.'
  );
}

const unsplash = createApi({ accessKey });

// ---------- Public API ----------
export async function unsplashImageSearch(
  input: UnsplashImageSearchInput
): Promise<UnsplashImageSearchOutput> {
  return unsplashImageSearchFlow(input);
}

const unsplashImageSearchFlow = ai.defineFlow(
  {
    name: 'unsplashImageSearchFlow',
    inputSchema: UnsplashImageSearchInputSchema,
    outputSchema: UnsplashImageSearchOutputSchema,
  },
  async (input) => {
    // Basic query normalization
    const q = input.query.trim();
    if (!q) {
      return { images: [] };
    }

    const result = await unsplash.search.getPhotos({
      query: q,
      perPage: 20,
      orientation: 'squarish',
    });

    if (result.errors) {
      console.error('Unsplash API Error:', result.errors);
      throw new Error('Failed to fetch images from Unsplash.');
    }

    const photos = result.response?.results ?? [];

    const images: UnsplashImage[] = photos.map((photo) => ({
      id: photo.id,
      alt_description: photo.alt_description,
      urls: {
        regular: photo.urls.regular,
        thumb: photo.urls.thumb,
      },
      user: {
        name: photo.user.name,
      },
    }));

    return { images };
  }
);
