import express from 'express';

const router = express.Router();

let totalTokens = 0;
let totalWords = 0;
let totalChars = 0;

// Endpoint para obtener los contadores
router.get('/contadores', (req, res) => {
	res.json({
		totalTokens,
		totalWords,
		totalChars,
	});
});

// Endpoint para actualizar los contadores (se llamará desde el endpoint de chat)
export function actualizarContadores(tokens, words, chars) {
	totalTokens += tokens;
	totalWords += words;
	totalChars += chars;
}

// Exportar el router para usarlo en el servidor principal
export default router;
