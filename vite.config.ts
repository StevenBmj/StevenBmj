import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return undefined;
            if (id.includes('react') || id.includes('react-dom') || id.includes('scheduler')) return 'react-vendor';
            if (id.includes('motion')) return 'motion-vendor';
            if (id.includes('@supabase')) return 'supabase-vendor';
            if (id.includes('lucide-react')) return 'icons-vendor';
            if (id.includes('jspdf') || id.includes('html2canvas')) return 'pdf-vendor';
            if (id.includes('libphonenumber-js')) return 'phone-vendor';
            if (id.includes('qrcode')) return 'qr-vendor';
            return 'vendor';
          },
        },
      },
    },
  };
});
