<script>
	import { carritoVisible, productosEnCarrito } from '$lib/stores/carritoTienda';

	$: cantidadProductos = $productosEnCarrito.reduce((sum, item) => sum + item.cantidad, 0);

	function toggleCarrito() {
		carritoVisible.update(value => !value);
	}
</script>

<svelte:head>
	<meta charset="UTF-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1.0" />
	<title>Footer with Icons</title>
	<script src="https://cdn.tailwindcss.com"></script>
	<link
		rel="stylesheet"
		href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
	/>
	<style>
		/* Adding custom styles for the footer background and icon colors */
		.footer {
			background: linear-gradient(180deg, #14213d 0%, #1e3a5f 30%, rgb(0, 0, 0) 60%, #0a1929 100%);
		}
		.icon {
			color: #ffffff;
			transition: all 0.3s ease;
			position: relative;
		}
		.icon:hover {
			color: #fca311;
			transform: translateY(-3px);
		}
		.icon::after {
			content: '';
			position: absolute;
			bottom: -8px;
			left: 50%;
			width: 0;
			height: 3px;
			background: #fca311;
			border-radius: 3px;
			transform: translateX(-50%);
			transition: width 0.3s ease;
		}
		.icon:hover::after {
			width: 100%;
		}
		.icon-container {
			display: flex;
			flex-direction: column;
			align-items: center;
			position: relative;
		}
		.icon-circle {
			width: 40px;
			height: 40px;
			border-radius: 50%;
			border: 1px solid rgba(255, 255, 255, 0.6);
			box-shadow: 0 0 3px rgba(255, 255, 255, 0.4);
			display: flex;
			justify-content: center;
			align-items: center;
			background-color: rgba(0, 0, 0, 0.3);
		}
		.icon-circle:hover {
			border-color: #fca311;
			box-shadow: 0 0 5px #fca311;
		}
		.icon-label {
			font-size: 0.7rem;
			margin-top: 5px;
			color: #e5e5e5;
			transition: all 0.3s ease;
		}
		.icon:hover + .icon-label {
			color: #fca311;
		}

		.notificacion-carrito {
			position: absolute;
			top: -8px;
			right: -8px;
			background: #e30808;
			color: white;
			font-size: 12px;
			font-weight: bold;
			min-width: 18px;
			height: 18px;
			border-radius: 9999px;
			display: flex;
			align-items: center;
			justify-content: center;
			padding: 2px;
			border: 2px solid #ffffff;
			box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
		}
	</style>
</svelte:head>

<footer class="footer fixed bottom-0 flex w-full items-center justify-around p-4 text-lg md:hidden">
	<a href="#" class="icon-container">
		<div class="icon-circle">
			<i class="fa-solid fa-qrcode icon text-xl"></i>
		</div>
		<span class="icon-label">Escanear</span>
	</a>
	<a href="#" class="icon-container">
		<div class="icon-circle">
			<i class="fa-solid fa-message icon text-xl"></i>
		</div>
		<span class="icon-label">Chat</span>
	</a>
	<a href="#" class="icon-container" on:click={toggleCarrito}>
		<div class="icon-circle">
			<i class="fa-solid fa-cart-shopping icon text-xl"></i>
			{#if cantidadProductos > 0}
				<span class="notificacion-carrito">{cantidadProductos}</span>
			{/if}
		</div>
		<span class="icon-label">Carrito</span>
	</a>
	<a href="#" class="icon-container">
		<div class="icon-circle">
			<i class="fa-solid fa-list-ul icon text-xl"></i>
		</div>
		<span class="icon-label">Ordenes</span>
	</a>

	<a href="#" class="icon-container">
		<div class="icon-circle">
			<i class="fa-solid fa-user-lock icon text-xl"></i>
		</div>
		<span class="icon-label">Login</span>
	</a>
</footer>
