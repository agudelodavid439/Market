<script lang="ts">
	import Header from '../routes/Header.svelte';
	import SecionBody from '$lib/sesion_productos_body/secion_body.svelte';
	import { Search } from 'lucide-svelte';
	import Footer from './footer.svelte'; // Importamos el componente Footer
	import Carrito from '$lib/sesion_carrito/carrito.svelte';
	import { onMount } from 'svelte';
	import { carritoVisible } from '$lib/stores/carritoTienda';

	// Función para mostrar el carrito en PC
	onMount(() => {
		// Detectamos si estamos en PC
		const esPC = window.innerWidth >= 769;

		// Si estamos en PC, mostramos el carrito
		if (esPC) {
			carritoVisible.set(true);
		}
	});
</script>

<div class="contenedor-aplicacion">
	<header class="cabecera-aplicacion">
		<div class="contenedor-ancho-maximo mx-auto px-3">
			<Header />
		</div>
	</header>

	<!-- Diseño de dos columnas, solo visible en PC -->
	<div class="layout-dos-columnas">
		<!-- Columna 1: Sección de productos -->
		<div class="columna-productos">
			<main class="cuerpo-aplicacion">
				<section class="seccion-productos my-8">
					<div class="contenedor-producto">
						<SecionBody />
					</div>
				</section>
			</main>
		</div>

		<!-- Columna 2: Carrito (solo visible en PC) -->
		<div class="columna-dos">
			<div class="carrito-pc-container">
				{#if $carritoVisible}
					<div class="carrito-adaptado">
						<Carrito />
					</div>
				{/if}
			</div>
		</div>
	</div>

	<!-- Footer -->
	<Footer />
</div>

<style>
	.contenedor-aplicacion {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}

	.cabecera-aplicacion {
		position: sticky;
		top: 0;
		z-index: 100;
		background-color: white;
	}

	/* Diseño de dos columnas - solo visible en PC */
	.layout-dos-columnas {
		display: flex;
		flex-direction: column;
		flex-grow: 1;
	}

	.columna-productos {
		width: 100%;
	}

	.columna-dos {
		display: none; /* Oculta por defecto */
	}

	.cuerpo-aplicacion {
		flex-grow: 1;
		padding-top: 0;
		padding-bottom: 70px;
	}

	.contenedor-ancho-maximo {
		max-width: 3000px;
	}

	/* Contenedor para productos */
	.contenedor-producto {
		width: 100%;
		padding: 0 15px; /* Padding horizontal estándar para móvil */
	}

	.seccion-productos {
		margin-top: 0;
	}

	/* Ajustes específicos para móvil - MANTENER EXACTAMENTE IGUAL */
	@media (max-width: 768px) {
		.cuerpo-aplicacion {
			padding-top: 100px;
			padding-bottom: 70px;
		}

		.contenedor-producto {
			padding: 0;
		}
	}

	/* Estilos específicos para PC - dos columnas */
	@media (min-width: 769px) {
		.layout-dos-columnas {
			flex-direction: row;
			align-items: flex-start;
		}

		.columna-productos {
			width: 65%; /* Columna 1: 65% de ancho */
		}

		.columna-dos {
			display: block; /* Mostrar en PC */
			width: 35%; /* Columna 2: 35% de ancho */
			position: sticky;
			top: 64px; /* Justo debajo del header */
			height: calc(100vh - 64px); /* Altura completa menos el header */
			overflow-y: auto; /* Permitir scroll dentro de la columna 2 */
			background-color: #f9f9f9;
			border-left: 1px solid #eaeaea;
			padding: 16px;
			z-index: 96; /* Por debajo del header pero por encima de otros elementos */
		}

		/* Nuevo contenedor para el carrito en PC */
		.carrito-pc-container {
			width: 100%;
			height: auto;
			position: relative;
		}

		/* Clase para adaptar el carrito en la columna 2 */
		.carrito-adaptado {
			width: 100%;
		}

		/* Estilos globales para adaptar el carrito en la columna 2 */
		.carrito-adaptado :global(.carrito-flotante) {
			position: relative !important; /* Cambiado de fixed a relative */
			top: 0 !important;
			right: 0 !important;
			transform: none !important;
			width: 100% !important;
			height: auto !important;
			max-height: none !important;
			animation: none !important;
			border-radius: 12px !important;
			box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
			margin: 0 !important;
			overflow-y: visible !important;
		}

		/* Asegurarse de que el contenido del carrito sea desplazable */
		.carrito-adaptado :global(.contenedor-productos-carrito) {
			max-height: 350px !important; /* Mayor altura para ver más productos */
		}

		/* Evitar que la animación de salida saque el carrito de la columna */
		.carrito-adaptado :global(.carrito-flotante.saliendo) {
			animation: none !important;
			opacity: 1 !important;
			transform: none !important;
		}

		.cuerpo-aplicacion {
			padding-top: 80px; /* En PC sí mantenemos el padding */
		}

		.seccion-productos {
			display: flex;
		}

		.contenedor-producto {
			width: 100%; /* Ancho completo dentro de columna-productos */
			max-width: 100%;
			margin-right: auto;
			margin-left: 7%;
			padding-left: 0;
		}
	}
</style>
