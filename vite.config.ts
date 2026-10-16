import { defineConfig } from 'vite';
import { resolve } from 'node:path';
export default defineConfig({ root: 'src/client', build: { outDir: '../../dist/client', emptyOutDir: true, rolldownOptions: { input: { admin: resolve('src/client/admin/index.html'), display: resolve('src/client/display/index.html'),bar:resolve('src/client/bar-display/index.html') } } } });
