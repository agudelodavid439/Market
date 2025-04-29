<script lang="ts">
	import { ShoppingBag } from 'lucide-svelte';
	import type { Producto } from '$lib/conexion_products';
	import { productosEnCarrito, carritoVisible } from '$lib/stores/carritoTienda';
	import ListaProductos from './productos.svelte';
	import Formulario from './formulario.svelte';

	$: cantidadProductos = $productosEnCarrito.reduce((sum, item) => sum + item.cantidad, 0);
	$: total = $productosEnCarrito.reduce(
		(sum, item) => sum + item.producto.col_precio_puerta * item.cantidad,
		0
	);

	function toggleCarrito() {
		carritoVisible.update(value => !value);
	}

	function formatearPrecio(precio: number): string {
		return new Intl.NumberFormat('es-CO', {
			style: 'currency',
			currency: 'COP',
			minimumFractionDigits: 0,
		}).format(precio);
	}

	let formularioVisible = false;

	function toggleFormulario() {
		formularioVisible = !formularioVisible;
	}

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
</script>

<div class="contenedor-principal">
	<div class="contenedor-carrito-total">
		<!-- Mostrar directamente el carrito -->
		<div class="carrito-flotante">
			<div class="carrito-header">
				<!-- Modifica el div header-content -->
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
					<h3>Solicitando Pedido...</h3>
				</div>

				<!-- Añade estos estilos en la sección <style> -->
				<button class="cerrar-carrito" on:click={toggleCarrito}>✕</button>
			</div>

			{#if $productosEnCarrito.length === 0}
				<p class="carrito-vacio">Aún no pides...</p>
			{:else}
				<ListaProductos {formatearPrecio} />

				<div class="total-carrito">
					<div class="detalles-factura">
						<div class="linea-detalle">
							<span class="etiqueta">Datos_Factura</span>
							<span class="etiqueta">N° Orden:</span>

							<span class="valor">#{Date.now().toString().slice(-6)}</span>
						</div>
						<div class="linea-detalle">
							<span class="etiqueta">Fecha y Hora:</span>
							<div class="valores">
								<span class="valor-hora"
									>{new Date().toLocaleTimeString('es-CO', {
										hour: '2-digit',
										minute: '2-digit',
										hour12: false,
									})}</span
								>
								<span class="separador">-</span>
								<span class="valor">{new Date().toLocaleDateString('es-CO')}</span>
							</div>
						</div>

						<Formulario {formularioVisible} {toggleFormulario} />
					</div>
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
			{/if}
		</div>
	</div>
</div>

<style>
	/* Estilos generales */
	.contenedor-principal {
		height: 1vh;
	}

	.contenedor-carrito-total {
		height: 100%;
		overflow-y: auto;
	}

	/* Estilos para el carrito flotante */
	.carrito-flotante {
		position: fixed;
		top: 40%;
		right: 1px;
		transform: translateY(-50%);
		background-color: #e1dddd;
		border: 1px solid #efecec;
		padding: 15px;
		border-radius: 12px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		z-index: 1001;
		width: 500px;
		max-width: 95vw;
		animation: slideInRight 0.3s ease-out;
		display: flex;
		flex-direction: column;
		height: 600px; /* altura */
	}

	@keyframes slideInRight {
		from {
			opacity: 0;
			transform: translateX(50%) translateY(-50%);
		}
		to {
			opacity: 1;
			transform: translateX(0) translateY(-50%);
		}
	}

	/* Estilos del encabezado del carrito */
	.carrito-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin: -15px -15px 15px -15px;
		padding: 15px 20px;
		background: linear-gradient(90deg, #0a2342, #18386b);
		color: white;
		font-weight: bold;
		width: calc(100% + 30px);
		border-radius: 12px 12px 0 0;
		border-bottom: 2px solid rgba(255, 255, 255, 0.15);
		box-shadow: 0 5px 8px rgba(10, 35, 66, 0.5);
	}

	.cerrar-carrito {
		background: none;
		border: none;
		color: white;
		font-size: 24px;
		cursor: pointer;
		padding: 8px;
		line-height: 1;
		opacity: 0.9;
		font-weight: 300;
		transition: all 0.2s ease;
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
	}

	.cerrar-carrito:hover {
		opacity: 1;
		transform: scale(1.1);
	}

	/* Mensaje de carrito vacío */
	.carrito-vacio {
		color: #777;
		text-align: center;
		padding: 15px 0;
	}

	.total-carrito {
		border-top: 1px solid rgb(247, 239, 239);
		padding: 1rem;
		margin: auto -15px -15px -15px;
		background: linear-gradient(90deg, #0a2342, #18386b);
		width: calc(100% + 30px);
		border-radius: 0 0 12px 12px;
	}

	/* Ajustar el padding del contenido dentro del total-carrito */
	.fila-principal,
	.detalles-factura {
		padding: 10px 25px; /* faltaba la unidad 'px' en el 10 */
		background: linear-gradient(90deg, #0a2342, #18386b);
		width: 100%; /* esto hace que ocupe todo el ancho */
		box-sizing: border-box; /* asegura que el padding no sume ancho extra */

		border-top: 1px solid rgba(231, 222, 222, 0.826);
	}

	.fila-principal {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
		gap: 2rem;
	}

	.seccion-precio {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.3rem;
	}

	.etiqueta-precio {
		font-family: 'Roboto', sans-serif;
		color: #fcfeff;
		font-weight: 600;
		font-size: 1rem;
	}

	.precio-total {
		font-size: 1.5rem;
		font-weight: 700;
		color: #ffc107;
		padding: 0.5rem;
		background: rgba(204, 32, 32, 0);
		border-radius: 8px;
		text-shadow: 2px 2px 4px rgba(186, 9, 9, 0.563);
		letter-spacing: 0.5px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		font-variant-numeric: tabular-nums;
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
		border-radius: 8px;
		box-shadow: 0 4px 6px rgba(41, 10, 168, 0.648);
		transition: all 0.2s ease;
		cursor: pointer;
	}

	.boton-pedir:hover {
		background-color: #3aa76c;
		transform: translateY(-2px);
	}

	.boton-pedir:active {
		transform: translateY(1px);
	}
	.icono-carrito-integrado {
		stroke: currentColor;
	}

	.texto-pedir {
		font-family: 'Roboto', sans-serif;
		font-size: 1rem;
	}

	.detalles-factura {
		display: flex;
		flex-direction: column;
		gap: 0.8rem;
		padding-top: 1rem;
		border-top: 1px dashed rgba(255, 255, 255, 0.708);
	}

	.linea-detalle {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.etiqueta {
		font-family: 'Roboto', sans-serif;
		color: #fffefe;
		font-weight: 600;
		font-size: 1rem;
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

	.icono-nota-pedido {
		width: 24px;
		height: 24px;
		border-radius: 70%;
		background: linear-gradient(135deg, #dc3545 0%, #fd7e14 50%, #ffc107 100%);
		border: none;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: all 0.3s ease;
		color: white;
		padding: 4px;
		margin-right: 10px;
	}

	.icono-nota-pedido:hover {
		transform: scale(1.1);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
	}

	.header-content {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.contenedor-icono {
		position: relative;
		display: inline-flex;
	}

	.notificacion-cantidad {
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

	/* Responsivo */
	@media (max-width: 480px) {
		.boton-pedir {
			width: 100%;
			padding: 12px;
		}
	}

	/* Ajustes responsivos mejorados */
	@media (max-width: 768px) {
		.carrito-flotante {
			position: fixed;
			top: 50%;
			right: 50%;
			transform: translate(50%, -50%);
			width: 90vw;
			max-height: 90vh;
			overflow-y: auto;
		}
	}

	@media (max-width: 480px) {
		.carrito-flotante {
			position: fixed;
			top: 50%;
			right: 20px;
			transform: translateY(-50%);
			width: 85vw;
			max-height: 85vh;
			border-radius: 12px;
		}

		.total-carrito {
			position: relative;
			bottom: 0;
			padding: 0rem;
			margin-top: auto;
			border-top: 5px solid rgba(0, 0, 01, 0.1);
		}

		.detalles-factura {
			grid-template-columns: 1fr 1fr;
			font-size: 0.85rem;
			gap: 1rem;
		}

		.etiqueta,
		.valor {
			font-size: 0.9rem;
		}
	}

	/* Ajustes de animación para móviles */
	@media (max-width: 480px) {
		@keyframes slideInRight {
			from {
				opacity: 0;
				transform: translateY(100%);
			}
			to {
				opacity: 1;
				transform: translateY(0);
			}
		}
	}
</style>
