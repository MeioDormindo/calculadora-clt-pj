import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// O site é publicado em <usuario>.github.io/calculadora-clt-pj/, então o build
// precisa desse prefixo nos assets. O dev server segue na raiz.
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'build' ? '/calculadora-clt-pj/' : '/',
  // Carimbado no momento do build — no deploy, é a hora em que o site foi publicado.
  define: {
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
}))
