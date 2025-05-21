<script lang="ts">
	import { ShoppingBag } from 'lucide-svelte';
	import type { Producto } from '$lib/conexion_products';
	import { productosEnCarrito, carritoVisible } from '$lib/stores/carritoTienda';
	import ListaProductos from './productos.svelte';
	import FinalizarPedido from './Finalizar_pedido.svelte';
	import { fade, scale } from 'svelte/transition';
	import { onMount, createEventDispatcher } from 'svelte';

	// Estado para detectar si estamos en móvil
	let esMobil = false;
	let esPC = false; // Nueva variable para detectar PC

	// Función para detectar si estamos en móvil
	function detectarMobil() {
		if (typeof window !== 'undefined') {
			esMobil = window.innerWidth <= 768;
			esPC = window.innerWidth >= 769;
		}
	}

	// Activar la detección en la carga y cuando cambia el tamaño de la ventana
	onMount(() => {
		detectarMobil();
		window.addEventListener('resize', detectarMobil);
		return () => window.removeEventListener('resize', detectarMobil);
	});

	// Crear un dispatcher para eventos
	const dispatch = createEventDispatcher();

	// Referencia al componente FinalizarPedido para poder llamar a sus métodos
	let formularioPedido: any;

	// Cálculo reactivo de cantidad y total
	$: cantidadProductos = $productosEnCarrito.reduce((sum, item) => sum + item.cantidad, 0);
	$: total = $productosEnCarrito.reduce(
		(sum, item) => sum + item.producto.col_precio_puerta * item.cantidad,
		0
	);

	// Variable para controlar la animación de salida
	let saliendo = false;
	let formularioVisible = false;

	// Nuevo estado para guardar el resultado del pedido
	let resultadoPedido: {
		exito: boolean;
		numeroOrden?: string;
		mensaje?: string;
	} | null = null;

	// Mejorar el log del estado de resultadoPedido
	$: if (resultadoPedido) {
		console.log('[Carrito] Estado de resultadoPedido actualizado:', resultadoPedido);
	}

	// Añadimos una función para calcular la clase basada en la cantidad de productos
	$: carritoClasses = `carrito-flotante ${saliendo ? 'saliendo' : ''} ${$productosEnCarrito.length <= 1 ? 'empty-cart' : ''}`;

	// Función para cerrar el carrito con animación
	function toggleCarrito() {
		console.log('[Carrito] toggleCarrito llamado, carritoVisible actual =', $carritoVisible);
		if ($carritoVisible) {
			saliendo = true;
			console.log('[Carrito] Animación de salida iniciada (saliendo =', saliendo, ')');
			setTimeout(() => {
				carritoVisible.set(false);
				saliendo = false;
				console.log('[Carrito] Carrito cerrado completamente');
			}, 300);
		} else {
			carritoVisible.set(true);
			console.log('[Carrito] Carrito abierto');
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

	// Función para mostrar/ocultar formulario con más logs
	function toggleFormulario() {
		formularioVisible = !formularioVisible;
		console.log(
			'[Carrito] Toggle formulario:',
			formularioVisible,
			'resultadoPedido =',
			resultadoPedido
		);

		// Si cerramos el formulario y hay un pedido exitoso, mantener visible el carrito
		if (!formularioVisible && resultadoPedido?.exito) {
			console.log('[Carrito] Manteniendo carrito visible debido a pedido exitoso');
		} else {
			// Comportamiento normal
			const carritoElement = document.querySelector('.carrito-flotante') as HTMLElement;
			if (carritoElement) {
				if (formularioVisible) {
					carritoElement.classList.add('con-formulario');
					document.body.classList.add('formulario-abierto');
					console.log('[Carrito] Añadidas clases para formulario abierto');

					// Ajustar el tamaño del carrito cuando se abre el formulario para mantener coherencia visual
					if (esMobil) {
						// En móvil, mantener las mismas dimensiones para una transición fluida
						carritoElement.style.maxHeight = carritoElement.clientHeight + 'px';
						setTimeout(() => {
							carritoElement.style.maxHeight = '95vh'; // Casi altura completa en móvil
							carritoElement.style.height = 'auto';
						}, 50);
					} else {
						// En PC, preservar las dimensiones actuales y luego expandir
						const alturaActual = carritoElement.clientHeight;
						carritoElement.style.height = alturaActual + 'px';
						setTimeout(() => {
							carritoElement.style.maxHeight = 'calc(100vh - 80px)'; // Mayor altura en PC
							carritoElement.style.height = 'auto';
						}, 50);
					}
				} else {
					carritoElement.classList.remove('con-formulario');
					document.body.classList.remove('formulario-abierto');
					console.log('[Carrito] Removidas clases para formulario cerrado');

					// Restaurar el tamaño original al cerrar el formulario
					if (esMobil) {
						// Transición suave en móvil
						carritoElement.style.transition = 'max-height 0.3s ease, height 0.3s ease';
						carritoElement.style.maxHeight = '90vh';
						carritoElement.style.height = 'auto';
					} else {
						// Transición suave en PC
						carritoElement.style.transition = 'max-height 0.3s ease, height 0.3s ease';
						carritoElement.style.maxHeight = 'calc(100vh - 150px)';
						carritoElement.style.height = 'auto';
					}
				}
			} else {
				console.error('[Carrito] No se encontró el elemento .carrito-flotante');
			}
		}
	}

	// Función para manejar finalización directa del pedido
	function handleFinalizarDirectamente() {
		if (formularioVisible) {
			// Mejorar la búsqueda del formulario con una mejor selección
			console.log('[Carrito] Intentando enviar formulario directamente');

			// Primera opción: usar la referencia al componente si está disponible
			if (formularioPedido && typeof formularioPedido.submitForm === 'function') {
				console.log('[Carrito] Usando método submitForm del componente');
				formularioPedido.submitForm();
				return;
			}

			// Segunda opción: buscar el formulario por ID (más específico)
			const formularioEl = document.getElementById('form-finalizar-pedido');
			if (formularioEl) {
				console.log('[Carrito] Formulario encontrado por ID, enviando...');
				const submitEvent = new Event('submit', { cancelable: true, bubbles: true });
				formularioEl.dispatchEvent(submitEvent);
				return;
			}

			// Tercera opción: buscar cualquier formulario dentro del contenedor
			const formularioContainer = document.querySelector('.formulario-container');
			if (formularioContainer) {
				const formularioEnContainer = formularioContainer.querySelector('form');
				if (formularioEnContainer) {
					console.log('[Carrito] Formulario encontrado dentro del contenedor, enviando...');
					const submitEvent = new Event('submit', { cancelable: true, bubbles: true });
					formularioEnContainer.dispatchEvent(submitEvent);
					return;
				}
			}

			// Si no se encontró ningún formulario, mostrar error detallado
			console.error('[Carrito] No se encontró el formulario para enviar. Estado del DOM:');
			console.error(
				'- ¿Existe .formulario-container?',
				!!document.querySelector('.formulario-container')
			);
			console.error(
				'- ¿Existe #form-finalizar-pedido?',
				!!document.getElementById('form-finalizar-pedido')
			);
			console.error('- Componente formularioPedido:', formularioPedido);

			// Como último recurso, intentamos con toggleFormulario para cerrar
			alert(
				'No se pudo procesar el pedido automáticamente. Por favor, presione "Finalizar Compra" directamente en el formulario.'
			);
		} else {
			// Si el formulario no está visible, simplemente lo mostramos
			toggleFormulario();
			console.log('[Carrito] Mostrando formulario (toggleFormulario)');
		}
	}

	// Recibir notificación de pedido exitoso con logs mejorados
	function handlePedidoExitoso(datos: { exito: boolean; numeroOrden?: string; mensaje?: string }) {
		console.log('[Carrito] handlePedidoExitoso llamado con datos:', datos);
		resultadoPedido = datos;
		console.log('[Carrito] resultadoPedido actualizado:', resultadoPedido);

		formularioVisible = false; // Cerrar el formulario
		console.log('[Carrito] Formulario cerrado (formularioVisible =', formularioVisible, ')');

		// Verificar que el DOM se actualiza
		setTimeout(() => {
			const mensajeExitoContainer = document.querySelector('.mensaje-exito-container-carrito');
			console.log(
				'[Carrito] Elemento mensaje-exito-container-carrito presente en DOM:',
				!!mensajeExitoContainer
			);
		}, 100);
	}

	// Función para reiniciar el carrito con logs
	function reiniciarCarrito() {
		console.log('[Carrito] reiniciarCarrito llamado');
		resultadoPedido = null;
		console.log('[Carrito] resultadoPedido reiniciado a null');
		carritoVisible.set(false);
		console.log('[Carrito] carritoVisible establecido a false');
	}

	// Función para mostrar log antes de renderizar FinalizarPedido (reemplaza el @const)
	function logDebugMessage() {
		console.log('[Carrito] Renderizando FinalizarPedido con onPedidoExitoso');
		return '';
	}
</script>

<!-- Carrito flotante - con clase adicional para PC -->
{#if $carritoVisible}
	<div class="{carritoClasses} {esPC ? 'carrito-pc-fixed' : ''}">
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
					{#if cantidadProductos > 0 && !resultadoPedido?.exito}
						<span class="notificacion-cantidad">{cantidadProductos}</span>
					{/if}
				</div>
				<h3 class="titulo-carrito">
					{#if resultadoPedido?.exito}
						Pedido Realizado
					{:else}
						Solicitando Pedido...
					{/if}
				</h3>
			</div>
			<button class="cerrar-carrito" on:click={toggleCarrito}>✕</button>
		</div>

		{#if resultadoPedido?.exito}
			<!-- Mostrar mensaje de éxito cuando hay un pedido exitoso -->
			<div
				class="mensaje-exito-container-carrito {esMobil ? 'mensaje-integrado-movil' : ''}"
				transition:fade
			>
				<div class="mensaje-exito-carrito" transition:scale={{ duration: 300 }}>
					<div class="titulo-con-icono">
						<div class="icono-exito">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							>
								<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
								<polyline points="22 4 12 14.01 9 11.01"></polyline>
							</svg>
						</div>
						<h2>¡Pedido Confirmado con Éxito!</h2>
					</div>
					<div class="detalles-pedido">
						<p class="numero-orden">
							Número de Orden: <strong>{resultadoPedido.numeroOrden}</strong>
						</p>
						<p class="mensaje-confirmacion">
							{resultadoPedido.mensaje}
						</p>
						<p class="agradecimiento">¡Gracias por pedir con nosotros!</p>
					</div>
					<!-- Contenedor para el botón Ordenes (eliminado el botón Entendido) -->
					<div class="botones-accion-container">
						<a
							href="javascript:void(0);"
							class="icon-container boton-ordenes"
							aria-label="Ver órdenes"
							on:click={reiniciarCarrito}
						>
							<div class="icon-circle">
								<i class="fa-solid fa-list-ul icon text-xl"></i>
							</div>
							<span class="icon-label">Ordenes</span>
						</a>
					</div>
				</div>
			</div>
		{:else if $productosEnCarrito.length === 0}
			<div class="carrito-vacio-container">
				<svg
					class="carrito-vacio-svg"
					viewBox="0 0 24 24"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
					width="180"
					height="180"
				>
					<path
						d="M3 3H5L5.4 5M7 13H17L21 5H5.4M7 13L5.4 5M7 13L4.70711 15.2929C4.07714 15.9229 4.52331 17 5.41421 17H17M17 17C15.8954 17 15 17.8954 15 19C15 20.1046 15.8954 21 17 21C18.1046 21 19 20.1046 19 19C19 17.8954 18.1046 17 17 17ZM9 19C9 20.1046 8.10457 21 7 21C5.89543 21 5 20.1046 5 19C5 17.8954 5.89543 17 7 17C8.10457 17 9 17.8954 9 19Z"
						stroke="#9CA3AF"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
				<div class="mensaje-carrito-vacio">
					<h3 class="carrito-vacio">¡Tu carrito está vacío!</h3>
					<p class="carrito-vacio-subtitulo">Añade productos para comenzar tu pedido</p>

					<button class="boton-seguir-comprando" on:click={() => carritoVisible.set(false)}>
						<i class="mdi mdi-cart-plus"></i>
						<span>Explorar productos</span>
					</button>
				</div>
			</div>
		{:else}
			<div class="contenedor-productos-carrito">
				<ListaProductos {actualizarCantidad} {quitarProducto} {formatearPrecio} />
			</div>

			<!-- Información de facturación y botón de confirmar -->
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

				<div class="divisor-elegante"></div>

				<div class="fila-principal">
					<button
						class="boton-pedir {formularioVisible ? 'modo-finalizar' : ''}"
						on:click={formularioVisible ? handleFinalizarDirectamente : toggleFormulario}
					>
						<div class="contenido-boton">
							<div class="columna-izq-boton">
								{#if formularioVisible}
									<i class="mdi mdi-check-circle-outline"></i>
								{:else}
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
								{/if}
								<span class="texto-pedir"
									>{formularioVisible ? 'Finalizar Compra' : 'Continuar'}</span
								>
							</div>
							<div class="columna-der-boton">
								<span class="precio-total-boton">Total: {formatearPrecio(total)}</span>
							</div>
						</div>
					</button>
				</div>
			</div>

			<!-- Formulario de finalización -->
			{#if formularioVisible}
				<div class="formulario-container" transition:fade={{ duration: 300 }}>
					{logDebugMessage()}
					<FinalizarPedido
						{toggleFormulario}
						onPedidoExitoso={handlePedidoExitoso}
						bind:this={formularioPedido}
					/>
				</div>
			{/if}
		{/if}
	</div>
{/if}

<svelte:head>
	<link
		rel="stylesheet"
		href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
	/>
	<link
		rel="stylesheet"
		href="https://cdn.jsdelivr.net/npm/@mdi/font@7.2.96/css/materialdesignicons.min.css"
	/>
</svelte:head>

<style>
	.carrito-flotante {
		/* Posición fija para que permanezca visible al hacer scroll */
		position: fixed;

		/* Distancia desde la parte superior (debajo del header y categorías) */
		top: -250px;

		/* Distancia desde el borde derecho */
		right: 20px;

		/* Color de fondo blanco */
		background-color: #fff;

		/* Borde delgado color gris claro */
		border: 1px solid #ddd;

		/* Espaciado interno general */
		padding: 15px;

		/* Elimina el padding superior para mejor alineación */
		padding-top: 0;

		/* Bordes redondeados */
		border-radius: 12px;

		/* Sombra para efecto elevado */
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);

		/* Nivel de apilamiento (por debajo de posibles overlays) */
		z-index: 998;

		/* Ancho fijo para escritorio */
		width: 600px;

		/* Ancho máximo relativo al viewport */
		max-width: 95vw;

		/* Animación de entrada desde la derecha */
		animation: slideInRight 0.3s ease-out;

		/* Disposición flexible en columna */
		display: flex;
		flex-direction: column;

		/* Altura calculada (90% del viewport menos espacio superior) */
		height: calc(90vh - 100px);

		/* Altura máxima igual a la altura calculada */
		max-height: calc(90vh - 100px);

		/* Scroll vertical si el contenido excede la altura */
		overflow-y: auto;

		/* Margen inferior para separación del footer */
		margin-bottom: 20px;
	}

	.carrito-flotante.saliendo {
		animation: slideOutRight 0.1s ease-out forwards;
	}

	.carrito-flotante.con-formulario {
		transition:
			max-height 0.3s ease,
			height 0.3s ease,
			transform 0.3s ease;
		overflow: hidden; /* Evita que se vea el contenido durante la transición */
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
		margin: 0 -15px 15px -15px; /* Eliminado el margen negativo superior */
		padding: 15px 20px;
		background: linear-gradient(135deg, rgba(10, 25, 47, 1), rgba(30, 58, 95, 0.95));
		color: white;
		font-weight: bold;
		width: calc(100% + 30px);
		border-radius: 12px 12px 0 0;
		border-bottom: 2px solid rgba(255, 255, 255, 0.1);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		box-sizing: border-box;
		position: sticky; /* Asegurar que el header se mantiene en su lugar */
		top: 0;
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

	.carrito-vacio-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 40px 20px;
		height: auto;
		min-height: 340px; /* Aumentado para más espacio */
		max-height: 450px; /* Aumentado para contenido más grande */
		overflow: hidden;
		background-color: #f9f9fa;
		border-radius: 12px;
		margin: 20px 15px;
		box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.03);
	}

	.carrito-vacio-svg {
		margin-bottom: 20px;
		opacity: 0.7;
		transition: all 0.3s ease;
		width: 180px; /* Aumentado */
		height: 180px; /* Aumentado */
	}

	.carrito-vacio-svg:hover {
		opacity: 1;
		transform: scale(1.05);
	}

	.mensaje-carrito-vacio {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		padding: 0 20px;
		width: 100%;
		max-width: 350px; /* Limitar ancho para mejor legibilidad */
	}

	.carrito-vacio {
		color: #3c4257;
		text-align: center;
		font-size: 1.8rem; /* Aumentado */
		font-weight: 600;
		margin: 0 0 12px 0; /* Aumentado espacio inferior */
	}

	.carrito-vacio-subtitulo {
		color: #6b7280;
		font-size: 1.1rem; /* Aumentado */
		margin: 0 0 25px 0; /* Aumentado espacio inferior */
		line-height: 1.4;
	}

	.boton-seguir-comprando {
		background: linear-gradient(135deg, #2e8b57, #3cb371);
		color: white;
		border: none;
		border-radius: 30px; /* Más redondeado */
		padding: 12px 24px; /* Más grande */
		font-size: 1.1rem; /* Más grande */
		font-weight: 500;
		display: flex;
		align-items: center;
		gap: 10px; /* Más espacio entre ícono y texto */
		cursor: pointer;
		transition: all 0.2s ease;
		box-shadow: 0 4px 10px rgba(46, 139, 87, 0.3);
		margin-top: 15px; /* Más separación */
	}

	.boton-seguir-comprando i {
		font-size: 1.3rem; /* Ícono más grande */
	}

	.boton-seguir-comprando:hover {
		transform: translateY(-3px);
		box-shadow: 0 6px 15px rgba(46, 139, 87, 0.4);
	}

	.boton-seguir-comprando:active {
		transform: translateY(-1px);
		box-shadow: 0 3px 8px rgba(46, 139, 87, 0.4);
	}

	.contenedor-productos-carrito {
		position: relative;
		width: 100%;
		overflow-y: auto;
		max-height: 300px; /* Aumentado para mostrar 3 productos (antes 300px) */
	}

	.total-carrito {
		border-top: 1px solid rgb(247, 239, 239);
		padding: 1rem;
		color: white;

		margin: auto -15px -15px -15px;
		background: linear-gradient(180deg, #14213d 0%, #1e3a5f 30%, rgb(0, 0, 0) 60%, #0a1929 100%);
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

	.detalles-pedido {
		text-align: left;
		padding: 1rem;
		background: #f3f4f6;
		border-radius: 8px;
		margin: 1rem 0;
	}

	.boton-pedir {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
		width: 100%; /* Ahora ocupa todo el ancho disponible */
		margin: 0;
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

	.boton-pedir.modo-finalizar {
		background-color: #1a5733; /* Color más oscuro cuando está en modo finalizar */
	}

	.contenido-boton {
		display: flex;
		justify-content: space-between;
		align-items: center;
		width: 100%;
	}

	.columna-izq-boton {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.columna-der-boton {
		display: flex;
		align-items: center;
		padding-left: 12px;
		border-left: 1px solid rgba(255, 255, 255, 0.2);
	}

	.precio-total-boton {
		font-size: 1.1rem;
		font-weight: 700;
		color: white;
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
	}

	.boton-pedir:hover {
		background: #1a5733;
		transform: translateY(-2px);
		box-shadow: 0 6px 8px rgba(0, 0, 0, 0.2);
	}

	.mdi {
		font-size: 20px;
		margin-right: 4px;
	}

	.formulario-container {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: white;
		z-index: 20; /* Aumentado para que esté por encima del header del carrito (z-index: 15) */
		border-radius: 12px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		overflow: auto; /* Permitir scroll dentro del contenedor */
		display: flex;
		flex-direction: column;
	}

	.formulario-container :global(.header-formulario) {
		position: sticky;
		top: 0;
		z-index: 21; /* Mayor que el z-index del formulario para que siempre esté encima */
	}

	.mensaje-exito-container-carrito {
		position: relative;
		width: 100%;
		padding: 1rem;
		display: flex;
		justify-content: center;
		align-items: center;
		min-height: 300px;
	}

	.mensaje-exito-carrito {
		text-align: center;
		padding: 1.5rem 1.5rem 5.5rem; /* Aumentado de 5rem a 5.5rem para dar más espacio al botón */
		background: white;
		border-radius: 12px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		width: 100%;
		animation: popIn 0.4s cubic-bezier(0.18, 1.25, 0.4, 1);
		position: relative; /* Necesario para posicionamiento absoluto del botón */
		border: 1px solid #4a3aff; /* Borde morado/azul oscuro brillante de 1px añadido aquí */
	}

	.botones-accion-container {
		position: absolute;
		bottom: 0.75rem; /* Bajado de 1.5rem a 0.75rem para que quede más abajo */
		left: 0;
		right: 0;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.boton-ordenes {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-decoration: none;
		color: #2e8b57;
		transition: all 0.2s ease;
		cursor: pointer;
		padding: 8px 16px;
		border-radius: 8px;
		background-color: rgba(46, 139, 87, 0.05);
		margin-top: 1rem; /* Añadido margen superior para separarlo más del texto */
	}

	.icon-circle {
		width: 40px;
		height: 40px;
		background-color: #2e8b57;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 8px;
		color: white;
		box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
		transition: all 0.2s ease;
	}

	.boton-ordenes:hover .icon-circle {
		transform: translateY(-2px);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
		background-color: #1a5733;
	}

	.icon-label {
		font-size: 0.9rem;
		font-weight: 500;
		letter-spacing: 0.2px;
		background: linear-gradient(90deg, #2e8b57, #3cb371); /* Degradado verde */
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
		transition: all 0.2s ease;
	}

	.boton-ordenes:hover .icon-label {
		background: linear-gradient(90deg, #1a5733, #2e8b57); /* Degradado verde más oscuro al hover */
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.titulo-con-icono {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 10px;
		margin-bottom: 1rem;
	}

	.icono-exito {
		width: 28px;
		height: 28px;
		color: #10b981;
		animation: bounceIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
		position: static;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.mensaje-exito-carrito h2 {
		color: #1f2937;
		margin: 0;
		font-size: 1.27rem;
		font-weight: 600;
		display: inline-flex;
	}

	.botones-accion-container {
		position: absolute;
		bottom: 0.75rem; /* Bajado de 1.5rem a 0.75rem para que quede más abajo */
		left: 0;
		right: 0;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	@keyframes popIn {
		0% {
			opacity: 0;
			transform: scale(0.9) translateY(10px);
		}
		70% {
			transform: scale(1.03) translateY(-5px);
		}
		100% {
			opacity: 1;
			transform: scale(1) translateY(0);
		}
	}

	@keyframes bounceIn {
		0% {
			transform: scale(0);
		}
		50% {
			transform: scale(1.2);
		}
		100% {
			transform: scale(1);
		}
	}

	@media (max-width: 768px) {
		.carrito-flotante.con-formulario {
			max-height: 95vh !important; /* Usar toda la altura disponible en móvil */
			height: auto !important;
			overflow: hidden;
			transform: translateY(0) !important; /* Evitar que se mueva durante la transición */
			transition:
				max-height 0.3s ease,
				height 0.3s ease,
				transform 0.3s ease;
		}

		/* Header fijo del carrito que ocupa todo el ancho disponible */
		.carrito-header {
			position: sticky;
			top: 0;
			z-index: 15;
			width: 100%;
			margin: 0 -15px 15px -15px; /* Eliminado el margen negativo superior */
			padding: 15px 20px;
			border-radius: 12px 12px 0 0;
			flex-shrink: 0;
			/* Asegurar ancho total */
			width: calc(100% + 30px); /* Suma del ancho más los márgenes negativos */
			box-sizing: border-box; /* Incluir padding y border en el ancho */
		}

		.total-carrito {
			position: sticky;
			bottom: 0;
			color: white;

			z-index: 15;
			width: calc(100% + 30px); /* Restaurar el ancho completo como estaba originalmente */
			flex-shrink: 0;
			margin-top: auto;
		}

		/* Formulario container sobre el header en móvil */
		.formulario-container {
			z-index: 20; /* Asegurar que sea mayor que el z-index del header del carrito */
			height: 70%; /* Ocupa toda la altura del contenedor padre */
			border-radius: 12px 12px 0 0; /* Mantiene los mismos bordes redondeados que el carrito */
		}

		.carrito-flotante {
			/* ...existing code... */
			max-height: calc(100vh - 170px); /* Reducido para no tapar el footer */
		}

		.carrito-vacio-container {
			min-height: 360px; /* Aumentado para móvil grande */
			padding: 35px 15px;
			margin: 10px; /* Reducir margen para aprovechar espacio */
		}

		.carrito-vacio-svg {
			width: 160px; /* Ajustado pero aún grande para móvil */
			height: 160px;
			margin-bottom: 20px;
		}

		.carrito-vacio {
			font-size: 1.7rem; /* Ajustado para móvil pero aún grande */
			margin-bottom: 15px;
		}

		.carrito-vacio-subtitulo {
			font-size: 1.05rem; /* Ajustado para móvil */
			margin-bottom: 22px;
		}

		.boton-seguir-comprando {
			padding: 11px 22px;
			font-size: 1rem;
		}
	}

	@media (max-width: 480px) {
		.carrito-flotante {
			width: 100%; /* Asegurar ancho total */
			max-width: 100%; /* Asegurar ancho total */
			right: 0; /* Eliminar margen derecho */
			left: 0; /* Asegurar que comienza desde el borde izquierdo */
			margin-left: 0; /* Eliminar cualquier margen izquierdo */
			margin-right: 0; /* Eliminar cualquier margen derecho */
			border-radius: 12px 12px 0 0; /* Redondear solo esquinas superiores */
			transform: translateY(0); /* Evitar transformación que podría desplazarlo */
			padding: 15px 15px 0; /* Mantener padding horizontal y eliminar el inferior */
			box-sizing: border-box; /* Incluir padding en el ancho total */
		}

		/* Asegurar que el header del carrito también ocupe todo el ancho */
		.carrito-header {
			width: calc(100% + 30px);
			margin: 0 -15px 15px -15px;
			border-radius: 12px 12px 0 0;
			position: sticky;
			top: 0;
			left: 0;
			right: 0;
		}

		.boton-pedir {
			width: 100%;
			margin: 0;
			padding: 12px 16px;
		}

		.columna-der-boton {
			padding-left: 8px;
		}

		.precio-total-boton {
			font-size: 0.95rem;
		}

		.carrito-flotante {
			width: 100%; /* Asegurar ancho total */
			max-width: 100%; /* Asegurar ancho total */
			max-height: 90vh; /* Mantener esta altura */
			padding-bottom: env(safe-area-inset-bottom, 0); /* Compatibilidad con iPhones modernos */
			display: flex;
			flex-direction: column;
		}

		.carrito-flotante.con-formulario {
			max-height: 95vh !important; /* Ocupar casi toda la pantalla en móviles pequeños */
			height: auto !important;
			padding-bottom: env(safe-area-inset-bottom, 0); /* Compatibilidad con notch */
			transform: translateY(0) !important; /* Asegurar que no se mueva */
			border-radius: 12px 12px 0 0; /* Mantener bordes redondeados superiores */
		}

		/* Contenedor fijo de altura para productos (3 max visibles sin scroll) */
		.contenedor-productos-carrito {
			max-height: 300px; /* Aumentado para mostrar 3 productos en móvil (antes 140px) */
			overflow-y: auto;
			-webkit-overflow-scrolling: touch;
			flex-shrink: 0; /* Prevenir encogimiento */
			flex-grow: 0; /* Prevenir expansión */
		}

		/* Asegurar que el botón de pedir esté siempre accesible */
		.total-carrito {
			position: sticky;
			bottom: 0;
			color: white;

			background-color: rgba(25, 40, 65, 0.97);
			z-index: 5;
			flex-shrink: 0; /* Evita que se encoja al añadir más productos */
			margin-top: auto; /* Empujar al fondo del contenedor */
		}

		/* Ajuste para manejar el espacio disponible cuando hay pocos productos */
		.carrito-flotante.empty-cart .contenedor-productos-carrito {
			flex: 1; /* Permitir que ocupe espacio disponible cuando hay pocos productos */
		}

		.carrito-flotante {
			max-height: 90vh; /* Aumentado aún más para dispositivos más pequeños */
			padding-bottom: env(safe-area-inset-bottom, 0); /* Compatibilidad con iPhones modernos */
		}

		/* Mejorar el desplazamiento del contenedor de productos */
		.contenedor-productos-carrito {
			max-height: 300px; /* Aumentado para mostrar 3 productos en móvil (antes 140px) */
			-webkit-overflow-scrolling: touch; /* Mejorar desplazamiento en iOS */
		}

		/* Asegurar que el botón de pedir esté siempre accesible */
		.total-carrito {
			position: sticky;
			bottom: 0;
			color: white;

			background-color: rgba(25, 40, 65, 0.97);
			z-index: 5;
		}

		/* Ajustes específicos para móviles pequeños */
		.mensaje-exito-container-carrito.mensaje-integrado-movil {
			padding: 5px;
			min-height: 300px;
		}

		.mensaje-integrado-movil .mensaje-exito-carrito {
			padding: 15px 10px 90px; /* Aumentado de 80px a 90px para dar más espacio al botón */
		}

		.mensaje-integrado-movil .botones-accion-container {
			padding: 0 10px;
			bottom: 0.5rem; /* Ajustado para móvil */
		}

		.mensaje-integrado-movil .icon-circle {
			width: 36px;
			height: 36px;
		}

		.mensaje-integrado-movil .icon-label {
			font-size: 0.85rem; /* Ajustado para móviles */
		}

		/* Asegurar que el header del carrito ocupe todo el ancho en móviles pequeños */
		.carrito-header {
			width: calc(100% + 30px);
			margin: 0 -15px 15px -15px; /* Eliminado el margen negativo superior */
			padding: 15px 20px;
			box-sizing: border-box;
		}

		.carrito-flotante {
			/* ...existing code... */
			max-height: calc(100vh - 150px); /* Reducido aún más para móviles pequeños */
			margin-bottom: 70px; /* Mayor margen para evitar que tape el footer */
		}

		.carrito-vacio-container {
			min-height: 580px; /* Ajustado para móviles pequeños */
			padding: 25px 15px;
			margin: 8px;
		}

		.carrito-vacio-svg {
			width: 120px; /* Más pequeño pero aún visible */
			height: 120px;
			margin-bottom: 15px;
		}

		.carrito-vacio {
			font-size: 1.4rem; /* Ajustado para móvil pequeño pero aún legible */
			margin-bottom: 10px;
		}

		.carrito-vacio-subtitulo {
			font-size: 1rem; /* Ajustado para mejor legibilidad */
			margin-bottom: 18px;
			padding: 0 5px; /* Reducir padding horizontal */
		}

		.boton-seguir-comprando {
			padding: 10px 20px;
			font-size: 0.95rem;
		}

		.boton-seguir-comprando i {
			font-size: 1.1rem;
		}
	}

	/* Asegurarnos que el carrito vacío no tape el footer en PC */
	@media (min-width: 769px) {
		.carrito-pc-fixed .carrito-vacio-container {
			height: auto;
			max-height: 320px;
		}

		.carrito-flotante.carrito-pc-fixed {
			max-height: calc(100vh - 140px); /* Espacio para evitar tapar el footer en PC */
			overflow-y: auto;
		}
	}
</style>
