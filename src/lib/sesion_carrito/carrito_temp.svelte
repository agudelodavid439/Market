<script lang="ts">
	import { ShoppingBag } from 'lucide-svelte';
	import type { Producto } from '$lib/conexion_products';
	import { productosEnCarrito, carritoVisible } from '$lib/stores/carritoTienda';
	import ListaProductos from './productos.svelte';
	import FinalizarPedido from './Finalizar_pedido.svelte';
	import { fade, scale } from 'svelte/transition';

	// Cálculo reactivo de cantidad y total
	$: cantidadProductos = $productosEnCarrito.reduce((sum, item) => sum + item.cantidad, 0);
	$: total = $productosEnCarrito.reduce(
		(sum, item) => sum + item.producto.col_precio_puerta * item.cantidad,
		0
	);

	// Variable para controlar la animación de salida
	let saliendo = false;
	let formularioVisible = false;

	// Función para cerrar el carrito con animación
	function toggleCarrito() {
		if ($carritoVisible) {
			saliendo = true;
			setTimeout(() => {
				carritoVisible.set(false);
				saliendo = false;
			}, 300);
		} else {
			carritoVisible.set(true);
		}
	}

	// Funciones para gestionar productos en el carrito
	function actualizarCantidad(nombreProducto: string, cambio: number) {
		productosEnCarrito.update(items =>
			items
				.map(item =>
					item.producto.col_nombre === nombreProducto
						? { ...item, cantidad: Math.max(1, item.cantidad + cambio) }
						: item
				)
				.filter(item => item.cantidad > 0)
		);
	}

	function quitarProducto(indice: number) {
		productosEnCarrito.update(productos => productos.filter((_, i) => i !== indice));
	}

	// Formateo de precios
	function formatearPrecio(precio: number) {
		return new Intl.NumberFormat('es-CO', {
			style: 'currency',
			currency: 'COP',
			minimumFractionDigits: 0,
		}).format(precio);
	}

	// Función para mostrar/ocultar formulario
	function toggleFormulario() {
		formularioVisible = !formularioVisible;
		const carritoElement = document.querySelector('.carrito-flotante');
		if (carritoElement) {
			if (formularioVisible) {
				carritoElement.classList.add('con-formulario');
				document.body.classList.add('formulario-abierto');
			} else {
				carritoElement.classList.remove('con-formulario');
				document.body.classList.remove('formulario-abierto');
			}
		}
	}
</script>

<div class="contenedor-principal" />

