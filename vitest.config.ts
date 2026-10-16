import { defineConfig } from 'vitest/config';
export default defineConfig({ test: { include: ['tests/{domain,server,client}/**/*.test.ts'], environment: 'node' } });
