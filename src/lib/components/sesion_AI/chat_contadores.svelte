<script>
	import { Copy, Check, Settings } from 'lucide-svelte';
	import TextareaAi from './textarea_Ai.svelte';
	import Ajustes_Ai from './Ajustes_Ai.svelte';

	const API_URL = 'http://localhost:5000/api/chat';
	let messages = [];
	let currentMessage = '';
	let isLoading = false;
	let totalTokens = 0;
	let copiedMessageId = null;
	let isSettingsPanelOpen = false;

	// Guardar respuestas comunes
	const cache = new Map();

	async function handleSubmit(event) {
		const message = event.detail.message;
		if (!message) return;

		const estimatedTokens = Math.ceil(message.split(/\s+/).length * 1.3);

		if (estimatedTokens > 5000) {
			messages = [
				...messages,
				{
					text: '⚠️ El mensaje es demasiado largo y podría consumir muchos tokens. Considera dividirlo.',
					sender: 'system',
				},
			];
			return;
		}

		// Agregar el mensaje del usuario primero
		messages = [
			...messages,
			{
				text: message,
				sender: 'user',
			},
		];

		// Verificar si la pregunta ya está en el cache
		if (cache.has(message)) {
			messages = [
				...messages,
				{
					text: cache.get(message),
					sender: 'ai',
				},
			];
			return;
		}

		try {
			isLoading = true;

			// Verificar si estamos en rate limit
			if (isRateLimited()) {
				throw new Error('Por favor espera unos minutos antes de enviar más mensajes');
			}

			const response = await fetch(API_URL, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				mode: 'cors',
				body: JSON.stringify({ pregunta: message }),
			});

			const data = await response.json();

			// Si recibimos error de rate limit
			if (response.status === 429) {
				const retryAfter = parseRetryAfterTime(data.error.message);
				setRateLimit(retryAfter);
				throw new Error(
					`Límite alcanzado. Intenta de nuevo en ${Math.ceil(retryAfter / 60)} minutos`
				);
			}

			if (!response.ok) {
				throw new Error(data.mensaje || `Error del servidor: ${response.status}`);
			}

			if (data.error) {
				throw new Error(data.mensaje);
			}

			if (!data.respuesta) {
				throw new Error('Respuesta vacía del servidor');
			}

			// Guardar respuesta en el cache
			cache.set(message, data.respuesta);

			messages = [
				...messages,
				{
					text: data.respuesta,
					sender: 'ai',
				},
			];

			// Actualizar contador de tokens después de respuesta exitosa
			if (data?.respuesta) {
				const responseTokens = Math.ceil(data.respuesta.split(/\s+/).length * 1.3);
				totalTokens += estimatedTokens + responseTokens;
			}
		} catch (error) {
			messages = [
				...messages,
				{
					text: `🚫 ${error.message}`,
					sender: 'system',
				},
			];
		} finally {
			isLoading = false;
		}
	}

	// Funciones auxiliares para manejar rate limit
	function isRateLimited() {
		const limitUntil = localStorage.getItem('rateLimitUntil');
		if (!limitUntil) return false;
		return Date.now() < parseInt(limitUntil);
	}

	function setRateLimit(seconds) {
		const limitUntil = Date.now() + seconds * 1000;
		localStorage.setItem('rateLimitUntil', limitUntil.toString());
	}

	function parseRetryAfterTime(message) {
		const match = message.match(/try again in (\d+)m(\d+\.\d+)s/);
		if (match) {
			const minutes = parseInt(match[1]);
			const seconds = parseFloat(match[2]);
			return minutes * 60 + seconds;
		}
		return 480; // 8 minutos por defecto
	}

	async function copyToClipboard(text, messageId) {
		try {
			await navigator.clipboard.writeText(text);
			copiedMessageId = messageId;
			setTimeout(() => {
				copiedMessageId = null;
			}, 2000);
		} catch (err) {
			console.error('Error al copiar:', err);
		}
	}

	// Añadir esta función
	function getTokenResetTime() {
		const firstUseTime = localStorage.getItem('firstUseTime');
		if (!firstUseTime) {
			const now = Date.now();
			localStorage.setItem('firstUseTime', now.toString());
			return new Date(now + 24 * 60 * 60 * 1000);
		}
		return new Date(parseInt(firstUseTime) + 24 * 60 * 60 * 1000);
	}

	// Reemplazar la función detectCodeBlock existente
	function detectCodeBlock(text) {
		return text.toLowerCase().includes('code');
	}

	// Reemplazar la función separateCodeFromText existente
	function separateCodeFromText(text) {
		const parts = text.split(/code/i);
		return parts
			.map((part, index) => {
				if (index > 0 && part.trim()) {
					return {
						type: 'code',
						content: part.trim(),
					};
				}
				return {
					type: 'text',
					content: part.trim(),
				};
			})
			.filter(part => part.content);
	}

	// Agregar variables reactivas para los contadores
	$: totalWords = messages.reduce((acc, msg) => acc + msg.text.trim().split(/\s+/).length, 0);

	$: totalChars = messages.reduce((acc, msg) => acc + msg.text.length, 0);

	function formatNumber(num) {
		return num >= 1000 ? (num / 1000).toFixed(1) + 'k' : num.toLocaleString();
	}

	// Función para toggle del panel
	function toggleSettingsPanel() {
		isSettingsPanelOpen = !isSettingsPanelOpen;
	}
