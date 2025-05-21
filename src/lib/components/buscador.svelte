<script lang="ts">
	import { terminoBusqueda } from '$lib/stores/buscadorStore';

	let isFocused = false;

	// Actualizar el store cuando cambie el valor del input
	function handleInput(event: Event) {
		const target = event.target as HTMLInputElement;
		$terminoBusqueda = target.value;
	}
</script>

<div class="search-container">
	<div class={`search-box ${isFocused ? 'search-box-focused' : ''}`}>
		<input
			type="text"
			placeholder="Buscar productos..."
			value={$terminoBusqueda}
			on:input={handleInput}
			on:focus={() => (isFocused = true)}
			on:blur={() => (isFocused = false)}
			class="search-input"
		/>
		<button class="search-button">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="20"
				height="20"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2.5"
				stroke-linecap="round"
				stroke-linejoin="round"
				class="search-icon"
			>
				<circle cx="11" cy="11" r="8" />
				<line x1="20" y1="20" x2="16.65" y2="16.65" />
			</svg>
		</button>
	</div>
</div>

<style>
	.search-container {
		display: flex;
		justify-content: center;
		align-items: center;
		padding: 0;
		width: 100%;
	}

	.search-box {
		display: flex;
		align-items: center;
		width: 100%;
		max-width: none;
		border-radius: 50px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		background-color: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(173, 216, 230, 0.3);
		padding: 2px;
		transition:
			border-color 0.3s ease,
			box-shadow 0.3s ease;
		overflow: hidden;
	}

	.search-box-focused {
		border-color: #60a5fa;
		box-shadow: 0 0 0 2px rgba(96, 165, 250, 0.3);
	}

	.search-input {
		flex: 1;
		border: none;
		padding: 8px 12px;
		font-size: 1rem;
		border-radius: 50px;
		outline: none;
		background-color: transparent;
		color: white;
	}

	.search-input::placeholder {
		color: rgba(255, 255, 255, 0.7);
	}

	.search-button {
		border: none;
		padding: 8px 12px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50px;
		background-color: #007bff;
		color: white;
		cursor: pointer;
		transition: background-color 0.3s ease;
	}

	.search-button:hover {
		background-color: #0056b3;
		background: linear-gradient(135deg, #0056b3, #0086b3);
	}

	.search-icon {
		width: 18px;
		height: 18px;
		color: white;
	}
</style>
