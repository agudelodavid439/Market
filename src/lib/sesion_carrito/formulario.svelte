<script lang="ts">
	import { carritoVisible } from '$lib/stores/carritoTienda';
	import { fade, scale } from 'svelte/transition';
	import { onMount } from 'svelte';

	// Props que necesitamos recibir del componente padre
	export let toggleFormulario: () => void;
	export let formData: {
		nombre: string;
		celular: string;
		direccion: string;
		metodoPago: string;
	};
	export let handleFormChange: (e: Event) => void;
	export let handleSubmit: (e: Event) => void;
	// Nuevo prop para recibir el resultado del pedido
	export let resultadoPedido: {
		exito: boolean;
		numeroOrden?: string;
		mensaje?: string;
	} | null = null;

	let mostrarFinalizarPedido = false;

	// Añadir log cuando resultadoPedido cambia
	$: if (resultadoPedido) {
		console.log('Formulario recibió resultadoPedido:', resultadoPedido);
	}

	// Función optimizada para obtener la ubicación actual
	async function obtenerUbicacionActual() {
		if (!navigator.geolocation) {
			alert('Tu navegador no soporta geolocalización');
			return;
		}

		try {
			// Mostrar que se está cargando la ubicación
			formData.direccion = 'Obteniendo ubicación...';

			// Obtener coordenadas
			const position = await new Promise<GeolocationPosition>((resolve, reject) => {
				navigator.geolocation.getCurrentPosition(resolve, reject, {
					enableHighAccuracy: true,
					timeout: 10000,
				});
			});

			const { latitude, longitude } = position.coords;

			// Intentar obtener la dirección de las coordenadas mediante Geocoding API
			try {
				const response = await fetch(
					`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
				);
				const data = await response.json();

				if (data && data.display_name) {
					// Usar una versión más corta y útil de la dirección
					const direccionFormateada = data.address
						? `${data.address.road || ''} ${data.address.house_number || ''}, ${data.address.suburb || data.address.neighbourhood || ''}`
						: data.display_name.split(',').slice(0, 3).join(',');

					formData.direccion = direccionFormateada.trim();
				} else {
					// Si no se puede obtener la dirección, usar las coordenadas
					formData.direccion = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
				}
			} catch (error) {
				// Si falla el geocoding, usar coordenadas
				formData.direccion = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
			}
		} catch (error) {
			// Si el usuario rechaza dar su ubicación o hay otro error
			formData.direccion = '';
			alert('No se pudo obtener tu ubicación. Por favor ingresa tu dirección manualmente.');
		}
	}
</script>

{#if resultadoPedido && resultadoPedido.exito}
	<div class="mensaje-exito-container" transition:fade>
		<div class="mensaje-exito" transition:scale={{ duration: 300 }}>
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
			<div class="detalles-pedido">
				<p class="numero-orden">Número de Orden: <strong>{resultadoPedido.numeroOrden}</strong></p>
				<p class="mensaje-confirmacion">
					{resultadoPedido.mensaje}
				</p>
				<p class="agradecimiento">¡Gracias por confiar en nosotros!</p>
			</div>
			<!-- Botón para cerrar manualmente el mensaje -->
			<button class="cerrar-mensaje-btn" on:click={() => carritoVisible.set(false)}>
				Cerrar
			</button>
		</div>
	</div>
{:else}
	<div class="contenedor-formulario expandido">
		<form class="formulario-pago" on:submit|preventDefault={handleSubmit}>
			<div class="header-formulario">
				<!-- El icono y el título juntos en un contenedor -->
				<div class="header-left">
					<i class="mdi mdi-package-variant-closed mdi-24px"></i>
					<h4>Datos de Envío</h4>
				</div>
				<!-- Botón de cerrar separado a la derecha -->
				<button
					type="button"
					class="cerrar-formulario"
					on:click={toggleFormulario}
					aria-label="Cerrar formulario">✕</button
				>
			</div>

			<!-- Mostrar mensajes de error si existen -->
			{#if resultadoPedido && !resultadoPedido.exito && resultadoPedido.mensaje}
				<div class="mensaje-error">
					{resultadoPedido.mensaje}
				</div>
			{/if}

			<div class="campos-formulario">
				<div class="campo-con-icono">
					<i class="mdi mdi-account mdi-24px"></i>
					<input
						type="text"
						name="nombre"
						bind:value={formData.nombre}
						on:input={handleFormChange}
						placeholder="Tu nombre"
						required
					/>
				</div>

				<div class="campo-con-icono">
					<i class="mdi mdi-cellphone mdi-24px"></i>
					<input
						type="tel"
						name="celular"
						bind:value={formData.celular}
						on:input={handleFormChange}
						placeholder="Tu celular"
						required
					/>
				</div>

				<div class="campo-con-icono">
					<i class="mdi mdi-map-marker mdi-24px"></i>
					<input
						type="text"
						name="direccion"
						bind:value={formData.direccion}
						on:input={handleFormChange}
						placeholder="Dirección de entrega"
						required
					/>
					<div class="contenedor-tooltip">
						<button
							type="button"
							class="boton-ubicacion"
							on:click={obtenerUbicacionActual}
							aria-label="Obtener ubicación actual"
						>
							<i class="mdi mdi-crosshairs-gps"></i>
						</button>
						<span class="tooltip">Agregar ubicación actual</span>
					</div>
				</div>

				<div class="campo-con-icono">
					<i class="mdi mdi-credit-card mdi-24px"></i>
					<select
						name="metodoPago"
						bind:value={formData.metodoPago}
						on:change={handleFormChange}
						required
					>
						<option value="">Método de pago</option>
						<option value="efectivo">Efectivo</option>
						<option value="datafono">Datafono</option>
						<option value="nequi">Nequi</option>
						<option value="daviplata">Daviplata</option>
						<option value="bancolombia">Bancolombia</option>
						<option value="bbva">BBVA</option>
						<option value="tarjeta">Tarjeta</option>
					</select>
				</div>
			</div>
			<div class="contenedor-boton">
				<button type="submit" class="boton-confirmar">
					<i class="mdi mdi-check-circle-outline mdi-24px"></i>
					<span>Finalizar Compra</span>
				</button>
			</div>
		</form>
	</div>
{/if}

<!-- Cargar íconos de Material Design -->
<svelte:head>
	<link
		href="https://cdn.jsdelivr.net/npm/@mdi/font@6.5.95/css/materialdesignicons.min.css"
		rel="stylesheet"
	/>
</svelte:head>

<style>
	.contenedor-formulario {
		height: auto;
		min-height: 100%;
		width: 100%;
		background-color: white;
		display: flex;
		flex-direction: column;
		border-radius: 12px;
		overflow: visible;
		position: relative;
	}

	.contenedor-formulario.expandido {
		position: relative;
		transform: none;
		height: auto;
	}

	.formulario-pago {
		display: flex;
		flex-direction: column;
		height: auto;
		min-height: 100%;
		overflow: visible;
	}

	.header-formulario {
		padding: 15px 20px;
		background: linear-gradient(135deg, rgba(10, 25, 47, 1), rgba(30, 58, 95, 0.95));
		color: white;
		border-radius: 12px 12px 0 0;
		position: relative;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.header-left {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.header-formulario h4 {
		margin: 0;
		font-size: 1.1rem;
		font-weight: bold;
	}

	.header-formulario i {
		color: white;
	}

	.cerrar-formulario {
		background: none;
		border: none;
		color: white;
		font-size: 1.4rem;
		cursor: pointer;
		line-height: 1;
		transition: all 0.2s ease;
		padding: 5px 10px;
		border-radius: 50%;
		position: absolute;
		right: 10px;
		top: 50%;
		transform: translateY(-50%);
		z-index: 12;
	}

	.cerrar-formulario:hover {
		background-color: rgba(255, 255, 255, 0.1);
		transform: translateY(-50%) scale(1.1);
	}

	.campos-formulario {
		flex: 1;
		overflow-y: auto;
		overflow-x: hidden;
		padding: 1rem;
		scrollbar-width: thin;
		scrollbar-color: #0a4d68 #f0f0f0;
		-webkit-overflow-scrolling: touch;
		height: auto;
		min-height: 200px;
	}

	.campo-con-icono {
		display: flex;
		align-items: center;
		gap: 1rem;
		background: white;
		padding: 0.8rem;
		border-radius: 8px;
		margin-bottom: 1rem;
		transition: all 0.2s ease;
		border: 1px solid rgba(0, 0, 0, 0.1);
		position: relative;
	}

	.campo-con-icono:hover {
		background: #f9f9f9;
		transform: translateY(-1px);
	}

	.campo-con-icono i {
		color: #2ecc71;
		font-size: 1.5rem;
	}

	.campo-con-icono input,
	.campo-con-icono select {
		flex: 1;
		border: none;
		background: transparent;
		padding: 0.5rem;
		font-size: 1rem;
		outline: none;
		color: #333333;
	}

	.campo-con-icono input::placeholder,
	.campo-con-icono select::placeholder {
		color: #95a5a6;
	}

	.contenedor-tooltip {
		position: absolute;
		right: 10px;
		top: 50%;
		transform: translateY(-50%);
	}

	.boton-ubicacion {
		padding: 6px;
		background-color: #2ecc71;
		color: white;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s ease;
	}

	.boton-ubicacion:hover {
		background-color: #27ae60;
		transform: scale(1.05);
	}

	.boton-ubicacion i {
		font-size: 1.2rem;
		color: white;
	}

	.tooltip {
		visibility: hidden;
		position: absolute;
		background-color: #333;
		color: white;
		text-align: center;
		padding: 5px 10px;
		border-radius: 6px;
		z-index: 1;
		opacity: 0;
		transition: opacity 0.3s;
		white-space: nowrap;
		font-size: 0.8rem;
		bottom: 125%;
		left: 50%;
		transform: translateX(-50%);
	}

	.contenedor-tooltip:hover .tooltip {
		visibility: visible;
		opacity: 1;
	}

	.contenedor-boton {
		padding: 10px 16px 16px;
		background: linear-gradient(to bottom, transparent, #f7f7f7 30%);
		position: sticky;
		bottom: 0;
		z-index: 11;
	}

	.boton-confirmar {
		width: 100%;
		padding: 14px;
		background: linear-gradient(135deg, #2ecc71, #27ae60);
		color: white;
		border: none;
		border-radius: 12px;
		font-size: 1.1rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s ease;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 10px;
		box-shadow: 0 4px 12px rgba(46, 204, 113, 0.3);
	}

	.boton-confirmar:hover {
		background: linear-gradient(135deg, #27ae60, #219653);
		transform: translateY(-2px);
		box-shadow: 0 6px 15px rgba(46, 204, 113, 0.4);
	}

	.boton-confirmar i {
		font-size: 1.3rem;
	}

	.mensaje-exito-container {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(255, 255, 255, 0.98);
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 1000;
	}

	.mensaje-exito {
		text-align: center;
		padding: 2.5rem;
		background: white;
		border-radius: 12px;
		box-shadow:
			0 4px 6px rgba(0, 0, 0, 0.1),
			0 1px 3px rgba(0, 0, 0, 0.08);
		max-width: 500px;
		width: 90%;
		animation: slideIn 0.5s ease-out;
		position: relative;
		padding-bottom: 4rem;
	}

	.icono-exito {
		width: 80px;
		height: 80px;
		margin: 0 auto 1.5rem;
		color: #10b981;
		animation: bounceIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
	}

	.mensaje-exito h2 {
		color: #1f2937;
		margin-bottom: 1.5rem;
		font-size: 1.75rem;
		font-weight: 600;
	}

	.detalles-pedido {
		text-align: left;
		padding: 1rem;
		background: #f3f4f6;
		border-radius: 8px;
		margin: 1rem 0;
	}

	.numero-orden {
		font-size: 1.1rem;
		color: #374151;
		margin-bottom: 1rem;
		padding-bottom: 1rem;
		border-bottom: 1px solid #e5e7eb;
	}

	.mensaje-confirmacion {
		color: #4b5563;
		line-height: 1.6;
		margin-bottom: 1rem;
	}

	.agradecimiento {
		color: #10b981;
		font-weight: 500;
		text-align: center;
		margin-top: 1rem;
	}

	.cerrar-mensaje-btn {
		position: absolute;
		bottom: 1.5rem;
		left: 50%;
		transform: translateX(-50%);
		padding: 10px 24px;
		background: #1f2937;
		color: white;
		border: none;
		border-radius: 6px;
		font-size: 0.95rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
		box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
	}

	.cerrar-mensaje-btn:hover {
		background: #374151;
		transform: translateX(-50%) translateY(-2px);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
	}

	.mensaje-error {
		background-color: #fee2e2;
		color: #b91c1c;
		padding: 10px 15px;
		margin: 0 16px 16px;
		border-radius: 6px;
		font-size: 0.95rem;
		border-left: 4px solid #ef4444;
	}

	@keyframes slideIn {
		from {
			transform: translateY(-20px);
			opacity: 0;
		}
		to {
			transform: translateY(0);
			opacity: 1;
		}
	}

	@keyframes bounceIn {
		0% {
			transform: scale(0);
		}
		50% {
			transform: scale(1.2);
			opacity: 1;
		}
		100% {
			transform: scale(1);
		}
	}

	@media (max-width: 480px) {
		.contenedor-formulario.expandido {
			height: auto;
			min-height: 100vh;
			border-radius: 12px 12px 0 0;
			overflow: visible;
		}

		.campos-formulario {
			padding: 0.75rem;
			height: auto;
			min-height: calc(100vh - 140px);
			overflow-y: auto;
			margin-bottom: 60px;
		}

		.boton-confirmar {
			padding: 16px;
			border-radius: 10px;
			font-size: 1.15rem;
		}

		.contenedor-boton {
			padding: 10px 12px;
			position: fixed;
			bottom: 0;
			left: 0;
			right: 0;
			background: white;
			box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
		}

		.campo-con-icono:last-child {
			margin-bottom: 0;
		}
	}
</style>
