import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Deliberately no `define` block for GEMINI_API_KEY here — that used to
// inline the key into the client bundle. It's now only read server-side by
// the /api/ai/* serverless functions (see api/_lib/verifyUser.ts).
export default defineConfig({
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
