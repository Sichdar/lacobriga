import { defineConfig } from 'vite';

export default defineConfig({
  // Relative paths, so the game works at any GitHub Pages address, whatever the repo is called.
  base: './',
  build: {
    // Phaser alone is over 1 MB; don't warn about it.
    chunkSizeWarningLimit: 2000,
  },
});
