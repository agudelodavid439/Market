<script lang="ts">
	import { onMount } from 'svelte';
	import { supabase } from '$lib/supabaseClient';
	// Actualizar la importación para asegurar que use el archivo .ts
	import {
		actualizarEstadoPedido,
		obtenerEstadoPedido as getEstadoPedido,
	} from '$lib/conexion_pedidos';

	// Importación simplificada para evitar problemas
	import * as TelefonoStore from '$lib/stores/busquedaTelefonoStore.js';
	const { telefonoBusqueda, buscandoPorTelefono, resultadosBusquedaTelefono } = TelefonoStore;

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
		estado?: string;
	}

	// Props que vienen del componente padre
	export let pedidosGuardados = [];
	export let estadosPedidos = {};
	export let filtroActual = 'todos';
	export let obtenerEstadoPedido;
	export let cargandoPedidosLocales = true;

	// Variables reactivas
	$: pedidosFiltradosPorTelefono = $buscandoPorTelefono ? $resultadosBusquedaTelefono : [];
	$: mostrandoBusquedaTelefono = $buscandoPorTelefono && $telefonoBusqueda;
	$: pedidosFiltrados = mostrandoBusquedaTelefono
		? pedidosFiltradosPorTelefono
		: filtroActual === 'todos'
			? pedidosGuardados
			: pedidosGuardados.filter(p => obtenerEstadoPedido(p.numeroOrden) === filtroActual);

	// Verificar si pedidosGuardados es un array válido y tiene elementos
	$: pedidosValidos = Array.isArray(pedidosGuardados) && pedidosGuardados.length > 0;

	// Verificar si pedidosFiltrados es un array válido y tiene elementos después de filtrar
	$: pedidosFiltradosValidos = Array.isArray(pedidosFiltrados) && pedidosFiltrados.length > 0;

	// Intentar cargar pedidos directamente de localStorage si no hay datos
	onMount(() => {
		// Si no recibimos pedidos del componente padre, intentamos cargarlos directamente
		if (!pedidosValidos && !cargandoPedidosLocales) {
			console.log(
				'[parte_ordenes] No hay pedidos recibidos del padre, intentando cargar de localStorage'
			);
			try {
				const pedidosString = localStorage.getItem('pedidosGuardados');
				if (pedidosString) {
					const pedidosLocal = JSON.parse(pedidosString);
					if (Array.isArray(pedidosLocal) && pedidosLocal.length > 0) {
						console.log('[parte_ordenes] Pedidos cargados de localStorage:', pedidosLocal.length);
						// Actualizar pedidosGuardados solo si es un array válido
						pedidosGuardados = pedidosLocal;
					} else {
						console.log('[parte_ordenes] No se encontraron pedidos válidos en localStorage');
					}
				} else {
					console.log('[parte_ordenes] No hay pedidos en localStorage');
				}
			} catch (error) {
				console.error('[parte_ordenes] Error al cargar pedidos desde localStorage:', error);
			}
		}
	});

	// Función para formatear las fechas de manera más legible
	function formatearFecha(fechaStr) {
		try {
			const fecha = new Date(fechaStr);
			return fecha.toLocaleDateString('es-CO', {
				year: 'numeric',
				month: 'short',
				day: 'numeric',
				hour: '2-digit',
				minute: '2-digit',
			});
		} catch (e) {
			return fechaStr; // Si hay error, devolver la cadena original
		}
	}

	// Función para actualizar el estado directamente desde el panel
	async function cambiarEstadoPedido(numeroOrden, nuevoEstado) {
		// Mostrar un mensaje de confirmación antes de cambiar el estado
		if (confirm(`¿Estás seguro de cambiar el estado a "${nuevoEstado}"?`)) {
			console.log(`[parte_ordenes] Cambiando estado de ${numeroOrden} a ${nuevoEstado}`);

			const resultado = await actualizarEstadoPedido(numeroOrden, nuevoEstado);

			if (resultado.success) {
				// Actualiza el estado en el objeto estadosPedidos directamente
				estadosPedidos[numeroOrden] = nuevoEstado;

				// Forzar actualización en la interfaz
				estadosPedidos = { ...estadosPedidos };

				alert(`Estado actualizado a "${nuevoEstado}"`);
			} else {
				alert(`Error al actualizar estado: ${resultado.error}`);
			}
		}
	}

	// Función para refrescar manualmente todos los estados desde Supabase
	async function refrescarEstados() {
		if (!Array.isArray(pedidosGuardados) || pedidosGuardados.length === 0) {
			alert('No hay pedidos para actualizar');
			return;
		}

		try {
			alert('Actualizando estados desde la base de datos...');

			const numerosOrdenes = pedidosGuardados.map(p => p.numeroOrden);

			const { data, error } = await supabase
				.from('pedidos')
				.select('numero_orden, estado')
				.in('numero_orden', numerosOrdenes);

			if (error) {
				throw error;
			}

			if (data && data.length > 0) {
				const nuevosEstados = { ...estadosPedidos };
				let cambios = false;

				data.forEach(p => {
					let estado = p.estado || 'pendiente';
					if (!['pendiente', 'en-camino', 'completado', 'cancelado'].includes(estado)) {
						estado = 'pendiente';
					}

					if (nuevosEstados[p.numero_orden] !== estado) {
						console.log(
							`[parte_ordenes] Estado actualizado para ${p.numero_orden}: ${nuevosEstados[p.numero_orden]} -> ${estado}`
						);
						nuevosEstados[p.numero_orden] = estado;
						cambios = true;
					}
				});

				if (cambios) {
					estadosPedidos = nuevosEstados;
					alert('Estados actualizados correctamente');
				} else {
					alert('Los estados ya están actualizados');
				}
			} else {
				alert('No se encontraron pedidos en la base de datos');
			}
		} catch (error) {
			console.error('[parte_ordenes] Error al refrescar estados:', error);
			alert(`Error al actualizar: ${error.message}`);
		}
	}
