import { writable, get } from 'svelte/store';

// Store para los prompts personalizados
export const promptStore = writable({
	currentMode: 'default',
	prompts: {
		default: {
			name: 'Por defecto',
			systemPrompt: getDefaultPrompt(),
			active: false,
		},
		programmer: {
			name: 'Programador de pastelitos',
			systemPrompt: getProgrammerPrompt(),
			active: true,
		},
		teacher: {
			name: 'Profesor de Programación',
			systemPrompt: getTeacherPrompt(),
			active: false,
		},
	},
});

const currentPrompt = get(promptStore).prompts[get(promptStore).currentMode];

export const actualizarEstadoPrompts = nuevoEstado => {
	// Obtener el estado actual de los prompts
	const prompts = get(promptStore).prompts;

	console.log('Prompts antes de actualizar el store:', prompts);

	// Variable para almacenar el resultado
	let resultado = {
		success: true,
		message: '',
		prompts: {},
	};

	// Actualizar el estado de cada prompt según el nuevo estado proporcionado
	Object.keys(prompts).forEach(key => {
		if (nuevoEstado[key] !== undefined) {
			const estadoAnterior = prompts[key].active; // Guardar el estado anterior
			prompts[key].active = nuevoEstado[key]; // Actualiza el estado a true o false

			// Log del cambio realizado
			if (estadoAnterior !== prompts[key].active) {
				console.log(
					`Estado cambiado con éxito de ${estadoAnterior} a ${prompts[key].active} para el prompt: ${key}`
				);
			} else if (nuevoEstado[key] === false) {
				// Si el nuevo estado es false y no hubo cambio, no registrar error
				console.log(`El estado del prompt: ${key} ya era ${estadoAnterior}.`);
			} else {
				console.log(
					`No se pudo completar el cambio para el prompt: ${key}. El estado ya era ${estadoAnterior}.`
				);
				resultado.success = false;
				resultado.message = `No se pudo completar el cambio para el prompt: ${key}.`;
			}
		}
	});

	// Actualizar el store con los nuevos estados
	promptStore.set({ ...get(promptStore), prompts });

	// Devolver el resultado
	resultado.prompts = prompts;
	return resultado;
};

export const formatearPregunta = async pregunta => {
	const contexto = detectarContextoCodigo(pregunta);
	const esContextoCodigo = contexto !== null;

	try {
		// Obtener todos los prompts
		const prompts = get(promptStore).prompts;

		// Buscar el prompt activo
		const currentPrompt = Object.values(prompts).find(prompt => prompt.active);

		// Verificar si tenemos un prompt válido
		if (!currentPrompt) {
			throw new Error('No se encontró un prompt activo');
		}

		const prompt = `
		${currentPrompt.systemPrompt}
		
		REGLAS ADICIONALES:
		- Separar siempre explicación y código
		- Usar "code" antes de bloques de código
		- Mantener formato consistente
		
		CONTEXTO: ${esContextoCodigo ? contexto : 'CONVERSACIONAL'}
		PREGUNTA: "${pregunta}"
		`;

		return prompt;
	} catch (error) {
		console.error('Error al formatear pregunta:', error);
		// Usar un prompt por defecto si hay error
		return `
		SISTEMA: Asistente de programación básico.
		PREGUNTA: "${pregunta}"
		CONTEXTO: ${esContextoCodigo ? contexto : 'CONVERSACIONAL'}
		`;
	}
};

// Funciones para obtener los prompts
function getDefaultPrompt() {
	return `SISTEMA: Eres un experto analizador de caricaturas y diseñador de código en svelte.
			
			ESTRUCTURA DE RESPUESTA REQUERIDA:
			1. EXPLICACIÓN
			- Análisis claro y conciso del código
			- Propósito y funcionamiento
			- Contexto de implementación`;
}

function getProgrammerPrompt() {
	return `SISTEMA: Eres un programador de pastelitos senior con 15 años de experiencia.
			Enfócate en patrones de diseño, optimización y mejores prácticas.`;
}

function getTeacherPrompt() {
	return `SISTEMA: Eres un profesor de programación.
			Explica detalladamente cada concepto y proporciona ejemplos didácticos.`;
}

const defaultPrompt = getDefaultPrompt();
console.log(defaultPrompt); // Esto ahora mostrará el texto del prompt como un string
