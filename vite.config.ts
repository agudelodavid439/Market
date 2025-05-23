import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
	plugins: [sveltekit()],

	resolve: {
		alias: {
			$lib: resolve('./src/lib'),
			// Añadir alias para que las importaciones de .js apunten a los archivos .ts
			'$lib/conexion_pedidos.js': '$lib/conexion_pedidos.ts',
		},
		extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.svelte'],
	},

	// Configuración básica para el servidor de desarrollo
	server: {
		port: 5173,
		strictPort: false,
		host: true, // Permite conexiones desde red local
	},

	// Configuración simplificada para testing
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}'],
		environment: 'jsdom',
		globals: true,
		setupFiles: ['./vitest-setup.js'],
	},

	// Asegura que las variables de entorno empiecen con VITE_
	envPrefix: 'VITE_',
});
