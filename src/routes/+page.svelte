<script lang="ts">
	import Header from '../routes/Header.svelte';
	import SecionBody from '$lib/sesion_productos_body/secion_body.svelte';
	import Footer from '../routes/footer.svelte';
	import { Search } from 'lucide-svelte';
</script>

<div class="contenedor-aplicacion">
	<header class="cabecera-aplicacion">
		<div class="contenedor-ancho-maximo mx-auto px-3">
			<Header />
		</div>
	</header>

	<main class="cuerpo-aplicacion">
		<section class="seccion-productos my-8" style="width: 100%;">
			<div class="contenedor-ancho-maximo px-50 mx-auto">
				<SecionBody />
			</div>
		</section>
	</main>

	<Footer />
</div>

<style>
	.contenedor-aplicacion {
		display: flex;
		flex-direction: column;
		min-height: 10vh;
	}

	.cabecera-aplicacion {
		position: sticky;
		top: 0;
		z-index: 100;
		background-color: white;
	}

	.cuerpo-aplicacion {
		flex-grow: 1;
		width: 100%; /* Nuevo: ocupa todo el ancho disponible */
		padding-top: 30px; /* Ajusta según el alto de tu encabezado */
	}

	.contenedor-ancho-maximo {
		max-width: 100%;
	}
</style>
