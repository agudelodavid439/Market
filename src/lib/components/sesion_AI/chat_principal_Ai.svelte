<script>
	import { createEventDispatcher } from 'svelte';
	import ChatIA from './chat_Ai.svelte';

	const dispatch = createEventDispatcher();
	export let estaAbierto = false; // Añadimos valor por defecto

	function cerrarModal() {
		dispatch('cerrar');
		estaAbierto = false; // Aseguramos que se actualice el estado
		console.log('Cerrando modal:', estaAbierto);
	}
</script>

{#if estaAbierto}
	<div class="fondo-modal" on:click={cerrarModal}>
		<div class="contenido-modal" on:click|stopPropagation>
			<!-- Layout de 3 columnas -->
			<div class="columnas-contenedor">
				<!-- Columna 1 -->
				<div class="columna columna-izquierda">
					<h3>Historial</h3>
					<!-- Contenido columna izquierda -->
				</div>

				<!-- Columna 2 (más ancha) -->
				<div class="columna columna-central">
					<button class="boton-cerrar" on:click={cerrarModal}>×</button>
					<ChatIA />
				</div>

				<!-- Columna 3 -->
				<div class="columna columna-derecha">
					<h3>Recursos</h3>
					<!-- Contenido columna derecha -->
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	.fondo-modal {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.75);
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 9999;
		padding: 2rem 0; /* Añadimos padding vertical */
	}

	.contenido-modal {
		background: var(--ai-msg-bg, rgba(255, 255, 255, 0.07));
		width: 95%;
		max-width: 4000px;
		height: 95vh; /* Reducimos altura */
		border-radius: 15px;
		position: relative;
		padding: 1rem;
		box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3);
		margin: auto; /* Asegura centrado vertical */
	}

	.columnas-contenedor {
		display: flex;
		height: 100%;
		gap: 1rem;
	}

	.columna {
		height: 100%;
		background: rgba(255, 255, 255, 0.03);
		border-radius: 10px;
		padding: 1rem;
		display: flex;
		flex-direction: column;
	}

	.columna-izquierda {
		flex: 0.75; /* Reducido para compensar el aumento de la columna central */
		min-width: 200px;
		background: rgba(255, 255, 255, 0.03);
	}

	.columna-central {
		flex: 2.5; /* Aumentado de 2 a 2.5 (25% más ancho) */
		position: relative;
		min-width: 500px; /* Aumentado de 400px a 500px */
		height: 100%;
		overflow: hidden;
		display: flex;
		flex-direction: column;
	}

	/* Aseguramos que ChatIA ocupe todo el espacio disponible */
	.columna-central :global(.chat-container) {
		height: 100%;
		min-height: 100%;
		max-height: 100%;
		overflow: hidden;
	}

	.columna-derecha {
		flex: 0.75; /* Reducido para compensar el aumento de la columna central */
		min-width: 200px;
	}

	.boton-cerrar {
		position: absolute;
		top: 1rem;
		right: 10.4rem;
		background: transparent;
		border: none;
		color: white;
		font-size: 2rem;
		cursor: pointer;
		width: 40px;
		height: 40px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		transition: all 0.3s ease;
		z-index: 1000;
	}

	.boton-cerrar:hover {
		background: rgba(255, 255, 255, 0.1);
	}

	/* Responsive */
	@media (max-width: 1024px) {
		.columnas-contenedor {
			flex-direction: row;
			overflow-x: auto;
		}

		.columna {
			min-height: 100%;
		}
	}
</style>
