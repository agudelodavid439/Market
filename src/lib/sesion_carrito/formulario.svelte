<script lang="ts">
	import { productosEnCarrito } from '$lib/stores/carritoTienda';
	export let formularioVisible: boolean;
	export let toggleFormulario: () => void;

	let formData = {
		nombre: '',
		celular: '',
		direccion: '',
		metodoPago: '',
	};

	let metodoPagoAbierto = false;
	const toggleMetodoPago = () => {
		metodoPagoAbierto = !metodoPagoAbierto;
	};

	function handleFormChange(e: Event) {
		const target = e.target as HTMLInputElement;
		formData[target.name as keyof typeof formData] = target.value;
	}

	function selectMetodoPago(metodo: string) {
		formData.metodoPago = metodo;
		metodoPagoAbierto = false;
	}

	function handleSubmit(e: Event) {
		e.preventDefault();

		const formValues = {
			nombre: formData.nombre.trim(),
			celular: formData.celular.trim(),
			direccion: formData.direccion.trim(),
			metodoPago: formData.metodoPago,
		};

		if (!formValues.nombre || !formValues.celular || !formValues.direccion) {
			alert('Por favor completa todos los campos obligatorios.');
			return;
		}

		const submitData = {
			pedido: {
				numero_orden: `ORD${Date.now()}`,
				nombre_cliente: formValues.nombre,
				telefono: formValues.celular,
				direccion: formValues.direccion,
				metodo_pago: formValues.metodoPago,
				estado: 'pendiente',
				cantidad_productos: 0,
			},
			items: $productosEnCarrito,
		};

		console.log('Datos del pedido:', submitData);
	}
</script>

