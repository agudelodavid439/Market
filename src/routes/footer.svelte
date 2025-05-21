<script>
	import { carritoVisible } from '$lib/stores/carritoTienda';
	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';
	import { fade } from 'svelte/transition';
	import PedidosBody from '$lib/sesion_pedidos/pedidos_body.svelte';

	// Crear un store local como respaldo
	const fallbackStore = writable([]);
	let productosStore = fallbackStore;
	let cantidadProductos = 0;

	// Store para controlar la animación de palpitación
	let palpitando = writable(false);
	let ultimaCantidad = 0;
	let animacionEnCurso = false; // Bandera para evitar múltiples palpitaciones

	// Store para controlar la visibilidad del panel de pedidos
	const pedidosVisible = writable(false);

	// Verificar si hay pedidos guardados para mostrar la notificación
	let hayPedidosGuardados = false;

	// Verificar si el carrito está vacío
	let carritoEstaVacio = true;

	// Importar y configurar después del montaje del componente
	onMount(async () => {
		try {
			// Importar dinámicamente el módulo
			const module = await import('$lib/stores/carritoTienda');
			// Usar el store real si está disponible
			productosStore = module.productosEnCarrito || fallbackStore;
		} catch (error) {
			console.error('Error cargando carritoTienda:', error);
			// Seguir usando el store local si hay error
		}

		// Suscribirse a cambios en el store que estamos usando
		const unsubscribe = productosStore.subscribe(items => {
			// Verificar que items exista y sea un array antes de usar reduce
			if (items && Array.isArray(items)) {
				const nuevaCantidad = items.reduce((sum, item) => sum + (item?.cantidad || 0), 0);

				// Si la cantidad aumentó, activar la palpitación una sola vez
				if (nuevaCantidad > ultimaCantidad) {
					activarPalpitacion();
				}

				cantidadProductos = nuevaCantidad;
				ultimaCantidad = nuevaCantidad;

				// Actualizar el estado de carritoEstaVacio basado en la cantidad
				carritoEstaVacio = nuevaCantidad === 0;
			} else {
				cantidadProductos = 0;
				ultimaCantidad = 0;
				carritoEstaVacio = true;
			}
		});

		// Verificar si hay pedidos guardados en localStorage
		try {
			const pedidosString = localStorage.getItem('pedidosGuardados');
			if (pedidosString) {
				const pedidos = JSON.parse(pedidosString);
				hayPedidosGuardados = Array.isArray(pedidos) && pedidos.length > 0;
				console.log(
					'[footer] Hay pedidos guardados:',
					hayPedidosGuardados,
					'cantidad:',
					pedidos.length
				);
			}
		} catch (error) {
			console.error('[footer] Error al verificar pedidos guardados:', error);
		}

		// Limpiar la suscripción cuando se desmonte el componente
		return unsubscribe;
	});

	// Modificamos la función toggleCarrito para asegurar sincronización con el botón del Header
	function toggleCarrito() {
		carritoVisible.update(value => !value);
	}

	// Función para activar la palpitación (modificada)
	function activarPalpitacion() {
		// Evitar activar múltiples animaciones simultáneas
		if (animacionEnCurso) {
			return;
		}

		// Marcar que hay una animación en curso
		animacionEnCurso = true;

		// Activar la palpitación
		palpitando.set(true);

		// Desactivar después de completar la animación
		setTimeout(() => {
			palpitando.set(false);

			// Permitir una nueva animación después de que termine la actual
			setTimeout(() => {
				animacionEnCurso = false;
			}, 200); // Pequeño buffer entre animaciones
		}, 1000); // 1 segundo de duración de la animación
	}

	// Función para mostrar/ocultar el panel de pedidos
	function togglePedidos() {
		pedidosVisible.update(valor => !valor);
		console.log('Panel de pedidos:', $pedidosVisible ? 'visible' : 'oculto');

		// Verificar pedidos guardados cada vez que se abre el panel
		if ($pedidosVisible) {
			try {
				const pedidosString = localStorage.getItem('pedidosGuardados');
				if (pedidosString) {
					const pedidos = JSON.parse(pedidosString);
					hayPedidosGuardados = Array.isArray(pedidos) && pedidos.length > 0;
					console.log('[footer] Actualizando estado de pedidos guardados:', hayPedidosGuardados);
				}
			} catch (error) {
				console.error('[footer] Error al actualizar estado de pedidos guardados:', error);
			}
		}
	}
