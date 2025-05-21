// stores.js - Stores centralizados para la aplicación
import { writable } from 'svelte/store';

// Store para controlar visibilidad del carrito
export const carritoAbierto = writable(false);

// Store para contador de productos en el carrito
export const totalProductos = writable(0);

// Store para el usuario autenticado
export const usuarioAutenticado = writable(null);
