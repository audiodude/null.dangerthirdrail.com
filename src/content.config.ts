import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const songs = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/songs' }),
  schema: z.object({
    title: z.string(),
    date: z.date(),
    duration: z.number(),
    tags: z.array(z.string()).default([]),
    audio: z.string().optional(),
    description: z.string(),
    lyric: z.string().optional(),
    cover: z.enum(['pressure', 'server', 'island', 'trackpad', 'found']),
  }),
});

export const collections = { songs };
