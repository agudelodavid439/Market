<script lang="ts">
	import { onMount } from 'svelte';
	import { obtenerPedidos, actualizarPedido, eliminarPedido } from '$lib/conexion_pedidos';
	import { supabase } from '$lib/supabaseClient';
	import ParteOrdenes from './parte_ordenes.svelte';
	import * as TelefonoStore from '$lib/stores/busquedaTelefonoStore.js';
	const {
		telefonoBusqueda,
		buscandoPorTelefono,
		resultadosBusquedaTelefono,
		limpiarBusquedaTelefono,
	} = TelefonoStore;
	import { buscarPedidosPorTelefono } from '$lib/conexion_pedidos';

	// Interfaz para los pedidos guardados en localStorage
	interface PedidoGuardado {
		numeroOrden: string;
		fecha: string;
		datosCliente: {
			nombre: string;
			celular: string;
			direccion: string;
			metodoPago: string;
		};
		productos: Array<{
			producto: any;
			cantidad: number;
		}>;
		total: number;
		mensaje: string;
		estado?: string; // Ahora opcional ya que lo tomaremos de Supabase
	}

	let pedidos: Array<any> = [];
	let pedidosGuardados: PedidoGuardado[] = [];
	let error = null;
	let pedidoEditado = null;
	let mostrarEditor = false;
	let cargandoPedidosLocales = true;

	// Almacenar los estados de pedidos desde Supabase
	let estadosPedidos = {};

	// Declarar las variables para los contadores antes de usarlas en expresiones reactivas
	let pedidosPendientes = 0;
	let pedidosEnCamino = 0;
	let pedidosCompletados = 0;
	let pedidosCancelados = 0;

	// Contador total de pedidos
	$: totalPedidos = pedidos.length;

	// Contador simulado de pedidos realizados
	$: numeroPedidosRealizados = pedidosGuardados.length;

	// Contadores para los diferentes estados usando los estados de Supabase
	$: {
		// Estos cálculos se ejecutarán cada vez que pedidosGuardados o estadosPedidos cambien
		if (Array.isArray(pedidosGuardados) && Object.keys(estadosPedidos).length > 0) {
			// Contar pedidos para cada estado utilizando los datos de estadosPedidos
			pedidosPendientes = pedidosGuardados.filter(
				p => obtenerEstadoPedido(p.numeroOrden) === 'pendiente'
			).length;

			pedidosEnCamino = pedidosGuardados.filter(
				p => obtenerEstadoPedido(p.numeroOrden) === 'en-camino'
			).length;

			pedidosCompletados = pedidosGuardados.filter(
				p => obtenerEstadoPedido(p.numeroOrden) === 'completado'
			).length;

			pedidosCancelados = pedidosGuardados.filter(
				p => obtenerEstadoPedido(p.numeroOrden) === 'cancelado'
			).length;

			console.log('[pedidos_body] Conteo actualizado de pedidos por estado:', {
				pendientes: pedidosPendientes,
				enCamino: pedidosEnCamino,
				completados: pedidosCompletados,
				cancelados: pedidosCancelados,
			});
		} else {
			// Si no hay datos válidos, inicializar contadores a 0
			pedidosPendientes = 0;
			pedidosEnCamino = 0;
			pedidosCompletados = 0;
			pedidosCancelados = 0;
		}
	}

	// Estado para filtrar los pedidos
	let filtroActual = 'todos'; // Valores posibles: 'todos', 'pendiente', 'en-camino', 'completado', 'cancelado'

	// Función para aplicar filtro al hacer clic
	function aplicarFiltro(filtro) {
		console.log(`[pedidos_body] Aplicando filtro: ${filtro}`);
		filtroActual = filtro;
	}

	// Estado para la búsqueda por teléfono
	let valorBusqueda = '';
	let mensajeError = '';

	// Agregar más logs y validación progresiva
	function validarFormatoTelefono(valor) {
		console.log(`[pedidos_body] Validando formato teléfono: "${valor}"`);

		if (!valor) return 'vacío';
		if (!/^\d*$/.test(valor)) return 'contiene caracteres no numéricos';
		if (valor.length < 10) return `incompleto (${valor.length}/10 dígitos)`;
		if (valor.length > 10) return `demasiado largo (${valor.length}/10 dígitos)`;

		console.log(`[pedidos_body] Formato de teléfono válido: ${valor}`);
		return 'válido';
	}

	// Función para manejar cambios en el input de búsqueda
	function manejarCambioBusqueda() {
		console.log(`[pedidos_body] Valor actual de búsqueda: "${valorBusqueda}"`);

		// Validar formato en tiempo real
		const estadoValidacion = validarFormatoTelefono(valorBusqueda);
		console.log(`[pedidos_body] Estado de validación: ${estadoValidacion}`);

		// Limpiar mensaje de error si se borra el input
		if (!valorBusqueda) {
			mensajeError = '';
			limpiarBusquedaTelefono();
		}

		// Buscar automáticamente si hay 10 dígitos
		if (estadoValidacion === 'válido') {
			console.log(`[pedidos_body] Iniciando búsqueda automática para: ${valorBusqueda}`);
			buscarPorTelefono();
		}
	}

	// Función para manejar la búsqueda por teléfono
	async function buscarPorTelefono() {
		console.log(`[pedidos_body] Ejecutando búsqueda para teléfono: "${valorBusqueda}"`);

		// Limpiar mensaje de error previo
		mensajeError = '';

		// Validar formato del teléfono (10 dígitos numéricos)
		if (!/^\d{10}$/.test(valorBusqueda)) {
			mensajeError = 'Ingresa un número de teléfono válido (10 dígitos)';
			console.log(`[pedidos_body] Validación fallida: ${mensajeError}`);
			return;
		}

		try {
			// Indicar que estamos buscando
			console.log(`[pedidos_body] Iniciando búsqueda en Supabase y localStorage...`);

			// Primero limpiar cualquier búsqueda anterior para evitar estados inconsistentes
			limpiarBusquedaTelefono();

			// Luego establecer valores iniciales para la nueva búsqueda
			buscandoPorTelefono.set(true);
			telefonoBusqueda.set(valorBusqueda);

			// Realizar la búsqueda
			console.log(
				`[pedidos_body] Llamando a buscarPedidosPorTelefono con teléfono: "${valorBusqueda}"`
			);
			const resultado = await buscarPedidosPorTelefono(valorBusqueda);
			console.log(`[pedidos_body] Resultado búsqueda:`, resultado);

			if (resultado.success) {
				// Guardar resultados en el store
				const resultados = resultado.data || [];
				console.log(`[pedidos_body] Actualizando store con ${resultados.length} resultados`);
				resultadosBusquedaTelefono.set(resultados);

				if (resultados.length === 0) {
					mensajeError = `No se encontraron pedidos con el teléfono ${valorBusqueda}`;
					console.log(`[pedidos_body] ${mensajeError}`);
				} else {
					console.log(`[pedidos_body] Se encontraron ${resultados.length} pedidos:`);
					resultados.forEach((pedido, index) => {
						console.log(
							`[pedidos_body] Pedido #${index + 1}:`,
							pedido.numeroOrden || pedido.numero_orden || 'Sin número'
						);
					});
				}
			} else {
				mensajeError = resultado.error || 'Error al buscar pedidos';
				console.error(`[pedidos_body] Error en búsqueda: ${mensajeError}`);
				limpiarBusquedaTelefono();
			}
		} catch (error) {
			console.error('[pedidos_body] Error inesperado en la búsqueda por teléfono:', error);
			mensajeError = 'Ocurrió un error inesperado';
			limpiarBusquedaTelefono();
		}
	}

	// Función para limpiar la búsqueda
	function limpiarBusqueda() {
		console.log('[pedidos_body] Limpiando búsqueda manualmente');
		valorBusqueda = '';
		mensajeError = '';

		try {
			limpiarBusquedaTelefono();
			console.log('[pedidos_body] limpiarBusquedaTelefono ejecutado correctamente');
		} catch (err) {
			console.error('[pedidos_body] Error al limpiar búsqueda:', err);
			// Fallback manual en caso de error
			buscandoPorTelefono.set(false);
			telefonoBusqueda.set('');
			resultadosBusquedaTelefono.set([]);
		}
	}

	// Función para cargar los pedidos
	onMount(async () => {
		console.log('[pedidos_body] Iniciando carga de pedidos');
		// Cargar pedidos de la API
		const { data, error: fetchError } = await obtenerPedidos();
		if (fetchError) {
			error = fetchError.message;
			console.error('[pedidos_body] Error al cargar pedidos de la API:', fetchError.message);
		} else {
			pedidos = data;
			console.log('[pedidos_body] Pedidos cargados de la API:', pedidos.length);
		}

		// Cargar pedidos guardados en localStorage
		try {
			console.log('[pedidos_body] Intentando cargar pedidos desde localStorage...');
			const pedidosString = localStorage.getItem('pedidosGuardados');

			if (pedidosString) {
				try {
					console.log(
						'[pedidos_body] Datos encontrados en localStorage:',
						pedidosString.substring(0, 100) + '...'
					);
					pedidosGuardados = JSON.parse(pedidosString);
					console.log(
						'[pedidos_body] Pedidos cargados desde localStorage:',
						pedidosGuardados.length
					);

					// Verificación adicional de la estructura de datos
					if (!Array.isArray(pedidosGuardados)) {
						console.error(
							'[pedidos_body] Error: pedidosGuardados no es un array, es:',
							typeof pedidosGuardados
						);
						pedidosGuardados = [];
					} else if (pedidosGuardados.length === 0) {
						console.log('[pedidos_body] El array de pedidos está vacío');
					} else {
						// Verificar el primer elemento
						console.log(
							'[pedidos_body] Primer pedido estructura:',
							Object.keys(pedidosGuardados[0])
						);

						// Validar que cada pedido tenga los campos necesarios
						const pedidosInvalidos = pedidosGuardados.filter(
							p => !p || !p.numeroOrden || !p.datosCliente || !Array.isArray(p.productos)
						);

						if (pedidosInvalidos.length > 0) {
							console.error(
								'[pedidos_body] Se encontraron pedidos con estructura inválida:',
								pedidosInvalidos.length
							);
						}
					}

					// Si tenemos pedidos guardados, consultamos sus estados en Supabase
					console.log('[pedidos_body] Consultando estados de pedidos en Supabase...');

					// Obtener los números de orden de los pedidos guardados
					const numerosOrdenes = pedidosGuardados.map(p => p.numeroOrden);

					try {
						// Consultar los estados en Supabase
						const { data: estadosData, error: estadosError } = await supabase
							.from('pedidos')
							.select('numero_orden, estado')
							.in('numero_orden', numerosOrdenes);

						if (estadosError) {
							console.error('[pedidos_body] Error al consultar estados en Supabase:', estadosError);
						} else if (estadosData && estadosData.length > 0) {
							// Crear un nuevo objeto para asegurar que se detecte el cambio
							const nuevosEstados = {};

							// Mapear los estados de Supabase
							estadosData.forEach(p => {
								// Asegurarnos de que los estados coincidan con nuestras categorías
								let estado = p.estado || 'pendiente';
								// Normalizar el estado para asegurar que coincida con nuestras categorías
								if (!['pendiente', 'en-camino', 'completado', 'cancelado'].includes(estado)) {
									estado = 'pendiente'; // Estado por defecto si no coincide
								}
								nuevosEstados[p.numero_orden] = estado;

								// Añadir un log para depurar los estados que se cargan desde Supabase
								console.log(
									`[pedidos_body] Cargando estado para orden ${p.numero_orden}: ${estado} (original: ${p.estado})`
								);
							});

							// Asignar a estadosPedidos el nuevo objeto para que Svelte detecte el cambio
							estadosPedidos = nuevosEstados;

							// Forzar una recarga de Supabase cada 30 segundos para mantener los estados actualizados
							setInterval(async () => {
								console.log('[pedidos_body] Actualizando estados desde Supabase...');
								try {
									const { data: refreshData, error: refreshError } = await supabase
										.from('pedidos')
										.select('numero_orden, estado')
										.in('numero_orden', Object.keys(estadosPedidos));

									if (!refreshError && refreshData && refreshData.length > 0) {
										const estadosActualizados = { ...estadosPedidos }; // Copiar el objeto actual
										let cambios = false;

										refreshData.forEach(p => {
											let estado = p.estado || 'pendiente';
											if (!['pendiente', 'en-camino', 'completado', 'cancelado'].includes(estado)) {
												estado = 'pendiente';
											}

											// Solo actualizar si hay cambio
											if (estadosActualizados[p.numero_orden] !== estado) {
												console.log(
													`[pedidos_body] Estado actualizado para ${p.numero_orden}: ${estadosActualizados[p.numero_orden]} -> ${estado}`
												);
												estadosActualizados[p.numero_orden] = estado;
												cambios = true;
											}
										});

										// Actualizar el objeto solo si hubo cambios para preservar reactividad
										if (cambios) {
											estadosPedidos = estadosActualizados;
										}
									}
								} catch (e) {
									console.error('[pedidos_body] Error al actualizar estados:', e);
								}
							}, 30000); // Cada 30 segundos
						} else {
							console.log(
								'[pedidos_body] No se encontraron estados en Supabase o la respuesta está vacía'
							);
							// Inicializar todos los pedidos como pendientes si no hay datos en Supabase
							estadosPedidos = numerosOrdenes.reduce((acc, numeroOrden) => {
								acc[numeroOrden] = 'pendiente';
								return acc;
							}, {});
						}

						// Forzar actualización de los contadores después de cargar estados
						setTimeout(() => {
							console.log('[pedidos_body] Verificación final de estados:', estadosPedidos);
						}, 100);
					} catch (error) {
						console.error('[pedidos_body] Error inesperado al consultar Supabase:', error);
					}
				} catch (jsonError) {
					console.error('[pedidos_body] Error al parsear JSON de localStorage:', jsonError);
					pedidosGuardados = [];
				}
			} else {
				console.log(
					'[pedidos_body] No se encontraron pedidos guardados en localStorage (null/undefined)'
				);
				pedidosGuardados = [];
			}
		} catch (error) {
			console.error('[pedidos_body] Error al cargar pedidos desde localStorage:', error);
			pedidosGuardados = [];
		} finally {
			cargandoPedidosLocales = false;
			console.log('[pedidos_body] Estado final de carga:', {
				pedidosGuardados: pedidosGuardados.length,
				cargandoPedidosLocales,
			});
		}
	});

	// Función para obtener el estado del pedido desde Supabase o usar "pendiente" como default
	function obtenerEstadoPedido(numeroOrden) {
		// Verificar primero si el numeroOrden y estadosPedidos son válidos
		if (!numeroOrden || !estadosPedidos || typeof estadosPedidos !== 'object') {
			return 'pendiente';
		}

		const estado = estadosPedidos[numeroOrden];

		// Validar explícitamente que el valor sea uno de los estados aceptados
		// Usar === para comparación estricta
		const estadoFinal =
			estado === 'pendiente' ||
			estado === 'en-camino' ||
			estado === 'completado' ||
			estado === 'cancelado'
				? estado
				: 'pendiente';

		// Agregar depuración para ver qué valores está devolviendo
		if (estado !== estadoFinal) {
			console.log(
				`[pedidos_body] Corrigiendo estado inválido para orden ${numeroOrden}: "${estado}" -> "${estadoFinal}"`
			);
		}

		// Añadir log para todos los estados consultados para facilitar depuración
		console.log(`[pedidos_body] Estado consultado para orden ${numeroOrden}: "${estadoFinal}"`);

		return estadoFinal;
	}

	// Función para abrir el editor de pedido, solo para editar pedidos existentes
	function abrirEditor(pedido) {
		pedidoEditado = { ...pedido }; // Crear una copia del pedido para la edición
		mostrarEditor = true;
	}

	// Función para manejar el guardado de un pedido editado
	function manejarGuardado(pedidoActualizado) {
		// Actualizamos el pedido en el arreglo de pedidos con los nuevos datos
		pedidos = pedidos.map(p => (p.id === pedidoActualizado.id ? pedidoActualizado : p));
		mostrarEditor = false;
	}

	// Función para eliminar un pedido
	async function handleEliminarPedido(id) {
		if (confirm('¿Estás seguro de que deseas eliminar este pedido?')) {
			const { error } = await eliminarPedido(id);

			if (error) {
				console.error('Error al eliminar pedido:', error);
			} else {
				pedidos = pedidos.filter(p => p.id !== id);
			}
		}
	}

	// Exportar la función cerrarPanel para que realmente cierre el panel
	export let cerrarPanel = () => {
		console.log('Cerrar panel de pedidos - función activada');
		// La función ahora será proporcionada por el componente padre (footer.svelte)
	};