{#if $carritoVisible}
	<div class="carrito-flotante {saliendo ? 'saliendo' : ''}" transition:fade>
		<div class="carrito-header">
			<div class="header-content">
				<div class="contenedor-icono">
					<svg
						viewBox="0 0 24 24"
						class="icono-nota-pedido"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<path
							d="M9 2h6a2 2 0 0 1 2 2v16l-3-2-3 2-3-2-3 2V4a2 2 0 0 1 2-2zM9 7h6M9 11h6M9 15h4"
						/>
					</svg>
					{#if cantidadProductos > 0}
						<span class="notificacion-cantidad">{cantidadProductos}</span>
					{/if}
				</div>
				<h3 class="titulo-carrito">Solicitando Pedido...</h3>
			</div>
			<button class="cerrar-carrito" on:click={toggleCarrito}>✕</button>
		</div>

		{#if $productosEnCarrito.length === 0}
			<p class="carrito-vacio">Aún no pides...</p>
		{:else}
			<div class="contenedor-productos-carrito">
				<ListaProductos {actualizarCantidad} {quitarProducto} {formatearPrecio} />
			</div>

			<div class="total-carrito">
				<div class="detalles-factura">
					<div class="linea-detalle">
						<span class="etiqueta">Fecha y Hora:</span>
						<div class="valores">
							<span class="valor-hora">
								{new Date().toLocaleTimeString('es-CO', {
									hour: '2-digit',
									minute: '2-digit',
									hour12: false,
								})}
							</span>
							<span class="separador">-</span>
							<span class="valor">{new Date().toLocaleDateString('es-CO')}</span>
						</div>
					</div>
					<div class="linea-detalle">
						<span class="etiqueta">N° Orden:</span>
						<span class="valor">#{Date.now().toString().slice(-6)}</span>
					</div>
				</div>

				<div class="divisor-elegante" />

				<div class="fila-principal">
					<div class="seccion-precio">
						<span class="etiqueta-precio">Total a Pagar:</span>
						<span class="precio-total">{formatearPrecio(total)}</span>
					</div>
					<button class="boton-pedir" on:click={toggleFormulario}>
						<svg
							viewBox="0 0 24 24"
							class="icono-carrito-integrado"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							width="20"
							height="20"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
							/>
						</svg>
						<span class="texto-pedir">{formularioVisible ? 'Cerrar' : 'Continuar'}</span>
					</button>
				</div>
			</div>

			{#if formularioVisible}
				<div class="formulario-container" transition:fade={{ duration: 300 }}>
					<FinalizarPedido {toggleFormulario} />
				</div>
			{/if}
		{/if}
	</div>
{/if}

<style>
	.contenedor-principal {
		margin-bottom: 400px;
	}

	.carrito-flotante {
		position: fixed;
		top: 80px;
		right: 20px;
		transform: none;
		background-color: #fff;
		border: 1px solid #ddd;
		padding: 15px;
		border-radius: 12px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		z-index: 998;
		width: 500px;
		max-width: 95vw;
		animation: slideInRight 0.3s ease-out;
		display: flex;
		flex-direction: column;
		height: calc(100vh - 100px);
		max-height: calc(100vh - 100px);
		overflow-y: auto;
	}

	.carrito-flotante.saliendo {
		animation: slideOutRight 0.1s ease-out forwards;
	}

	@keyframes slideInRight {
		from {
			opacity: 0;
			transform: translateX(100%);
		}
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}

	@keyframes slideOutRight {
		from {
			opacity: 1;
			transform: translateX(0);
		}
		to {
			opacity: 0;
			transform: translateX(100%);
		}
	}

	.carrito-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin: -15px -15px 15px -15px;
		padding: 15px 20px;
		background: linear-gradient(135deg, rgba(10, 25, 47, 1), rgba(30, 58, 95, 0.95));
		color: white;
		font-weight: bold;
		width: calc(100% + 30px);
		border-radius: 8px 8px 0 0;
		border-bottom: 2px solid rgba(255, 255, 255, 0.1);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.header-content {
		display: flex;
		align-items: center;
		flex-grow: 1;
	}

	.contenedor-icono {
		position: relative;
		display: inline-flex;
		margin-right: 12px;
	}

	.titulo-carrito {
		margin: 0;
		font-size: 1.1rem;
		font-weight: 600;
		white-space: nowrap;
	}

	.cerrar-carrito {
		background: none;
		border: none;
		color: white;
		font-size: 24px;
		cursor: pointer;
		line-height: 1;
		opacity: 0.9;
		font-weight: 300;
		transition: all 0.2s ease;
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
		margin-left: 16px;
		padding: 4px 8px;
		border-radius: 4px;
		display: flex;
		align-items: center;
		justify-content: center;
		min-width: 36px;
		min-height: 36px;
	}

	.cerrar-carrito:hover {
		opacity: 1;
		transform: scale(1.1);
		background-color: rgba(255, 255, 255, 0.1);
	}

	.carrito-vacio {
		color: #777;
		text-align: center;
		padding: 15px 0;
	}

	.contenedor-productos-carrito {
		position: relative;
		width: 100%;
		overflow-y: auto;
		max-height: 200px;
	}

	.total-carrito {
		border-top: 1px solid rgb(247, 239, 239);
		padding: 1rem;
		margin: auto -15px -15px -15px;
		background: linear-gradient(to bottom, rgba(25, 40, 65, 0.97) 0%, rgba(30, 58, 95, 0.95) 100%);
		width: calc(100% + 30px);
		border-radius: 0 0 12px 12px;
		box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1);
	}

	.detalles-factura {
		background-color: rgba(255, 255, 255, 0.05);
		border-radius: 8px;
		padding: 10px 15px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		display: flex;
		flex-direction: column;
		gap: 0.8rem;
	}

	.linea-detalle {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.etiqueta {
		font-family: 'Playfair Display', serif;
		color: #fffefe;
		font-weight: 600;
		font-size: 0.95rem;
	}

	.valores {
		display: flex;
		align-items: center;
		gap: 0.8rem;
	}

	.valor-hora,
	.valor {
		font-family: Arial, sans-serif;
		color: #ffffff;
		font-weight: 500;
		font-size: 1.1rem;
		letter-spacing: 0.2px;
	}

	.separador {
		color: #ffffff;
		font-weight: 400;
		font-size: 1.1rem;
	}

	.boton-pedir {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		width: auto;
		min-width: 150px;
		margin: 0;
		margin-left: auto;
		margin-right: 1rem;
		padding: 0.75rem 1.5rem;
		background-color: #2e8b57;
		color: white;
		font-weight: bold;
		border: none;
		border-radius: 9999px;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		transition: all 0.2s ease;
		cursor: pointer;
	}

	.boton-pedir:hover {
		background: #1a5733;
		transform: translateY(-2px);
		box-shadow: 0 6px 8px rgba(0, 0, 0, 0.2);
	}

	.formulario-container {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: white;
		z-index: 10;
		border-radius: 12px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		overflow: hidden;
	}

	@media (max-width: 768px) {
		.carrito-flotante {
			position: fixed;
			top: auto;
			left: 0;
			right: 0;
			bottom: 0;
			width: 100%;
			max-width: 100%;
			height: auto;
			max-height: 70vh;
			margin: 0;
			border-radius: 12px 12px 0 0;
			animation: slideInUp 0.3s ease-out;
		}

		@keyframes slideInUp {
			from {
				transform: translateY(100%);
			}
			to {
				transform: translateY(0);
			}
		}

		@keyframes slideOutDown {
			from {
				transform: translateY(0);
			}
			to {
				transform: translateY(100%);
			}
		}

		.carrito-flotante.saliendo {
			animation: slideOutDown 0.3s ease-out forwards;
		}

		.formulario-container {
			position: fixed;
			height: 70vh;
		}
	}

	@media (max-width: 480px) {
		.boton-pedir {
			width: 100%;
			margin: 0;
			padding: 12px;
		}

		.carrito-flotante {
			max-height: 65vh;
		}

		.contenedor-productos-carrito {
			max-height: calc(30vh - 60px);
		}
	}
</style>
