import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const songs = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/songs' }),
  schema: z.object({
    title: z.string(),
    date: z.date(),
    order: z.number().default(0),
    tags: z.array(z.string()).default([]),
    versions: z
      .array(
        z.object({
          name: z.string(),
          audio: z.string(),
          accent: z.string().default('#3b82f6'),
          appendix: z.string().optional(),
          highlights: z
            .array(
              z.object({
                label: z.string(),
                start: z.number(),
                end: z.number(),
              }),
            )
            .default([]),
        }),
      )
      .default([]),
    lyric: z.string().optional(),
    cover: z.enum(['pressure', 'server', 'island', 'trackpad', 'found', 'waveform', 'vinyl', 'circuit', 'constellation', 'prism']),
  }),
});

export const collections = { songs };