</script>

<div class="pedidos-contenido">
	<!-- Debugging - oculto pero útil para desarrollo -->
	<div style="display: none;">
		<pre>
            cargandoPedidosLocales: {cargandoPedidosLocales}
            pedidosValidos: {pedidosValidos}
            pedidosGuardados: {Array.isArray(pedidosGuardados)
				? pedidosGuardados.length
				: 'no es array'}
            filtroActual: {filtroActual}
            pedidosFiltradosValidos: {pedidosFiltradosValidos}
            pedidosFiltrados: {Array.isArray(pedidosFiltrados)
				? pedidosFiltrados.length
				: 'no es array'}
        </pre>
	</div>

	{#if mostrandoBusquedaTelefono && pedidosFiltradosPorTelefono.length === 0}
		<div class="no-resultados-busqueda">
			<i class="fa-solid fa-phone-slash"></i>
			<p>No se encontraron pedidos con el número {$telefonoBusqueda}</p>
		</div>
	{:else if cargandoPedidosLocales}
		<!-- Estado de carga -->
		<div class="loading-pedidos">
			<div class="spinner-pedidos"></div>
			<p>Cargando pedidos...</p>
		</div>
	{:else if pedidosValidos}
		<!-- Verificar que haya pedidos después de aplicar el filtro -->
		{#if pedidosFiltradosValidos}
			<div class="pedidos-locales-grid">
				{#each pedidosFiltrados as pedido (pedido.numeroOrden)}
					<div class="pedido-local">
						<div class="pedido-header">
							<div class="header-column">
								<h3 class="numero-orden">Orden #{pedido.numeroOrden}</h3>
								<span class="fecha-pedido">
									{formatearFecha(pedido.fecha)}
								</span>
							</div>
						</div>
						<div class="pedido-detalles">
							<!-- Información del cliente -->
							<div class="cliente-info">
								<p><i class="fa-solid fa-user"></i> {pedido.datosCliente?.nombre || 'Cliente'}</p>
								<p>
									<i class="fa-solid fa-phone"></i>
									{pedido.datosCliente?.celular || 'Sin teléfono'}
								</p>
								<p>
									<i class="fa-solid fa-location-dot"></i>
									{pedido.datosCliente?.direccion || 'Sin dirección'}
								</p>
							</div>

							<!-- Productos del pedido -->
							{#if Array.isArray(pedido.productos) && pedido.productos.length > 0}
								<div class="pedido-productos">
									<p class="titulo-productos">Productos:</p>
									<div class="productos-lista">
										{#each pedido.productos as item}
											<div class="producto-item">
												<span class="producto-cantidad">{item.cantidad}x</span>
												<span class="producto-nombre"
													>{item.producto?.col_nombre || 'Producto'}</span
												>
												<span class="producto-precio">
													${(
														(item.producto?.col_precio_puerta || 0) * item.cantidad
													).toLocaleString('es-CO')}
												</span>
											</div>
										{/each}
									</div>
								</div>
							{:else}
								<div class="pedido-productos">
									<p class="titulo-productos">No hay productos disponibles</p>
								</div>
							{/if}

							<!-- Total del pedido -->
							<div class="pedido-total">
								<span class="total-label">Total:</span>
								<span class="total-valor">${(pedido.total || 0).toLocaleString('es-CO')}</span>
							</div>

							<!-- Método de pago y estado del pedido -->
							<div class="pedido-metodo">
								<div class="metodo-estado-container">
									<span class="metodo-pago"
										>Pago con: {pedido.datosCliente?.metodoPago || 'Efectivo'}</span
									>
									<!-- Estado del pedido -->
									<span class="estado-pedido {obtenerEstadoPedido(pedido.numeroOrden)}">
										{obtenerEstadoPedido(pedido.numeroOrden)
											.replace('-', ' ')
											.charAt(0)
											.toUpperCase() +
											obtenerEstadoPedido(pedido.numeroOrden).replace('-', ' ').slice(1)}
									</span>
								</div>
							</div>

							<!-- Agregar lista desplegable para cambiar estado -->
							<div class="acciones-pedido">
								<div class="selector-estado">
									<select
										class="cambiar-estado {obtenerEstadoPedido(pedido.numeroOrden)}"
										on:change={e => {
											const target = e.target as HTMLSelectElement | null;
											if (target) {
												cambiarEstadoPedido(pedido.numeroOrden, target.value);
											}
										}}
										value={obtenerEstadoPedido(pedido.numeroOrden)}
									>
										<option value="pendiente">Pendiente</option>
										<option value="en-camino">En camino</option>
										<option value="completado">Completado</option>
										<option value="cancelado">Cancelado</option>
									</select>
								</div>
							</div>
						</div>
					</div>
				{/each}
			</div>
			<!-- Si no hay resultados para el filtro aplicado -->
		{:else if filtroActual !== 'todos'}
			<div class="no-resultados-filtro">
				<i class="fa-solid fa-filter-circle-xmark"></i>
				<p>No hay pedidos con estado "{filtroActual.replace('-', ' ')}"</p>
				<button
					class="limpiar-filtro"
					on:click={() => {
						filtroActual = 'todos';
					}}
				>
					Ver todos los pedidos
				</button>
			</div>
		{:else}
			<div class="no-pedidos">
				<div class="icono-no-pedidos">
					<i class="fa-solid fa-box-open"></i>
				</div>
				<p>No hay pedidos que mostrar</p>
				<small>Parece que hay un problema con los datos</small>
			</div>
		{/if}
		<!-- Si no hay pedidos guardados en absoluto -->
	{:else}
		<div class="no-pedidos">
			<div class="icono-no-pedidos">
				<i class="fa-solid fa-box-open"></i>
			</div>
			<p>No hay pedidos almacenados</p>
			<small>Los pedidos que realices aparecerán aquí</small>
		</div>
	{/if}
</div>

<style>
	/* Contenedor para los pedidos con scroll independiente */
	.pedidos-contenido {
		flex: 1;
		overflow-y: auto;
		padding: 16px 16px 70px 16px; /* Aumentado el padding-bottom para evitar que el contenido quede detrás del footer */
		display: flex;
		flex-direction: column;
		width: 100%;
		box-sizing: border-box;
		margin-bottom: 0; /* Asegurar que llega hasta el borde del footer */
	}

	/* Mantener los estilos existentes para pedidos */
	.pedidos-locales-grid {
		display: flex;
		flex-direction: column;
		width: 100%;
		gap: 1rem;
		padding: 0.5rem;
	}

	/* Centrar mensaje de no pedidos y ajustar espacio inferior */
	.no-pedidos {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%;
		min-height: 200px;
		padding-bottom: 70px; /* Espacio para evitar que quede detrás del footer */
	}

	/* Estado de cargando centrado */
	.loading-pedidos {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%;
		min-height: 200px;
		padding-bottom: 70px; /* Espacio para evitar que quede detrás del footer */
	}

	.no-pedidos {
		text-align: center;
		color: #9ca3af;
	}

	.icono-no-pedidos {
		font-size: 3rem;
		margin-bottom: 10px;
		opacity: 0.5;
	}

	.no-pedidos p {
		font-size: 1rem;
		margin-top: 0;
	}

	.no-pedidos small {
		display: block;
		margin-top: 0.5rem;
		color: #6b7280;
		font-size: 0.8rem;
	}

	/* Estilos para mostrar los pedidos locales */
	.pedido-local {
		background-color: #1d273f;
		border-radius: 8px;
		overflow: hidden;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
		transition: transform 0.2s;
	}

	.pedido-local:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
	}

	.pedido-header {
		background-color: #2d3a5f;
		padding: 0.75rem 1rem;
		display: flex;
		flex-direction: column;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}

	.header-column {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.numero-orden {
		margin: 0;
		font-size: 1rem;
		color: white;
		font-weight: 600;
	}

	.fecha-pedido {
		font-size: 0.8rem;
		color: #d1d5db;
	}

	.cliente-info {
		margin-bottom: 0.75rem;
		padding-bottom: 0.75rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}

	.cliente-info p {
		margin: 0.25rem 0;
		font-size: 0.9rem;
		color: #e5e7eb;
	}

	.cliente-info p i {
		width: 16px;
		margin-right: 8px;
		color: #6b7280;
	}

	.pedido-productos {
		margin-bottom: 0.75rem;
	}

	.titulo-productos {
		font-size: 0.9rem;
		font-weight: 600;
		color: #d1d5db;
		margin-bottom: 0.5rem;
	}

	.productos-lista {
		max-height: 150px;
		overflow-y: auto;
	}

	.producto-item {
		display: flex;
		padding: 0.4rem 0;
		border-bottom: 1px solid rgba(255, 255, 255, 0.05);
	}

	.producto-cantidad {
		font-weight: bold;
		color: #a5b4fc;
		margin-right: 8px;
		min-width: 30px;
	}

	.producto-nombre {
		flex: 1;
		color: #e5e7eb;
	}

	.producto-precio {
		color: #d1d5db;
	}

	.pedido-total {
		display: flex;
		justify-content: space-between;
		padding: 0.75rem 0;
		border-top: 1px solid rgba(255, 255, 255, 0.1);
		margin-top: 0.5rem;
	}

	.total-label {
		font-weight: 600;
		color: #f3f4f6;
	}

	.total-valor {
		font-weight: 700;
		color: #10b981;
	}

	.pedido-metodo {
		font-size: 0.85rem;
		text-align: right;
		color: #9ca3af;
	}

	.metodo-estado-container {
		display: flex;
		justify-content: flex-end;
		align-items: center;
		gap: 10px;
	}

	/* Estilo para la etiqueta de estado */
	.estado-pedido {
		display: inline-block;
		padding: 3px 8px;
		border-radius: 4px;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: capitalize;
	}

	/* Colores para los estados, siguiendo los mismos colores de los filtros */
	.estado-pedido.pendiente {
		background-color: rgba(245, 158, 11, 0.15);
		color: #f59e0b;
	}

	.estado-pedido.en-camino {
		background-color: rgba(59, 130, 246, 0.15);
		color: #3b82f6;
	}

	.estado-pedido.completado {
		background-color: rgba(16, 185, 129, 0.15);
		color: #10b981;
	}

	.estado-pedido.cancelado {
		background-color: rgba(239, 68, 68, 0.15);
		color: #ef4444;
	}

	/* Estilo para el loader */
	.spinner-pedidos {
		width: 40px;
		height: 40px;
		border: 3px solid rgba(255, 255, 255, 0.1);
		border-radius: 50%;
		border-top-color: #3b82f6;
		animation: spin 1s ease-in-out infinite;
		margin-bottom: 1rem;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	/* Estilos para mensaje de no resultados */
	.no-resultados-filtro {
		text-align: center;
		padding: 40px 0;
		color: #9ca3af;
	}

	.limpiar-filtro {
		background-color: rgba(255, 255, 255, 0.1);
		border: none;
		border-radius: 4px;
		padding: 5px 10px;
		color: #d1d5db;
		cursor: pointer;
		transition: background-color 0.2s;
		font-size: 0.85rem;
		display: flex;
		align-items: center;
		gap: 5px;
	}

	.limpiar-filtro:hover {
		background-color: rgba(255, 255, 255, 0.2);
	}

	/* Estilos para el selector de estados */
	.acciones-pedido {
		margin-top: 0.5rem;
		display: flex;
		justify-content: flex-end;
	}

	.selector-estado {
		position: relative;
	}

	.cambiar-estado {
		background-color: rgba(255, 255, 255, 0.1);
		color: white;
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 4px;
		padding: 4px 10px;
		font-size: 0.85rem;
		cursor: pointer;
		min-width: 120px;
	}

	.cambiar-estado option {
		background-color: #1d273f;
	}

	/* Colores específicos para cada estado en el selector (solo texto) */
	.cambiar-estado.pendiente {
		color: #f59e0b; /* Naranja/ámbar para pendiente */
		border-color: rgba(245, 158, 11, 0.5);
	}

	.cambiar-estado.en-camino {
		color: #3b82f6; /* Azul para en camino */
		border-color: rgba(59, 130, 246, 0.5);
	}

	.cambiar-estado.completado {
		color: #10b981; /* Verde para completado */
		border-color: rgba(16, 185, 129, 0.5);
	}

	.cambiar-estado.cancelado {
		color: #ef4444; /* Rojo para cancelado */
		border-color: rgba(239, 68, 68, 0.5);
	}

	/* Colores para las opciones del selector desplegable (solo texto) */
	.cambiar-estado option[value='pendiente'] {
		color: #f59e0b; /* Naranja/ámbar para pendiente */
	}

	.cambiar-estado option[value='en-camino'] {
		color: #3b82f6; /* Azul para en camino */
	}

	.cambiar-estado option[value='completado'] {
		color: #10b981; /* Verde para completado */
	}

	.cambiar-estado option[value='cancelado'] {
		color: #ef4444; /* Rojo para cancelado */
	}

	/* Estilos para mensaje de no resultados de búsqueda */
	.no-resultados-busqueda {
		text-align: center;
		padding: 40px 0;
		color: #9ca3af;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 12px;
	}

	.no-resultados-busqueda i {
		font-size: 2rem;
		opacity: 0.5;
	}

	.no-resultados-busqueda p {
		font-size: 1rem;
	}
</style>
