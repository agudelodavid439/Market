<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';
	import { ShoppingBag } from 'lucide-svelte';
	import { fade, fly } from 'svelte/transition';
	import { obtenerProductos } from '$lib/conexion_products';
	import { obtenerCategorias } from '$lib/conexion_pedidos';
	import type { Producto } from '$lib/conexion_products';
	import Carrito from '$lib/sesion_carrito/carrito.svelte';

	import { productosEnCarrito, carritoVisible, toggleCarrito } from '$lib/stores/carritoTienda';
	import { terminoBusqueda } from '$lib/stores/buscadorStore';

	export type Producto = {
		col_nombre: string;
		col_tipo: string;
		col_precio_domicilio11: number;
		col_stock: number;
		col_imagen?: string;
		col_descripcion?: string;
		col_descuento_precio?: number; // Added the missing property
		col_cupon_descuento?: string; // Añadir la nueva propiedad
	};

	let listaProductos: Producto[] = [];
	let listaCategorias: string[] = [];
	let mensajeError: string | null = null;
	let estaCargando = true;
	let categoriaSeleccionada: string | null = null;
	let productoResaltado: number | null = null;
	let cantidadProductos = 0;

	const dispatch = createEventDispatcher();

	// Objeto para rastrear los productos agregados al carrito
	let productosAgregados: Record<string, boolean> = {};

	onMount(async () => {
		try {
			const [respuestaProductos, respuestaCategorias] = await Promise.all([
				obtenerProductos(),
				obtenerCategorias(),
			]);

			if (respuestaProductos.error) throw respuestaProductos.error;
			if (respuestaCategorias.error) throw respuestaCategorias.error;

			listaProductos = respuestaProductos.data || [];
			listaCategorias = respuestaCategorias.data || [];
		} catch (err) {
			mensajeError = 'Error al cargar los datos: ' + err.message;
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
		// Eliminar símbolo de moneda, puntos de miles y espacios, luego convertir a número
		const numberString = currencyString.replace(/[$. ]/g, '');
		return parseInt(numberString, 10);
	}

	// Función única para agregar al carrito
	async function agregarAlCarrito(producto: Producto) {
		// Verifica si es el primer producto antes de añadirlo
		const esPrimerProducto = $productosEnCarrito.length === 0;

		productosEnCarrito.update(items => {
			const existente = items.find(item => item.producto.col_nombre === producto.col_nombre);
			if (existente) {
				return items.map(item =>
					item.producto.col_nombre === producto.col_nombre
						? { ...item, cantidad: item.cantidad + 1 }
						: item
				);
			}
			return [...items, { producto, cantidad: 1 }];
		});

		// Actualizar cantidad de productos en el carrito
		cantidadProductos = $productosEnCarrito.reduce((total, item) => total + item.cantidad, 0);

		// Mostrar el carrito sólo si es el primer producto que se agrega
		if (esPrimerProducto) {
			carritoVisible.set(true);
		}

		// Marcar el producto como agregado
		productosAgregados[producto.col_nombre] = true;

		// Resetear el estado después de 1.5 segundos
		setTimeout(() => {
			productosAgregados[producto.col_nombre] = false;
		}, 1500);
	}

	// Añadimos una nueva variable para los productos de la categoría actual
	// sin el filtro de búsqueda aplicado
	$: productosDeCategoriaActual = listaProductos.filter(producto => {
		return !categoriaSeleccionada || producto.col_tipo === categoriaSeleccionada;
	});

	// Modificamos el filtro combinado para tener una referencia clara
	// si la búsqueda no dio resultados pero hay productos en la categoría
	$: productosFiltrados = listaProductos.filter(producto => {
		const cumpleFiltroCategoria =
			!categoriaSeleccionada || producto.col_tipo === categoriaSeleccionada;
		const cumpleFiltroBusqueda =
			!$terminoBusqueda ||
			producto.col_nombre.toLowerCase().includes($terminoBusqueda.toLowerCase()) ||
			(producto.col_descripcion?.toLowerCase() || '').includes($terminoBusqueda.toLowerCase()) ||
			producto.col_tipo.toLowerCase().includes($terminoBusqueda.toLowerCase());

		return cumpleFiltroCategoria && cumpleFiltroBusqueda;
	});

	// Variable para determinar si tenemos una búsqueda activa
	$: busquedaActiva = !!$terminoBusqueda && $terminoBusqueda.trim() !== '';
</script>

<!-- La barra de categorías estará fuera del contenedor principal para posicionarla de manera fija -->
<div class="menu-container">
	<!-- Espaciador visible solo en móvil -->
	<div class="spacer-mobile"></div>

	<div class="category-nav-container">
		<div class="category-nav">
			<button
				class="category-btn {!categoriaSeleccionada ? 'active' : ''}"
				on:click={() => (categoriaSeleccionada = null)}
			>
				Todos
			</button>
			{#each listaCategorias as categoria}
				<button
					class="category-btn {categoriaSeleccionada === categoria ? 'active' : ''}"
					on:click={() => (categoriaSeleccionada = categoria)}
				>
					{categoria}
				</button>
			{/each}
		</div>
	</div>

	<!-- Espaciador para compensar la altura de la barra de categorías fija -->
	<div class="category-nav-spacer"></div>

	<!-- Listado de productos -->
	<div class="product-container">
		<h2 class="section-title">{categoriaSeleccionada || 'Todos los productos'}</h2>

		<!-- Nuevo contenedor grid que maneja la disposición en columnas -->
		<div class="product-grid">
			{#if estaCargando}
				{#each Array(3) as _, i}
					<div class="product-card esqueleto-cargando" in:fade></div>
				{/each}
			{:else if mensajeError}
				<div class="error-message">
					{mensajeError}
				</div>
			{:else if productosFiltrados.length === 0}
				<!-- Mensaje de búsqueda sin resultados -->
				<div class="empty-message">
					{#if busquedaActiva}
						<div class="no-results-search">
							<div class="no-results-icon">
								<i class="mdi mdi-magnify-close"></i>
							</div>
							<p class="no-results-title">
								No se encontraron productos para "{$terminoBusqueda}"
								{#if categoriaSeleccionada}
									en la categoría "{categoriaSeleccionada}"
								{/if}
							</p>
							<p class="no-results-subtitle">
								Intenta con otros términos o revisa estos productos de la categoría:
							</p>
						</div>
					{:else if categoriaSeleccionada}
						<div class="empty-category">
							No hay productos en la categoría "{categoriaSeleccionada}" por ahora.
						</div>
					{:else}
						<div class="empty-store">No hay productos disponibles.</div>
					{/if}
				</div>

				<!-- Mostrar productos de la categoría seleccionada cuando la búsqueda no da resultados -->
				{#if busquedaActiva && productosDeCategoriaActual.length > 0}
					<div class="category-title-separator">
						{#if categoriaSeleccionada}
							<h3>Productos en {categoriaSeleccionada}</h3>
						{:else}
							<h3>Todos los productos disponibles</h3>
						{/if}
					</div>

					<!-- Mostrar todos los productos de la categoría actual -->
					{#each productosDeCategoriaActual as producto, i}
						<div class="product-card" in:fly={{ y: 20, delay: i * 50 }}>
							<!-- Imagen del producto -->
							<div class="product-img">
								<!-- Lógica para mostrar la etiqueta de descuento basada en col_cupon_descuento -->
								{#if producto.col_precio_domicilio11 && producto.col_cupon_descuento && producto.col_cupon_descuento.trim() !== ''}
									{@const precioOriginal = producto.col_precio_domicilio11}
									{@const precioCupon = parseCurrencyString(producto.col_cupon_descuento)}

									<!-- Verificar que el precio del cupón sea válido y menor que el original -->
									{#if !isNaN(precioCupon) && precioCupon > 0 && precioCupon < precioOriginal}
										{@const descuento = Math.round(
											((precioOriginal - precioCupon) / precioOriginal) * 100
										)}
										{#if descuento > 0}
											<!-- La etiqueta span que muestra el descuento -->
											<span class="discount-percentage-badge">-{descuento}%</span>
										{/if}
									{/if}
								{/if}
								<img
									src={producto.col_imagen || 'https://via.placeholder.com/400x300?text=Producto'}
									alt={producto.col_nombre}
									on:error={e =>
										(e.target.src = 'https://via.placeholder.com/400x300?text=Error+de+Imagen')}
								/>
							</div>

							<!-- Información del producto -->
							<div class="product-info">
								<div class="product-main-info">
									<div class="product-header">
										<h3 class="product-name">{producto.col_nombre}</h3>
										{#if producto.col_stock > 0}
											<!-- Mostrar cantidad de stock -->
											<span class="discount-badge">stock ({producto.col_stock})</span>
										{:else}
											<span class="discount-badge out-of-stock">Agotado</span>
										{/if}
									</div>

									<p class="product-description">
										{producto.col_descripcion || 'Sin descripción disponible'}
									</p>
								</div>

								<div class="product-actions">
									<div class="product-price">
										{#if producto.col_precio_domicilio11 && producto.col_cupon_descuento && producto.col_cupon_descuento.trim() !== ''}
											<!-- Si hay cupón: Mostrar domicilio11 tachado y cupón como precio final -->
											<span class="price-original-striked"
												>{formatearPrecio(producto.col_precio_domicilio11)}</span
											>
											<span class="discounted-price">{producto.col_cupon_descuento}</span>
										{:else}
											<!-- Si no hay cupón: Mostrar domicilio11 como precio normal -->
											<span class="discounted-price"
												>{formatearPrecio(producto.col_precio_domicilio11)}</span
											>
										{/if}
									</div>

									<button
										class="add-btn"
										disabled={!producto.col_stock || producto.col_stock <= 0}
										on:click={() => agregarAlCarrito(producto)}
									>
										+{#if productosAgregados[producto.col_nombre]}
											<span class="checkmark" in:fly={{ y: -5, duration: 200 }}>✓</span>
										{/if}
									</button>
								</div>
							</div>
						</div>
					{/each}
				{/if}
			{:else}
				{#each productosFiltrados as producto, i}
					<div class="product-card" in:fly={{ y: 20, delay: i * 100 }}>
						<!-- Imagen del producto -->
						<div class="product-img">
							<!-- Lógica para mostrar la etiqueta de descuento basada en col_cupon_descuento -->
							{#if producto.col_precio_domicilio11 && producto.col_cupon_descuento && producto.col_cupon_descuento.trim() !== ''}
								{@const precioOriginal = producto.col_precio_domicilio11}
								{@const precioCupon = parseCurrencyString(producto.col_cupon_descuento)}

								<!-- Verificar que el precio del cupón sea válido y menor que el original -->
								{#if !isNaN(precioCupon) && precioCupon > 0 && precioCupon < precioOriginal}
									{@const descuento = Math.round(
										((precioOriginal - precioCupon) / precioOriginal) * 100
									)}
									{#if descuento > 0}
										<!-- La etiqueta span que muestra el descuento -->
										<span class="discount-percentage-badge">-{descuento}%</span>
									{/if}
								{/if}
							{/if}
							<img
								src={producto.col_imagen || 'https://via.placeholder.com/400x300?text=Producto'}
								alt={producto.col_nombre}
								on:error={e =>
									(e.target.src = 'https://via.placeholder.com/400x300?text=Error+de+Imagen')}
							/>
						</div>

						<!-- Información del producto -->
						<div class="product-info">
							<div class="product-main-info">
								<div class="product-header">
									<h3 class="product-name">{producto.col_nombre}</h3>
									{#if producto.col_stock > 0}
										<!-- Mostrar cantidad de stock -->
										<span class="discount-badge">stock ({producto.col_stock})</span>
									{:else}
										<span class="discount-badge out-of-stock">Agotado</span>
									{/if}
								</div>

								<p class="product-description">
									{producto.col_descripcion || 'Sin descripción disponible'}
								</p>
							</div>

							<div class="product-actions">
								<div class="product-price">
									{#if producto.col_precio_domicilio11 && producto.col_cupon_descuento && producto.col_cupon_descuento.trim() !== ''}
										<!-- Si hay cupón: Mostrar domicilio11 tachado y cupón como precio final -->
										<span class="price-original-striked"
											>{formatearPrecio(producto.col_precio_domicilio11)}</span
										>
										<span class="discounted-price">{producto.col_cupon_descuento}</span>
									{:else}
										<!-- Si no hay cupón: Mostrar domicilio11 como precio normal -->
										<span class="discounted-price"
											>{formatearPrecio(producto.col_precio_domicilio11)}</span
										>
									{/if}
								</div>

								<button
									class="add-btn"
									disabled={!producto.col_stock || producto.col_stock <= 0}
									on:click={() => agregarAlCarrito(producto)}
								>
									+{#if productosAgregados[producto.col_nombre]}
										<span class="checkmark" in:fly={{ y: -5, duration: 200 }}>✓</span>
									{/if}
								</button>
							</div>
						</div>
					</div>
				{/each}
			{/if}
		</div>
	</div>
</div>

<!-- Importante: esto muestra el modal del carrito abierto sin overlay adicional -->
{#if $carritoVisible}
	<div class="carrito-flotante solo-movil">
		<Carrito />
	</div>
{/if}

<style>
	.menu-container {
		font-family: 'Arial', sans-serif;
		max-width: 100%;
		margin: 0 auto;
		background: #f8f9fa;
		border-radius: 8px;
		overflow: hidden;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
		margin-top: 0;
		z-index: 1; /* Asegura que esté por debajo de las categorías pero encima del fondo */
	}

	/* Espaciador solo visible en móvil */
	.spacer-mobile {
		display: none;
	}

	/* Configuración especial para PC - contenedor al borde izquierdo */
	@media (min-width: 769px) {
		.menu-container {
			position: relative;
			margin-left: 0; /* Elimina margen izquierdo */
			padding-left: 0; /* Elimina padding izquierdo */
			left: 0 !important; /* Posición completamente a la izquierda */
			border-radius: 0; /* Elimina borde redondeado en el lado izquierdo */
			border-top-right-radius: 8px; /* Mantiene borde redondeado en el lado derecho */
			border-bottom-right-radius: 8px;
			max-width: 1000px; /* Limita el ancho máximo */
			width: 100% !important;
		}

		.category-nav {
			padding-left: 16px; /* Padding interno para no pegar el texto al borde */
		}

		.product-grid {
			padding-left: 16px; /* Padding interno para los productos */
		}

		.section-title {
			padding-left: 16px; /* Padding para el título de la sección */
			margin-left: 0;
		}
	}

	/* Contenedor de la barra de categorías fija */
	.category-nav-container {
		position: fixed;
		top: 64px; /* Justo debajo del header (64px) */
		left: 0;
		right: 0;
		width: 100%;
		z-index: 90; /* Ajustado para no interferir con los modales (que suelen usar 1000+) */
		background: white;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		pointer-events: auto; /* Asegura que los eventos de mouse funcionen */
	}

	/* Espaciador para compensar la altura de la barra de categorías fija */
	.category-nav-spacer {
		height: 60px; /* Altura aproximada de la barra de categorías */
		width: 100%;
	}

	.category-nav {
		padding: 7px;
		overflow-x: auto;
		white-space: nowrap;
		background: white;
		border-bottom: 1px solid #e0e0e0;
		padding-top: 15px;
		padding-bottom: 12px;
		padding-right: 24px; /* Añadir más espacio a la derecha */
		scrollbar-width: thin; /* Para Firefox */
	}

	/* Personalización de la barra de desplazamiento para Webkit (Chrome, Safari, etc.) */
	.category-nav::-webkit-scrollbar {
		height: 4px;
	}

	.category-nav::-webkit-scrollbar-track {
		background: #f1f1f1;
		border-radius: 10px;
	}

	.category-nav::-webkit-scrollbar-thumb {
		background: #e0e0e0;
		border-radius: 10px;
	}

	.category-btn {
		padding: 6px 16px;
		margin-right: 8px;
		border-radius: 20px;
		font-size: 14px;
		cursor: pointer;
		border: none;
		background: #f0f0f0;
		color: #555;
	}

	.category-btn.active {
		background: #ffeeee;
		color: #ff4444;
		border: 1px solid #ff4444;
	}

	.section-title {
		margin: 16px 0 12px 16px;
		font-size: 18px;
		font-weight: 600;
		color: #ff4444;
	}

	/* Nuevo contenedor grid para productos */
	.product-grid {
		padding: 0 12px 16px;
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	/* En pantallas grandes: 2 columnas */
	@media (min-width: 769px) {
		.product-grid {
			display: grid;
			grid-template-columns: repeat(2, 1fr);
			gap: 16px;
		}
	}

	/* Estilo de tarjeta de producto optimizada como lista */
	.product-card {
		display: flex;
		padding: 10px;
		background: white;
		border-radius: 8px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
		position: relative;
		transition: all 0.2s ease;
		border: 1px solid rgba(0, 0, 0, 0.03);
		align-items: center;
	}

	.product-card:hover {
		box-shadow: 0 3px 8px rgba(0, 0, 0, 0.1);
		transform: translateY(-1px);
	}

	/* Imagen más pequeña y con mejor formato */
	.product-img {
		width: 60px;
		height: 60px;
		border-radius: 6px;
		background: #f0f0f0;
		overflow: hidden;
		flex-shrink: 0;
		border: 1px solid rgba(0, 0, 0, 0.05);
		position: relative;
	}

	.product-img img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	/* Nueva etiqueta para el porcentaje de descuento */
	.discount-percentage-badge {
		position: absolute;
		top: 0px;
		left: 0px;
		background-color: rgba(255, 68, 68, 0.9);
		color: white;
		padding: 1px 4px;
		border-bottom-right-radius: 4px;
		border-top-left-radius: 6px;
		font-size: 9px;
		font-weight: bold;
		line-height: 1.2;
		z-index: 2;
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
	}

	/* Información del producto reorganizada */
	.product-info {
		margin-left: 12px;
		flex: 1;
		display: flex;
		justify-content: space-between;
		align-items: center;
		min-width: 0;
	}

	.product-main-info {
		flex: 1;
		min-width: 0;
	}

	.product-header {
		display: flex;
		align-items: center;
		gap: 8px;
		flex-wrap: wrap;
		margin-bottom: 2px;
	}

	.product-name {
		font-size: 15px;
		font-weight: 600;
		color: #333;
		margin: 0;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 100%;
	}

	.product-description {
		font-size: 12px;
		color: #777;
		margin: 0;
		margin-top: 3px;
		line-height: 1.2;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
		text-overflow: ellipsis;
		max-height: 2.4em;
	}

	.product-actions {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-left: 8px;
	}

	.product-price {
		text-align: right;
		white-space: nowrap;
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 0px;
		line-height: 1.2; /* Ajustado para mejor alineación vertical */
	}

	/* Estilo para el precio original cuando hay descuento (tachado) */
	.price-original-striked {
		text-decoration: line-through; /* Tachado */
		font-size: 15px; /* Mismo tamaño */
		font-weight: 600; /* Mismo grosor */
		color: #888; /* Color gris */
	}

	/* Estilo para el precio final (ya sea el de cupón o el normal) */
	.discounted-price {
		font-size: 15px;
		font-weight: 600;
		color: #ff4444; /* Color rojo */
	}

	/* Botón de añadir optimizado */
	.add-btn {
		width: 28px;
		height: 28px;
		background: #4caf50; /* Cambiado a verde */
		color: white;
		border: none;
		border-radius: 4px;
		font-size: 16px;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s ease;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		position: relative;
	}

	.add-btn:hover:not(:disabled) {
		background: #45a049; /* Verde más oscuro para hover */
		transform: translateY(-1px);
		box-shadow: 0 2px 5px rgba(0, 0, 0, 0.15);
	}

	.add-btn:disabled {
		background: #cccccc;
		cursor: not-allowed;
	}

	/* Estilo para el signo de verificación */
	.checkmark {
		margin-left: 2px;
		font-weight: bold;
		font-size: 14px;
		color: white;
		display: inline-block;
	}

	/* Estilos responsivos para móviles */
	@media (max-width: 480px) {
		.product-card {
			padding: 8px;
		}

		.product-img {
			width: 50px;
			height: 50px;
		}

		/* Ajustar tamaño de la etiqueta de descuento en móvil si es necesario */
		.discount-percentage-badge {
			font-size: 8px;
			padding: 1px 3px;
		}

		.product-description {
			font-size: 11px;
			-webkit-line-clamp: 1;
			max-height: 1.2em;
		}

		.price-original-striked {
			font-size: 13px; /* Ajustar tamaño en móvil */
		}

		.discounted-price {
			font-size: 13px;
		}

		.add-btn {
			width: 24px;
			height: 24px;
			font-size: 14px;
		}
	}

	.carrito-flotante {
		position: fixed;
		top: 50%;
		right: 20px;
		transform: translateY(-50%);
		z-index: 1000; /* Mantiene el carrito por encima de las categorías */
		pointer-events: auto; /* Asegura que se pueda interactuar con el carrito */
	}

	/* Nueva clase para mostrar solo en móvil */
	@media (min-width: 769px) {
		.solo-movil {
			display: none;
		}
	}

	/* Ajuste para que el carrito ocupe ancho total en móvil */
	@media (max-width: 768px) {
		.carrito-flotante {
			left: 0;
			right: 0;
			width: 100%;
			display: flex;
			justify-content: center;
		}

		.carrito-flotante :global(> div),
		.carrito-flotante :global(> section),
		.carrito-flotante :global(> article) {
			width: 100%;
			max-width: 100%;
			margin: 0;
			border-radius: 0;
		}
	}

	/* Mover la columna hacia la izquierda SOLO en PC */
	@media (min-width: 769px) {
		.menu-container {
			position: relative;
			left: -80px !important;
			width: calc(100% + 0px) !important;
		}

		.category-nav-container {
			top: 64px; /* Asegurar que está justo debajo del header en PC */
			left: 0; /* Resetear posición para abarcar toda la pantalla */
			right: 35%; /* Dejar espacio para la columna del carrito */
			padding-left: 0; /* Quitar padding que causa desalineación */
			width: 65%; /* Ancho ajustado para coincidir con la columna izquierda */
			z-index: 95; /* Ajustado para no interferir con modales pero quedar sobre el contenido normal */
			background-color: white; /* Fondo más sólido */
			-webkit-backface-visibility: hidden; /* Mejora el rendimiento */
			backface-visibility: hidden;
		}

		/* Hacemos que los elementos sean visibles y funcionales */
		.product-container {
			position: relative;
			z-index: 2; /* Mayor que el contenedor pero menor que las categorías */
		}

		.product-grid {
			visibility: visible !important;
			opacity: 1 !important;
		}

		.category-nav {
			max-width: none; /* Eliminar el ancho máximo para que se extienda más */
			margin-left: 7%; /* Alinear con el margen izquierdo del contenido */
			padding-left: 0; /* Quitar el padding izquierdo */
			padding-right: 40px; /* Añadir más espacio a la derecha */
			display: flex; /* Asegurar que los botones permanecen en una línea */
			flex-wrap: nowrap; /* Evitar que los botones se envuelvan */
			overflow-x: auto; /* Mantener el scroll horizontal */
			scrollbar-width: thin; /* Barra de desplazamiento delgada para Firefox */
		}

		/* Mejora del scroll para categorías en PC */
		.category-nav::-webkit-scrollbar {
			height: 4px; /* Altura muy pequeña para la barra de desplazamiento */
		}

		.category-nav::-webkit-scrollbar-track {
			background: #f1f1f1; /* Color claro para el track */
			border-radius: 10px; /* Bordes redondeados */
		}

		.category-nav::-webkit-scrollbar-thumb {
			background: #e0e0e0; /* Color claro para el thumb */
			border-radius: 10px; /* Bordes redondeados */
		}

		.category-nav::-webkit-scrollbar-thumb:hover {
			background: #cccccc; /* Ligeramente más oscuro al hover */
		}

		.category-nav-spacer {
			height: 60px; /* Altura consistente para PC */
		}
	}

	/* Ajustes adicionales para móvil */
	@media (max-width: 768px) {
		.menu-container {
			margin-top: 0;
		}

		.category-nav-container {
			top: 120px; /* Más espacio en móvil debido al header más grande */
			z-index: 90; /* Asegura que se mantenga debajo de los modales en móvil también */
			position: fixed;
		}

		.category-nav {
			padding-right: 40px; /* Añadir más espacio a la derecha en móvil también */
		}

		.category-nav-spacer {
			height: 70px; /* Un poco más alto en móvil */
		}

		.product-grid {
			display: flex;
			flex-direction: column;
		}
	}

	/* Estilos para garantizar que modales y carrito estén por encima */
	:global(body),
	:global(html) {
		background-color: #fff;
	}

	/* Estilos para el mensaje de "no se encontraron resultados" */
	.empty-message {
		grid-column: 1 / -1; /* Ocupa todas las columnas */
		padding: 20px;
		text-align: center;
		background-color: #f9fafb;
		border-radius: 8px;
		margin: 15px 0;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
	}

	.no-results-search {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 20px 10px;
	}

	.no-results-icon {
		width: 70px;
		height: 70px;
		background-color: #f3f4f6;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 15px;
	}

	.no-results-icon i {
		font-size: 36px;
		color: #6b7280;
	}

	.no-results-title {
		font-size: 1.1rem;
		font-weight: 600;
		color: #374151;
		margin-bottom: 8px;
		line-height: 1.4;
	}

	.no-results-subtitle {
		font-size: 0.95rem;
		color: #6b7280;
		margin-bottom: 5px;
	}

	.empty-category,
	.empty-store {
		font-size: 1rem;
		color: #4b5563;
		padding: 15px;
	}

	/* Separador para título de la categoría */
	.category-title-separator {
		grid-column: 1 / -1;
		margin: 10px 0 5px;
		padding: 10px 0;
		border-top: 1px solid #e5e7eb;
		border-bottom: 1px solid #e5e7eb;
		background-color: #f3f4f6;
		text-align: center;
		border-radius: 6px;
	}

	.category-title-separator h3 {
		font-size: 1rem;
		font-weight: 600;
		color: #4b5563;
		margin: 0;
	}

	/* Ajustes específicos para móvil */
	@media (max-width: 768px) {
		.no-results-icon {
			width: 60px;
			height: 60px;
		}

		.no-results-icon i {
			font-size: 30px;
		}

		.no-results-title {
			font-size: 1rem;
		}

		.no-results-subtitle {
			font-size: 0.85rem;
		}

		.category-title-separator h3 {
			font-size: 0.9rem;
		}
	}
</style>
