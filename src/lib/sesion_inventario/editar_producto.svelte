<script>
	import { onMount, createEventDispatcher } from 'svelte';
	import {
		obtenerProductoPorId,
		actualizarProducto,
		eliminarProductoPorId,
	} from '$lib/conexion_products';
	import { supabase } from '$lib/supabaseClient';

	const dispatch = createEventDispatcher();

	export let productoId = null;
	export let producto = {
		id: '',
		col_nombre: '',
		col_tipo: '',
		col_precio_compra: 0,
		col_precio_puerta: 0,
		col_precio_puerta11: 0,
		col_precio_domicilio: 0,
		col_precio_domicilio11: 0,
		col_stock: 0,
		col_estado: '',
		col_descripcion: '',
		col_imagen: '',
	};

	let cargando = false;
	let cargandoDatos = false;
	let error = '';
	let exito = '';
	let mostrarMensajeExito = false;

	onMount(async () => {
		if (productoId) {
			try {
				cargandoDatos = true;
				const { data, error: err } = await obtenerProductoPorId(productoId);
				if (err) throw err;
				producto = { ...producto, ...data };
			} catch (e) {
				error = e.message || 'Error al cargar el producto';
			} finally {
				cargandoDatos = false;
			}
		}
	});

	function generarIdCorto() {
		return Math.floor(10000000 + Math.random() * 90000000); // ID de 8 dígitos
	}

	function limpiarNumeros(producto) {
		if (producto.col_precio_compra)
			producto.col_precio_compra = parseFloat(
				producto.col_precio_compra.toString().replace(/[^0-9.-]+/g, '')
			);
		if (producto.col_precio_puerta)
			producto.col_precio_puerta = parseFloat(
				producto.col_precio_puerta.toString().replace(/[^0-9.-]+/g, '')
			);
		if (producto.col_precio_domicilio)
			producto.col_precio_domicilio = parseFloat(
				producto.col_precio_domicilio.toString().replace(/[^0-9.-]+/g, '')
			);
		if (producto.col_precio_puerta11)
			producto.col_precio_puerta11 = parseFloat(
				producto.col_precio_puerta11.toString().replace(/[^0-9.-]+/g, '')
			);
		if (producto.col_precio_domicilio11)
			producto.col_precio_domicilio11 = parseFloat(
				producto.col_precio_domicilio11.toString().replace(/[^0-9.-]+/g, '')
			);
		if (producto.col_stock)
			producto.col_stock = parseInt(producto.col_stock.toString().replace(/[^0-9]+/g, ''));
		return producto;
	}

	async function handleEliminarProducto() {
		if (!producto.id) return;
		if (!confirm('¿Estás seguro de que deseas eliminar este producto?')) return;
		cargando = true;
		error = '';
		exito = '';
		try {
			const { error: deleteError } = await eliminarProductoPorId(producto.id);
			if (deleteError) throw new Error(deleteError.message || 'Error al eliminar');
			exito = '🗑️ Producto eliminado correctamente.';
			dispatch('eliminado', producto.id); // Notifica al padre para que sincronice la lista
		} catch (e) {
			error = e.message || 'Error al eliminar producto';
		} finally {
			cargando = false;
		}
	}

	async function guardarProducto() {
		cargando = true;
		error = '';
		exito = '';
		mostrarMensajeExito = false;

		try {
			if (!producto.col_nombre || !producto.col_precio_compra || !producto.col_stock) {
				throw new Error('Nombre, precio_compra y Stock son obligatorios.');
			}

			// Generar ID temporal si no existe aún
			let idTemporal = false;
			if (!producto.id) {
				producto.id = generarIdCorto(); // generar ID si es nuevo
				idTemporal = true;
			}

			const datosLimpios = limpiarNumeros(producto);
			let respuesta;

			// Verificar si ya existe un producto con ese ID
			const { data: existe, error: errorExistencia } = await supabase
				.from('products')
				.select('id')
				.eq('id', producto.id)
				.maybeSingle(); // Usa maybeSingle para comprobar si el producto ya existe

			if (existe) {
				console.log('Actualizando producto...');
				respuesta = await actualizarProducto(producto.id, datosLimpios); // Actualiza
			} else {
				console.log('Insertando nuevo producto...');
				const { data, error } = await supabase
					.from('products')
					.insert([datosLimpios])
					.select()
					.single(); // Garantiza que se devuelva un solo producto

				if (error) throw error;

				// Reemplazar producto.id temporal por el real
				if (data && idTemporal) {
					producto.id = data.id;
				}

				respuesta = { data, error: null };
			}

			if (respuesta.error) throw respuesta.error;

			exito = '✅ ¡Producto Guardado!';
			mostrarMensajeExito = true;
			dispatch('guardado', producto); // Notificar al componente padre con el producto ya ajustado

			setTimeout(() => {
				mostrarMensajeExito = false;
			}, 5000);
		} catch (e) {
			error = e.message || 'Error al guardar.';
			dispatch('error', { message: error });
		} finally {
			cargando = false;
		}
	}
