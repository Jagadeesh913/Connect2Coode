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
        target: 'https://codingplatform-tdt0.onrender.com',
        changeOrigin: true,
        secure: false,
        headers: {
          Origin: 'https://codingplatform-tdt0.onrender.com',
        },
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader('Origin', 'https://codingplatform-tdt0.onrender.com');
          });
        },
      },
      '/oauth2': {
        target: 'https://codingplatform-tdt0.onrender.com',
        changeOrigin: true,
        secure: false,
        headers: {
          Origin: 'https://codingplatform-tdt0.onrender.com',
        },
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader('Origin', 'https://codingplatform-tdt0.onrender.com');
          });
        },
      }
    }
  },
  preview: {
    port: 4173,
    proxy: {
      '/api': {
        target: 'https://codingplatform-tdt0.onrender.com',
        changeOrigin: true,
        secure: false,
        headers: {
          Origin: 'https://codingplatform-tdt0.onrender.com',
        },
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader('Origin', 'https://codingplatform-tdt0.onrender.com');
          });
        },
      },
      '/oauth2': {
        target: 'https://codingplatform-tdt0.onrender.com',
        changeOrigin: true,
        secure: false,
        headers: {
          Origin: 'https://codingplatform-tdt0.onrender.com',
        },
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader('Origin', 'https://codingplatform-tdt0.onrender.com');
          });
        },
      }
    }
  }
})