<div class="contenedor-formulario" class:expandido={formularioVisible}>
	{#if formularioVisible}
		<form class="formulario-pago" on:submit={handleSubmit}>
			<div class="header-formulario">
				<svg
					viewBox="0 0 24 24"
					width="24"
					height="24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M9 2h6a2 2 0 0 1 2 2v16l-3-2-3 2-3-2-3 2V4a2 2 0 0 1 2-2zM9 7h6M9 11h6M9 15h4"
					/>
				</svg>

				<h4>Datos de Envío</h4>

				<button type="button" class="cerrar-formulario" on:click={toggleFormulario}>
					<svg
						viewBox="0 0 24 24"
						width="24"
						height="24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<path d="M18 6L6 18M6 6l12 12" stroke-linecap="round" stroke-linejoin="round" />
					</svg>
				</button>
			</div>
			<div class="campos-formulario">
				<div class="campo-con-icono">
					<div class="icono">
						<svg
							viewBox="0 0 24 24"
							width="20"
							height="20"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
							<circle cx="12" cy="7" r="4" />
						</svg>
					</div>
					<input
						type="text"
						name="nombre"
						bind:value={formData.nombre}
						on:input={handleFormChange}
						placeholder="Nombre"
						required
						style="color: black;"
					/>
				</div>

				<div class="campo-con-icono">
					<div class="icono">
						<svg
							viewBox="0 0 24 24"
							width="20"
							height="20"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<path
								d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"
							/>
						</svg>
					</div>
					<input
						type="tel"
						name="celular"
						bind:value={formData.celular}
						on:input={handleFormChange}
						placeholder="Celular"
						required
					/>
				</div>

				<div class="campo-con-icono">
					<div class="icono">
						<svg
							viewBox="0 0 24 24"
							width="20"
							height="20"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z" />
							<circle cx="12" cy="10" r="3" />
						</svg>
					</div>
					<input
						type="text"
						name="direccion"
						bind:value={formData.direccion}
						placeholder="Dirección de Envío"
						required
					/>
				</div>

				<div class="campo-con-icono metodo-pago-container">
					<div class="icono">
						<svg
							viewBox="0 0 24 24"
							width="20"
							height="20"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
							<line x1="1" y1="10" x2="23" y2="10" />
						</svg>
					</div>
					<div class="metodo-pago-selector" on:click={toggleMetodoPago}>
						<span class="metodo-pago-placeholder">
							{formData.metodoPago
								? formData.metodoPago.charAt(0).toUpperCase() + formData.metodoPago.slice(1)
								: 'Método de pago'}
						</span>
						<svg
							class="dropdown-icon"
							class:activo={metodoPagoAbierto}
							viewBox="0 0 24 24"
							width="18"
							height="18"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<polyline points="6 9 12 15 18 9" />
						</svg>
					</div>

					{#if metodoPagoAbierto}
						<div class="opciones-metodo-pago">
							<div class="opciones-scroll">
								<div class="opcion-metodo" on:click={() => selectMetodoPago('efectivo')}>
									<svg
										viewBox="0 0 24 24"
										width="18"
										height="18"
										fill="none"
										stroke="currentColor"
										stroke-width="2"
									>
										<rect x="2" y="4" width="20" height="16" rx="2" />
										<line x1="12" y1="4" x2="12" y2="20" />
									</svg>
									<span>Efectivo</span>
								</div>
								<div class="opcion-metodo" on:click={() => selectMetodoPago('datafono')}>
									<svg
										viewBox="0 0 24 24"
										width="18"
										height="18"
										fill="none"
										stroke="currentColor"
										stroke-width="2"
									>
										<rect x="4" y="4" width="16" height="12" rx="2" />
										<line x1="4" y1="12" x2="20" y2="12" />
										<line x1="12" y1="18" x2="12" y2="22" />
										<line x1="8" y1="22" x2="16" y2="22" />
									</svg>
									<span>Datafono</span>
								</div>
								<div class="opcion-metodo" on:click={() => selectMetodoPago('nequi')}>
									<svg
										viewBox="0 0 24 24"
										width="18"
										height="18"
										fill="none"
										stroke="currentColor"
										stroke-width="2"
									>
										<rect x="5" y="2" width="14" height="20" rx="2" />
										<circle cx="12" cy="18" r="1" />
										<line x1="8" y1="6" x2="16" y2="6" />
									</svg>
									<span>Nequi</span>
								</div>
								<div class="opcion-metodo" on:click={() => selectMetodoPago('daviplata')}>
									<svg
										viewBox="0 0 24 24"
										width="18"
										height="18"
										fill="none"
										stroke="currentColor"
										stroke-width="2"
									>
										<path
											d="M5 5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5z"
										/>
										<path d="M12 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />
										<path d="M8 8h8" />
									</svg>
									<span>Daviplata</span>
								</div>
								<div class="opcion-metodo" on:click={() => selectMetodoPago('bancolombia')}>
									<svg
										viewBox="0 0 24 24"
										width="18"
										height="18"
										fill="none"
										stroke="currentColor"
										stroke-width="2"
									>
										<rect x="3" y="3" width="18" height="18" rx="2" />
										<path d="M8 7h8M8 12h8M8 17h5" />
									</svg>
									<span>Bancolombia</span>
								</div>
								<div class="opcion-metodo" on:click={() => selectMetodoPago('paypal')}>
									<svg
										viewBox="0 0 24 24"
										width="18"
										height="18"
										fill="none"
										stroke="currentColor"
										stroke-width="2"
									>
										<path d="M7 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
										<path d="M17 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" />
									</svg>
									<span>Paypal</span>
								</div>
								<div class="opcion-metodo" on:click={() => selectMetodoPago('stripe')}>
									<svg
										viewBox="0 0 24 24"
										width="18"
										height="18"
										fill="none"
										stroke="currentColor"
										stroke-width="2"
									>
										<path d="M2 12 L22 12" />
										<path d="M6 8 L18 8" />
										<path d="M6 16 L18 16" />
									</svg>
									<span>Stripe</span>
								</div>
								<div class="opcion-metodo" on:click={() => selectMetodoPago('tarjeta')}>
									<svg
										viewBox="0 0 24 24"
										width="18"
										height="18"
										fill="none"
										stroke="currentColor"
										stroke-width="2"
									>
										<rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
										<line x1="1" y1="10" x2="23" y2="10" />
									</svg>
									<span>Tarjeta</span>
								</div>
								<div class="opcion-metodo" on:click={() => selectMetodoPago('transferencia')}>
									<svg
										viewBox="0 0 24 24"
										width="18"
										height="18"
										fill="none"
										stroke="currentColor"
										stroke-width="2"
									>
										<path d="M8 3v3a2 2 0 0 1-2 2H3" />
										<path d="M16 21v-3a2 2 0 0 1 2-2h3" />
										<path d="M21 8h-3a2 2 0 0 1-2-2V3" />
										<path d="M3 16h3a2 2 0 0 1 2 2v3" />
										<line x1="16" y1="8" x2="8" y2="16" />
									</svg>
									<span>Transferencia</span>
								</div>
							</div>
						</div>
					{/if}
				</div>
			</div>

			<div class="footer-formulario">
				<button type="submit" class="boton-finalizar">
					<svg
						viewBox="0 0 24 24"
						width="20"
						height="20"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<path d="M5 12h14" />
						<path d="M12 5l7 7-7 7" />
					</svg>
					<span>Finalizar</span>
				</button>
			</div>
		</form>
	{/if}
</div>

<style>
	.contenedor-formulario {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		background: linear-gradient(90deg, #0a2342, #18386b);
		max-height: 0;
		overflow: hidden;
		transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
		border-radius: 12px;
		box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.1);
		z-index: 10;
	}

	.contenedor-formulario.expandido {
		max-height: calc(100% - 80px);
		transform: translateY(-20px);
		display: flex;
		flex-direction: column;
	}

	.formulario-pago {
		display: flex;
		flex-direction: column;
		height: 100%;
		position: relative;
		/* Eliminado el overflow:hidden para permitir que se vea el botón */
	}

	.header-formulario {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: flex-start;
		padding: 1rem;
		background: linear-gradient(180deg, #14213d 0%, #1e3a5f 30%, rgb(0, 0, 0) 60%, #0a1929 100%);
		color: white;
		border-radius: 12px 12px 0 0;
		width: 100%;
		margin: -15px -15px 15px -15px;
		padding: 15px 20px;
		width: calc(100% + 30px);
		box-sizing: border-box;
		position: sticky;
		top: 0;
		z-index: 11;
	}

	.header-formulario svg {
		margin-right: 10px;
	}

	.header-formulario h4 {
		font-size: 1.5rem;
		text-align: center;
	}

	.header-formulario .cerrar-formulario {
		position: static;
		margin-left: auto;
		background: none;
		border: none;
		color: white;
		cursor: pointer;
		padding: 5px;
		opacity: 0.9;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.cerrar-formulario:hover {
		color: #e0e0e0;
		transform: scale(1.1);
	}

	.campos-formulario {
		flex: 1;
		overflow-y: auto;
		overflow-x: hidden;
		padding: 1rem;
		scrollbar-width: thin;
		scrollbar-color: #123986 #f0f0f0;
		-webkit-overflow-scrolling: touch;
		max-height: calc(100vh - 150px); /* Ajustado para mejor visibilidad */
		padding-bottom: 2rem; /* Añadido más espacio en la parte inferior */
	}

	.campos-formulario::-webkit-scrollbar {
		width: 6px;
	}

	.campos-formulario::-webkit-scrollbar-track {
		background: #e1dddd;
	}

	.campos-formulario::-webkit-scrollbar-thumb {
		border-radius: 6px;
	}

	.campo-con-icono {
		display: flex;
		align-items: center;
		gap: 1rem;
		background: #e1dddd;
		padding: 0.8rem;
		border-radius: 8px;
		margin-bottom: 1rem;
		transition: all 0.2s ease;
		position: relative;
	}

	.campo-con-icono:hover {
		background: #f0f0f0;
		transform: translateY(-1px);
	}

	.icono {
		display: flex;
		align-items: center;
		justify-content: center;
		min-width: 40px;
		color: #2ecc71;
	}

	.campo-con-icono input {
		flex: 1;
		border: none;
		background: transparent;
		padding: 0.5rem;
		font-size: 1rem;
		outline: none;
		color: #494848;
	}

	.campo-con-icono input::placeholder {
		color: #807e7e;
	}

	/* Nuevo estilo para el selector de método de pago */
	.metodo-pago-container {
		position: relative;
	}

	.metodo-pago-selector {
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex: 1;
		cursor: pointer;
		padding: 0.5rem;
		font-size: 1rem;
		color: #201f1f;
	}

	.metodo-pago-placeholder {
		color: #201f1f;
	}

	.dropdown-icon {
		transition: transform 0.3s ease;
	}

	.dropdown-icon.activo {
		transform: rotate(180deg);
	}

	.opciones-metodo-pago {
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		background: white;
		border-radius: 0 0 8px 8px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
		z-index: 12;
		max-height: 0;
		animation: expandir 0.3s forwards;
		overflow: hidden;
	}

	@keyframes expandir {
		to {
			max-height: 300px;
		}
	}

	.opciones-scroll {
		max-height: 250px;
		overflow-y: auto;
		padding: 0.5rem;
		scrollbar-width: thin;
		scrollbar-color: #0a4d68 #f0f0f0;
	}

	.opciones-scroll::-webkit-scrollbar {
		width: 4px;
	}

	.opciones-scroll::-webkit-scrollbar-track {
		background: #f0f0f0;
	}

	.opciones-scroll::-webkit-scrollbar-thumb {
		background-color: #0a4d68;
		border-radius: 4px;
	}

	.opcion-metodo {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.7rem;
		cursor: pointer;
		transition: background 0.2s;
		border-radius: 4px;
	}

	.opcion-metodo:hover {
		background: #f0f0f0;
	}

	.opcion-metodo svg {
		color: #2ecc71;
	}

	/* Footer y botón finalizar */
	.footer-formulario {
		position: sticky; /* Cambiado de absolute a sticky */
		bottom: 0;
		left: 0;
		right: 0;
		display: flex;
		justify-content: center;
		padding: 1rem;
		background: linear-gradient(90deg, #0a2342, #18386b);
		border-top: 1px solid rgba(255, 255, 255, 0.1);
		z-index: 20; /* Incrementado para asegurar que esté encima de todo */
		margin-top: auto; /* Hace que se pegue al fondo del contenedor */
	}

	.boton-finalizar {
		width: auto;
		min-width: 150px;
		padding: 0.75rem 1.5rem;
		background-color: #2e8b57;
		color: white;
		border: none;
		border-radius: 15px;
		font-size: 1.2rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.3s ease;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	}

	.boton-finalizar:hover {
		background: #27ae60;
		transform: translateY(-2px);
		box-shadow: 0 6px 8px rgba(0, 0, 0, 0.15);
	}

	.boton-finalizar:active {
		transform: translateY(0);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	@media (max-width: 480px) {
		.contenedor-formulario.expandido {
			max-height: 90vh;
			height: 90vh;
			position: fixed;
			top: 5vh;
			transform: none;
		}

		.campos-formulario {
			padding: 1rem;
			-webkit-overflow-scrolling: touch;
			max-height: calc(100vh - 200px);
		}

		.header-formulario {
			position: sticky;
			top: 0;
			margin: 0;
			border-radius: 0;
		}

		.footer-formulario {
			position: sticky; /* Mantiene la consistencia con la versión de PC */
			bottom: 0;
			left: 0;
			right: 0;
		}
	}
	/* Hacer siempre visible el scrollbar en PC */
	@media (min-width: 481px) {
		.campos-formulario {
			overflow-y: scroll;
		}
	}
</style>
