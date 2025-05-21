<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import { User, QrCode } from 'lucide-svelte';
	import { fade } from 'svelte/transition';
	import Buscador from '$lib/components/buscador.svelte';
	import MenuIzquierda from '$lib/components/menu_izquierda.svelte';
	import { carritoVisible } from '$lib/stores/carritoTienda';
	import { writable } from 'svelte/store';

	const despachadorDeEventos = createEventDispatcher();
	let menuEstaAbierto = false;

	function alternarMenu() {
		menuEstaAbierto = !menuEstaAbierto;
		despachadorDeEventos('alternarMenu', { estaAbierto: menuEstaAbierto });
	}

	// Código para el botón de carrito (similar al footer)
	const fallbackStore = writable([]);
	let productosStore = fallbackStore;
	let cantidadProductos = 0;
	let palpitando = writable(false);
	let ultimaCantidad = 0;
	let animacionEnCurso = false;

	onMount(async () => {
		try {
			const module = await import('$lib/stores/carritoTienda');
			productosStore = module.productosEnCarrito || fallbackStore;
		} catch (error) {
			console.error('Error cargando carritoTienda:', error);
		}

		const unsubscribe = productosStore.subscribe(items => {
			if (items && Array.isArray(items)) {
				const nuevaCantidad = items.reduce((sum, item) => sum + (item?.cantidad || 0), 0);

				if (nuevaCantidad > ultimaCantidad) {
					activarPalpitacion();
				}

				cantidadProductos = nuevaCantidad;
				ultimaCantidad = nuevaCantidad;
			} else {
				cantidadProductos = 0;
				ultimaCantidad = 0;
			}
		});

		return unsubscribe;
	});

	function toggleCarrito() {
		carritoVisible.update(value => !value);
	}

	function activarPalpitacion() {
		if (animacionEnCurso) return;

		animacionEnCurso = true;
		palpitando.set(true);

		setTimeout(() => {
			palpitando.set(false);
			setTimeout(() => {
				animacionEnCurso = false;
			}, 200);
		}, 1000);
	}
</script>

