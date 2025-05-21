<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { promptStore, actualizarEstadoPrompts } from '$lib/stores/promptStore.js';

	const dispatch = createEventDispatcher();

	let nuevoNombrePrompt = '';
	let nuevoContenidoPrompt = '';
	let promptEnEdicion = null;

	// Al cargar el componente, recuperar el prompt activo del localStorage
	function consultarStorage() {
		const promptActivo = localStorage.getItem('activePrompt');
		if (promptActivo) {
			$promptStore.currentMode = promptActivo; // Establecer el prompt activo
			// Actualiza el estado de 'active' para todos los prompts
			Object.keys($promptStore.prompts).forEach(k => {
				$promptStore.prompts[k].active = k === promptActivo; // Marca el prompt activo
			});
		}
	}

	// Llama a la función de consulta al abrir el modal
	consultarStorage();

	function agregarNuevoPrompt() {
		if (!nuevoNombrePrompt || !nuevoContenidoPrompt) return;

		$promptStore.prompts = {
			...$promptStore.prompts,
			[nuevoNombrePrompt.toLowerCase()]: {
				name: nuevoNombrePrompt,
				systemPrompt: nuevoContenidoPrompt,
				active: false,
			},
		};

		nuevoNombrePrompt = '';
		nuevoContenidoPrompt = '';
	}

	function establecerPromptActivo(key) {
		// Cambia el modo actual al prompt seleccionado
		$promptStore.currentMode = key;

		// Crear un objeto con el nuevo estado
		const nuevoEstado = {};
		Object.keys($promptStore.prompts).forEach(k => {
			nuevoEstado[k] = k === key; // true para el prompt activo, false para los demás
		});

		// Llama a la función para actualizar el estado de los prompts
		const resultado = actualizarEstadoPrompts(nuevoEstado);

		// Verificar el resultado y mostrar el mensaje en la consola
		if (resultado.success) {
			console.log('Estado actualizado con éxito:', resultado.prompts);
		} else {
			console.error('Error al actualizar el estado:', resultado.message);
		}

		// Guarda el prompt activo en localStorage
		localStorage.setItem('activePrompt', key);

		// Muestra un mensaje en la consola indicando que se ha guardado
		console.log('Guardado en storage:', key);

		// Muestra el estado actualizado de los prompts en la consola
		console.log('Estado de los prompts:', JSON.stringify($promptStore.prompts, null, 2));
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
					<button
						class="activate-btn {prompt.active ? 'active' : ''}"
						on:click={() => establecerPromptActivo(key)}
					>
						{prompt.active ? '✓ Activo' : 'Activar'}
					</button>
					<button class="save-btn">Guardar</button>
				</div>
				<div class="prompt-content">
					<textarea
						value={prompt.systemPrompt}
						on:input={e => {
							if (e.target) {
								$promptStore.prompts[key].systemPrompt = (e.target as HTMLTextAreaElement).value;
							}
						}}
					/>
				</div>
			</div>
		{/each}
	</div>

	<div class="add-new-prompt">
		<h3>Agregar Nuevo Prompt</h3>
		<input type="text" placeholder="Nombre del prompt" bind:value={nuevoNombrePrompt} />
		<textarea placeholder="Contenido del prompt..." bind:value={nuevoContenidoPrompt} />
		<button on:click={agregarNuevoPrompt}>Agregar Prompt</button>
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

	.activate-btn {
		background: rgba(14, 39, 129, 0.636); /* Color rojo para el botón "Activar" */
		border: none;
		padding: 8px 16px;
		border-radius: 4px;
		color: white;
		cursor: pointer;
		transition: all 0.2s ease;
		margin-right: -70px; /* Espaciado a la derecha para separar del botón "Guardar" */
	}

	.activate-btn:hover {
		background: #006400; /* Color verde oscuro al pasar el mouse */
	}

	.activate-btn.active {
		background: #006400; /* Color verde oscuro cuando está activado */
	}

	.save-btn {
		background: #006400; /* Color verde oscuro para el botón "Guardar" */
		border: none;
		padding: 8px 16px;
		border-radius: 4px;
		color: white;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.save-btn:hover {
		background: #004d00; /* Color más oscuro al pasar el mouse */
	}
</style>
