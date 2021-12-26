import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import inject from '@rollup/plugin-inject';
import polyfillNode from 'rollup-plugin-polyfill-node'
import tsconfigPaths from 'vite-tsconfig-paths'



// https://vitejs.dev/config/
export default defineConfig({
  plugins: [polyfillNode(),svelte(),tsconfigPaths()],
  build: {
    rollupOptions: {
        plugins: [inject({ Buffer: ['buffer', 'Buffer'] })],
    },
},
})
