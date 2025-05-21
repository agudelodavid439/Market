<script lang="ts">
	import { onMount } from 'svelte';
	import { obtenerProductos } from '$lib/conexion_products';
	import type { Producto as ProductoType } from '$lib/conexion_products';
	import { agregarAlCarrito as addToCart } from '$lib/stores/carritoTienda';

	let listaProductos: ProductoType[] = [];
	let mensajeError: string | null = null;
	let estaCargando = true;

	onMount(async () => {
		try {
			const respuesta = await obtenerProductos();
			if (respuesta.error) throw respuesta.error;
			listaProductos = respuesta.data || [];
		} catch (err) {
			mensajeError = 'Error al cargar los productos: ' + err.message;
			console.error(err);
		} finally {
			estaCargando = false;
		}
	});

	function formatearPrecio(precio: number): string {
		return new Intl.NumberFormat('es-CO', {
			style: 'currency',
			currency: 'COP',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0,
		}).format(precio);
	}

	function parseCurrencyString(currencyString: string): number {
		if (!currencyString) return NaN;
		const numberString = currencyString.replace(/[$. ]/g, '');
		const value = parseInt(numberString, 10);
		return value;
	}

	function agregarAlCarrito(producto: ProductoType) {
		addToCart(producto);
	}
</script>

<div class="productos-container">
	<h1>Nuestros Productos</h1>

	{#if estaCargando}
		<p>Cargando productos...</p>
	{:else if mensajeError}
		<p class="error-message">{mensajeError}</p>
	{:else if listaProductos.length === 0}
		<p>No hay productos disponibles.</p>
	{:else}
		<div class="product-grid">
			{#each listaProductos as producto}
				{@const precioOriginal = producto.col_precio_domicilio11}
				{@const cuponString = producto.col_cupon_descuento}
				{@const precioCupon = cuponString ? parseCurrencyString(cuponString) : NaN}
				{@const tieneCuponValido = cuponString && cuponString.trim() !== ''}
				{@const cuponEsNumeroValido = !isNaN(precioCupon) && precioCupon > 0}
				{@const esDescuentoReal = cuponEsNumeroValido && precioCupon < precioOriginal}

				<div class="product-card">
					<div class="product-img">
						{#if precioOriginal && tieneCuponValido && esDescuentoReal}
							{@const descuento = Math.round(
								((precioOriginal - precioCupon) / precioOriginal) * 100
							)}
							{#if descuento > 0}
								<span class="discount-percentage-badge">-{descuento}%</span>
							{/if}
						{/if}
						<img
							src={producto.col_imagen || 'https://via.placeholder.com/150'}
							alt={producto.col_nombre}
						/>
					</div>
					<h3>{producto.col_nombre}</h3>
					<p>{producto.col_descripcion || 'Descripción no disponible'}</p>
					<div class="product-actions">
						<div class="product-price">
							{#if precioOriginal && tieneCuponValido && esDescuentoReal}
								<span class="price-original-striked">{formatearPrecio(precioOriginal)}</span>
								<span class="discounted-price">{cuponString}</span>
							{:else}
								<span class="discounted-price">{formatearPrecio(precioOriginal)}</span>
							{/if}
						</div>
						<button
							class="add-btn"
							disabled={!producto.col_stock || producto.col_stock <= 0}
							on:click={() => agregarAlCarrito(producto)}
						>
							{#if !producto.col_stock || producto.col_stock <= 0}
								Agotado
							{:else}
								Añadir
							{/if}
						</button>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.productos-container {
		padding: 20px;
		max-width: 1200px;
		margin: auto;
	}

	.product-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		gap: 20px;
	}

	.product-card {
		border: 1px solid #ddd;
		border-radius: 8px;
		padding: 15px;
		text-align: center;
		background-color: white;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
	}

	.product-img {
		width: 100%;
		height: 150px;
		margin-bottom: 10px;
		position: relative;
		overflow: visible;
		display: flex;
		justify-content: center;
		align-items: center;
		background-color: #f0f0f0;
		border-radius: 4px;
	}

	.product-img img {
		max-width: 100%;
		max-height: 100%;
		object-fit: contain;
	}

	.product-card h3 {
		font-size: 1.1em;
		margin: 10px 0 5px;
	}

	.product-card p {
		font-size: 0.9em;
		color: #555;
		flex-grow: 1;
		margin-bottom: 10px;
	}

	.product-actions {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-top: 10px;
	}

	.product-price {
		text-align: left;
		white-space: nowrap;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0px;
		line-height: 1.2;
	}

	.price-original-striked {
		text-decoration: line-through;
		font-size: 0.9em;
		font-weight: normal;
		color: #888;
	}

	.discounted-price {
		font-size: 1em;
		font-weight: bold;
		color: #e74c3c;
	}

	.discount-percentage-badge {
		position: absolute;
		top: 0px;
		left: 0px;
		background-color: rgba(255, 68, 68, 1);
		color: white;
		padding: 2px 5px;
		border-bottom-right-radius: 4px;
		border-top-left-radius: 4px;
		font-size: 10px;
		font-weight: bold;
		line-height: 1.2;
		z-index: 3;
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
		display: inline-block;
	}

	.add-btn {
		padding: 8px 12px;
		background-color: #4caf50;
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.9em;
		transition: background-color 0.2s ease;
	}

	.add-btn:hover:not(:disabled) {
		background-color: #45a049;
	}

	.add-btn:disabled {
		background-color: #ccc;
		cursor: not-allowed;
	}

	.error-message {
		color: red;
	}
</style>
