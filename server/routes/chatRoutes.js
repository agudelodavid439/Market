import express from 'express';
import { procesarMensaje } from '../controllers/chatController.js';

const router = express.Router();

router.post('/chat', procesarMensaje);

export default router;