</script>

<!-- Panel de gestión de pedidos similar al de la imagen -->
<div class="panel-pedidos">
	<div class="panel-header">
		<div class="panel-title">
			<i class="fa-solid fa-shopping-bag"></i>
			<span>Pedidos</span>
			<span class="contador-pedidos">{totalPedidos}</span>
		</div>
		<div class="header-actions">
			<button class="boton-filtrar">
				<i class="fa-solid fa-filter"></i>
				<span>Filtrar</span>
			</button>
			<button class="cerrar-panel" on:click={cerrarPanel}>✕</button>
		</div>
	</div>

	<!-- Contenido principal - Mostrar pedidos o mensaje de no hay pedidos -->
	<div class="panel-content">
		<div class="filtros-pedidos-sticky">
			<!-- Reemplazamos la sección de filtros para que se vea igual que en la imagen -->
			<div class="filtros-pedidos">
				<div class="filtros-header">
					<div class="filtros-titulo">
						<svg
							class="filtros-icono"
							viewBox="0 0 24 24"
							fill="none"
							xmlns="http://www.w3.org/2000/svg"
						>
							<path
								d="M9 6H20"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
							<path
								d="M9 12H20"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
							<path
								d="M9 18H20"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
							<path
								d="M4 6H4.01"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
							<path
								d="M4 12H4.01"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
							<path
								d="M4 18H4.01"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
						</svg>
						<span>Pedidos</span>
						<span class="contador-pedidos-realizados">{numeroPedidosRealizados}</span>
					</div>
					<button class="filtros-boton">
						<i class="fa-solid fa-filter"></i>
						<span>Filtrar</span>
						<i class="fa-solid fa-chevron-down flecha-dropdown"></i>
					</button>
				</div>
				<div class="filtros-container">
					<!-- Agregar log oculto para diagnóstico en tiempo real -->
					<div style="display: none;">
						{#each Object.entries(estadosPedidos) as [numeroOrden, estado]}
							<!-- Este bloque no se muestra pero fuerza la reactividad -->
							<span>{numeroOrden}: {estado}</span>
						{/each}
					</div>
					<div
						class="filtro pendiente {filtroActual === 'pendiente' ? 'activo' : ''}"
						on:click={() => aplicarFiltro('pendiente')}
					>
						<span class="numero">{pedidosPendientes || 0}</span>
						<span class="label">Pendiente</span>
					</div>
					<div
						class="filtro en-camino {filtroActual === 'en-camino' ? 'activo' : ''}"
						on:click={() => aplicarFiltro('en-camino')}
					>
						<span class="numero">{pedidosEnCamino || 0}</span>
						<span class="label">En camino</span>
					</div>
					<div
						class="filtro completado {filtroActual === 'completado' ? 'activo' : ''}"
						on:click={() => aplicarFiltro('completado')}
					>
						<span class="numero">{pedidosCompletados || 0}</span>
						<span class="label">Completado</span>
					</div>
					<div
						class="filtro cancelado {filtroActual === 'cancelado' ? 'activo' : ''}"
						on:click={() => aplicarFiltro('cancelado')}
					>
						<span class="numero">{pedidosCancelados || 0}</span>
						<span class="label">Cancelado</span>
					</div>
				</div>
			</div>
		</div>
		<div class="panel-search">
			<div class="search-container">
				<i class="fa-solid fa-search search-icon"></i>
				<input
					type="text"
					bind:value={valorBusqueda}
					on:input={manejarCambioBusqueda}
					placeholder="Buscar por número de teléfono (10 dígitos)"
					on:keydown={e => e.key === 'Enter' && buscarPorTelefono()}
					pattern="[0-9]*"
					inputmode="numeric"
					maxlength="10"
				/>

				<!-- Botones de búsqueda/limpiar -->
				{#if $buscandoPorTelefono || valorBusqueda.length > 0}
					<button class="boton-limpiar" on:click={limpiarBusqueda} title="Limpiar búsqueda">
						<i class="fa-solid fa-times"></i>
					</button>
				{:else}
					<button
						class="boton-buscar"
						on:click={buscarPorTelefono}
						title="Buscar"
						disabled={valorBusqueda.length !== 10}
					>
						<i class="fa-solid fa-magnifying-glass"></i>
					</button>
				{/if}
			</div>

			<!-- Mostrar estado de la validación del teléfono mientras se escribe -->
			{#if valorBusqueda.length > 0 && valorBusqueda.length < 10}
				<div class="status-busqueda">
					<i class="fa-solid fa-keyboard"></i>
					<span>Continúa escribiendo... {valorBusqueda.length}/10 dígitos</span>
				</div>
			{/if}

			<!-- Mensaje de error de búsqueda -->
			{#if mensajeError}
				<div class="mensaje-error-busqueda">
					{mensajeError}
				</div>
			{/if}

			<!-- Indicador de búsqueda activa -->
			{#if $buscandoPorTelefono && $telefonoBusqueda}
				<div class="filtro-activo-container">
					<span class="filtro-activo">
						Mostrando pedidos para: {$telefonoBusqueda}
						<span class="datos-busqueda">
							({$resultadosBusquedaTelefono.length} encontrados)
						</span>
					</span>
					<button class="boton-quitar-filtro" on:click={limpiarBusqueda}>
						<i class="fa-solid fa-times"></i>
					</button>
				</div>
			{/if}
		</div>
		<!-- Componente ParteOrdenes con mejor logging de propiedades -->
		<ParteOrdenes
			pedidosGuardados={Array.isArray(pedidosGuardados) ? pedidosGuardados : []}
			{estadosPedidos}
			{obtenerEstadoPedido}
			{cargandoPedidosLocales}
			bind:filtroActual
		/>
	</div>
</div>

<!-- Cargar los iconos de Font Awesome -->
<svelte:head>
	<link
		rel="stylesheet"
		href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
	/>
</svelte:head>

<style>
	/* Estilos para el panel de pedidos */
	.panel-pedidos {
		background: linear-gradient(180deg, #14213d 0%, #1e3a5f 30%, rgb(0, 0, 0) 60%, #0a1929 100%);
		width: 100%; /* Cambiado de 300px a 100% para ocupar todo el ancho */
		height: 100%;
		color: white;
		display: flex;
		flex-direction: column;
		z-index: 1000;
		box-shadow: 2px 0 10px rgba(0, 0, 0, 0.2);
		overflow-y: auto; /* Permitir scroll dentro del panel */
		padding-bottom: 0; /* Eliminado el padding-bottom para llegar hasta el borde del footer */
	}

	.panel-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 15px 20px;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
		position: sticky; /* Hacer que el header se mantenga visible al hacer scroll */
		top: 0; /* Pegarlo a la parte superior */
		background-color: #131b2e; /* Mismo color de fondo que el panel */
		z-index: 20; /* Aumentado para asegurar que esté por encima */
	}

	.panel-title {
		display: flex;
		align-items: center;
		font-size: 1.2rem;
		font-weight: bold;
	}

	.panel-title i {
		margin-right: 10px;
		color: #ffffff;
	}

	/* Estilo para el contador de pedidos */
	.contador-pedidos {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		background-color: rgba(255, 255, 255, 0.15);
		color: #ffffff;
		font-size: 0.9rem;
		font-weight: 500;
		border-radius: 4px;
		padding: 2px 8px;
		margin-left: 10px;
		min-width: 24px;
		height: 24px;
	}

	/* Contenedor de acciones del header */
	.header-actions {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	/* Botón de filtrar */
	.boton-filtrar {
		display: flex;
		align-items: center;
		gap: 6px;
		background-color: rgba(255, 255, 255, 0.1);
		color: white;
		border: none;
		border-radius: 4px;
		padding: 6px 12px;
		font-size: 0.9rem;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.boton-filtrar:hover {
		background-color: rgba(255, 255, 255, 0.2);
	}

	.cerrar-panel {
		background: none;
		border: none;
		color: white;
		font-size: 22px;
		cursor: pointer;
		opacity: 0.8;
		width: 40px; /* Tamaño definido para mejor área de toque */
		height: 40px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		transition: all 0.2s ease;
	}

	.cerrar-panel:hover {
		opacity: 1;
		background-color: rgba(255, 255, 255, 0.1);
	}

	.panel-search {
		padding: 10px 20px;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}

	.search-container {
		display: flex;
		align-items: center;
		background-color: #1d273f;
		padding: 10px 15px; /* Aumentado el padding para más espacio */
		border-radius: 4px;
		position: relative;
	}

	.search-icon {
		margin-right: 12px; /* Aumentado el margen para separar del input */
		color: #a3b1d6; /* Color más claro para mejor contraste */
		font-size: 1.2rem; /* Aumentado el tamaño del icono en un 50% */
	}

	.panel-search input {
		background-color: transparent;
		border: none;
		color: white;
		width: 100%;
		outline: none;
		font-size: 1.05rem; /* Aumentado el tamaño de la fuente en un 50% */
		font-weight: 500; /* Añadido peso a la fuente para mejor legibilidad */
	}

	.panel-search input::placeholder {
		color: #8796b0; /* Color más claro del placeholder para mejor contraste */
		font-weight: 400; /* Peso normal para el placeholder */
	}

	.boton-buscar,
	.boton-limpiar {
		background: transparent;
		border: none;
		color: #a3b1d6;
		padding: 6px 8px;
		cursor: pointer;
		border-radius: 4px;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s;
	}

	.boton-buscar:hover,
	.boton-limpiar:hover {
		background-color: rgba(255, 255, 255, 0.1);
		color: white;
	}

	.boton-buscar:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.boton-limpiar {
		color: #e5e7eb;
	}

	.mensaje-error-busqueda {
		background-color: rgba(239, 68, 68, 0.15);
		color: #ef4444;
		padding: 8px 12px;
		margin-top: 8px;
		border-radius: 4px;
		font-size: 0.85rem;
		text-align: center;
	}

	.filtro-activo-container {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 8px 0 0;
		gap: 8px;
	}

	.filtro-activo {
		background-color: rgba(59, 130, 246, 0.15);
		color: #3b82f6;
		padding: 4px 10px;
		border-radius: 4px;
		font-size: 0.85rem;
		display: inline-flex;
		align-items: center;
	}

	.boton-quitar-filtro {
		background: rgba(59, 130, 246, 0.1);
		border: none;
		color: #3b82f6;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 20px;
		height: 20px;
		border-radius: 50%;
		font-size: 0.7rem;
		cursor: pointer;
		transition: all 0.2s;
		padding: 0;
	}

	.boton-quitar-filtro:hover {
		background: rgba(59, 130, 246, 0.2);
	}

	/* Nuevos estilos para la sección de filtros basados en la imagen */
	.filtros-pedidos {
		background-color: #121827;
		padding: 8px 0;
		display: flex;
		flex-direction: column;
		width: 100%;
	}

	.filtros-header {
		padding: 10px 15px;
		margin-bottom: 5px;
		display: flex;
		justify-content: space-between;
		align-items: center;
		width: 100%;
		box-sizing: border-box;
	}

	.filtros-titulo {
		display: flex;
		align-items: center;
		color: white;
		font-weight: 600;
		font-size: 1.1rem;
	}

	.filtros-icono {
		width: 20px;
		height: 20px;
		margin-right: 8px;
		color: #d1d5db;
	}

	/* Estilo para el contador de pedidos realizados */
	.contador-pedidos-realizados {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		background-color: rgba(255, 255, 255, 0.15);
		color: #ffffff;
		font-size: 0.8rem;
		font-weight: 600;
		border-radius: 4px;
		padding: 1px 6px;
		margin-left: 8px;
		min-width: 20px;
		height: 20px;
	}

	/* Estilo para el botón de filtrar */
	.filtros-boton {
		display: flex;
		align-items: center;
		background-color: rgba(255, 255, 255, 0.1);
		color: white;
		border: none;
		border-radius: 6px;
		padding: 6px 12px;
		font-size: 0.9rem;
		cursor: pointer;
		transition: all 0.2s ease;
		gap: 6px;
	}

	.filtros-boton:hover {
		background-color: rgba(255, 255, 255, 0.15);
	}

	.filtros-boton .flecha-dropdown {
		font-size: 0.8rem;
		margin-left: 2px;
	}

	.filtros-container {
		display: flex;
		width: 100%;
		justify-content: space-around;
	}

	.filtro {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 6px 0;
		cursor: pointer;
		width: 25%;
		transition: background-color 0.2s;
		flex: 1; /* Asegura que cada filtro ocupe espacio equitativo */
		position: relative;
		overflow: hidden;
	}

	.filtro:hover {
		background-color: rgba(255, 255, 255, 0.05);
	}

	.filtro.activo::after {
		content: '';
		position: absolute;
		bottom: 0;
		left: 0;
		width: 100%;
		height: 3px;
		background-color: currentColor;
	}

	.filtro.activo {
		background-color: rgba(255, 255, 255, 0.1);
		font-weight: bold;
	}

	.numero {
		font-size: 1.1rem;
		font-weight: bold;
		margin-bottom: 2px;
	}

	.label {
		font-size: 0.7rem;
	}

	/* Colores específicos para cada tipo de filtro */
	.filtro.pendiente .numero,
	.filtro.pendiente .label {
		color: #f59e0b;
	}

	.filtro.en-camino .numero,
	.filtro.en-camino .label {
		color: #3b82f6;
	}

	.filtro.completado .numero,
	.filtro.completado .label {
		color: #10b981;
	}

	.filtro.cancelado .numero,
	.filtro.cancelado .label {
		color: #ef4444;
	}

	/* Esconder la sección de filtros anterior */
	.panel-filters {
		display: none;
	}

	/* Reorganización del panel-content sin cambiar tamaños */
	.panel-content {
		flex: 1;
		display: flex;
		flex-direction: column;
		padding: 0;
		overflow-y: hidden;
		min-height: 10px;
		height: 100%; /* Asegurar que ocupa todo el alto disponible */
	}

	/* Contenedor fijo para filtros */
	.filtros-pedidos-sticky {
		position: sticky;
		top: 0;
		z-index: 15;
		background-color: #131b2e;
		width: 100%;
	}

	.resultados-filtro {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 10px 15px;
		background-color: rgba(255, 255, 255, 0.05);
		border-radius: 8px;
		margin-bottom: 15px;
		color: #d1d5db;
		font-size: 0.9rem;
	}

	.estado-filtro {
		font-weight: 600;
		padding: 2px 8px;
		border-radius: 4px;
		text-transform: capitalize;
	}

	.limpiar-filtro {
		background-color: rgba(255, 255, 255, 0.2);
		color: white;
		border: none;
		border-radius: 4px;
		padding: 6px 12px;
		font-size: 0.8rem;
		cursor: pointer;
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.limpiar-filtro:hover {
		background-color: rgba(255, 255, 255, 0.3);
	}

	.status-busqueda {
		background-color: rgba(59, 130, 246, 0.1);
		color: #3b82f6;
		padding: 6px 12px;
		margin-top: 8px;
		border-radius: 4px;
		font-size: 0.85rem;
		text-align: center;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
	}

	.datos-busqueda {
		font-size: 0.75rem;
		opacity: 0.8;
		margin-left: 4px;
	}
</style>
