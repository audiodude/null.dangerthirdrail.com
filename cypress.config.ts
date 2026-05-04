import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:4321',
    supportFile: false,
    video: false,
    screenshotOnRunFailure: false,
    setupNodeEvents(on, config) {
      on('before:browser:launch', (browser, launchOptions) => {
        if (browser.family === 'chromium') {
          launchOptions.args.push('--mute-audio');
        }
        if (browser.family === 'firefox') {
          launchOptions.preferences['media.volume_scale'] = '0.0';
        }
        return launchOptions;
      });
    },
  },
});
