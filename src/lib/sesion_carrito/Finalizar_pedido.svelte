<script lang="ts">
	import { productosEnCarrito, limpiarCarrito, carritoVisible } from '$lib/stores/carritoTienda';
	export let toggleFormulario: () => void;
	// Añadir una nueva prop para enviar el resultado del pedido al componente padre
	export let onPedidoExitoso: (datos: {
		exito: boolean;
		numeroOrden?: string;
		mensaje?: string;
		estado?: string;
	}) => void;

	import { crearPedidoCompleto } from '$lib/conexion_pedidos';
	import { fade, scale } from 'svelte/transition';
	import { onDestroy } from 'svelte';

	let formData = {
		nombre: '',
		celular: '',
		direccion: '',
		metodoPago: 'efectivo',
	};

	let procesando = false;
	let error = '';
	let exito = false;
	let numeroOrden = '';

	// Variable para controlar el contenido a mostrar
	let vista = 'formulario'; // Puede ser: 'formulario', 'procesando', 'exito'

	// Variables para el mapa
	let mostrarMapa = false;
	let coordenadasMapa = { lat: 0, lng: 0 };
	let direccionFormateada = '';
	let mapaExpandido = false; // Nueva variable para controlar la expansión del mapa
	let zoomMapa = 15; // Nivel de zoom del mapa

	// Verificar si onPedidoExitoso está definido
	$: if (onPedidoExitoso === undefined) {
		console.error('[Finalizar_pedido] ERROR: onPedidoExitoso prop no está definido');
	} else {
		console.log('[Finalizar_pedido] onPedidoExitoso prop está correctamente definido');
	}

	// Calcular el total del carrito
	$: total = $productosEnCarrito.reduce((sum, item) => {
		return sum + item.producto.col_precio_puerta * item.cantidad;
	}, 0);

	// Función para obtener ubicación usando APIs de geocodificación más avanzadas
	async function obtenerCoordenadasPrecisas(
		direccion: string
	): Promise<{ lat: number; lng: number } | null> {
		try {
			// Intentar usar la API de OpenStreetMap Nominatim para geocodificación más precisa
			const response = await fetch(
				`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(direccion)}&limit=1`
			);
			const data = await response.json();

			if (data && data.length > 0) {
				return {
					lat: parseFloat(data[0].lat),
					lng: parseFloat(data[0].lon),
				};
			}

			return null;
		} catch (error) {
			console.error('Error al obtener coordenadas precisas:', error);
			return null;
		}
	}

	// Función para alternar la vista expandida del mapa
	function toggleMapaExpandido() {
		mapaExpandido = !mapaExpandido;

		// Si estamos ampliando el mapa, ajustar el zoom según el dispositivo
		if (mapaExpandido) {
			// Detectar si es móvil
			const esMobil = window.innerWidth <= 768;
			zoomMapa = esMobil ? 15 : 16; // Zoom más alejado en móvil para mejor contexto

			// En móvil, bloquear el scroll del body cuando el mapa está expandido
			if (esMobil && typeof document !== 'undefined') {
				document.body.style.overflow = 'hidden';
			}
		} else {
			zoomMapa = 15; // Zoom normal para la vista regular

			// Restaurar el scroll del body
			if (typeof document !== 'undefined') {
				document.body.style.overflow = '';
			}
		}
	}

	// Detectar cuando se desmonta el componente para restaurar el scroll
	onDestroy(() => {
		// Asegurar que el scroll del body se restaure al desmontar
		if (typeof document !== 'undefined' && mapaExpandido) {
			document.body.style.overflow = '';
		}
	});

	// Función mejorada para actualizar el mapa con coordenadas más precisas
	async function actualizarMapa(direccion: string) {
		// Verificar si son coordenadas GPS (formato: latitud, longitud)
		const coordPattern = /^(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)$/;
		const match = direccion.match(coordPattern);

		if (match) {
			// Son coordenadas, extraer latitud y longitud
			const lat = parseFloat(match[1]);
			const lng = parseFloat(match[3]);

			if (!isNaN(lat) && !isNaN(lng)) {
				coordenadasMapa = { lat, lng };
				direccionFormateada = direccion; // Mantener el formato original
				mostrarMapa = true;
				return;
			}
		}

		// No son coordenadas, intentar geocodificar la dirección
		try {
			direccionFormateada = direccion;

			// Intentar obtener coordenadas más precisas
			const coordenadas = await obtenerCoordenadasPrecisas(direccion);

			if (coordenadas) {
				// Si tenemos coordenadas precisas, usarlas
				coordenadasMapa = coordenadas;
			} else {
				// Coordenadas de respaldo para Colombia (Bogotá)
				coordenadasMapa = { lat: 4.710989, lng: -74.072092 };
			}

			mostrarMapa = true;
		} catch (error) {
			console.error('Error al geocodificar la dirección:', error);
			mostrarMapa = false;
		}
	}

	// Función mejorada para obtener ubicación actual con alta precisión
	async function obtenerUbicacionActual() {
		console.log('[Finalizar_pedido] obtenerUbicacionActual iniciado');
		if (!navigator.geolocation) {
			console.error('[Finalizar_pedido] Geolocalización no soportada');
			alert('Tu navegador no soporta geolocalización');
			return;
		}

		try {
			formData.direccion = 'Obteniendo ubicación...';
			console.log('[Finalizar_pedido] Solicitando permisos de ubicación...');

			// Usar opciones mejoradas para mayor precisión
			const position = await new Promise((resolve, reject) => {
				navigator.geolocation.getCurrentPosition(resolve, reject, {
					enableHighAccuracy: true,
					timeout: 15000, // Mayor tiempo de espera para obtener mejor precisión
					maximumAge: 0, // No usar caché para obtener la posición más actual
				});
			});

			console.log('[Finalizar_pedido] Ubicación obtenida:', position.coords);
			const { latitude, longitude, accuracy } = position.coords;

			// Ajustar el zoom según la precisión obtenida
			zoomMapa = accuracy < 100 ? 17 : accuracy < 500 ? 16 : 15;

			// Actualizar coordenadas del mapa inmediatamente
			coordenadasMapa = { lat: latitude, lng: longitude };
			mostrarMapa = true;

			try {
				const response = await fetch(
					`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
				);
				const data = await response.json();

				if (data && data.display_name) {
					const direccionFormateada = data.address
						? `${data.address.road || ''} ${data.address.house_number || ''}, ${data.address.suburb || data.address.neighbourhood || ''}`
						: data.display_name.split(',').slice(0, 3).join(',');

					formData.direccion = direccionFormateada.trim();
				} else {
					formData.direccion = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
				}
			} catch (error) {
				formData.direccion = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
			}
		} catch (error) {
			console.error('[Finalizar_pedido] Error al obtener ubicación:', error);
			formData.direccion = '';
			alert('No se pudo obtener tu ubicación. Por favor ingresa tu dirección manualmente.');
		}
	}

	// Mejorada la función submitForm para que funcione sin necesitar un evento
	export function submitForm() {
		console.log('[Finalizar_pedido] submitForm() llamado externamente');

		// Para evitar el error si no hay evento, creamos una versión adaptada
		handleSubmit({
			preventDefault: () => {
				console.log('[Finalizar_pedido] preventDefault simulado');
			},
		});
	}

	// Función para manejar cambios en los campos del formulario
	function handleFormChange(e) {
		const target = e.target;
		if (target?.name && target.name in formData) {
			const value = target.value ?? '';
			formData = {
				...formData,
				[target.name]: value,
			};
		}
	}

	// Implementación de la función handleSubmit que faltaba
	async function handleSubmit(e) {
		// Asegurar que preventDefault se llame solo si existe
		if (e && typeof e.preventDefault === 'function') {
			e.preventDefault();
		}

		console.log('[Finalizar_pedido] handleSubmit iniciado', { formData });

		if (!formData.nombre || !formData.celular || !formData.direccion) {
			error = 'Por favor complete todos los campos obligatorios';
			console.error('[Finalizar_pedido] Validación fallida: campos incompletos', formData);
			return;
		}

		if ($productosEnCarrito.length === 0) {
			error = 'El carrito está vacío';
			console.error('[Finalizar_pedido] Validación fallida: carrito vacío');
			return;
		}

		// Cambiar a vista de procesamiento
		vista = 'procesando';
		procesando = true;
		error = '';
		console.log('[Finalizar_pedido] Iniciando procesamiento de pedido');

		try {
			console.log('[Finalizar_pedido] Enviando pedido a API...', {
				formData,
				productos: $productosEnCarrito,
				total,
			});

			const resultado = await crearPedidoCompleto(formData, $productosEnCarrito, total);
			console.log('[Finalizar_pedido] Respuesta recibida:', resultado);

			if (resultado.success) {
				console.log('[Finalizar_pedido] PEDIDO EXITOSO: actualizando estado...');
				numeroOrden = resultado.numeroOrden;
				console.log('[Finalizar_pedido] Número de orden asignado:', numeroOrden);

				// Guardar en localStorage el pedido exitoso
				try {
					const pedidoParaGuardar = {
						numeroOrden: resultado.numeroOrden,
						fecha: new Date().toISOString(),
						datosCliente: { ...formData },
						productos: [...$productosEnCarrito],
						total: total,
						estado: 'pendiente', // Añadimos el estado pendiente por defecto
						mensaje:
							'Hemos recibido su pedido correctamente. En breve recibirá una notificación cuando su pedido esté listo.',
					};

					console.log('[Finalizar_pedido] Estado del pedido establecido a: pendiente');

					// Obtener pedidos existentes o inicializar array vacío
					const pedidosGuardados = JSON.parse(localStorage.getItem('pedidosGuardados') || '[]');

					// Añadir nuevo pedido al inicio del array
					pedidosGuardados.unshift(pedidoParaGuardar);

					// Guardar array actualizado
					localStorage.setItem('pedidosGuardados', JSON.stringify(pedidosGuardados));

					console.log(
						'[Finalizar_pedido] Pedido guardado en localStorage exitosamente',
						pedidoParaGuardar
					);
					console.log('[Finalizar_pedido] Estado del pedido guardado:', pedidoParaGuardar.estado);
				} catch (storageError) {
					console.error(
						'[Finalizar_pedido] Error al guardar pedido en localStorage:',
						storageError.message
					);
				}

				limpiarCarrito();
				console.log('[Finalizar_pedido] Carrito limpiado');

				vista = 'exito';
				exito = true;
				console.log('[Finalizar_pedido] Estado actualizado: vista =', vista, 'exito =', exito);

				// Importante: Comunicar el éxito al componente padre (carrito.svelte)
				if (typeof onPedidoExitoso === 'function') {
					console.log('[Finalizar_pedido] Llamando a onPedidoExitoso con:', {
						exito: true,
						numeroOrden: resultado.numeroOrden,
						estado: 'pendiente', // Incluir estado en el log
						mensaje:
							'Hemos recibido su pedido correctamente. En breve recibirá una notificación cuando su pedido esté listo.',
					});

					onPedidoExitoso({
						exito: true,
						numeroOrden: resultado.numeroOrden,
						estado: 'pendiente', // Incluir estado en los datos enviados
						mensaje:
							'Hemos recibido su pedido correctamente. En breve recibirá una notificación cuando su pedido esté listo.',
					});
				} else {
					console.error('[Finalizar_pedido] ERROR: onPedidoExitoso no es una función válida');
				}
			} else {
				console.error('[Finalizar_pedido] La API reportó un error:', resultado.mensaje);
				vista = 'formulario'; // Volver al formulario en caso de error
				throw new Error(resultado.mensaje || 'Error al procesar el pedido');
			}
		} catch (e) {
			console.error('[Finalizar_pedido] Error en el proceso:', e);
			vista = 'formulario'; // Volver al formulario en caso de error
			error = e instanceof Error ? e.message : 'Error al procesar el pedido';
		} finally {
			procesando = false;
			console.log('[Finalizar_pedido] Procesamiento finalizado. Estado final:', {
				vista,
				exito,
				error,
				procesando,
			});
		}
	}

	// Función para obtener el ícono según el método de pago seleccionado
	function getPaymentIcon(metodo: string): string {
		switch (metodo) {
			case 'efectivo':
				return 'mdi-cash';
			case 'datafono':
				return 'mdi-credit-card-wireless';
			case 'nequi':
				return 'mdi-cellphone-nfc';
			case 'daviplata':
				return 'mdi-bank-transfer';
			case 'bancolombia':
				return 'mdi-bank';
			case 'bbva':
				return 'mdi-office-building';
			case 'tarjeta':
				return 'mdi-credit-card';
			default:
				return 'mdi-credit-card-outline';
		}
	}

	// Estado para controlar el modal de métodos de pago
	let modalPagoVisible = false;

	// Función para manejar la selección desde el modal
	function seleccionarMetodoPago(metodo: string) {
		formData.metodoPago = metodo;
		modalPagoVisible = false;
	}
</script>

{#if vista === 'procesando'}
	<div class="mensaje-procesando" transition:fade>
		<div class="spinner"></div>
		<p>Procesando su pedido...</p>
	</div>
{:else if vista === 'exito'}
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
				<p class="numero-orden">Número de Orden: <strong>{numeroOrden}</strong></p>
				<p class="mensaje-confirmacion">
					Hemos recibido su pedido correctamente. Consulta tu pedido en la secion de pedidos.
					"Proceda a realizar el pago desde la secion de pedidos"
				</p>

				<p class="agradecimiento">¡Gracias por confiar en nosotros!</p>
			</div>
			<button class="cerrar-mensaje-btn" on:click={() => carritoVisible.set(false)}>
				Cerrar
			</button>
		</div>
	</div>
{:else}
	<div class="contenedor-formulario expandido">
		<form
			class="formulario-pago"
			on:submit|preventDefault={handleSubmit}
			id="form-finalizar-pedido"
		>
			<div class="header-formulario">
				<div class="header-left">
					<i class="mdi mdi-package-variant-closed mdi-24px"></i>
					<h4>Datos de Envío</h4>
				</div>
				<button
					type="button"
					class="cerrar-formulario"
					on:click={toggleFormulario}
					aria-label="Minimizar formulario"
				>
					<i class="mdi mdi-window-minimize circulo-minimizar"></i>
				</button>
			</div>

			{#if error}
				<div class="mensaje-error">
					{error}
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

				<div class="campo-con-icono campo-metodo-pago">
					<i class="mdi {getPaymentIcon(formData.metodoPago)} mdi-24px"></i>
					<div class="selector-pago" on:click={() => (modalPagoVisible = true)}>
						<span class="texto-metodo">
							{#if formData.metodoPago}
								{formData.metodoPago.charAt(0).toUpperCase() + formData.metodoPago.slice(1)}
							{:else}
								Método de pago
							{/if}
						</span>
						<i class="mdi mdi-chevron-down"></i>
					</div>
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

				<!-- Sección del mapa que se muestra cuando hay una dirección -->
				{#if mostrarMapa}
					<div
						class="contenedor-mapa {mapaExpandido ? 'mapa-expandido' : ''}"
						transition:fade={{ duration: 300 }}
					>
						<div class="header-mapa">
							<div class="header-mapa-izquierda">
								<i class="mdi mdi-map mdi-18px"></i>
								<span>Ubicación del pedido</span>
							</div>
							<button
								class="boton-expandir-mapa"
								on:click={toggleMapaExpandido}
								aria-label="{mapaExpandido ? 'Reducir' : 'Ampliar'} mapa"
							>
								<i class="mdi {mapaExpandido ? 'mdi-arrow-collapse' : 'mdi-arrow-expand'} mdi-18px"
								></i>
							</button>
						</div>
						<div class="mapa-ubicacion">
							<iframe
								title="Mapa de ubicación de entrega"
								width="100%"
								height="100%"
								frameborder="0"
								scrolling="no"
								marginheight="0"
								marginwidth="0"
								src="https://maps.google.com/maps?q={coordenadasMapa.lat},{coordenadasMapa.lng}&z={zoomMapa}&output=embed"
								loading="lazy"
								allowfullscreen
							></iframe>
							<div class="direccion-confirmada">
								<div class="direccion-texto">
									<i class="mdi mdi-check-circle-outline mdi-18px"></i>
									<span>{direccionFormateada}</span>
								</div>
								<div class="controles-mapa">
									<button
										class="boton-control-mapa"
										on:click={() => (zoomMapa = Math.min(zoomMapa + 1, 20))}
										aria-label="Acercar"
									>
										<i class="mdi mdi-plus"></i>
									</button>
									<button
										class="boton-control-mapa"
										on:click={() => (zoomMapa = Math.max(zoomMapa - 1, 10))}
										aria-label="Alejar"
									>
										<i class="mdi mdi-minus"></i>
									</button>
								</div>
							</div>
						</div>

						<!-- Botón cerrar exclusivo para móvil en modo expandido -->
						{#if mapaExpandido}
							<button
								class="cerrar-mapa-expandido-movil"
								on:click={toggleMapaExpandido}
								aria-label="Cerrar mapa"
							>
								<i class="mdi mdi-close"></i>
							</button>
						{/if}
					</div>
				{/if}
			</div>
		</form>
	</div>

	<!-- Modal de selección de métodos de pago -->
	{#if modalPagoVisible}
		<div
			class="overlay-modal"
			on:click|self={() => (modalPagoVisible = false)}
			transition:fade={{ duration: 150 }}
		>
			<div class="modal-metodos-pago" transition:scale={{ start: 0.95, duration: 200 }}>
				<div class="header-modal">
					<h3>Selecciona tu método de pago</h3>
					<button class="cerrar-modal" on:click={() => (modalPagoVisible = false)}>
						<i class="mdi mdi-close"></i>
					</button>
				</div>

				<div class="lista-metodos-pago">
					<button
						class="opcion-pago {formData.metodoPago === 'efectivo' ? 'seleccionado' : ''}"
						on:click={() => seleccionarMetodoPago('efectivo')}
					>
						<div class="icono-metodo">
							<i class="mdi mdi-cash"></i>
						</div>
						<span>Efectivo</span>
					</button>

					<button
						class="opcion-pago {formData.metodoPago === 'datafono' ? 'seleccionado' : ''}"
						on:click={() => seleccionarMetodoPago('datafono')}
					>
						<div class="icono-metodo">
							<i class="mdi mdi-credit-card-wireless"></i>
						</div>
						<span>Datafono</span>
					</button>

					<button
						class="opcion-pago {formData.metodoPago === 'nequi' ? 'seleccionado' : ''}"
						on:click={() => seleccionarMetodoPago('nequi')}
					>
						<div class="icono-metodo nequi">
							<i class="mdi mdi-cellphone-nfc"></i>
						</div>
						<span>Nequi</span>
					</button>

					<button
						class="opcion-pago {formData.metodoPago === 'daviplata' ? 'seleccionado' : ''}"
						on:click={() => seleccionarMetodoPago('daviplata')}
					>
						<div class="icono-metodo daviplata">
							<i class="mdi mdi-bank-transfer"></i>
						</div>
						<span>Daviplata</span>
					</button>

					<button
						class="opcion-pago {formData.metodoPago === 'bancolombia' ? 'seleccionado' : ''}"
						on:click={() => seleccionarMetodoPago('bancolombia')}
					>
						<div class="icono-metodo bancolombia">
							<i class="mdi mdi-bank"></i>
						</div>
						<span>Bancolombia</span>
					</button>

					<button
						class="opcion-pago {formData.metodoPago === 'bbva' ? 'seleccionado' : ''}"
						on:click={() => seleccionarMetodoPago('bbva')}
					>
						<div class="icono-metodo bbva">
							<i class="mdi mdi-office-building"></i>
						</div>
						<span>BBVA</span>
					</button>

					<button
						class="opcion-pago {formData.metodoPago === 'tarjeta' ? 'seleccionado' : ''}"
						on:click={() => seleccionarMetodoPago('tarjeta')}
					>
						<div class="icono-metodo">
							<i class="mdi mdi-credit-card"></i>
						</div>
						<span>Tarjeta</span>
					</button>
				</div>
			</div>
		</div>
	{/if}
{/if}

<!-- Cargar íconos de Material Design -->
<svelte:head>
	<link
		href="https://cdn.jsdelivr.net/npm/@mdi/font@6.5.95/css/materialdesignicons.min.css"
		rel="stylesheet"
	/>
</svelte:head>

<style>
	/* Estilos del formulario y mensajes */
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
		z-index: 21; /* Asegurar que el header esté siempre visible encima de todo */
		position: sticky; /* Hacerlo sticky */
		top: 0; /* Anclarlo a la parte superior */
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
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.circulo-minimizar {
		border: 1.5px solid white;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1px;
		background: transparent;
	}

	.cerrar-formulario i {
		font-size: 20px;
		color: white;
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
		padding-bottom: 30px; /* Añadir espacio extra al final para compensar la eliminación del botón */
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

	/* Mensaje de procesamiento */
	.mensaje-procesando {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(255, 255, 255, 0.98);
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		z-index: 1000;
	}

	.spinner {
		width: 40px;
		height: 40px;
		border: 4px solid #f3f3f3;
		border-top: 4px solid #3498db;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin-bottom: 1rem;
	}

	.mensaje-procesando p {
		color: #2c3e50;
		font-size: 1.1rem;
		font-weight: 500;
	}

	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}

	/* MENSAJE DE ÉXITO - Código crucial */
	.mensaje-exito-container {
		position: fixed;
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
			0 1px 3px rgba(0, 0, 0, 0.08),
			0 10px 25px rgba(0, 0, 0, 0.12);
		max-width: 500px;
		width: 90%;
		position: relative;
		padding-bottom: 5rem;
		animation: popIn 0.4s cubic-bezier(0.18, 1.25, 0.4, 1);
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
		font-size: 1rem;
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

	/* Mensaje de error */
	.mensaje-error {
		background-color: #fee2e2;
		color: #b91c1c;
		padding: 10px 15px;
		margin: 0 16px 16px;
		border-radius: 6px;
		font-size: 0.95rem;
		border-left: 4px solid #ef4444;
	}

	/* Animación mejorada para entrada del mensaje */
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
		}
		100% {
			transform: scale(1);
		}
	}

	/* Media queries para asegurar el centrado en dispositivos móviles */
	@media (max-width: 768px) {
		.mensaje-exito {
			width: 90%;
			max-width: 400px;
			margin: 0 auto;
			padding: 2rem 1.5rem 4.5rem;
		}
	}

	/* Ajustes para dispositivos móviles */
	@media (max-width: 480px) {
		.contenedor-formulario.expandido {
			height: auto;
			min-height: 100%;
			max-height: 90vh; /* Asegurar que no sobrepase la altura visible */
			border-radius: 12px 12px 0 0;
			overflow: visible;
			display: flex;
			flex-direction: column;
		}

		.campos-formulario {
			padding: 0.75rem;
			height: auto;
			flex: 1;
			overflow-y: auto;
			-webkit-overflow-scrolling: touch; /* Mejorar desplazamiento en iOS */
			padding-bottom: 40px; /* Espacio adicional al final del scroll en móvil */
		}

		.header-formulario {
			position: sticky;
			top: 0;
			z-index: 21;
			width: 100%;
			background: linear-gradient(135deg, rgba(10, 25, 47, 1), rgba(30, 58, 95, 0.95));
		}
	}

	/* Estilo para selector de método de pago */
	.campo-metodo-pago {
		position: relative;
		cursor: pointer;
		transition: all 0.3s ease;
	}

	.campo-metodo-pago:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
	}

	.selector-pago {
		display: flex;
		justify-content: space-between;
		align-items: center;
		width: 100%;
		padding: 10px 12px;
		border-radius: 6px;
		background-color: white;
		position: relative;
		cursor: pointer;
	}

	.texto-metodo {
		font-weight: 500;
		color: #333;
	}

	/* Modal para selección de método de pago */
	.overlay-modal {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(0, 0, 0, 0.5);
		backdrop-filter: blur(3px);
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 1000;
	}

	.modal-metodos-pago {
		background-color: white;
		border-radius: 12px;
		box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
		width: 90%;
		max-width: 400px;
		max-height: 80vh;
		overflow-y: auto;
		padding: 0;
		animation: fadeIn 0.2s ease-out;
	}

	.header-modal {
		padding: 16px;
		background: linear-gradient(135deg, #2e8b57, #3cb371);
		color: white;
		border-radius: 12px 12px 0 0;
		display: flex;
		justify-content: space-between;
		align-items: center;
		position: sticky;
		top: 0;
		z-index: 2;
	}

	.header-modal h3 {
		margin: 0;
		font-size: 1.1rem;
		font-weight: 600;
	}

	.cerrar-modal {
		background: none;
		border: none;
		color: white;
		font-size: 20px;
		cursor: pointer;
		width: 32px;
		height: 32px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s ease;
	}

	.cerrar-modal:hover {
		background-color: rgba(255, 255, 255, 0.2);
		transform: rotate(90deg);
	}

	.lista-metodos-pago {
		padding: 12px;
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 12px;
	}

	/* Estilos para cada opción de pago */
	.opcion-pago {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 16px 10px;
		border-radius: 10px;
		border: 1px solid #eaeaea;
		background-color: white;
		transition: all 0.3s ease;
		cursor: pointer;
		gap: 10px;
	}

	.opcion-pago:hover {
		transform: translateY(-3px);
		box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
	}

	.opcion-pago.seleccionado {
		border-color: #2e8b57;
		background-color: rgba(46, 139, 87, 0.05);
		box-shadow: 0 5px 15px rgba(46, 139, 87, 0.2);
	}

	.icono-metodo {
		width: 46px;
		height: 46px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: #f0f0f0;
		font-size: 24px;
		color: #333;
		transition: all 0.3s ease;
	}

	.opcion-pago:hover .icono-metodo {
		transform: scale(1.1);
	}

	.opcion-pago.seleccionado .icono-metodo {
		background-color: #2e8b57;
		color: white;
		transform: scale(1.1);
	}

	/* Colores específicos para cada método de pago */
	.icono-metodo.nequi {
		background-color: #ffe0f0;
		color: #e31c79;
	}

	.opcion-pago.seleccionado .icono-metodo.nequi {
		background-color: #e31c79;
		color: white;
	}

	.icono-metodo.daviplata {
		background-color: #ffe0e0;
		color: #ee2737;
	}

	.opcion-pago.seleccionado .icono-metodo.daviplata {
		background-color: #ee2737;
		color: white;
	}

	.icono-metodo.bancolombia {
		background-color: #e0f0ff;
		color: #0c4ca3;
	}

	.opcion-pago.seleccionado .icono-metodo.bancolombia {
		background-color: #0c4ca3;
		color: white;
	}

	.icono-metodo.bbva {
		background-color: #e0e0ff;
		color: #004b8d;
	}

	.opcion-pago.seleccionado .icono-metodo.bbva {
		background-color: #004b8d;
		color: white;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	/* Adaptación para móvil */
	@media (max-width: 480px) {
		.modal-metodos-pago {
			width: 95%;
			max-width: 320px;
			max-height: 70vh;
		}

		.lista-metodos-pago {
			grid-template-columns: 1fr;
			gap: 8px;
			padding: 8px;
		}

		.opcion-pago {
			flex-direction: row;
			justify-content: flex-start;
			padding: 12px 10px;
			gap: 12px;
		}

		.icono-metodo {
			width: 36px;
			height: 36px;
			font-size: 18px;
		}

		.header-modal h3 {
			font-size: 1rem;
		}
	}

	/* Estilos mejorados para el contenedor del mapa */
	.contenedor-mapa {
		margin-top: 15px;
		margin-bottom: 15px;
		background-color: white;
		border-radius: 10px;
		overflow: hidden;
		box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
		border: 1px solid rgba(0, 0, 0, 0.08);
		transition: all 0.3s ease;
	}

	/* Clase para mapa expandido */
	.contenedor-mapa.mapa-expandido {
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 90%;
		max-width: 800px;
		height: 80%;
		max-height: 600px;
		z-index: 1010;
		box-shadow: 0 5px 25px rgba(0, 0, 0, 0.25);
		border-radius: 12px;
	}

	/* Fondo oscuro cuando el mapa está expandido */
	.contenedor-mapa.mapa-expandido::before {
		content: '';
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.7);
		z-index: -1;
	}

	.header-mapa {
		display: flex;
		align-items: center;
		justify-content: space-between; /* Añadido para colocar el botón expandir a la derecha */
		padding: 10px 12px;
		background-color: #f5f5f5;
		border-bottom: 1px solid #eee;
		color: #555;
		font-weight: 500;
		font-size: 0.9rem;
	}

	.header-mapa-izquierda {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.header-mapa i {
		color: #2e8b57;
	}

	/* Botón para expandir el mapa */
	.boton-expandir-mapa {
		background: none;
		border: none;
		color: #2e8b57;
		cursor: pointer;
		padding: 4px;
		border-radius: 4px;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s ease;
	}

	.boton-expandir-mapa:hover {
		background-color: rgba(46, 139, 87, 0.1);
		transform: scale(1.1);
	}

	.mapa-ubicacion {
		position: relative;
		height: 180px;
		width: 100%;
		transition: height 0.3s ease;
	}

	/* Ajustar altura del mapa cuando está expandido */
	.mapa-expandido .mapa-ubicacion {
		height: calc(100% - 40px); /* 40px es aproximadamente la altura del header */
	}

	.direccion-confirmada {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		background: rgba(255, 255, 255, 0.9);
		padding: 8px 12px;
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 0.85rem;
		color: #333;
		backdrop-filter: blur(4px);
		border-top: 1px solid rgba(0, 0, 0, 0.05);
		justify-content: space-between; /* Para colocar los controles a la derecha */
	}

	.direccion-texto {
		display: flex;
		align-items: center;
		gap: 8px;
		flex: 1;
		min-width: 0; /* Para permitir truncamiento */
		overflow: hidden;
	}

	.direccion-texto span {
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.direccion-confirmada i {
		color: #2e8b57;
		flex-shrink: 0;
	}

	/* Botón cerrar para móvil en modo expandido */
	.cerrar-mapa-expandido-movil {
		display: none; /* Oculto por defecto, solo visible en móvil */
		position: absolute;
		top: 10px;
		right: 10px;
		width: 36px;
		height: 36px;
		background-color: rgba(255, 255, 255, 0.9);
		border: none;
		border-radius: 50%;
		color: #333;
		font-size: 18px;
		cursor: pointer;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
		z-index: 20;
		align-items: center;
		justify-content: center;
	}

	/* Media queries para ajustar el tamaño del mapa en dispositivos móviles */
	@media (max-width: 480px) {
		.mapa-ubicacion {
			height: 150px; /* Más pequeño en móvil cuando no está expandido */
		}

		/* Sobrescribir para modo expandido en móvil */
		.contenedor-mapa.mapa-expandido {
			position: fixed;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
			width: 100%;
			height: 100%;
			max-width: none;
			max-height: none;
			transform: none;
			margin: 0;
			border-radius: 0;
			z-index: 2000; /* Mayor z-index para asegurar que está por encima de todo */
		}

		.contenedor-mapa.mapa-expandido .mapa-ubicacion {
			height: calc(100% - 40px); /* Ajustado para móvil en modo expandido */
		}

		.contenedor-mapa.mapa-expandido .header-mapa {
			border-radius: 0;
		}

		.cerrar-mapa-expandido-movil {
			display: flex; /* Mostrar botón de cerrar en móvil */
		}

		.direccion-confirmada {
			flex-direction: column;
			align-items: flex-start;
			padding: 8px 10px;
		}

		.direccion-texto {
			width: 100%;
			margin-bottom: 4px;
		}

		.controles-mapa {
			align-self: flex-end;
			margin-left: 0;
		}

		/* El botón expandir desaparece en móvil cuando está expandido */
		.contenedor-mapa.mapa-expandido .boton-expandir-mapa {
			display: none;
		}
	}
</style>
