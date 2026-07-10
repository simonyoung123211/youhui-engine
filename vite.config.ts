import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.OPENAI_API_BASE': JSON.stringify(env.OPENAI_API_BASE || 'https://5yuantoken.org/v1'),
        'process.env.OPENAI_API_KEY': JSON.stringify(env.OPENAI_API_KEY || ''),
        // 兼容旧 Gemini 配置字段
        'process.env.API_KEY': JSON.stringify(env.OPENAI_API_KEY || env.GEMINI_API_KEY || ''),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || env.OPENAI_API_KEY || ''),
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
