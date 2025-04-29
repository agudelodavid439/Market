import { writable } from 'svelte/store';
import type { Producto } from '$lib/conexion_products';

// Interfaces
interface ProductoCarrito {
	producto: Producto;
	cantidad: number;
}

// Stores
export const productosEnCarrito = writable<ProductoCarrito[]>([]);
export const carritoVisible = writable<boolean>(false); // Añadido el export del store

// Funciones auxiliares
export function agregarProductoAlCarrito(producto: Producto) {
	productosEnCarrito.update(items => {
		const existente = items.find(item => item.producto.col_nombre === producto.col_nombre);
		if (existente) {
			return items.map(item =>
				item.producto.col_nombre === producto.col_nombre
					? { ...item, cantidad: item.cantidad + 1 }
					: item
			);
		}
		return [...items, { producto, cantidad: 1 }];
	});
}

export function toggleCarrito() {
	carritoVisible.update(value => !value);
}

export function actualizarCantidad(nombreProducto: string, cantidad: number) {
	productosEnCarrito.update(items => {
		return items.map(item => {
			if (item.producto.col_nombre === nombreProducto) {
				const nuevaCantidad = item.cantidad + cantidad;
				if (nuevaCantidad > 0) {
					return { ...item, cantidad: nuevaCantidad };
				} else {
					return item; // No permitir cantidades negativas
				}
			}
			return item;
		});
	});
}

export function quitarProducto(indice: number) {
	productosEnCarrito.update(items => {
		items.splice(indice, 1);
		return items;
	});
}
