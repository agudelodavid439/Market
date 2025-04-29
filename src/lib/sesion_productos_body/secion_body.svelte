<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';
	import { ShoppingBag } from 'lucide-svelte';
	import { fade, fly } from 'svelte/transition';
	import { obtenerProductos } from '$lib/conexion_products';
	import { obtenerCategorias } from '$lib/conexion_pedidos';
	import type { Producto } from '$lib/conexion_products';
	import Carrito from '$lib/sesion_carrito/carrito.svelte';
	import { searchTerm } from '$lib/estadoGlobal.js';

	import { productosEnCarrito, carritoVisible, toggleCarrito } from '$lib/stores/carritoTienda';

	let listaProductos: Producto[] = [];
	let listaCategorias: string[] = [];
	let mensajeError: string | null = null;
	let estaCargando = true;
	let categoriaSeleccionada: string | null = null;
	let productoResaltado: number | null = null;
	let cantidadProductos = 0;

	const dispatch = createEventDispatcher();

	onMount(async () => {
		try {
			const [respuestaProductos, respuestaCategorias] = await Promise.all([
				obtenerProductos(),
				obtenerCategorias(),
			]);

			if (respuestaProductos.error) throw respuestaProductos.error;
			if (respuestaCategorias.error) throw respuestaCategorias.error;

			listaProductos = respuestaProductos.data || [];
			listaCategorias = respuestaCategorias.data || [];
		} catch (err: any) {
			mensajeError = 'Error al cargar los datos: ' + err.message;
			console.error(err);
		} finally {
			estaCargando = false;
		}
	});

	function formatearPrecio(precio: number): string {
		return new Intl.NumberFormat('es-CO', {
			style: 'currency',
			currency: 'COP',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0,
		}).format(precio);
	}

	// Función única para agregar al carrito
	async function agregarAlCarrito(producto: Producto) {
		productosEnCarrito.update(items => {
			const existente = items.find(item => item.producto.col_nombre === producto.col_nombre);
			if (existente) {
				return items.map(item =>
					item.producto.col_nombre === producto.col_nombre
						? { ...item, cantidad: item.cantidad + 1 }
						: item
				);
			}
			return [...items, { producto, cantidad: 1 }];
		});

		// Actualizar cantidad de productos en el carrito
		cantidadProductos = $productosEnCarrito.reduce((total, item) => total + item.cantidad, 0);

		// Mostrar el carrito
		carritoVisible.set(true);

		// Mostrar notificación
		const mensaje = document.createElement('div');
		mensaje.textContent = '¡Producto añadido! 🛍️';
		mensaje.style.cssText = `
			position: fixed;
			bottom: 20px;
			right: 20px;
			background: #4CAF50;
			color: white;
			padding: 1rem;
			border-radius: 8px;
			animation: fadeInOut 2s ease-in-out;
			z-index: 1000;
		`;
		document.body.appendChild(mensaje);
		setTimeout(() => mensaje.remove(), 2000);
	}

	$: productosFiltrados = listaProductos.filter(producto => {
		const categoriaCoincide = !categoriaSeleccionada || producto.col_tipo === categoriaSeleccionada;
		const busquedaCoincide =
			producto.col_nombre?.toLowerCase().includes($searchTerm) ||
			producto.col_descripcion?.toLowerCase().includes($searchTerm);

		return busquedaCoincide;
	});
</script>

