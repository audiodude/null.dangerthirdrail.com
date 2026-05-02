// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import keystatic from '@keystatic/astro';

const isDev = process.env.NODE_ENV !== 'production';

// https://astro.build/config
export default defineConfig({
  site: 'https://null.dangerthirdrail.com',
  integrations: [react(), ...(isDev ? [keystatic()] : [])],
  vite: {
    server: {
      allowedHosts: ['.trycloudflare.com'],
    },
    optimizeDeps: {
      noDiscovery: true,
      include: [
        'react', 'react-dom', 'react/jsx-runtime', 'react/jsx-dev-runtime',
        '@astrojs/react/client.js',
        '@keystatic/core', '@keystatic/core/ui',
        '@keystatic/astro/ui', '@keystatic/astro/api',
      ],
    },
  },
});
