<script lang="ts">
	import { productosEnCarrito, limpiarCarrito, carritoVisible } from '$lib/stores/carritoTienda';
	import { crearPedidoCompleto } from '$lib/conexion_pedidos';
	import Formulario from './formulario.svelte';
	import { fade, scale } from 'svelte/transition';

	export let toggleFormulario: () => void;

	let formData = {
		nombre: '',
		celular: '',
		direccion: '',
		metodoPago: 'efectivo',
	};

	let procesando = false;
	let error = '';
	let exito = false;
	let numeroOrden = '';

	// Calcular el total del carrito
	$: total = $productosEnCarrito.reduce((sum, item) => {
		return sum + item.producto.col_precio_puerta * item.cantidad;
	}, 0);

	function handleFormChange(e: Event) {
		const target = e.target as HTMLInputElement;
		if (target?.name && target.name in formData) {
			const value = target.value ?? '';
			formData = {
				...formData,
				[target.name]: value,
			};
		}
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();

		if (!formData.nombre || !formData.celular || !formData.direccion) {
			error = 'Por favor complete todos los campos obligatorios';
			return;
		}

		if ($productosEnCarrito.length === 0) {
			error = 'El carrito está vacío';
			return;
		}

		procesando = true;
		error = '';

		try {
			const resultado = await crearPedidoCompleto(formData, $productosEnCarrito, total);

			if (resultado.success) {
				numeroOrden = resultado.numeroOrden;
				exito = true;
				limpiarCarrito();
				carritoVisible.set(false); // Cerrar el carrito
			} else {
				throw new Error(resultado.mensaje);
			}
		} catch (e) {
			error = e instanceof Error ? e.message : 'Error al procesar el pedido';
		} finally {
			procesando = false;
		}
	}
</script>

{#if exito}
	<div class="modal-overlay" transition:fade>
		<div class="mensaje-exito" transition:scale>
			<div class="icono-exito">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
					<polyline points="22 4 12 14.01 9 11.01"></polyline>
				</svg>
			</div>
			<h2>¡Pedido Confirmado con Éxito!</h2>
			<div class="detalles-pedido">
				<p class="numero-orden">Número de Orden: <strong>{numeroOrden}</strong></p>
				<p class="mensaje-confirmacion">
					Hemos recibido su pedido correctamente. En breve recibirá un correo electrónico con los
					detalles de su compra.
				</p>
				<p class="agradecimiento">¡Gracias por confiar en nosotros!</p>
			</div>
		</div>
	</div>
{:else}
	<Formulario {formData} {handleFormChange} {handleSubmit} {toggleFormulario} />
{/if}

<style>
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 1000;
	}

	.mensaje-exito {
		text-align: center;
		padding: 2.5rem;
		background: white;
		border-radius: 12px;
		box-shadow:
			0 4px 6px rgba(0, 0, 0, 0.1),
			0 1px 3px rgba(0, 0, 0, 0.08);
		max-width: 500px;
		width: 90%;
		animation: slideIn 0.5s ease-out;
	}

	.icono-exito {
		width: 80px;
		height: 80px;
		margin: 0 auto 1.5rem;
		color: #10b981;
		animation: bounceIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
	}

	.mensaje-exito h2 {
		color: #1f2937;
		margin-bottom: 1.5rem;
		font-size: 1.75rem;
		font-weight: 600;
	}

	.detalles-pedido {
		text-align: left;
		padding: 1rem;
		background: #f3f4f6;
		border-radius: 8px;
		margin: 1rem 0;
	}

	.numero-orden {
		font-size: 1.1rem;
		color: #374151;
		margin-bottom: 1rem;
		padding-bottom: 1rem;
		border-bottom: 1px solid #e5e7eb;
	}

	.mensaje-confirmacion {
		color: #4b5563;
		line-height: 1.6;
		margin-bottom: 1rem;
	}

	.agradecimiento {
		color: #10b981;
		font-weight: 500;
		text-align: center;
		margin-top: 1rem;
	}

	@keyframes slideIn {
		from {
			transform: translateY(-20px);
			opacity: 0;
		}
		to {
			transform: translateY(0);
			opacity: 1;
		}
	}

	@keyframes bounceIn {
		0% {
			transform: scale(0);
		}
		50% {
			transform: scale(1.2);
		}
		100% {
			transform: scale(1);
		}
	}
</style>
