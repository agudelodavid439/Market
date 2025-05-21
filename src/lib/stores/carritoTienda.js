import { writable } from 'svelte/store';

// Store para los productos en el carrito
export const productosEnCarrito = writable([]);

// Store para la visibilidad del carrito
export const carritoVisible = writable(false);

// Función para manejar la vibración del dispositivo
function vibrarDispositivo() {
	if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in window.navigator) {
		window.navigator.vibrate(200); // Vibra por 200ms
	}
}

// Función para alternar la visibilidad del carrito
export function toggleCarrito() {
	carritoVisible.update(value => !value);
}

// Función para agregar un producto al carrito con efectos
export function agregarAlCarrito(producto, cantidad = 1) {
	// Vibrar dispositivo
	vibrarDispositivo();

	// Actualizar el carrito
	productosEnCarrito.update(items => {
		// Buscar si el producto ya está en el carrito
		const indiceExistente = items.findIndex(item => item.producto.id === producto.id);

		if (indiceExistente >= 0) {
			// Si el producto ya existe, actualizar la cantidad
			const itemsActualizados = [...items];
			itemsActualizados[indiceExistente].cantidad += cantidad;
			return itemsActualizados;
		} else {
			// Si es un producto nuevo, añadirlo al carrito
			return [...items, { producto, cantidad }];
		}
	});
}

// Función para eliminar un producto del carrito
export function eliminarDelCarrito(productoId) {
	productosEnCarrito.update(items => items.filter(item => item.producto.id !== productoId));
}

// Función para actualizar la cantidad de un producto
export function actualizarCantidad(productoId, nuevaCantidad) {
	if (nuevaCantidad <= 0) {
		eliminarDelCarrito(productoId);
		return;
	}

	productosEnCarrito.update(items => {
		return items.map(item => {
			if (item.producto.id === productoId) {
				return { ...item, cantidad: nuevaCantidad };
			}
			return item;
		});
	});
}

// Función para limpiar el carrito
export function limpiarCarrito() {
	productosEnCarrito.set([]);
}
