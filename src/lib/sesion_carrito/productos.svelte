<script lang="ts">
	import type { Producto } from '$lib/conexion_products';
	import {
		productosEnCarrito,
		actualizarCantidad,
		quitarProducto,
	} from '$lib/stores/carritoTienda';

	// Exportar propiedades que necesitamos del padre
	export let formatearPrecio: (precio: number) => string;

	// Mantener la reactividad con el store de productos
	$: productos = $productosEnCarrito;
</script>

<ul class="lista-productos-carrito">
	{#each productos as item, indice}
		<li class="item-carrito">
			<div class="producto-container">
				<div class="imagen-producto-carrito">
					<img
						src={item.producto.col_imagen}
						alt={item.producto.col_nombre}
						on:error={e =>
							((e.target as HTMLImageElement).src =
								'https://via.placeholder.com/50x50?text=Producto')}
					/>
				</div>
				<div class="info-producto">
					<h4 class="nombre-producto">{item.producto.col_nombre}</h4>
					<span class="precio-producto">{formatearPrecio(item.producto.col_precio_puerta)}</span>
				</div>
			</div>
			<div class="control-cantidad">
				<div class="cantidad-botones">
					<button
						class="boton-control"
						on:click={() => actualizarCantidad(item.producto.col_nombre, -1)}
					>
						<span class="icono-control">−</span>
					</button>
					<span class="cantidad">{item.cantidad}</span>
					<button
						class="boton-control"
						on:click={() => actualizarCantidad(item.producto.col_nombre, 1)}
					>
						<span class="icono-control">+</span>
					</button>
				</div>
				<button class="boton-eliminar" on:click={() => quitarProducto(indice)}>
					<svg
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<path
							d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
						/>
					</svg>
				</button>
			</div>
		</li>
	{/each}
</ul>

<style>
	/* Lista de productos */
	.lista-productos-carrito {
		list-style: none;
		padding: 15px;
		margin-bottom: 15px;
		overflow-y: auto;
		max-height: 300px;
		transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.item-carrito {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem;
		border-bottom: 1px solid rgba(0, 0, 0, 0.05);
		transition: background-color 0.2s ease;
	}

	.item-carrito:hover {
		background-color: rgba(46, 139, 87, 0.05);
	}

	.producto-container {
		display: flex;
		align-items: center;
		gap: 1rem;
		flex: 1;
	}

	.imagen-producto-carrito {
		width: 40%;
		height: 40%;
		object-fit: cover;
		border-radius: 12px;
		overflow: hidden;
		box-shadow: 0 4px 4px rgba(0, 0, 0, 0.1);
		border: 1px solid #df6c07;
		transition: transform 0.2s ease;
	}

	.imagen-producto-carrito:hover {
		transform: scale(1.05);
	}

	.info-producto {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
	}

	.nombre-producto {
		font-size: 1rem;
		font-weight: 600;
		color: #2c3e50;
		margin: 0;
	}

	.precio-producto {
		font-size: 0.9rem;
		color: #2e8b57;
		font-weight: 500;
	}

	.control-cantidad {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		background: #f8f9fa;
		padding: 0.5rem;
		border-radius: 8px;
	}

	.cantidad-botones {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.boton-control {
		width: 24px;
		height: 24px;
		border-radius: 6px;
		border: none;
		background: #ffffff;
		color: #2c3e50;
		display: grid;
		place-items: center;
		cursor: pointer;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
		transition: all 0.2s ease;
	}

	.boton-control:hover {
		background: #2e8b57;
		color: white;
	}

	.icono-control {
		font-size: 1rem;
		font-weight: bold;
		line-height: 1;
	}

	.cantidad {
		font-weight: 600;
		color: #2c3e50;
		min-width: 20px;
		text-align: center;
	}

	.boton-eliminar {
		background: none;
		border: none;
		color: #e74c3c;
		cursor: pointer;
		padding: 4px;
		transition: all 0.2s ease;
		opacity: 0.7;
	}

	.boton-eliminar:hover {
		opacity: 1;
		transform: scale(1.1);
	}

	@media (max-width: 768px) {
		.item-carrito {
			flex-direction: row;
			align-items: center;
			gap: 1rem;
		}

		.imagen-producto-carrito {
			width: 300%; /* Aumentado 3 veces */
			height: 300%; /* Aumentado 3 veces */
			object-fit: cover;
			border-radius: 12px;
			overflow: hidden;
			box-shadow: 0 4px 4px rgba(0, 0, 0, 0.1);
			border: 1px solid #df6c07;
			transition: transform 0.2s ease;
		}
	}

	@media (max-width: 480px) {
		.lista-productos-carrito {
			max-height: 60vh;
			overflow-y: auto;
		}

		.imagen-producto-carrito {
			width: 300%; /* Aumentado 3 veces */
			height: 300%; /* Aumentado 3 veces */
			object-fit: cover;
			border-radius: 12px;
			overflow: hidden;
			box-shadow: 0 4px 4px rgba(0, 0, 0, 0.1);
			border: 1px solid #df6c07;
			transition: transform 0.2s ease;
		}
	}
</style>
