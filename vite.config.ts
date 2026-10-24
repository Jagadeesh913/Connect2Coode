import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src')
    }
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_PROXY_TARGET || 'https://api.connect2code.in',
        changeOrigin: true,
        secure: false,
        headers: {
          Origin: process.env.VITE_PROXY_TARGET || 'https://api.connect2code.in',
        },
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader('Origin', process.env.VITE_PROXY_TARGET || 'https://api.connect2code.in');
          });
        },
      },
      '/oauth2': {
        target: process.env.VITE_PROXY_TARGET || 'https://api.connect2code.in',
        changeOrigin: true,
        secure: false,
        headers: {
          Origin: process.env.VITE_PROXY_TARGET || 'https://api.connect2code.in',
        },
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader('Origin', process.env.VITE_PROXY_TARGET || 'https://api.connect2code.in');
          });
        },
      }
    }
  },
  preview: {
    port: 4173,
    proxy: {
      '/api': {
        target: process.env.VITE_PROXY_TARGET || 'https://api.connect2code.in',
        changeOrigin: true,
        secure: false,
        headers: {
          Origin: process.env.VITE_PROXY_TARGET || 'https://api.connect2code.in',
        },
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader('Origin', process.env.VITE_PROXY_TARGET || 'https://api.connect2code.in');
          });
        },
      },
      '/oauth2': {
        target: process.env.VITE_PROXY_TARGET || 'https://api.connect2code.in',
        changeOrigin: true,
        secure: false,
        headers: {
          Origin: process.env.VITE_PROXY_TARGET || 'https://api.connect2code.in',
        },
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader('Origin', process.env.VITE_PROXY_TARGET || 'https://api.connect2code.in');
          });
        },
      }
    }
  }
})
