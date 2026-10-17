// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
	site: 'https://ipreppro.app',
	integrations: [sitemap(), react()],
	redirects: {
		'/coding/react-live': '/coding/react-live/counter',
		'/coding/nextjs-live': '/coding/nextjs-live/app-nav',
	},
	vite: {
		plugins: [tailwindcss()],
	},
});
