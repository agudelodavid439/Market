// src/lib/conexion_pedidos.ts

import { supabase } from '$lib/supabaseclient';

// Interfaces para tipar los datos
interface PedidoData {
	id: string;
	numero_orden: string;
	nombre_cliente: string;
	correo: string;
	telefono: string;
	direccion: string;
	metodo_pago: string;
	articulos: string;
	total: number;
	estado: string;
	fecha_creacion: string;
	fecha_actualizacion: string;
	cantidad_productos: number;
	contador_ordenes_correo: number;
	contador_ordenes_telefono: number;
	imagenes_productos: string;
	notas?: string;
	codigo_descuento?: string;
	metodo_envio: string;
	fecha_entrega_estimada: string;
}

interface PedidoItem {
	pedido_id: string;
	producto_id: string;
	cantidad: number;
	total: number;
	subtotal: number;
	estado: string;
}

interface DatosCliente {
	nombre: string;
	correo?: string;
	celular: string;
	direccion: string;
	metodoPago: string;
}

interface CarritoItem {
	producto: any; // Tipo any temporalmente, idealmente debería ser más específico
	cantidad: number;
}

interface CrearPedidoResponse {
	success: boolean;
	mensaje: string;
	numeroOrden?: string;
	error: string | null;
}

interface ActualizarEstadoResponse {
	success: boolean;
	data?: { estado: string };
	error?: string;
}

// Función para crear un nuevo pedido
export async function crearPedido(pedidoData: PedidoData) {
	const { data, error } = await supabase.from('pedidos').insert([pedidoData]).select();
	return { data, error };
}

// Función para crear items del pedido
export async function crearPedidoItems(items: PedidoItem[]) {
	const { data, error } = await supabase.from('pedido_items').insert(items).select();
	return { data, error };
}

// Función para generar número de orden único
export function generarNumeroOrden(): string {
	const fecha = new Date();
	const timestamp = fecha.getTime();
	const random = Math.floor(Math.random() * 1000);
	return `ORD-${timestamp}-${random}`;
}

