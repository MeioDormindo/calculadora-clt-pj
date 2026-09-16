import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// O site é publicado em <usuario>.github.io/calculadora-clt-pj/, então o build
// precisa desse prefixo nos assets. O dev server segue na raiz.
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'build' ? '/calculadora-clt-pj/' : '/',
}))
