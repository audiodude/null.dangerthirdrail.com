// Dev-only Astro integration that mounts the iPad "studio" control panel on the
// Astro dev server at /studio. It rides the same port (4321) as Keystatic, so a
// single Cloudflare tunnel exposes both. This mirrors how the Keystatic Astro
// integration injects its own /keystatic middleware in dev.
//
// Never added in production builds — astro.config.mjs only wires it up when
// NODE_ENV !== 'production'.
import { createStudioRouter } from './server.mjs';

export default function studioIntegration() {
  return {
    name: 'null-rail-studio',
    hooks: {
      'astro:server:setup': ({ server, logger }) => {
        const token = process.env.STUDIO_TOKEN || '';
        server.middlewares.use('/studio', createStudioRouter({ token, logger }));
        if (token) {
          logger.info('studio panel at /studio (token auth enabled)');
        } else {
          logger.warn(
            'studio panel mounted but STUDIO_TOKEN is unset — its API is disabled. ' +
              'Start with `npm run ipad` to get a token + tunnel.',
          );
        }
      },
    },
  };
}
