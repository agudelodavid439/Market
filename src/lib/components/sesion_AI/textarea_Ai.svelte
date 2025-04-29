<script>
	import { createEventDispatcher } from 'svelte';
	import TokenCounter from './TokenCounter.svelte';

	const dispatch = createEventDispatcher();
	export let currentMessage = '';
	export let isLoading = false;

	function handleTextareaSubmit() {
		if (currentMessage.trim()) {
			dispatch('submit', { message: currentMessage.trim() });
			currentMessage = '';
		}
	}

	function handleKeydown(event) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			handleTextareaSubmit();
		}
	}
</script>

<div class="textarea-container">
	<TokenCounter text={currentMessage} />
	<form on:submit|preventDefault={handleTextareaSubmit} class="input-form">
		<div class="input-wrapper">
			<textarea
				bind:value={currentMessage}
				on:keydown={handleKeydown}
				placeholder="Escriba su mensaje..."
				disabled={isLoading}
				rows="1"
				class="textarea-input"
			></textarea>
			<button type="submit" class="send-button" disabled={isLoading || !currentMessage.trim()}>
				{#if isLoading}
					<span class="loading">•••</span>
				{:else}
					→
				{/if}
			</button>
		</div>
	</form>
</div>

<style>
	.textarea-container {
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: 8px;
		padding: 12px;
		background: var(--input-bg);
		border-radius: 12px;
		border: 1px solid var(--border-color);
	}

	.input-form {
		width: 100%;
	}

	.input-wrapper {
		display: flex;
		align-items: flex-end; /* Mantiene el botón alineado en la parte inferior */
		gap: 8px;
		width: 100%;
		align-self: flex-end; /* Asegura que todo el wrapper se alinee abajo */
	}

	.textarea-input {
		flex: 1;
		min-height: 40px;
		max-height: 150px;
		background: transparent;
		border: none;
		color: var(--primary-text);
		font-size: 15px;
		font-family: inherit;
		resize: none;
		padding: 8px;
		line-height: 1.5;
		overflow-y: auto;
		vertical-align: bottom; /* Alinea el texto en la parte inferior */
		align-self: flex-end; /* Asegura que el crecimiento sea hacia abajo */
		transition: height 0.2s ease; /* Suaviza la transición de altura */
	}

	.textarea-input:focus {
		outline: none;
	}

	.send-button {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		background-color: var(--accent-color);
		border: none;
		color: white;
		font-size: 20px;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: all 0.2s;
	}

	.send-button:hover:not(:disabled) {
		transform: scale(1.05);
		background-color: #5a8ae8;
	}

	.send-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.loading {
		animation: pulse 1.5s infinite;
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 0.5;
		}
		50% {
			opacity: 1;
		}
	}
</style>
