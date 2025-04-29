import { Groq } from 'groq-sdk';
import { formatearPregunta } from './codeReaderController.js';

const groq = new Groq({
	apiKey: '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',
});

export const handleChat = async (req, res) => {
	try {
		const { message } = req.body;
		const completion = await groq.chat.completions.create({
			messages: [{ role: 'user', content: message }],
			model: 'llama-3.3-70b-versatile',
			temperature: 0.7,
			max_tokens: 1024,
			top_p: 1,
		});

		res.json({
			response: completion.choices[0].message.content,
		});
	} catch (error) {
		res.status(500).json({
			error: 'Error en la comunicación con Groq',
			details: error.message,
		});
	}
};

export const procesarMensaje = async (req, res) => {
	try {
		const { pregunta, archivos } = req.body;

		// Validar el mensaje
		if (!pregunta && (!archivos || archivos.length === 0)) {
			return res.status(400).json({
				error: true,
				mensaje: 'Se requiere una pregunta o archivos',
			});
		}

		// Formatear la pregunta
		const promptFormateado = await formatearPregunta(pregunta || '');

		// Aquí iría la lógica de tu modelo de IA
		// Por ahora, retornamos un mensaje de prueba
		const respuesta = {
			respuesta: `Procesando tu pregunta: ${pregunta}`,
			// Agregar más campos según necesites
		};

		return res.json(respuesta);
	} catch (error) {
		console.error('Error en procesarMensaje:', error);
		return res.status(500).json({
			error: true,
			mensaje: error.message,
		});
	}
};

// se encarga de conectar con el servidor backend ubicado en el archivo= servidor_AI.JS puerto 5000
