import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'node:url';
import {defineConfig} from 'vite';

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': projectRoot,
      },
    },
    build: {
      rolldownOptions: {
        output: {
          codeSplitting: {
            minSize: 20_000,
            groups: [
              { name: 'firebase-auth', test: /[\\/]node_modules[\\/](?:firebase[\\/]auth|@firebase[\\/]auth)(?:[\\/]|$)/ },
              { name: 'firebase-firestore', test: /[\\/]node_modules[\\/](?:firebase[\\/]firestore|@firebase[\\/]firestore)(?:[\\/]|$)/ },
              { name: 'firebase', test: /[\\/]node_modules[\\/](?:firebase|@firebase)[\\/]/ },
              { name: 'react-vendor', test: /[\\/]node_modules[\\/](?:react|react-dom|scheduler)[\\/]/ },
              { name: 'map-vendor', test: /[\\/]node_modules[\\/]leaflet[\\/]/ },
            ],
          },
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
