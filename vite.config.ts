import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { port: 5180, host: '127.0.0.1' },
  build: {
    rollupOptions: {
      output: {
        // three / r3f are only reached through the lazily loaded hero scene;
        // splitting them lets three.js cache independently of the app code.
        // React needs a chunk of its own: Rollup pulls a manual chunk's
        // unassigned dependencies into it, so React would otherwise land in
        // `r3f` and the entry would have to load all of the 3D code eagerly.
        manualChunks(id) {
          if (/\/node_modules\/(react|react-dom|scheduler)\//.test(id)) return 'react';
          if (id.includes('/node_modules/three/')) return 'three';
          if (/\/node_modules\/(@react-three\/|postprocessing\/)/.test(id)) return 'r3f';
        },
      },
    },
  },
});