</script>

<div class="popup">
	<div class="popup-header">
		<h1>{producto.id ? 'Editar Producto' : 'Nuevo Producto'}</h1>

		{#if mostrarMensajeExito}
			<p class="mensaje-exito">{exito}</p>
		{/if}

		<div class="popup-actions popup-actions-row">
			{#if producto.id}
				<button
					type="button"
					class="btn eliminar icon-action"
					on:click={handleEliminarProducto}
					disabled={cargando}
					title="procede con precaución"
				>
					<div class="icon-img bordered red">
						<svg
							width="50"
							height="50"
							viewBox="0 0 50 50"
							fill="none"
							aria-hidden="true"
							focusable="false"
						>
							<rect
								x="12"
								y="18"
								width="26"
								height="22"
								rx="3"
								fill="#e53935"
								stroke="#b71c1c"
								stroke-width="2"
							/>
							<rect
								x="19"
								y="12"
								width="12"
								height="6"
								rx="2"
								fill="#e53935"
								stroke="#b71c1c"
								stroke-width="2"
							/>
							<rect x="16" y="10" width="18" height="4" rx="2" fill="#b71c1c" />
							<line
								x1="20"
								y1="23"
								x2="20"
								y2="36"
								stroke="#fff"
								stroke-width="2.2"
								stroke-linecap="round"
							/>
							<line
								x1="25"
								y1="23"
								x2="25"
								y2="36"
								stroke="#fff"
								stroke-width="2.2"
								stroke-linecap="round"
							/>
							<line
								x1="30"
								y1="23"
								x2="30"
								y2="36"
								stroke="#fff"
								stroke-width="2.2"
								stroke-linecap="round"
							/>
						</svg>
					</div>
					<span class="icon-tooltip">Eliminar</span>
				</button>
			{/if}

			<button
				type="button"
				class="guardar-png-btn"
				on:click={guardarProducto}
				disabled={cargando}
				aria-label="Guardar"
			>
				{#if cargando}
					<span class="spinner"></span>
				{:else}
					<img src="/boton_save.png" alt="Guardar" width="50" height="50" />
				{/if}
				<span class="guardar-label">Guardar</span>
			</button>

			<style>
				.guardar-png-btn {
					background: none;
					border: none;
					margin: 0;
					padding: 0;
					box-shadow: none;
					display: flex;
					flex-direction: column;
					align-items: center;
					justify-content: center;
				}
				.guardar-png-btn:disabled {
					opacity: 0.5;
				}
				.guardar-label {
					display: block;
					font-size: 0.78rem;
					color: #fff;
					text-align: center;
					margin-top: -10px;
					font-weight: 400;
					letter-spacing: 0.01em;
				}
			</style>
			<button
				type="button"
				class="cerrar-btn"
				on:click={() => dispatch('cancelar')}
				disabled={cargando}
				aria-label="Cerrar"
			>
				<svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true" focusable="false">
					<line x1="12" y1="12" x2="28" y2="28" stroke="white" stroke-width="3" />
					<line x1="28" y1="12" x2="12" y2="28" stroke="white" stroke-width="3" />
				</svg>
				<span class="icon-tooltip">Cerrar</span>
			</button>
		</div>
	</div>

	{#if cargandoDatos}
		<div class="alert info">Cargando producto...</div>
	{:else if error}
		<div class="alert error">{error}</div>
	{/if}

	<form class="popup-body">
		{#if producto.col_imagen}
			<div class="imagen-fondo">
				<img src={producto.col_imagen} alt="Imagen producto" />
			</div>
		{/if}

		<div class="grid">
			<div>
				<label><i class="fas fa-tag"></i> Nombre</label>
				<input type="text" bind:value={producto.col_nombre} required />
			</div>

			<div>
				<label><i class="fas fa-cogs"></i> Categoría</label>
				<select bind:value={producto.col_tipo} required>
					<option value="">Seleccionar categoría</option>
					<option value="Ron">ron</option>
					<option value="Aguardiente">Aguardiente</option>
					<option value="Cerveza">Cerveza</option>
					<option value="Whisky">Whisky</option>
					<option value="Gaseosa">Gaseosa</option>
					<option value="Cigarrillos">Cigarrillos</option>
					<option value="Snack">Snack</option>
					<option value="Vodka">Vodka</option>
					<option value="Tequila">Tequila</option>
				</select>
			</div>

			<div class="input-icon">
				<label><i class="fas fa-calendar-alt"></i> Fecha de Vencimiento</label>
				<div class="input-with-icon">
					<input type="date" bind:value={producto.col_fecha_vencimiento} />
				</div>
			</div>

			<div>
				<label><i class="fas fa-dollar-sign"></i> Precio Compra</label>
				<input type="number" bind:value={producto.col_precio_compra} min="0" step="0.01" />
			</div>
			<div>
				<label><i class="fas fa-box"></i> Stock</label>
				<input type="number" bind:value={producto.col_stock} min="0" />
			</div>
			<div>
				<label><i class="fas fa-door-open"></i> Puerta</label>
				<input type="number" bind:value={producto.col_precio_puerta} min="0" step="0.01" />
			</div>
			<div>
				<label><i class="fas fa-door-closed"></i> Puerta (11)</label>
				<input type="number" bind:value={producto.col_precio_puerta11} min="0" step="0.01" />
			</div>
			<div>
				<label><i class="fas fa-truck"></i> Domicilio</label>
				<input type="number" bind:value={producto.col_precio_domicilio} min="0" step="0.01" />
			</div>
			<div>
				<label><i class="fas fa-truck-moving"></i> Domicilio (11)</label>
				<input type="number" bind:value={producto.col_precio_domicilio11} min="0" step="0.01" />
			</div>
			<div>
				<label><i class="fas fa-image"></i> Imagen (URL)</label>
				<input type="text" bind:value={producto.col_imagen} />
			</div>
			<div class="full">
				<label><i class="fas fa-pencil-alt"></i> Descripción</label>
				<textarea bind:value={producto.col_descripcion}></textarea>
			</div>
		</div>
	</form>
</div>

<style>
	.popup {
		position: relative;
		background: #fff;
		border-radius: 1rem;
		overflow: hidden;
		box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
	}

	.popup-header {
		background: linear-gradient(90deg, #0a2647, #144272, #205295);
		color: white;
		font-weight: bold;
		font-size: 2.2rem;
		text-align: center;
		padding: 1rem;
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 1rem;
	}

	.popup-header h1 {
		flex-grow: 1;
		text-align: left;
		margin: 0;
	}

	.popup-actions {
		display: flex;
		gap: 1rem;
	}

	.popup-actions-row {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: flex-end;
		gap: 18px;
	}
	.icon-action {
		background: transparent;
		border: none;
		display: flex;
		flex-direction: column;
		align-items: center;
		margin: 0 4px;
		position: relative;
	}
	.icon-img {
		width: 44px;
		height: 44px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 30%;
		margin-bottom: 0;
		border: 1px solid #bbb;
		background: #063f85;
		transition:
			border 0.2s,
			box-shadow 0.2s;
		box-shadow: 0 1px 6px rgba(0, 0, 0, 0.1);
	}
	.icon-img img,
	.icon-img .spinner {
		width: 36px;
		height: 36px;
	}
	/* Solo para el botón de guardar (más grande) */
	.icon-action-big .icon-img-big {
		width: 6px;
		height: 6px;
	}
	.icon-action-big .icon-img-big img,
	.icon-action-big .icon-img-big .spinner {
		width: 48px;
		height: 48px;
	}

	.icon-action:hover .icon-img,
	.icon-action:focus .icon-img {
		border: 1px solid #fff;
		box-shadow: 0 2px 12px rgba(30, 60, 120, 0.18);
	}
	.icon-tooltip {
		visibility: hidden;
		opacity: 0;
		position: absolute;
		left: 50%;
		top: 110%;
		transform: translateX(-50%);
		background: rgba(20, 30, 60, 0.96);
		color: #fff;
		padding: 5px 12px;
		border-radius: 5px;
		font-size: 0.89rem;
		white-space: nowrap;
		pointer-events: none;
		transition:
			opacity 0.18s,
			visibility 0.18s;
		z-index: 1001;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.13);
	}
	.icon-action:hover .icon-tooltip,
	.icon-action:focus .icon-tooltip {
		visibility: visible;
		opacity: 1;
	}

	.icon-img.red {
		border-color: #1976d2;
	}

	.icon-img.blue {
		border-color: #1976d2;
	}

	.icon-img.gray {
		border-color: #1976d2;
	}

	.icon-label {
		color: #fff;
		font-size: 0.72rem;
		margin-top: 1px;
		text-align: center;
		letter-spacing: 0.01em;
		user-select: none;
	}

	.popup-body {
		position: relative;
		padding: 1.5rem;
		max-height: 700px;
		overflow-y: auto;
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 1rem;
		position: relative;
		z-index: 1;
		align-items: start;
	}

	.full {
		grid-column: span 2;
	}

	label {
		display: block;
		font-weight: 500;
		margin-bottom: 0.3rem;
	}

	input,
	textarea {
		width: 100%;
		padding: 0.3.5rem;
		border: 1px solid #000000;
		border-radius: 0.5rem;
		background: rgba(255, 255, 255, 0.9);
	}

	.alert {
		margin: 1rem;
		padding: 0.7rem;
		border-radius: 0.5rem;
		font-weight: bold;
		text-align: center;
	}

	.info {
		background: #dbeafe;
		color: #1e40af;
	}

	.error {
		background: #fee2e2;
		color: #b91c1c;
	}

	.success {
		background: #d1fae5;
		color: #065f46;
	}

	.imagen-fondo {
		position: absolute;
		bottom: 2rem;
		right: 2rem;
		left: auto;
		display: flex;
		justify-content: flex-end;
		z-index: 0;
		opacity: 1;
		pointer-events: none;
	}

	.imagen-fondo img {
		max-width: 200px;
		max-height: 250px;
		object-fit: contain;
	}

	.spinner {
		border: 3px solid #ffffff;
		border-top: 3px solid #205295;
		border-radius: 50%;
		width: 20px;
		height: 20px;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}

	/*cerrar popup*/
	.cerrar-btn {
		transition: transform 0.18s cubic-bezier(0.4, 0, 0.2, 1);
	}
	.cerrar-btn:hover,
	.cerrar-btn:focus {
		transform: scale(1.2);
	}

	.mensaje-exito {
		position: absolute;
		top: 6rem; /* más cerca del encabezado */
		left: 80%;
		transform: translateX(-50%);
		color: white;
		background: green;
		padding: 0.25rem 0.75rem;
		border-radius: 30px;
		text-align: center;
		font-weight: 500;
		font-size: 1rem; /* texto más pequeño */
		white-space: nowrap; /* evita que se corte en varias líneas */
		z-index: 10;
	}
</style>
