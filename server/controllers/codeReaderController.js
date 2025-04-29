import fs from 'fs/promises';
import path from 'path';

// Configuración y constantes
const MAX_CONTENT_LENGTH = 15000; // Aumentado de 5000 a 15000
const DEFAULT_RESPONSE = {
	explicacion: {
		respuesta:
			'Lo siento, el contenido es demasiado extenso. ¿Podrías compartir una parte específica?',
		contexto: null,
		detalles: null,
	},
};

// Agregar al inicio del archivo, después de las importaciones
const CODE_CONTEXTS = {
	GENERATE: ['generar', 'crear', 'implementar', 'desarrollar', 'hacer'],
	ANALYZE: ['analizar', 'revisar', 'examinar', 'explicar'],
	RETURN: ['devolver', 'mostrar', 'obtener'],
	MODIFY: ['modificar', 'cambiar', 'actualizar', 'mejorar', 'implementar cambios'],
};

// Función para detectar el contexto de código
const detectarContextoCodigo = pregunta => {
	const preguntaLower = pregunta.toLowerCase();

	for (const [tipo, keywords] of Object.entries(CODE_CONTEXTS)) {
		if (keywords.some(keyword => preguntaLower.includes(keyword))) {
			return tipo;
		}
	}
	return null;
};

// Patrones para detección de lenguaje por contenido
const LANGUAGE_PATTERNS = {
	svelte: /<script.*?>|<style.*?>|<template.*?>/i,
	python: /def\s+\w+\s*\(|import\s+\w+|from\s+\w+\s+import/,
	javascript: /const\s+\w+\s*=|let\s+\w+\s*=|function\s+\w+\s*\(/,
	typescript: /interface\s+\w+|type\s+\w+|:\s*\w+\s*=>/,
	html: /<(!DOCTYPE|html|head|body|div|span)/i,
	css: /(\.|#|\w+)\s*\{[^}]*\}/,
	java: /public\s+class|private\s+\w+|package\s+\w+/,
};

// Función mejorada para detectar lenguaje
const detectarLenguaje = (contenido, extension = '') => {
	// 1. Primero intentar por extensión
	const extensionMap = {
		'.svelte': 'Svelte',
		'.py': 'Python',
		'.js': 'JavaScript',
		'.ts': 'TypeScript',
		'.html': 'HTML',
		'.css': 'CSS',
		'.java': 'Java',
		'.jsx': 'React JSX',
		'.tsx': 'React TypeScript',
		'.php': 'PHP',
	};

	if (extension && extensionMap[extension]) {
		return extensionMap[extension];
	}

	// 2. Detección por contenido
	for (const [lang, pattern] of Object.entries(LANGUAGE_PATTERNS)) {
		if (pattern.test(contenido)) {
			return extensionMap[`.${lang}`] || lang;
		}
	}

	// 3. Análisis de palabras clave y estructura
	const contentAnalysis = {
		imports: /import\s+.*from/,
		functions: /function\s+\w+\s*\(/,
		classes: /class\s+\w+/,
		decorators: /@\w+/,
	};

	const matches = Object.entries(contentAnalysis).filter(([_, pattern]) =>
		pattern.test(contenido)
	).length;

	return matches > 0 ? 'JavaScript/TypeScript' : 'Desconocido';
};

// Función para dividir código grande en secciones analizables
const dividirContenido = contenido => {
	if (contenido.length <= MAX_CONTENT_LENGTH) {
		return [contenido];
	}

	const secciones = [];
	let currentSection = '';
	const lines = contenido.split('\n');

	for (const line of lines) {
		if ((currentSection + line).length > MAX_CONTENT_LENGTH) {
			secciones.push(currentSection);
			currentSection = line;
		} else {
			currentSection += line + '\n';
		}
	}
	if (currentSection) secciones.push(currentSection);

	return secciones;
};

// Función para ajustar formato según contexto
const ajustarFormatoSegunContexto = (pregunta, nivelDetalle) => {
	// Detectar tipo de pregunta
	const esPreguntaSimple = pregunta.length < 50;
	const pideSugerencias = /mejorar|optimizar|sugerir|recomendar/i.test(pregunta);
	const pideAnalisis = /analizar|explicar|entender/i.test(pregunta);

	// Construir objeto base
	const formatoBase = {
		explicacion: {
			respuesta: esPreguntaSimple ? 'Respuesta concisa' : 'Explicación detallada',
			contexto: pideAnalisis ? 'Contexto relevante' : null,
			detalles: nivelDetalle === 'detallado' ? 'Detalles técnicos' : null,
		},
	};

	// Agregar secciones condicionales
	if (pideSugerencias) {
		formatoBase.sugerencias = ['Mejoras específicas'];
	}

	if (pideAnalisis) {
		formatoBase.analisisCodigo = {
			proposito: 'Objetivo del código',
			puntosClave: ['Aspectos importantes'],
		};
	}

	// Convertir a string y formatear
	return `FORMATO DE RESPUESTA: ${JSON.stringify(formatoBase, null, 2)}`;
};

// En codeReaderController.js
import { get } from 'svelte/store';
import { promptStore } from './path/to/Ajustes_Ai.svelte';

// Modificar la función analizarCodigo
export const analizarCodigo = async (contenido, pregunta, preferenciasUsuario = {}) => {
	try {
		const secciones = dividirContenido(contenido);
		const lenguaje = detectarLenguaje(contenido);
		const nivelDetalle = preferenciasUsuario.nivelDetalle || 'normal';

		const currentPrompt = get(promptStore).prompts[get(promptStore).currentMode];
		const prompt = `
        ${currentPrompt.systemPrompt}
        
        CÓDIGO A ANALIZAR:
        ${secciones[0]} ${secciones.length > 1 ? '\n// ... (contenido adicional disponible)' : ''}

        PREGUNTA DEL USUARIO: "${pregunta}"
        `;

		return prompt;
	} catch (error) {
		console.error('Error en analizarCodigo:', error);
		return {
			error: true,
			mensaje: error.message,
			sugerencia: 'Por favor, revisa el contenido e intenta nuevamente',
		};
	}
};

// Helper function para leer archivo
export const leerArchivo = async rutaArchivo => {
	try {
		const contenido = await fs.readFile(rutaArchivo, 'utf-8');
		return contenido;
	} catch (error) {
		throw new Error(`Error al leer archivo: ${error.message}`);
	}
};

// Modificar la función formatearPregunta
export const formatearPregunta = async pregunta => {
	const contexto = detectarContextoCodigo(pregunta);
	const esContextoCodigo = contexto !== null;

	const prompt = `
    SISTEMA: Asistente de programación con formato estructurado.
    
    REGLAS OBLIGATORIAS DE RESPUESTA:
    1. Separar SIEMPRE el texto explicativo del código
    2. Todo código DEBE ir precedido por la palabra "code"
    3. SIEMPRE cerrar todas las etiquetas HTML/JSX/Svelte
    4. Mantener el código completo y formateado
    5. Máximo 3 párrafos de explicación
    
    ESTRUCTURA DE RESPUESTA:
    1. EXPLICACIÓN:
       - Breve introducción
       - Emoticon relevante
       - Explicación concisa
    
    2. CÓDIGO:
       - Precedido por "code"
       - Indentación correcta
       - Etiquetas completas
       - Estilos incluidos
    
    3. FORMATO OBLIGATORIO:
       [Texto explicativo]
       
       code
       [Bloque de código]
       
       [Texto adicional si es necesario]
       
       code
       [Otro bloque de código si es necesario]
    
    IMPORTANTE:
    - NO usar comillas invertidas (\`\`\`) para código
    - SIEMPRE usar la palabra "code" antes del código
    - NUNCA mezclar texto y código en el mismo bloque
    - SIEMPRE incluir estilos CSS completos

    PREGUNTA: "${pregunta}"
    CONTEXTO: ${esContextoCodigo ? contexto : 'CONVERSACIONAL'}
    `;

	return prompt;
};
