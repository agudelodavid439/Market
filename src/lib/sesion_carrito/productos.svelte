<script lang="ts">
	import type { Producto } from '$lib/conexion_products';
	import { productosEnCarrito } from '$lib/stores/carritoTienda';
	import { onMount } from 'svelte';

	// Exportar propiedades que necesitamos del padre
	export let actualizarCantidad: (nombreProducto: string, cambio: number) => void;
	export let quitarProducto: (indice: number) => void;
	export let formatearPrecio: (precio: number) => string;

	// Mantener la reactividad con el store de productos
	$: productos = $productosEnCarrito;

	interface BotonesActivos {
		restar: string | null;
		sumar: string | null;
	}

	// Estado para rastrear qué botones están activos
	let botonesActivos: BotonesActivos = {
		restar: null,
		sumar: null,
	};

	// Función mejorada para manejar efectos visuales
	function aplicarEfectoRestar(nombreProducto: string) {
		// Activar el efecto
		botonesActivos.restar = nombreProducto;

		// Ejecutar la acción
		actualizarCantidad(nombreProducto, -1);

		// Programar la desactivación del efecto después de 1 segundo
		setTimeout(() => {
			if (botonesActivos.restar === nombreProducto) {
				botonesActivos.restar = null;
			}
		}, 1000);
	}

	function aplicarEfectoSumar(nombreProducto: string) {
		// Activar el efecto
		botonesActivos.sumar = nombreProducto;

		// Ejecutar la acción
		actualizarCantidad(nombreProducto, 1);

		// Programar la desactivación del efecto después de 1 segundo
		setTimeout(() => {
			if (botonesActivos.sumar === nombreProducto) {
				botonesActivos.sumar = null;
			}
		}, 1000);
	}

	// Función para truncar textos largos de forma controlada
	function truncarTexto(texto: string, lineas: number = 2): string {
		// Si el texto es corto, lo devolvemos tal cual
		if (texto.length < 30) return texto;

		// Si es largo, lo procesamos para mostrarlo en múltiples líneas
		return texto;
	}

	// Manejador de error de imagen tipado
	function handleImageError(e: Event) {
		const target = e.target as HTMLImageElement;
		if (target) {
			target.src = 'https://via.placeholder.com/50x50?text=Producto';
		}
	}
</script>

<ul class="lista-productos-carrito">
	{#each productos as item, indice}
		<li class="item-carrito">
			<div class="numero-item">{indice + 1}.</div>
			<div class="producto-container">
				<div class="imagen-producto-carrito">
					<img
						src={item.producto.col_imagen}
						alt={item.producto.col_nombre}
						on:error={handleImageError}
					/>
				</div>
				<div class="info-producto">
					<h4 class="nombre-producto">{item.producto.col_nombre}</h4>
					<span class="precio-producto">{formatearPrecio(item.producto.col_precio_puerta)}</span>
				</div>
			</div>
			<div class="control-cantidad">
				<div class="cantidad-botones">
					<button
						class="boton-control {botonesActivos.restar === item.producto.col_nombre
							? 'efecto-restar'
							: ''}"
						on:click={() => aplicarEfectoRestar(item.producto.col_nombre)}
						aria-label="Disminuir cantidad"
					>
						<span class="icono-control">−</span>
					</button>
					<span class="cantidad">{item.cantidad}</span>
					<button
						class="boton-control {botonesActivos.sumar === item.producto.col_nombre
							? 'efecto-sumar'
							: ''}"
						on:click={() => aplicarEfectoSumar(item.producto.col_nombre)}
						aria-label="Aumentar cantidad"
					>
						<span class="icono-control">+</span>
					</button>
				</div>

				<button
					class="boton-eliminar"
					on:click={() => quitarProducto(indice)}
					aria-label="Eliminar producto del carrito"
				>
					<svg
						width="12"
						height="12"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<path
							d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
						/>
					</svg>
				</button>
			</div>
		</li>
	{/each}
</ul>