</script>

<div class="chat-container {isSettingsPanelOpen ? 'panel-open' : ''}">
	<div class="chat-header">
		<div class="header-left">
			<button
				class="settings-button {isSettingsPanelOpen ? 'active' : ''}"
				on:click={toggleSettingsPanel}
			>
				<Settings size={24} />
			</button>
			<h1>Chat Groq AI</h1>
		</div>
		<div class="stats-container">
			<div class="stat-item">
				<span class="stat-count">{formatNumber(totalTokens)}</span>
				<span class="stat-label">tokens</span>
			</div>
			<div class="stat-item">
				<span class="stat-count">{formatNumber(totalWords)}</span>
				<span class="stat-label">palabras</span>
			</div>
			<div class="stat-item">
				<span class="stat-count">{formatNumber(totalChars)}</span>
				<span class="stat-label">caracteres</span>
			</div>
			{#if isSettingsPanelOpen}
				<button class="close-settings" on:click={toggleSettingsPanel}>×</button>
			{/if}
		</div>
	</div>

	<div class="rate-limit-info">
		{#if isRateLimited()}
			<p>Próximo reinicio de tokens: {getTokenResetTime().toLocaleTimeString()}</p>
		{/if}
	</div>

	<div class="messages-area">
		{#each messages as message, i}
			<div class="message message-{message.sender}">
				<div class="message-avatar">
					{#if message.sender === 'user'}
						<svg class="avatar-icon" viewBox="0 0 24 24">
							<path
								d="M12 4a4 4 0 0 1 4 4 4 4 0 0 1-4 4 4 4 0 0 1-4-4 4 4 0 0 1 4-4m0 10c4.42 0 8 1.79 8 4v2H4v-2c0-2.21 3.58-4 8-4z"
							/>
						</svg>
					{:else if message.sender === 'ai'}
						<svg class="avatar-icon" viewBox="0 0 24 24">
							<path
								d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"
							/>
						</svg>
					{/if}
				</div>
				<div class="message-content">
					{#each separateCodeFromText(message.text) as part}
						{#if part.type === 'text'}
							<p class="message-text">{part.content}</p>
						{:else}
							<div class="code-block">
								<div class="code-header">
									<span>Código</span>
									<button
										class="copy-button"
										on:click={() => copyToClipboard(part.content, `${i}-code`)}
									>
										{#if copiedMessageId === `${i}-code`}
											<Check size={16} />
											<span class="copy-tooltip">¡Copiado!</span>
										{:else}
											<Copy size={16} />
										{/if}
									</button>
								</div>
								<pre><code>{part.content}</code></pre>
							</div>
						{/if}
					{/each}
					<span class="message-time">
						{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
					</span>
				</div>
			</div>
		{/each}
		{#if isLoading}
			<div class="message message-system">
				<div class="loading-indicator">
					<span class="loading-dot"></span>
					<span class="loading-dot"></span>
					<span class="loading-dot"></span>
				</div>
			</div>
		{/if}
	</div>

	<div class="input-container">
		<TextareaAi bind:currentMessage {isLoading} on:submit={handleSubmit} />
	</div>

	{#if isSettingsPanelOpen}
		<div class="settings-sidebar">
			<Ajustes_Ai on:close={toggleSettingsPanel} />
		</div>
	{/if}
</div>

<style>
	@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap');

	:root {
		--primary-text: #ffffff;
		--secondary-text: #b0b7c3;
		--system-msg-bg: rgba(255, 255, 255, 0.05);
		--user-msg-bg: rgba(25, 118, 210, 0.15);
		--ai-msg-bg: rgba(255, 255, 255, 0.07);
		--input-bg: rgba(255, 255, 255, 0.07);
		--border-color: rgba(255, 255, 255, 0.1);
		--accent-color: #4d84e6;
	}

	* {
		box-sizing: border-box;
		margin: 0;
		padding: 0;
	}

	.chat-container {
		width: calc(100% - 550px); /* Dejamos 300px de espacio a la derecha */
		height: 100vh;
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		background: linear-gradient(180deg, #14213d 0%, #1e3a5f 30%, rgb(0, 0, 0) 60%, #0a1929 100%);
		font-family: 'Inter', sans-serif;
		color: var(--primary-text);
		position: fixed;
		left: 0;
		top: 0;
		overflow-x: hidden;
	}

	.settings-sidebar {
		position: fixed;
		left: 0;
		top: 0;
		bottom: 0;
		width: 600px;
		background: var(--background-secondary, #1a1a1a);
		border-right: 1px solid var(--border-color);
		overflow-y: auto;
		z-index: 1000;
		animation: slideIn 0.3s ease-out;
	}

	.settings-header {
		position: sticky;
		top: 0;
		z-index: 10;
		background: inherit;
		padding: 15px;
		border-bottom: 1px solid var(--border-color);
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.close-button {
		position: absolute;
		top: 15px;
		right: 15px;
		background: transparent;
		border: none;
		color: var(--secondary-text);
		font-size: 24px;
		cursor: pointer;
		width: 32px;
		height: 32px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s ease;
	}

	.close-button:hover {
		background: rgba(255, 255, 255, 0.1);
		color: var(--primary-text);
	}

	.chat-header {
		padding: 20px 25px;
		border-bottom: 1px solid var(--border-color);
		flex-shrink: 0;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.header-left {
		display: flex;
		font-size: 1.3em;
		align-items: center;
		gap: 8px;
	}

	.settings-button {
		background: transparent;
		border: none;
		color: var(--secondary-text);
		cursor: pointer;
		padding: 8px;
		border-radius: 8px;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s ease;
	}

	.settings-button.active {
		transform: rotate(45deg);
		color: var(--accent-color);
	}

	.settings-button:hover {
		background: rgba(255, 255, 255, 0.1);
		color: var(--primary-text);
		transform: rotate(45deg);
	}

	.stats-container {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 0.5rem 1rem;
		background: rgba(255, 255, 255, 0.05);
		border-radius: 20px;
		font-size: 0.9rem;
	}

	.stat-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.25rem 0.5rem;
		border-radius: 12px;
		background: rgba(0, 0, 0, 0.2);
	}

	.stat-count {
		font-weight: 600;
		color: var(--accent-color);
		min-width: 3em;
		text-align: right;
	}

	.stat-label {
		color: var(--secondary-text);
		font-size: 0.8rem;
	}

	.close-settings {
		background: transparent;
		border: none;
		color: var(--secondary-text);
		font-size: 20px;
		cursor: pointer;
		width: 28px;
		height: 28px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s ease;
		margin-left: 8px;
	}

	.close-settings:hover {
		background: rgba(255, 255, 255, 0.1);
		color: var(--primary-text);
		transform: rotate(90deg);
	}

	.rate-limit-info {
		padding: 10px 25px;
		color: var(--secondary-text);
		font-size: 14px;
	}

	.messages-area {
		flex: 1;
		overflow-y: auto;
		padding: 20px;
		scroll-behavior: smooth;
		height: calc(100% - 140px);
		max-height: 100%;
		scrollbar-width: thin;
		scrollbar-color: var(--accent-color) rgba(0, 0, 0, 0.2);
		width: 100%;
		max-width: 100%;
	}

	.messages-area::-webkit-scrollbar {
		width: 8px;
	}

	.messages-area::-webkit-scrollbar-track {
		background: rgba(0, 0, 0, 0.2);
		border-radius: 4px;
	}

	.messages-area::-webkit-scrollbar-thumb {
		background-color: var(--accent-color);
		border-radius: 4px;
		border: 2px solid transparent;
		background-clip: padding-box;
	}

	.messages-area::-webkit-scrollbar-thumb:hover {
		background-color: #5a8ae8;
	}

	.message {
		margin-bottom: 18px;
		display: flex;
		width: 100%;
		align-items: flex-start;
		gap: 10px;
	}

	.message-user {
		justify-content: flex-end;
		flex-direction: row-reverse;
	}

	.message-user .message-avatar {
		background: linear-gradient(135deg, #1976d2, #1565c0);
	}

	.message-ai {
		justify-content: flex-start;
	}

	.message-system {
		margin: 12px auto;
	}

	.message-avatar {
		width: 35px;
		height: 35px;
		flex-shrink: 0;
		border-radius: 50%;
		background: linear-gradient(135deg, var(--accent-color), #2c4167);
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
		transition: transform 0.2s;
	}

	.message-avatar:hover {
		transform: scale(1.05);
	}

	.avatar-icon {
		width: 20px;
		height: 20px;
		fill: white;
	}

	.message-content {
		padding: 14px 18px;
		border-radius: 10px;
		position: relative;
		display: flex;
		flex-direction: column;
		color: var(--primary-text);
		flex: 1;
		max-width: calc(100% - 50px);
	}

	.message-user .message-content {
		background-color: var(--user-msg-bg);
		border-radius: 10px 2px 10px 10px;
		margin-right: 8px;
	}

	.message-ai .message-content {
		background-color: var(--ai-msg-bg);
		border-radius: 2px 10px 10px 10px;
		margin-left: 8px;
	}

	.message-system .message-content {
		background-color: var(--system-msg-bg);
		border-radius: 10px;
		text-align: center;
	}

	.message-text {
		line-height: 1.5;
		font-size: 15px;
		color: var(--primary-text);
	}

	.message-time {
		font-size: 11px;
		color: var(--secondary-text);
		margin-top: 8px;
		align-self: flex-end;
	}

	.loading-indicator {
		display: flex;
		justify-content: center;
		align-items: center;
		padding: 10px;
	}

	.loading-dot {
		width: 8px;
		height: 8px;
		margin: 0 4px;
		border-radius: 50%;
		background-color: var(--accent-color);
		animation: loading 1.4s infinite ease-in-out;
	}

	.loading-dot:nth-child(1) {
		animation-delay: 0s;
	}

	.loading-dot:nth-child(2) {
		animation-delay: 0.2s;
	}

	.loading-dot:nth-child(3) {
		animation-delay: 0.4s;
	}

	.input-container {
		padding: 20px;
		border-top: 1px solid var(--border-color);
		flex-shrink: 0;
	}

	.code-block {
		background: rgba(0, 0, 0, 0.3);
		border-radius: 8px;
		margin: 8px 0;
		overflow: hidden;
	}

	.code-header {
		position: relative;
		margin-bottom: 4px;
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 8px 12px;
		background: rgba(0, 0, 0, 0.2);
		border-bottom: 1px solid var(--border-color);
	}

	.copy-button {
		background: transparent;
		border: none;
		color: var(--secondary-text);
		cursor: pointer;
		padding: 4px;
		border-radius: 4px;
		display: flex;
		align-items: center;
		gap: 4px;
		transition: all 0.2s;
		position: relative;
	}

	.copy-button:hover {
		background: rgba(255, 255, 255, 0.1);
		color: var(--primary-text);
	}

	.copy-tooltip {
		position: absolute;
		right: 0;
		bottom: -30px;
		background: var(--accent-color);
		color: white;
		padding: 4px 8px;
		border-radius: 4px;
		font-size: 12px;
		animation: fadeInUp 0.2s ease-in-out;
		z-index: 10;
	}

	@keyframes fadeInUp {
		from {
			opacity: 0;
			transform: translateY(-5px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	pre {
		margin: 0;
		padding: 12px;
		overflow-x: auto;
	}

	code {
		font-family: 'Fira Code', monospace;
		font-size: 14px;
		line-height: 1.5;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(5px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@media (max-width: 768px) {
		.message {
			max-width: 95%;
		}
	}

	@keyframes loading {
		0%,
		80%,
		100% {
			transform: scale(0);
			opacity: 0.5;
		}
		40% {
			transform: scale(1);
			opacity: 1;
		}
	}
</style>
