import path from 'node:path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

// The app page is React on the Glaze design system. The core modules in src/
// stay plain TypeScript. The benchmark pages (eval.html, answers.html,
// probe.html) are tools: they use no React and are not part of the build.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': path.resolve(import.meta.dirname, 'src') } },
});
