<script>
	import { writable } from 'svelte/store';
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	// Store para los prompts personalizados
	export const promptStore = writable({
		currentMode: 'default',
		prompts: {
			default: {
				name: 'Por defecto',
				systemPrompt: `SISTEMA: Eres un experto analizador y diseñador de código.
                
                ESTRUCTURA DE RESPUESTA REQUERIDA:
                1. EXPLICACIÓN
                - Análisis claro y conciso del código
                - Propósito y funcionamiento
                - Contexto de implementación`,
				active: true,
			},
			programmer: {
				name: 'Programador Senior',
				systemPrompt: `SISTEMA: Eres un programador senior con 15 años de experiencia.
                Enfócate en patrones de diseño, optimización y mejores prácticas.`,
				active: false,
			},
			teacher: {
				name: 'Profesor de Programación',
				systemPrompt: `SISTEMA: Eres un profesor de programación.
                Explica detalladamente cada concepto y proporciona ejemplos didácticos.`,
				active: false,
			},
		},
	});

	let newPromptName = '';
	let newPromptContent = '';
	let editingPrompt = null;

	function addNewPrompt() {
		if (!newPromptName || !newPromptContent) return;

		$promptStore.prompts = {
			...$promptStore.prompts,
			[newPromptName.toLowerCase()]: {
				name: newPromptName,
				systemPrompt: newPromptContent,
				active: false,
			},
		};

		newPromptName = '';
		newPromptContent = '';
	}

	function setActivePrompt(key) {
		$promptStore.currentMode = key;
		Object.keys($promptStore.prompts).forEach(k => {
			$promptStore.prompts[k].active = k === key;
		});
	}
</script>

<div class="settings-panel">
	<div class="settings-header">
		<h2>Ajustes de Prompts</h2>
		<button class="close-button" on:click={() => dispatch('close')}> × </button>
	</div>

	<div class="prompts-list">
		{#each Object.entries($promptStore.prompts) as [key, prompt]}
			<div class="prompt-item {prompt.active ? 'active' : ''}">
				<div class="prompt-header">
					<h3>{prompt.name}</h3>
					<button class="activate-btn" on:click={() => setActivePrompt(key)}>
						{prompt.active ? '✓ Activo' : 'Activar'}
					</button>
				</div>
				<div class="prompt-content">
					<textarea
						value={prompt.systemPrompt}
						on:input={e => {
							$promptStore.prompts[key].systemPrompt = e.target.value;
						}}
					/>
				</div>
			</div>
		{/each}
	</div>

	<div class="add-new-prompt">
		<h3>Agregar Nuevo Prompt</h3>
		<input type="text" placeholder="Nombre del prompt" bind:value={newPromptName} />
		<textarea placeholder="Contenido del prompt..." bind:value={newPromptContent} />
		<button on:click={addNewPrompt}>Agregar Prompt</button>
	</div>
</div>

<style>
	.settings-panel {
		height: 100%;
		overflow-y: auto;
		padding: 20px;
		background: inherit;
		border-radius: 8px;
		max-width: 800px;
		margin: 0 auto;
	}

	.settings-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 20px;
	}

	.close-button {
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

	.close-button:hover {
		background: rgba(255, 255, 255, 0.1);
		color: var(--primary-text);
		transform: rotate(90deg);
	}

	.prompts-list {
		display: grid;
		gap: 20px;
		margin: 20px 0;
	}

	.prompt-item {
		background: rgba(255, 255, 255, 0.05);
		border-radius: 8px;
		padding: 15px;
		transition: all 0.3s ease;
	}

	.prompt-item.active {
		border: 1px solid var(--accent-color);
		background: rgba(77, 132, 230, 0.1);
	}

	.prompt-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 10px;
	}

	textarea {
		width: 100%;
		min-height: 150px;
		background: rgba(0, 0, 0, 0.2);
		border: 1px solid var(--border-color);
		border-radius: 4px;
		padding: 10px;
		color: var(--primary-text);
		font-family: 'Fira Code', monospace;
		resize: vertical;
	}

	button {
		background: var(--accent-color);
		border: none;
		padding: 8px 16px;
		border-radius: 4px;
		color: white;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	button:hover {
		background: var(--accent-color-hover);
	}

	.add-new-prompt {
		margin-top: 30px;
		padding-top: 20px;
		border-top: 1px solid var(--border-color);
	}

	input {
		width: 100%;
		padding: 8px;
		margin-bottom: 10px;
		background: rgba(0, 0, 0, 0.2);
		border: 1px solid var(--border-color);
		border-radius: 4px;
		color: var(--primary-text);
	}
</style>