<header class="contenedor-cabecera" in:fade>
	<div class="contenedor-principal">
		<div class="columna-logo">
			<button class="boton-menu" on:click={alternarMenu} aria-label="Abrir menú">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="icono-menu"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M4 6h16M4 12h16M4 18h16"
					/>
				</svg>
				<span class="texto-logo">Licores_Bogotá</span>
			</button>
		</div>

		<div class="columna-buscador escritorio-visible">
			<Buscador />
		</div>

		<div class="columna-botones">
			<div class="grupo-botones">
				<button class="boton-accion carrito" on:click={toggleCarrito} aria-label="Ver carrito">
					<div class="contenedor-icono-carrito {$palpitando ? 'palpitando' : ''}">
						<i class="fa-solid fa-cart-shopping"></i>
						{#if cantidadProductos > 0}
							<span class="notificacion-cantidad">{cantidadProductos}</span>
						{/if}
					</div>
				</button>
				<button class="boton-inicio-sesion" aria-label="Iniciar sesión">
					<User size={20} />
					<span class="mensaje-flotante">Iniciar sesión</span>
				</button>
				<!-- Reemplazo del botón QR por un botón de Chat -->
				<button class="boton-accion chat texto-blanco" aria-label="Abrir chat">
					<i class="fa-solid fa-message"></i>
					<span class="mensaje-flotante">Abrir chat</span>
				</button>
			</div>
		</div>

		<div class="columna-buscador-movil">
			<Buscador />
		</div>
	</div>
</header>

<!-- Componente de menú lateral controlado por menuEstaAbierto -->
<MenuIzquierda isOpen={menuEstaAbierto} />

<!-- Agregar Font Awesome para los iconos -->
<svelte:head>
	<link
		rel="stylesheet"
		href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
	/>
</svelte:head>

<style>
	/* Header container styling */
	.contenedor-cabecera {
		background: linear-gradient(135deg, rgba(10, 25, 47, 1), rgba(30, 58, 95, 0.95));
		backdrop-filter: blur(15px);
		border-bottom: 2px solid rgba(173, 216, 230, 0.3);
		min-height: 64px;
		box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
		width: 100%;
		z-index: 1000;
		position: fixed;
		top: 0;
		left: 0;
	}
	/* Main content container within the header */
	.contenedor-principal {
		min-height: 64px;
		display: grid;
		grid-template-columns: 1fr 5fr 1fr; /* Modificado para alargar la columna del buscador */
		grid-template-areas: 'logo buscador botones';
		align-items: center;
		padding: 0.5rem 1.5rem;
	}

	/* Logo column styling */
	.columna-logo {
		grid-area: logo;
		justify-self: start;
	}

	/* Desktop search bar column styling */
	.columna-buscador {
		grid-area: buscador;
		width: 100%; /* Volviendo a 100% para que ocupe todo el ancho de su columna */
		justify-self: center;
	}

	/* Buttons column styling */
	.columna-botones {
		grid-area: botones;
		justify-self: end;
	}

	/* Mobile search bar column styling */
	.columna-buscador-movil {
		display: none;
		grid-area: buscador-movil;
		width: 100%;
		margin-top: 0.5rem;
		margin-bottom: 0.5rem;
	}

	/* Menu button styling */
	.boton-menu {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		background: none;
		border: none;
		cursor: pointer;
		transition: opacity 0.3s;
	}

	.boton-menu:hover {
		opacity: 0.8;
	}

	/* Menu icon styling */
	.icono-menu {
		height: 1.5rem;
		width: 1.5rem;
		color: white;
	}

	/* Logo text styling */
	.texto-logo {
		font-size: 1.5rem;
		font-weight: 700;
		background: linear-gradient(90deg, #007aff, #00c6ff);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
		text-fill-color: transparent;
		letter-spacing: -0.5px;
	}

	/* Container for action buttons */
	.grupo-botones {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	/* General action button styling */
	.boton-accion {
		position: relative;
		width: 40px;
		height: 40px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.3s ease;
		background: rgba(255, 255, 255, 0.05);
		border: none;
		cursor: pointer;
	}

	.boton-accion:hover {
		background: rgba(255, 255, 255, 0.1);
		transform: translateY(-2px);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
	}

	/* Specific styling for QR button */
	.boton-accion.qr {
		background: #007aff;
	}

	.boton-accion.qr:hover {
		background: #0056b3;
		box-shadow: 0 0 12px rgba(0, 122, 255, 0.5);
	}

	/* Utility class for white text */
	.texto-blanco {
		color: white;
	}

	/* Login button styling */
	.boton-inicio-sesion {
		position: relative;
		background: linear-gradient(135deg, #007aff, #00c6ff);
		color: white;
		border-radius: 50%;
		width: 40px;
		height: 40px;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.3s ease;
		border: none;
		box-shadow: 0 2px 6px rgba(0, 122, 255, 0.3);
		cursor: pointer;
	}

	.boton-inicio-sesion:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 122, 255, 0.5);
	}

	/* Tooltip styling */
	.mensaje-flotante {
		position: absolute;
		top: 100%;
		left: 50%;
		transform: translateX(-50%);
		margin-top: 0.5rem;
		padding: 0.5rem 0.75rem;
		background: rgba(0, 0, 0, 0.8);
		backdrop-filter: blur(4px);
		border-radius: 0.5rem;
		font-size: 0.75rem;
		white-space: nowrap;
		opacity: 0;
		visibility: hidden;
		transition: all 0.2s ease;
		z-index: 10;
	}

	/* Show tooltip on button hover */
	.boton-inicio-sesion:hover .mensaje-flotante,
	.boton-accion:hover .mensaje-flotante {
		opacity: 1;
		visibility: visible;
		transform: translateX(-50%) translateY(0);
	}

	/* Text inside buttons */
	.texto-boton {
		font-size: 1rem;
	}

	/* Estilos para el botón de carrito */
	.boton-accion.carrito {
		background: linear-gradient(135deg, #007aff, #00c6ff);
		color: white;
	}

	.boton-accion.carrito:hover {
		background: linear-gradient(135deg, #0056b3, #0091c2);
		box-shadow: 0 0 12px rgba(0, 122, 255, 0.5);
	}

	.contenedor-icono-carrito {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100%;
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

	/* Estilos específicos para el botón de chat */
	.boton-accion.chat {
		background: #4caf50; /* Color verde para el chat */
	}

	.boton-accion.chat:hover {
		background: #3d8b40;
		box-shadow: 0 0 12px rgba(76, 175, 80, 0.5);
	}

	/* --- Media queries for responsive design --- */

	/* Tablet and smaller devices */
	@media (max-width: 768px) {
		.contenedor-principal {
			grid-template-columns: 1fr 1fr;
			grid-template-areas:
				'logo botones'
				'buscador-movil buscador-movil';
			gap: 0.5rem;
			padding: 0.5rem 1rem;
		}

		.columna-buscador {
			display: none;
		}

		.columna-buscador-movil {
			display: block;
		}
	}

	/* Small mobile devices */
	@media (max-width: 480px) {
		.texto-logo {
			font-size: 1.2rem;
		}

		.grupo-botones {
			gap: 0.5rem;
		}

		.contenedor-principal {
			padding: 0.5rem 0.75rem;
		}
	}
</style>