</script>

<svelte:head>
	<meta charset="UTF-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1.0" />
	<title>Footer with Icons</title>
	<script src="https://cdn.tailwindcss.com"></script>
	<link
		rel="stylesheet"
		href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
	/>
	<style>
		/* Adding custom styles for the footer background and icon colors */
		.footer {
			background: linear-gradient(180deg, #14213d 0%, #1e3a5f 30%, rgb(0, 0, 0) 60%, #0a1929 100%);
			position: fixed;
			bottom: 0;
			left: 0;
			right: 0;
			z-index: 100; /* Asegurar que el footer esté por encima de otros elementos */
		}
		.icon {
			color: #ffffff;
			transition: all 0.3s ease;
			position: relative;
		}
		.icon:hover {
			color: #fca311;
			transform: translateY(-3px);
		}
		.icon::after {
			content: '';
			position: absolute;
			bottom: -8px;
			left: 50%;
			width: 0;
			height: 3px;
			background: #fca311;
			border-radius: 3px;
			transform: translateX(-50%);
			transition: width 0.3s ease;
		}
		.icon:hover::after {
			width: 100%;
		}
		.icon-container {
			display: flex;
			flex-direction: column;
			align-items: center;
			position: relative;
		}
		.icon-circle {
			width: 40px;
			height: 40px;
			border-radius: 50%;
			border: 1px solid rgba(255, 255, 255, 0.6);
			box-shadow: 0 0 3px rgba(255, 255, 255, 0.4);
			display: flex;
			justify-content: center;
			align-items: center;
			background-color: rgba(0, 0, 0, 0.3);
		}
		.icon-circle:hover {
			border-color: #fca311;
			box-shadow: 0 0 5px #fca311;
		}
		.icon-label {
			font-size: 0.7rem;
			margin-top: 5px;
			color: #e5e5e5;
			transition: all 0.3s ease;
		}
		.icon:hover + .icon-label {
			color: #fca311;
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

		/* Animación de palpitación para el carrito - un solo latido, más suave */
		@keyframes heartbeat {
			0% {
				transform: scale(1);
			}
			50% {
				transform: scale(1.2);
			}
			100% {
				transform: scale(1);
			}
		}

		.palpitando {
			animation: heartbeat 0.8s ease-out;
		}

		/* Estilos para el panel de pedidos */
		.panel-pedidos-container {
			position: fixed;
			top: 60px; /* Mantener espacio para el header */
			left: 0;
			bottom: 70px; /* Espacio exacto para el footer - mantiene el panel justo hasta el borde del footer */
			width: 100%;
			height: auto;
			z-index: 95;
			background-color: rgba(0, 0, 0, 0.2);
			display: flex;
			overflow: hidden;
		}

		.panel-pedidos-wrapper {
			position: relative;
			width: 100%;
			height: 100%; /* Asegurar que ocupa toda la altura disponible */
			transform: translateX(-100%);
			transition: transform 0.4s ease-out;
			overflow: hidden;
			display: flex;
			flex-direction: column;
		}

		.panel-pedidos-wrapper.visible {
			transform: translateX(0);
		}

		/* Asegurar que el panel no tape el footer y tenga la altura correcta */
		.panel-pedidos-wrapper :global(.panel-pedidos) {
			width: 100% !important;
			height: 100% !important;
			max-height: none !important; /* Eliminar la restricción de altura máxima */
			position: relative !important;
			left: 0 !important;
			top: 0 !important;
			overflow-y: auto !important;
			display: flex !important; /* Forzar flex para el contenido interno */
			flex-direction: column !important; /* Apilar elementos verticalmente */
		}

		/* Asegurar que el panel-header dentro del panel de pedidos sea visible */
		.panel-pedidos-wrapper :global(.panel-header) {
			position: sticky !important;
			top: 0 !important;
			z-index: 25 !important; /* Aumentado para que esté por encima */
			background-color: #131b2e !important;
			display: flex !important;
			justify-content: space-between !important;
			align-items: center !important;
			padding: 15px 20px !important;
		}

		/* Asegurarnos que los botones en el header sean clickeables */
		.panel-pedidos-wrapper :global(.panel-header .header-actions) {
			display: flex !important;
			align-items: center !important;
			gap: 10px !important;
			z-index: 30 !important;
		}

		.panel-pedidos-wrapper :global(.panel-header .cerrar-panel) {
			width: 40px !important;
			height: 40px !important;
			background: rgba(255, 255, 255, 0.05) !important;
			border-radius: 50% !important;
			display: flex !important;
			align-items: center !important;
			justify-content: center !important;
			cursor: pointer !important;
			z-index: 30 !important;
		}

		/* Estilo para la notificación de órdenes */
		.notificacion-ordenes {
			position: absolute;
			top: -2px;
			right: -2px;
			width: 10px;
			height: 10px;
			background-color: #10b981;
			border-radius: 50%;
			border: 2px solid #ffffff;
			box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
		}
	</style>
</svelte:head>

<!-- Panel de pedidos -->
{#if $pedidosVisible}
	<div class="panel-pedidos-container" transition:fade={{ duration: 200 }}>
		<div class="panel-pedidos-wrapper" class:visible={$pedidosVisible}>
			<PedidosBody cerrarPanel={() => pedidosVisible.set(false)} />
		</div>
	</div>
{/if}

<!-- Footer que se muestra siempre en PC, y en móvil cuando el carrito está vacío o no está abierto -->
<footer
	class="footer fixed bottom-0 flex w-full items-center justify-around p-4 text-lg md:hidden"
	style="display: {$carritoVisible && !carritoEstaVacio ? 'none' : 'flex'};"
>
	<a href="javascript:void(0);" class="icon-container" aria-label="Escanear código QR">
		<div class="icon-circle">
			<i class="fa-solid fa-qrcode icon text-xl"></i>
		</div>
		<span class="icon-label">Escanear</span>
	</a>
	<a href="javascript:void(0);" class="icon-container" aria-label="Abrir chat">
		<div class="icon-circle">
			<i class="fa-solid fa-message icon text-xl"></i>
		</div>
		<span class="icon-label">Chat</span>
	</a>
	<button class="icon-container" on:click={toggleCarrito} aria-label="Ver carrito">
		<div class="icon-circle {$palpitando ? 'palpitando' : ''}">
			<i class="fa-solid fa-cart-shopping icon text-xl"></i>
			{#if cantidadProductos > 0}
				<span class="notificacion-carrito">{cantidadProductos}</span>
			{/if}
		</div>
		<span class="icon-label">Carrito</span>
	</button>
	<button class="icon-container" on:click={togglePedidos} aria-label="Ver órdenes">
		<div class="icon-circle">
			<i class="fa-solid fa-list-ul icon text-xl"></i>
			<!-- Mostrar notificación si hay pedidos guardados -->
			{#if hayPedidosGuardados}
				<span class="notificacion-ordenes"></span>
			{/if}
		</div>
		<span class="icon-label">Ordenes</span>
	</button>
	<a href="javascript:void(0);" class="icon-container" aria-label="Iniciar sesión">
		<div class="icon-circle">
			<i class="fa-solid fa-user-lock icon text-xl"></i>
		</div>
		<span class="icon-label">Login</span>
	</a>
</footer>
