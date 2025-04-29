<script lang="ts">
	import { ShoppingBag } from 'lucide-svelte';
	import type { Producto } from '$lib/conexion_products';

	let carrito: Producto[] = []; // Estado del carrito
	let carritoVisible = false; // Control de visibilidad

	function agregarAlCarrito(producto: Producto) {
		carrito = [...carrito, producto]; // Añadir producto al carrito
		console.log('Carrito:', carrito);
		carritoVisible = true; // Mostrar el carrito al agregar un producto (opcional)
	}

	function toggleCarrito() {
		carritoVisible = !carritoVisible;
	}

	function eliminarDelCarrito(index: number) {
		carrito = carrito.filter((_, i) => i !== index);
	}
</script>

<div class="contenedor-principal"></div>

<button class="boton-carrito-flotante" on:click={toggleCarrito}>
	<ShoppingBag size={24} />
	{#if carrito.length > 0}
		<span class="contador-carrito">{carrito.length}</span>
	{/if}
</button>

{#if carritoVisible}
	<div class="carrito-flotante">
		<h3>Tu Carrito</h3>
		{#if carrito.length === 0}
			<p>El carrito está vacío.</p>
		{:else}
			<ul>
				{#each carrito as item, index}
					<li>
						{item.col_nombre} - {formatearPrecio(item.col_precio_puerta)}
						<button on:click={() => eliminarDelCarrito(index)}>Eliminar</button>
					</li>
				{/each}
			</ul>
			<button>Ver Carrito Completo</button>
			<button on:click={toggleCarrito}>Cerrar</button>
		{/if}
	</div>
{/if}

<style>
	/* Estilos para el botón flotante */
	.boton-carrito-flotante {
		position: fixed;
		bottom: 20px;
		right: 20px;
		background: linear-gradient(145deg, #ff9900, #ffc107);
		color: white;
		border: none;
		border-radius: 50%;
		width: 60px;
		height: 60px;
		display: flex;
		justify-content: center;
		align-items: center;
		cursor: pointer;
		z-index: 1000; /* Asegurar que esté por encima de otros elementos */
	}

	.contador-carrito {
		position: absolute;
		top: -8px;
		right: -8px;
		background-color: red;
		color: white;
		border-radius: 50%;
		padding: 4px 8px;
		font-size: 12px;
	}

	/* Estilos para el carrito flotante */
	.carrito-flotante {
		position: fixed;
		top: 50%;
		right: 20px;
		transform: translateY(-50%);
		background-color: white;
		border: 1px solid #ccc;
		padding: 20px;
		border-radius: 8px;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
		z-index: 1001; /* Mayor que el botón */
		width: 300px;
	}

	.carrito-flotante h3 {
		margin-top: 0;
	}

	.carrito-flotante ul {
		list-style: none;
		padding: 0;
	}

	.carrito-flotante li {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 10px;
	}

	.carrito-flotante li button {
		background-color: #dc3545;
		color: white;
		border: none;
		padding: 5px 10px;
		border-radius: 4px;
		cursor: pointer;
		font-size: 12px;
	}

	.carrito-flotante button {
		margin-top: 10px;
		padding: 8px 15px;
		border: 1px solid #ccc;
		border-radius: 4px;
		cursor: pointer;
		background-color: #f8f9fa;
	}

	.carrito-flotante button:hover {
		background-color: #e9ecef;
	}
</style>
