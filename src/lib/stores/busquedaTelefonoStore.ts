import { writable } from 'svelte/store';

// Store para el término de búsqueda por teléfono
const telefonoBusqueda = writable('');

// Store para indicar si hay una búsqueda en progreso
const buscandoPorTelefono = writable(false);

// Store para los resultados de la búsqueda por teléfono
const resultadosBusquedaTelefono = writable([]);

// Función para limpiar la búsqueda
function limpiarBusquedaTelefono() {
	telefonoBusqueda.set('');
	buscandoPorTelefono.set(false);
	resultadosBusquedaTelefono.set([]);
}

// Exportar explícitamente todas las variables y funciones
export {
	telefonoBusqueda,
	buscandoPorTelefono,
	resultadosBusquedaTelefono,
	limpiarBusquedaTelefono,
};