<div class="contenedor-principal">
	<div class="contenedor-catalogo">
		<div class="seccion-cabecera">
			<div class="barra-categorias">
				<div class="flex">
					<button
						class="boton-categoria {!categoriaSeleccionada ? 'activo' : ''}"
						on:click={() => (categoriaSeleccionada = null)}
					>
						Todos
					</button>
					{#each listaCategorias as categoria}
						<button
							class="boton-categoria {categoriaSeleccionada === categoria ? 'activo' : ''}"
							on:click={() => (categoriaSeleccionada = categoria)}
						>
							{categoria}
						</button>
					{/each}
				</div>
			</div>
		</div>

		<div class="cuadricula-productos-horizontal">
			{#if estaCargando}
				{#each Array(6) as _, i}
					<div class="tarjeta-producto esqueleto-cargando" in:fade></div>
				{/each}
			{:else if mensajeError}
				<div class="col-span-full text-center text-lg text-red-400">
					{mensajeError}
				</div>
			{:else if productosFiltrados.length === 0}
				<div class="col-span-full text-center text-lg text-gray-400">
					{#if categoriaSeleccionada}
						No hay productos en la categoría "{categoriaSeleccionada}" por ahora.
					{:else}
						No hay productos disponibles.
					{/if}
				</div>
			{:else}
				{#each productosFiltrados as producto, i}
					<div
						class="tarjeta-producto"
						in:fly={{ y: 20, delay: i * 100 }}
						on:mouseenter={() => (productoResaltado = i)}
						on:mouseleave={() => (productoResaltado = null)}
					>
						<div class="contenedor-imagen-producto">
							<img
								src={producto.col_imagen || 'https://via.placeholder.com/400x300?text=Producto'}
								alt={producto.col_nombre}
								class="imagen-producto"
								on:error={e => {
									if (e.target) {
										(e.target as HTMLImageElement).src =
											'https://via.placeholder.com/400x300?text=Error+de+Imagen';
									}
								}}
							/>
							{#if producto.col_stock > 0}
								<span class="etiqueta-stock stock-disponible"> Disponible </span>
							{:else}
								<span class="etiqueta-stock stock-agotado">Agotado</span>
							{/if}

							<div class="contenedor-boton-comprar">
								<div class="carrito-container">
									<button
										class="boton-carrito-flotante"
										disabled={!producto.col_stock || producto.col_stock <= 0}
										on:click={() => toggleCarrito()}
									>
										<svg
											viewBox="0 0 24 24"
											class="icono-carrito"
											fill="none"
											stroke="currentColor"
											stroke-width="2"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												d="M9 2h6a2 2 0 0 1 2 2v16l-3-2-3 2-3-2-3 2V4a2 2 0 0 1 2-2z"
											/>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												d="M9 7h6M9 11h6M9 15h4"
											/>
										</svg>

										{#if cantidadProductos > 0}
											<span class="notificacion-carrito">{cantidadProductos}</span>
										{/if}
									</button>
								</div>
								<span class="texto-comprar">pedido</span>
							</div>
						</div>

						<div class="info-producto">
							<div class="encabezado-producto">
								<h3 class="titulo-producto">{producto.col_nombre}</h3>
								<div class="linea-decorativa"></div>
							</div>
							<p class="descripcion-producto">
								{producto.col_descripcion || 'Sin descripción disponible'}
							</p>
							<div class="etiqueta-precio">
								{formatearPrecio(producto.col_precio_puerta)}
								<div class="contenedor-boton-accion">
									<button
										class="boton-carrito-agregar"
										disabled={!producto.col_stock || producto.col_stock <= 0}
										on:click={() => agregarAlCarrito(producto)}
									>
										<svg
											viewBox="0 0 24 24"
											class="icono-carrito-integrado"
											fill="none"
											stroke="currentColor"
											stroke-width="2"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
											/>
										</svg>
										<span class="texto-pedir">Pedir</span>
									</button>
								</div>
							</div>

							<div class="tiempo-envio">
								<svg class="icono-reloj" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width={2}
										d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
									/>
								</svg>
								<span class="texto-envio">Disponible</span>
							</div>
						</div>
					</div>
				{/each}
			{/if}
		</div>
	</div>
</div>

<!-- Importante: esto muestra el modal del carrito abierto -->
{#if $carritoVisible}
	<div class="carrito-flotante">
		<Carrito />
	</div>
{/if}

<style>
	/* Estilos del Contenedor Principal */
	.contenedor-principal {
		padding: -2rem;
	}

	@media (max-width: 768px) {
		.contenedor-principal {
			padding-top: 40px;
		}
	}

	/* Estilos del Catálogo */
	.contenedor-catalogo {
		width: auto;
		max-width: 100%;
		margin: 0 auto;
		padding: 2rem 1rem;
		background: linear-gradient(180deg, #14213d 0%, #1e3a5f 30%, rgb(0, 0, 0) 60%, #0a1929 100%);
		background-attachment: fixed;
		backdrop-filter: blur(30px);
		border-radius: 0; /* Borde redondeado eliminado */
		box-shadow: none; /* Sombra eliminada (parece borde visual) */
		overflow: hidden;
	}

	/* Estilos de la Cabecera de Sección */
	.seccion-cabecera {
		margin-bottom: 2rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
	}

	/* Estilos de la Barra de Categorías */
	.barra-categorias {
		overflow-x: auto;
		white-space: nowrap;
		scrollbar-width: thin;
		-ms-overflow-style: thin;
		padding: 0.75rem;
		border-radius: 8px;
		background: rgba(0, 0, 0, 0.1);
		width: 100%;
		max-width: 100%;
	}

	@media (min-width: 768px) {
		.barra-categorias {
			display: flex;
			justify-content: center;
		}
	}

	/* Estilos para ocultar la barra de desplazamiento en navegadores WebKit */
	@media (min-width: 768px) {
		.barra-categorias::-webkit-scrollbar {
			width: 0; /* Ancho de la barra de desplazamiento */
			height: 0; /* Altura de la barra de desplazamiento */
		}

		/* Estilos para el pulgar de la barra de desplazamiento en navegadores WebKit */
		.barra-categorias::-webkit-scrollbar-thumb {
			background: transparent; /* Color del pulgar */
		}

		/* Estilos para la pista de la barra de desplazamiento en navegadores WebKit */
		.barra-categorias::-webkit-scrollbar-track {
			background: transparent; /* Color de la pista */
		}
	}

	.barra-categorias .flex {
		gap: 0.75rem;
		display: inline-flex;
		align-items: center;
		flex-wrap: nowrap;
	}
	.boton-categoria {
		background: transparent;
		border: 1px solid rgba(255, 255, 255, 0.1);
		padding: 0.5rem 1rem;
		border-radius: 9999px;
		font-weight: 500;
		transition: all 0.3s ease;
		white-space: nowrap;
		cursor: pointer;
		font-size: 1.105rem;
		display: inline-block;

		/* 🎯 Texto degradado siempre */
		background-image: linear-gradient(90deg, #007aff, #00c6ff);
		background-clip: text;
		-webkit-background-clip: text;
		color: transparent;
		-webkit-text-fill-color: transparent;
	}

	.boton-categoria.activo {
		/* 🎯 Fondo visible solo en activo */
		background-color: rgba(0, 123, 255, 0.929); /* azul clarito, 15% opacidad */
		border: 1.3px solid rgb(253, 253, 253);
		backdrop-filter: blur(4px); /* opcional: para un efecto de vidrio */
	}

	/* Estilos de la Cuadrícula de Productos */
	.cuadricula-productos-horizontal {
		display: flex;
		overflow-x: auto;
		padding-bottom: 1rem;
		-webkit-overflow-scrolling: touch;
		scrollbar-width: none;
		-ms-overflow-style: none;
		padding-left: 1rem;
	}

	.cuadricula-productos-horizontal .tarjeta-producto {
		margin-right: 1.5rem;
		flex-shrink: 0;
		width: 300px;
	}

	.cuadricula-productos-horizontal .tarjeta-producto:last-child {
		margin-right: 0;
	}

	/* Estilos de la Tarjeta de Producto */
	.tarjeta-producto {
		position: relative;
		border-radius: 1rem;
		overflow: hidden;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.1);
		transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
		display: flex;
		flex-direction: column;
		height: auto;
		width: 300px;
		flex-shrink: 0;
		margin-right: 1rem;
	}

	.tarjeta-producto:last-child {
		margin-right: 0;
	}

	.tarjeta-producto:hover {
		transform: translateY(-0.3rem);
		border-color: rgba(255, 255, 255, 0.2);
		box-shadow: 0 8px 15px rgba(0, 0, 0, 0.2);
	}

	/* Estilos del Contenedor de Imagen del Producto */
	.contenedor-imagen-producto {
		position: relative;
		width: 100%;
		aspect-ratio: 4 / 3;
		overflow: hidden;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}

	.imagen-producto {
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: transform 0.6s ease;
	}

	.tarjeta-producto:hover .imagen-producto {
		transform: scale(1.03);
	}

	/* Estilos de la Información del Producto */
	.info-producto {
		padding: 1.5rem;
		color: white;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		background: linear-gradient(to bottom, rgba(255, 255, 255, 0.05), rgba(0, 0, 0, 0.2));
		border-radius: 0 0 1rem 1rem;
	}

	.encabezado-producto {
		position: relative;
		margin-bottom: 0.5rem;
	}

	.titulo-producto {
		font-size: 1.4rem;
		font-weight: 700;
		color: #ffffff;
		margin-bottom: 0.5rem;
		line-height: 1.3;
		letter-spacing: 0.5px;
		text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
	}

	.linea-decorativa {
		width: 40px;
		height: 3px;
		background: linear-gradient(to right, #fd7e14, #ffc107);
		margin-top: 0.5rem;
		border-radius: 2px;
		box-shadow: 0 2px 4px rgba(253, 126, 20, 0.3);
	}

	.descripcion-producto {
		font-size: 0.95rem;
		line-height: 1.5;
		color: #e2e8f0;
		margin: 0.75rem 0;
		padding-left: 0.5rem;
		border-left: 2px solid rgba(255, 255, 255, 0.1);
		min-height: 3em;
	}

	.etiqueta-precio {
		font-size: 1.5rem;
		font-weight: 700;
		color: #ffc107;
		padding: 0.5rem;
		background: rgba(0, 0, 0, 0.2);
		border-radius: 8px;
		text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
		letter-spacing: 0.5px;
		display: flex;
		align-items: center;
		justify-content: space-between; /* Cambio aquí para distribuir espacio */
		gap: 1rem; /* Espacio entre precio y botón */
	}

	.etiqueta-precio span:first-child {
		text-align: left; /* Alinear precio a la izquierda */
		margin-right: auto; /* Empuja el contenido siguiente hacia la derecha */
	}

	.contenedor-boton-accion {
		flex-shrink: 0; /* Evita que el botón se encoja */
	}

	/* Actualizar los estilos del botón */
	.boton-carrito-agregar {
		display: flex;
		align-items: center;
		padding: 0.5rem 1rem;
		border-radius: 9999px;
		background: #2e8b57; /* Verde mar oscuro (SeaGreen) */
		border: none;
		transition: all 0.3s ease;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.boton-carrito-agregar:hover {
		background: #3cb371; /* Verde mar medio al hover */
		transform: translateY(-1px);
	}

	.icono-carrito-integrado {
		width: 16px;
		height: 16px;
		margin-right: 4px;
		vertical-align: middle;
		color: #ffffff; /* Blanco para mejor contraste */
	}

	.texto-pedir {
		display: inline-flex;
		align-items: center;
		font-size: 0.875rem;
		font-weight: 500;
		letter-spacing: 0.5px;
		color: #ffffff; /* Blanco para mejor contraste */
	}

	/* Estilos de la Etiqueta de Stock */
	.etiqueta-stock {
		position: absolute;
		top: 0.5rem;
		left: 0.5rem;
		padding: 0.2rem 0.6rem;
		border-radius: 9999px;
		font-size: 0.7rem;
		font-weight: 500;
		backdrop-filter: blur(4px);
		z-index: 10;
	}

	.stock-disponible {
		color: #2e8b57;
		background-color: rgba(#2e8b57);
	}

	.stock-agotado {
		color: #fee2e2;
		background-color: rgba(220, 38, 38, 0.3);
	}

	/* Estilos del Esqueleto de Carga */
	@keyframes shimmer {
		0% {
			background-position: -468px 0;
		}

		100% {
			background-position: 468px 0;
		}
	}

	.esqueleto-cargando {
		background: linear-gradient(
			to right,
			rgba(255, 255, 255, 0.1) 8%,
			rgba(255, 255, 255, 0.2) 18%,
			rgba(255, 255, 255, 0.1) 33%
		);
		background-size: 800px 104px;
		animation: shimmer 1.5s linear infinite;
		border-radius: 0.8rem;
		height: auto;
		display: flex;
		flex-direction: column;
	}

	/* Estilos para pantallas muy pequeñas */
	@media (max-width: 375px) {
		.cuadricula-productos-horizontal {
			grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
			gap: 0.75rem;
			padding: 0.75rem;
		}

		.titulo-producto {
			font-size: 3rem;
			margin-bottom: 0.1rem;
		}

		.descripcion-producto {
			font-size: 2rem;
			line-height: 1.2;
			margin-bottom: 0.25rem;
		}

		.etiqueta-precio {
			font-size: 2.6rem;
			margin-bottom: 1rem;
		}

		.boton-carrito-agregar {
			width: 7rem;
			height: 7rem;
			font-size: 2.2rem;
			bottom: 0.25rem;
			right: 0.25rem;
		}
	}

	/* Nuevos estilos para el scroll horizontal */
	.cuadricula-productos-horizontal {
		display: flex;
		overflow-x: auto;
		padding-bottom: 1rem;
		-webkit-overflow-scrolling: touch;
		scrollbar-width: none;
		-ms-overflow-style: none;
		padding-left: 1rem;
	}

	.cuadricula-productos-horizontal .tarjeta-producto {
		margin-right: 1.5rem;
		flex-shrink: 0;
		width: 300px;
	}

	.cuadricula-productos-horizontal .tarjeta-producto:last-child {
		margin-right: 0;
	}

	.contenedor-boton-comprar {
		position: absolute;
		bottom: 1rem;
		right: 1rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.3rem;
		z-index: 20;
	}

	.carrito-container {
		position: relative;
		z-index: 200;
	}

	.boton-carrito-flotante {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		background: linear-gradient(135deg, #dc3545 0%, #fd7e14 50%, #ffc107 100%);
		border: none;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: all 0.3s ease;
		color: white;
	}

	.notificacion-carrito {
		position: absolute;
		top: -8px;
		right: -8px;
		background: #e30808;
		color: white;
		font-size: 12px;
		font-weight: bold;
		min-width: 18px;
		height: 18px;
		border-radius: 9999px;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 2px;
		border: 2px solid #ffffff;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
	}

	.carrito-flotante {
		position: fixed;
		top: 50%;
		right: 20px;
		transform: translateY(-50%);
		z-index: 100;
	}

	.texto-comprar {
		color: #dcfce7;
		font-size: 0.75rem;
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		background-color: #2e8b57;
		padding: 0.2rem 0.6rem;
		border-radius: 9999px;
		backdrop-filter: blur(4px);
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
		transition: all 0.3s ease;
	}

	.contenedor-boton-comprar:hover .texto-comprar {
		background-color: rgba(34, 197, 94, 0.8);
		transform: translateY(1px);
	}

	/* Estilos para el tiempo de envío */
	.tiempo-envio {
		display: flex;
		align-items: center;
		gap: 0.3rem;
		margin-top: 0.5rem;
	}

	.icono-reloj {
		width: 0.875rem;
		height: 0.875rem;
		color: #98fb98; /* Verde seda claro */
	}

	.texto-envio {
		font-size: 0.875rem;
		color: #98fb98; /* Verde seda claro */
		font-weight: 500;
		letter-spacing: 0.02em;
	}

	.tiempo-envio:hover {
		opacity: 0.9;
		transform: translateY(-1px);
		transition: all 0.3s ease;
	}
</style>
