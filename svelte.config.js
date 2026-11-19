import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  compilerOptions: {
    // Form-builder state is initialized from load() data once, on purpose.
    warningFilter: (w) => w.code !== 'state_referenced_locally'
  },
  kit: {
    adapter: adapter()
  }
};

export default config;
