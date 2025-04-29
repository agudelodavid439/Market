// src/lib/conexion_products.ts
import { supabase } from '$lib/supabaseClient';

// Definir tipos para los productos
export interface Producto {
	id: string;
	col_imagen: string;
	col_nombre: string;
	col_tipo: string; // Esta es nuestra columna de categoría
	col_precio_compra: number;
	col_precio_puerta: number;
	col_precio_puerta11: number;
	col_precio_domicilio: number;
	col_precio_domicilio11: number;
	col_stock: number;
	col_estado: string;
	col_descripcion: string | null;
	col_reseñas: string | null;
	col_fecha_vencimiento: string | null;
	col_proveedor: string | null;
	col_cupon_descuento: string | null;
	col_categoria_parent_id: string | null;
	// col_categoria: string | null; <-- Eliminamos esto
}

interface ErrorSupabase {
	message: string;
	code: string;
	details: string;
}

// Eliminar producto por ID
export async function eliminarProductoPorId(id: string): Promise<{ error: ErrorSupabase | null }> {
	try {
		const { data, error } = await supabase.from('products').delete().eq('id', id).select('id'); // necesario para saber si se eliminó algo

		if (error) {
			return { error };
		}

		if (!data || data.length === 0) {
			return {
				error: {
					message: 'Producto no encontrado',
					code: 'not_found',
					details: '',
				},
			};
		}

		return { error: null };
	} catch (e: any) {
		return {
			error: {
				message: e.message,
				code: 'delete_error',
				details: e.stack,
			} as ErrorSupabase,
		};
	}
}

// Obtener todos los productos
export async function obtenerProductos(): Promise<{
	data: Producto[] | null;
	error: ErrorSupabase | null;
}> {
	const { data, error } = await supabase
		.from('products')
		.select(
			'id, col_imagen, col_nombre, col_tipo, col_precio_compra, col_precio_puerta, col_precio_puerta11, col_precio_domicilio, col_precio_domicilio11, col_stock, col_estado, col_descripcion, col_reseñas, col_fecha_vencimiento, col_proveedor, col_cupon_descuento, col_categoria_parent_id'
		) // col_tipo ya está incluido
		.order('id', { ascending: true });
	return { data, error };
}

// Nueva función para obtener un producto específico por ID
export async function obtenerProductoPorId(
	id: string
): Promise<{ data: Producto | null; error: ErrorSupabase | null }> {
	console.log(`[obtenerProductoPorId] Solicitando producto ID: ${id}`);

	try {
		const { data, error } = await supabase.from('products').select('*').eq('id', id).single(); // Usamos single() porque esperamos un solo resultado

		console.log(`[obtenerProductoPorId] Respuesta para ID ${id}:`, { data, error });

		if (error) {
			console.error('[obtenerProductoPorId] Error de Supabase:', {
				message: error.message,
				code: error.code,
				details: error.details,
			});
			throw error;
		}

		if (!data) {
			console.warn('[obtenerProductoPorId] No se encontró producto con ID:', id);
			throw new Error('Producto no encontrado');
		}

		return { data, error: null };
	} catch (error) {
		console.error('[obtenerProductoPorId] Error al obtener producto:', error);
		throw error;
	}
}

// Función para insertar o actualizar producto
export async function guardarProducto(
	producto: Producto
): Promise<{ data: Producto | null; error: ErrorSupabase | null }> {
	if (producto.id) {
		// Si tiene ID, actualizar
		return await actualizarProducto(producto.id, producto);
	} else {
		// Si no tiene ID, insertar
		const { data, error } = await supabase.from('products').insert([producto]).select(); // Obtener nuevo producto insertado
		return { data: data ? data[0] : null, error };
	}
}

// Función para actualizar un producto
export async function actualizarProducto(
	id: string,
	updatedData: Producto
): Promise<{ data: Producto | null; error: ErrorSupabase | null }> {
	const idStr = String(id || '').trim();
	const idValido = !isNaN(Number(idStr)) && idStr.length > 0; // Validación para que sea numérico

	try {
		if (!idValido) throw new Error('ID inválido: no se puede guardar sin un ID definido');

		const camposValidos = [
			'id',
			'col_imagen',
			'col_nombre',
			'col_tipo',
			'col_precio_compra',
			'col_precio_puerta',
			'col_precio_puerta11',
			'col_precio_domicilio',
			'col_precio_domicilio11',
			'col_stock',
			'col_estado',
			'col_descripcion',
			'col_reseñas',
			'col_fecha_vencimiento',
			'col_proveedor',
			'col_cupon_descuento',
			'col_categoria_parent_id',
			'col_descuento_precio',
		];

		const dataFiltrada = Object.fromEntries(
			Object.entries(updatedData).filter(([key]) => camposValidos.includes(key))
		);

		if (Object.keys(dataFiltrada).length === 0) {
			throw new Error('No se enviaron campos válidos para guardar');
		}

		// Verificamos si el producto ya existe
		const { data: productoExistente, error: errorVerificacion } = await supabase
			.from('products')
			.select('id')
			.eq('id', idStr) // Usamos idStr como string
			.maybeSingle();

		if (errorVerificacion) throw errorVerificacion;

		let resultado;

		if (productoExistente) {
			// ACTUALIZAR
			const { data, error } = await supabase
				.from('products')
				.update(dataFiltrada)
				.eq('id', idStr) // Usamos idStr como string
				.select();

			if (error) throw error;
			if (!data || data.length === 0 || !data[0]) {
				throw new Error('No se devolvió el producto actualizado');
			}

			resultado = { data: data[0], error: null };
		} else {
			// INSERTAR
			const { data, error } = await supabase.from('products').insert([dataFiltrada]).select();

			if (error) throw error;
			if (!data || data.length === 0 || !data[0]) {
				throw new Error('No se devolvió el producto insertado');
			}

			resultado = { data: data[0], error: null };
		}

		return resultado;
	} catch (error) {
		console.error('[actualizarProducto] Error en operación de producto:', {
			mensaje: error.message,
			stack: error.stack,
		});

		return {
			data: null,
			error: {
				message: error.message,
				details: error.stack,
				hint: 'Verifica los datos enviados',
				code: 'actualizarProducto_error',
			} as ErrorSupabase,
		};
	}
}