<style>
	/* Lista de productos */
	.lista-productos-carrito {
		list-style: none;
		padding: 12px;
		margin-bottom: 15px;
		overflow-y: auto;
		/* Altura ajustada para contener 3 productos sin scroll */
		max-height: 300px; /* Ajustado para 3 productos */
		transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
		/* Estilo para la barra de desplazamiento */
		scrollbar-width: thin;
		scrollbar-color: rgba(0, 0, 0, 0.2) rgba(0, 0, 0, 0.1);
	}

	/* Estilo de la barra de desplazamiento para Webkit (Chrome, Safari) */
	.lista-productos-carrito::-webkit-scrollbar {
		width: 5px;
	}

	.lista-productos-carrito::-webkit-scrollbar-track {
		background: rgba(0, 0, 0, 0.05);
		border-radius: 10px;
	}

	.lista-productos-carrito::-webkit-scrollbar-thumb {
		background: rgba(0, 0, 0, 0.2);
		border-radius: 10px;
	}

	.item-carrito {
		display: flex;
		justify-content: space-between;
		align-items: flex-start; /* Cambiado de center a flex-start para permitir altura variable */
		padding: 8px 10px;
		margin-bottom: 8px;
		border-radius: 8px;
		background-color: #f8f9fa;
		border-bottom: 1px solid rgba(0, 0, 0, 0.05);
		transition: all 0.2s ease;
		min-height: 68px; /* Altura óptima para que 3 items ocupen el espacio correcto */
		max-height: 85px; /* Límite máximo para mantener consistencia */
	}

	/* Estilo para el número de item tipo factura */
	.numero-item {
		min-width: 24px;
		font-size: 0.85rem;
		font-weight: 600;
		color: #555;
		background-color: #f0f0f0;
		border-radius: 50%;
		height: 24px;
		width: 24px;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-right: 6px;
		border: 1px solid rgba(0, 0, 0, 0.08);
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
	}

	.producto-container {
		display: flex;
		align-items: flex-start; /* Alineación superior para títulos multilínea */
		gap: 10px;
		flex: 1;
		min-width: 0; /* Necesario para que el texto se corte correctamente */
	}

	.imagen-producto-carrito {
		width: 40px;
		height: 40px;
		border-radius: 6px;
		overflow: hidden;
		flex-shrink: 0;
		border: 1px solid rgba(223, 108, 7, 0.3);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.imagen-producto-carrito img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.info-producto {
		display: flex !important;
		flex-direction: column;
		gap: 2px;
		min-width: 0; /* Necesario para truncamiento de texto */
	}

	.nombre-producto {
		font-size: 0.9rem;
		font-weight: 600;
		color: #2c3e50;
		margin: 0; /* Eliminamos restricción de altura */
		/* Permite dos líneas con ellipsis */
		white-space: normal;
		overflow: hidden;
		text-overflow: ellipsis;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		line-height: 1.2;
		max-width: 100%;
	}

	.precio-producto {
		font-size: 0.85rem;
		color: #2e8b57;
		font-weight: 500;
	}

	/* Control de cantidad con ancho fijo */
	.control-cantidad {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 5px;
		margin-left: 8px;
		flex-shrink: 0; /* Evita que la columna de controles se comprima */
		width: 60px; /* Ancho fijo para mantener alineación consistente */
	}

	.cantidad-botones {
		display: flex;
		align-items: center;
		gap: 5px;
		background: #ffffff;
		padding: 2px 4px;
		border-radius: 6px;
		border: 1px solid rgba(0, 0, 0, 0.1);
	}

	.boton-control {
		width: 20px;
		height: 20px;
		border-radius: 4px;
		border: none;
		background: #f0f0f0;
		color: #2c3e50;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: all 0.2s ease;
		padding: 0;
	}

	/* Estilos para los efectos temporales */
	.boton-control.efecto-restar {
		background: #ffeeee !important;
		color: #e74c3c !important;
		transform: scale(1.1);
		box-shadow: 0 2px 4px rgba(231, 76, 60, 0.3);
	}

	.boton-control.efecto-sumar {
		background: #eefff0 !important;
		color: #2ecc71 !important;
		transform: scale(1.1);
		box-shadow: 0 2px 4px rgba(46, 204, 113, 0.3);
	}

	.boton-control:hover {
		background: #2e8b57;
		color: white;
	}

	.icono-control {
		font-size: 0.9rem;
		font-weight: bold;
		line-height: 1;
	}

	.cantidad {
		font-weight: 600;
		color: #2c3e50;
		min-width: 18px;
		text-align: center;
		font-size: 0.85rem;
	}

	/* Botón eliminar más compacto */
	.boton-eliminar {
		background: #fff0f0;
		border: 1px solid rgba(231, 76, 60, 0.2);
		color: #e74c3c;
		cursor: pointer;
		padding: 2px;
		width: 20px;
		height: 20px;
		border-radius: 4px;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s ease;
		opacity: 0.7;
	}

	.boton-eliminar:hover {
		opacity: 1;
		background-color: #ffdddd;
		transform: scale(1.05);
	}

	@media (max-width: 768px) {
		.lista-productos-carrito {
			/* Ajustamos la altura y el padding para móviles */
			padding: 8px 4px;
			max-height: 210px; /* Ajustado para 3 productos en móvil */
		}

		.item-carrito {
			padding: 8px 4px;
			width: 100%;
			margin: 0 0 8px 0;
		}

		.producto-container {
			flex: 1;
			min-width: 0;
			margin-right: 8px;
		}

		.imagen-producto-carrito {
			width: 40px;
			height: 40px;
		}

		.info-producto {
			flex: 1;
			min-width: 0;
		}

		.nombre-producto {
			font-size: 0.85rem;
			line-height: 1.2;
			-webkit-line-clamp: 2;
			width: 100%;
		}

		.precio-producto {
			font-size: 0.8rem;
		}

		.numero-item {
			min-width: 20px;
			width: 20px;
			height: 20px;
			font-size: 0.75rem;
			margin-right: 8px;
		}

		.control-cantidad {
			margin-left: auto;
			width: auto;
			min-width: 60px;
		}
	}

	@media (max-width: 480px) {
		.lista-productos-carrito {
			max-height: 210px; /* Ajustado para 3 productos en móvil pequeño */
			padding: 4px 2px;
		}

		.item-carrito {
			padding: 6px 4px;
			min-height: 60px; /* Ligeramente más pequeño en móvil */
			width: 100%;
			margin-bottom: 6px; /* Reducido para optimizar espacio */
		}

		.producto-container {
			margin-right: 4px;
		}

		.boton-control {
			width: 20px;
			height: 20px;
		}

		.icono-control {
			font-size: 0.85rem;
		}

		.cantidad {
			min-width: 18px;
			font-size: 0.85rem;
		}

		.numero-item {
			min-width: 18px;
			width: 18px;
			height: 18px;
			font-size: 0.7rem;
			margin-right: 6px;
		}

		.control-cantidad {
			min-width: 65px;
			gap: 3px;
		}

		.boton-eliminar {
			width: 20px;
			height: 20px;
		}

		.cantidad-botones {
			padding: 3px;
			gap: 3px;
		}
	}
</style>
