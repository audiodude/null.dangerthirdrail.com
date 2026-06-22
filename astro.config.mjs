// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import keystatic from '@keystatic/astro';
import studio from './studio/integration.mjs';

const isDev = process.env.NODE_ENV !== 'production';

// https://astro.build/config
export default defineConfig({
  site: 'https://null.dangerthirdrail.com',
  integrations: [react(), ...(isDev ? [keystatic(), studio()] : [])],
  vite: {
    server: {
      // .dangerthirdrail.com covers the named tunnel (studio.dangerthirdrail.com);
      // .trycloudflare.com covers quick tunnels.
      allowedHosts: ['.trycloudflare.com', '.dangerthirdrail.com'],
    },
    optimizeDeps: {
      include: [
        '@keystatic/core', '@keystatic/core/ui',
        '@keystatic/astro/ui', '@keystatic/astro/api',
      ],
    },
  },
});