// Función para generar ID único
function generarId(): string {
	return 'pid_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Función para obtener la IP del cliente
export async function obtenerIP(): Promise<string | null> {
	try {
		const response = await fetch('https://api.ipify.org?format=json');
		const data = await response.json();
		return data.ip;
	} catch (error) {
		console.error('Error al obtener IP:', error);
		return null;
	}
}

// Función para crear pedido completo con sus items
export async function crearPedidoCompleto(
	datosCliente: DatosCliente,
	productosCarrito: CarritoItem[],
	total: number
): Promise<CrearPedidoResponse> {
	try {
		// 1. Generar número de orden e ID
		const numeroOrden = generarNumeroOrden();
		const pedidoId = generarId();

		// 2. Obtener IP del cliente
		const ip = await obtenerIP();

		// 3. Crear el pedido principal
		const pedidoData: PedidoData = {
			id: pedidoId,
			numero_orden: numeroOrden,
			nombre_cliente: datosCliente.nombre,
			correo: datosCliente.correo || 'no-email@example.com', // Valor por defecto para campo requerido
			telefono: datosCliente.celular,
			direccion: datosCliente.direccion,
			metodo_pago: datosCliente.metodoPago,
			articulos: JSON.stringify(productosCarrito),
			total: total,
			estado: 'pendiente',
			fecha_creacion: new Date().toISOString(),
			fecha_actualizacion: new Date().toISOString(),
			cantidad_productos: productosCarrito.reduce((sum, item) => sum + item.cantidad, 0),
			contador_ordenes_correo: 0,
			contador_ordenes_telefono: 0,
			imagenes_productos: JSON.stringify(
				productosCarrito.map(item => ({
					id: item.producto.id,
					imagen: item.producto.col_imagen,
				}))
			),
			metodo_envio: 'estandar',
			fecha_entrega_estimada: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 días después
		};

		// 4. Insertar el pedido
		const { data: pedidoCreado, error: errorPedido } = await crearPedido(pedidoData);
		if (errorPedido) throw errorPedido;

		// 5. Preparar items del pedido
		const pedidoItems: PedidoItem[] = productosCarrito.map(item => ({
			pedido_id: pedidoId,
			producto_id: item.producto.id,
			cantidad: item.cantidad,
			total: item.producto.col_precio_puerta * item.cantidad,
			subtotal: item.producto.col_precio_puerta * item.cantidad,
			estado: 'pendiente',
		}));

		// 6. Insertar items del pedido
		const { error: errorItems } = await crearPedidoItems(pedidoItems);
		if (errorItems) throw errorItems;

		return {
			success: true,
			mensaje: '¡Pedido creado exitosamente!',
			numeroOrden,
			error: null,
		};
	} catch (error: any) {
		console.error('Error al crear pedido:', error);
		return {
			success: false,
			mensaje: 'Error al crear el pedido',
			error: error.message,
		};
	}
}

// Función para obtener todos los pedidos ordenados por ID
export async function obtenerPedidos() {
	const { data, error } = await supabase
		.from('pedidos')
		.select(
			'id, numero_orden, nombre_cliente, correo, telefono, direccion, metodo_pago, articulos, total, estado, fecha_creacion, fecha_actualizacion, cantidad_productos, contador_ordenes_correo, contador_ordenes_telefono, imagenes_productos, notas, codigo_descuento, metodo_envio, fecha_entrega_estimada'
		)
		.order('id', { ascending: true });
	return { data, error };
}

// Función para obtener un pedido específico por ID
export async function obtenerPedidoPorId(id: string) {
	const { data, error } = await supabase
		.from('pedidos')
		.select(
			'id, numero_orden, nombre_cliente, correo, telefono, direccion, metodo_pago, articulos, total, estado, fecha_creacion, fecha_actualizacion, cantidad_productos, contador_ordenes_correo, contador_ordenes_telefono, imagenes_productos, notas, codigo_descuento, metodo_envio, fecha_entrega_estimada'
		)
		.eq('id', id)
		.single();
	return { data, error };
}

// Función para actualizar un pedido específico por ID
// Función para buscar pedidos por número de teléfono
export async function buscarPedidosPorTelefono(telefono: string) {
    const { data, error } = await supabase
        .from('pedidos')
        .select('*')
        .ilike('telefono', `%${telefono}%`)
        .order('fecha_creacion', { ascending: false });
    return { data, error };
}

export async function actualizarPedido(id: string, updatedData: Partial<PedidoData>) {
	const { error } = await supabase.from('pedidos').update(updatedData).eq('id', id);
	return { error };
}

// Función para eliminar un pedido específico por ID
export async function eliminarPedido(id: string) {
	const { error } = await supabase.from('pedidos').delete().eq('id', id);
	return { error };
}

export async function obtenerCategorias() {
	try {
		// Cambiamos 'productos' por 'products' que es el nombre correcto de la tabla
		const { data, error } = await supabase
			.from('products') // Corregido: 'productos' → 'products'
			.select('col_tipo')
			.not('col_tipo', 'is', null)
			.order('col_tipo', { ascending: true });

		if (error) throw error;

		// Protección contra data null
		if (!data) {
			return { data: [], error: null };
		}

		// Eliminar duplicados
		const categoriasUnicas = [...new Set(data.map(item => item.col_tipo))];

		return { data: categoriasUnicas, error: null };
	} catch (err) {
		console.error('Error al obtener categorías:', err);
		return { data: [], error: err };
	}
}

/**
 * Actualiza el estado de un pedido en Supabase
 * @param {string} numeroOrden - Número de orden del pedido
 * @param {string} nuevoEstado - Nuevo estado ('pendiente', 'en-camino', 'completado', 'cancelado')
 */
export async function actualizarEstadoPedido(
	numeroOrden: string,
	nuevoEstado: string
): Promise<ActualizarEstadoResponse> {
	try {
		// Validar que el nuevo estado sea uno de los permitidos
		if (!['pendiente', 'en-camino', 'completado', 'cancelado'].includes(nuevoEstado)) {
			throw new Error('Estado inválido. Debe ser pendiente, en-camino, completado o cancelado');
		}

		console.log(`[conexion_pedidos] Actualizando estado de pedido ${numeroOrden} a ${nuevoEstado}`);

		// Agregamos un registro más explícito de cada paso
		console.log(`[conexion_pedidos] PASO 1: Verificando conexión a Supabase`);

		try {
			// Verificar primero que la conexión a Supabase funcione
			const { data: testData, error: testError } = await supabase
				.from('pedidos')
				.select('id, estado')
				.limit(1);

			if (testError) {
				console.error('[conexion_pedidos] Error de conexión a Supabase:', testError);
				throw new Error(`Error de conexión: ${testError.message}`);
			}

			console.log(`[conexion_pedidos] Conexión a Supabase OK, datos de prueba:`, testData);
		} catch (connError: any) {
			console.error('[conexion_pedidos] Error crítico de conexión:', connError);
			throw connError;
		}

		// PASO 2: Verificar existencia del pedido
		console.log(`[conexion_pedidos] PASO 2: Buscando pedido ${numeroOrden} en Supabase`);

		// Buscar explícitamente por número de orden
		const { data: existingData, error: checkError } = await supabase
			.from('pedidos')
			.select('id, numero_orden, estado')
			.eq('numero_orden', numeroOrden)
			.maybeSingle();

		if (checkError) {
			console.error(`[conexion_pedidos] Error al buscar pedido:`, checkError);
			throw checkError;
		}

		// Si no existe el pedido, lo creamos desde localStorage
		if (!existingData) {
			console.log(
				`[conexion_pedidos] PASO 3A: Pedido ${numeroOrden} no encontrado, intentando crearlo`
			);

			// Buscar datos en localStorage
			let pedidoData = null;
			try {
				const pedidosString = localStorage.getItem('pedidosGuardados');
				if (pedidosString) {
					const pedidos = JSON.parse(pedidosString);
					pedidoData = pedidos.find((p: any) => p.numeroOrden === numeroOrden);
					console.log(`[conexion_pedidos] Datos encontrados en localStorage:`, pedidoData);
				}
			} catch (e) {
				console.error(`[conexion_pedidos] Error al buscar pedido en localStorage:`, e);
			}

			if (!pedidoData) {
				throw new Error(`Pedido ${numeroOrden} no existe en localStorage ni en Supabase`);
			}

			// Crear un ID único para el pedido
			const newPedidoId = `pid_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

			console.log(`[conexion_pedidos] PASO 4A: Insertando nuevo pedido con ID ${newPedidoId}`);

			// Insertar el pedido en Supabase
			const { data: insertData, error: insertError } = await supabase
				.from('pedidos')
				.insert({
					id: newPedidoId,
					numero_orden: numeroOrden,
					nombre_cliente: pedidoData.datosCliente?.nombre || 'Cliente',
					correo: 'cliente@example.com',
					telefono: pedidoData.datosCliente?.celular || '0000000000',
					direccion: pedidoData.datosCliente?.direccion || 'Sin dirección',
					metodo_pago: pedidoData.datosCliente?.metodoPago || 'efectivo',
					articulos: JSON.stringify(pedidoData.productos || []),
					total: pedidoData.total || 0,
					estado: nuevoEstado, // Asignar el nuevo estado directamente
					fecha_creacion: pedidoData.fecha || new Date().toISOString(),
					fecha_actualizacion: new Date().toISOString(),
				})
				.select();

			if (insertError) {
				console.error(`[conexion_pedidos] Error al insertar pedido:`, insertError);
				throw insertError;
			}

			console.log(
				`[conexion_pedidos] Pedido creado exitosamente con estado ${nuevoEstado}:`,
				insertData
			);
		}
		// Si el pedido existe, actualizamos su estado directamente
		else {
			console.log(
				`[conexion_pedidos] PASO 3B: Actualizando pedido existente con ID ${existingData.id}`
			);
			console.log(
				`[conexion_pedidos] Estado actual: ${existingData.estado}, Nuevo estado: ${nuevoEstado}`
			);

			// Usar el ID para la actualización, que es la clave primaria
			const { data: updateData, error: updateError } = await supabase
				.from('pedidos')
				.update({
					estado: nuevoEstado,
					fecha_actualizacion: new Date().toISOString(),
				})
				.eq('id', existingData.id) // Usar ID en lugar de numero_orden
				.select();

			if (updateError) {
				console.error(`[conexion_pedidos] Error al actualizar estado:`, updateError);
				throw updateError;
			}

			console.log(`[conexion_pedidos] Estado actualizado exitosamente:`, updateData);
		}

		// PASO FINAL: Actualizar localStorage para mantener la sincronización
		try {
			const pedidosString = localStorage.getItem('pedidosGuardados');
			if (pedidosString) {
				const pedidos = JSON.parse(pedidosString);
				const pedidoIndex = pedidos.findIndex((p: any) => p.numeroOrden === numeroOrden);

				if (pedidoIndex !== -1) {
					pedidos[pedidoIndex].estado = nuevoEstado;
					localStorage.setItem('pedidosGuardados', JSON.stringify(pedidos));
					console.log(`[conexion_pedidos] Estado actualizado en localStorage para ${numeroOrden}`);
				}
			}
		} catch (e) {
			console.error('[conexion_pedidos] Error al actualizar localStorage:', e);
		}

		// Verificar que el estado se actualizó correctamente consultando de nuevo
		console.log(`[conexion_pedidos] PASO 5: Verificando actualización`);

		const { data: verifyData, error: verifyError } = await supabase
			.from('pedidos')
			.select('estado')
			.eq('numero_orden', numeroOrden)
			.single();

		if (verifyError) {
			console.error(`[conexion_pedidos] Error al verificar actualización:`, verifyError);
		} else if (verifyData) {
			console.log(`[conexion_pedidos] Verificación del estado en Supabase: ${verifyData.estado}`);

			if (verifyData.estado !== nuevoEstado) {
				console.warn(
					`[conexion_pedidos] ¡ADVERTENCIA! El estado en la base de datos (${verifyData.estado}) no coincide con el solicitado (${nuevoEstado})`
				);
			} else {
				console.log(
					`[conexion_pedidos] ✅ Verificación exitosa: Estado actualizado a ${nuevoEstado}`
				);
			}
		}

		return { success: true, data: { estado: nuevoEstado } };
	} catch (error: any) {
		console.error('[conexion_pedidos] Error al actualizar estado:', error);
		return { success: false, error: error.message };
	}
}

/**
 * Actualiza ÚNICAMENTE el estado de un pedido en Supabase
 * @param {string} numeroOrden - Número de orden del pedido
 * @param {string} nuevoEstado - Nuevo estado ('pendiente', 'en-camino', 'completado', 'cancelado')
 */
export async function actualizarSoloEstadoPedido(
	numeroOrden: string,
	nuevoEstado: string
): Promise<ActualizarEstadoResponse> {
	try {
		// Validar que el nuevo estado sea uno de los permitidos
		if (!['pendiente', 'en-camino', 'completado', 'cancelado'].includes(nuevoEstado)) {
			throw new Error('Estado inválido. Debe ser pendiente, en-camino, completado o cancelado');
		}

		console.log(
			`[conexion_pedidos] Actualizando SOLO estado de pedido ${numeroOrden} a ${nuevoEstado}`
		);

		// Verificar que la conexión a Supabase funcione
		try {
			const { error: testError } = await supabase.from('pedidos').select('count').limit(1);

			if (testError) {
				console.error('[conexion_pedidos] Error de conexión a Supabase:', testError);
				throw new Error(`Error de conexión: ${testError.message}`);
			}
		} catch (connError: any) {
			console.error('[conexion_pedidos] Error crítico de conexión:', connError);
			throw connError;
		}

		// Buscar el pedido para obtener su ID (clave primaria)
		console.log(`[conexion_pedidos] Buscando pedido ${numeroOrden} para actualizar solo estado`);
		const { data: existingData, error: findError } = await supabase
			.from('pedidos')
			.select('id, numero_orden, estado')
			.eq('numero_orden', numeroOrden)
			.maybeSingle();

		if (findError) {
			console.error(`[conexion_pedidos] Error al buscar pedido:`, findError);
			throw findError;
		}

		if (!existingData) {
			console.error(`[conexion_pedidos] Pedido ${numeroOrden} no encontrado en la base de datos`);
			throw new Error(`Pedido ${numeroOrden} no existe en la base de datos`);
		}

		// Actualizar ÚNICAMENTE el campo "estado"
		console.log(`[conexion_pedidos] Actualizando SOLO campo 'estado' para ${numeroOrden}`);
		const { data: updateData, error: updateError } = await supabase
			.from('pedidos')
			.update({
				estado: nuevoEstado,
				fecha_actualizacion: new Date().toISOString(), // Mínimo necesario para tracking
			})
			.eq('id', existingData.id)
			.select();

		if (updateError) {
			console.error(`[conexion_pedidos] Error al actualizar solo estado:`, updateError);
			throw updateError;
		}

		console.log(`[conexion_pedidos] Estado actualizado exitosamente a: ${nuevoEstado}`);

		// Verificar la actualización (solo para debug)
		const { data: verifyData, error: verifyError } = await supabase
			.from('pedidos')
			.select('estado')
			.eq('id', existingData.id)
			.single();

		if (verifyError) {
			console.error(`[conexion_pedidos] Error al verificar la actualización:`, verifyError);
		} else if (verifyData && verifyData.estado !== nuevoEstado) {
			console.warn(
				`[conexion_pedidos] ADVERTENCIA: El estado verificado (${verifyData.estado}) no coincide con el solicitado (${nuevoEstado})`
			);
		} else {
			console.log(`[conexion_pedidos] Verificación exitosa: estado = ${nuevoEstado}`);
		}

		// Actualizar también en localStorage para mantener sincronizado
		try {
			const pedidosString = localStorage.getItem('pedidosGuardados');
			if (pedidosString) {
				const pedidos = JSON.parse(pedidosString);
				const pedidoIndex = pedidos.findIndex((p: any) => p.numeroOrden === numeroOrden);

				if (pedidoIndex !== -1) {
					pedidos[pedidoIndex].estado = nuevoEstado;
					localStorage.setItem('pedidosGuardados', JSON.stringify(pedidos));
					console.log(`[conexion_pedidos] Estado actualizado en localStorage`);
				}
			}
		} catch (storageError) {
			console.error('[conexion_pedidos] Error al actualizar localStorage:', storageError);
			// No lanzamos error aquí para no interrumpir el flujo principal
		}

		return {
			success: true,
			data: { estado: nuevoEstado },
		};
	} catch (error: any) {
		console.error('[conexion_pedidos] Error en actualizarSoloEstadoPedido:', error);
		return {
			success: false,
			error: error.message,
		};
	}
}

/**
 * Obtiene el estado actual de un pedido desde Supabase
 * @param {string} numeroOrden - Número de orden del pedido
 */
export async function obtenerEstadoPedido(numeroOrden: string) {
	try {
		console.log(`[conexion_pedidos] Consultando estado de pedido ${numeroOrden}`);

		const { data, error } = await supabase
			.from('pedidos')
			.select('estado')
			.eq('numero_orden', numeroOrden)
			.single();

		if (error) throw error;

		if (data) {
			console.log(`[conexion_pedidos] Estado encontrado para ${numeroOrden}: ${data.estado}`);
			return { success: true, estado: data.estado };
		} else {
			console.log(`[conexion_pedidos] No se encontró el pedido ${numeroOrden}`);
			return { success: false, error: 'Pedido no encontrado' };
		}
	} catch (error: any) {
		console.error('[conexion_pedidos] Error al consultar estado:', error);
		return { success: false, error: error.message };
	}
}
