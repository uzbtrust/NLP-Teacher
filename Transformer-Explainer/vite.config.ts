import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';

// Loyiha ildizining absolyut yo'li. Sass ning yangi (modern) API si
// nisbiy yo'llarni import qilinayotgan fayl joyiga qarab yechadi,
// shuning uchun `additionalData` ichidagi yo'l uchun loadPaths kerak.
const projectRoot = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
	plugins: [sveltekit()],
	css: {
		preprocessorOptions: {
			scss: {
				additionalData: `@import '${projectRoot}src/styles/variables.scss';`,
				loadPaths: [projectRoot]
			}
		}
	},
	server: {
		fs: {
			// Allow serving files from one level up to the project root
			allow: ['..']
		}
	}
});
