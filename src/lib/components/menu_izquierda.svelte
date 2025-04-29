<script>
	import {
		LayoutDashboard,
		Video,
		Package,
		Truck,
		Users,
		MessageSquare,
		Ticket,
		Settings,
	} from 'lucide-svelte';
	import ChatPrincipalAi from '$lib/components/sesion_AI/chat_principal_Ai.svelte';

	export let isOpen = false; // 'isOpen' es ahora solo una prop

	let mostrarChat = false;

	function alternarChat() {
		mostrarChat = !mostrarChat;
		console.log('Estado del chat:', mostrarChat); // Para depuración
	}
</script>

<div class="menu-izquierda" class:open={isOpen}>
	<button><LayoutDashboard /> Dashboard</button>
	<button><Video /> Cámaras</button>
	<button><Package /> Inventario</button>
	<button><Truck /> Pedidos</button>
	<button><Users /> Usuarios</button>
	<button on:click={alternarChat}><MessageSquare /> Chat</button>
	<button><Ticket /> Cupones</button>
	<button><Settings /> Ajustes</button>
</div>

{#if mostrarChat}
	<ChatPrincipalAi estaAbierto={mostrarChat} />
{/if}

<style>
	.menu-izquierda {
		position: fixed;
		top: 0;
		left: 0;
		bottom: 0;
		width: 250px; /* Ajusta este valor según lo ancho que quieras el menú */
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		padding: 80px 20px 20px; /* Ajusta el padding-top para que no se pegue al header */
		background-color: #1a2332;
		border-right: 2px solid #2d3748;
		z-index: 999;
		transform: translateX(-100%);
		transition: transform 0.3s ease-in-out;
		overflow-y: auto;
	}

	.menu-izquierda.open {
		transform: translateX(0);
	}
	.menu-izquierda button {
		display: flex;
		align-items: center;
		margin: 8px 0; /* Ajuste del margen entre elementos */
		padding: 12px 16px; /* Ajuste del padding interno de los botones */
		background-color: #212b3b;
		border: none;
		border-radius: 8px; /* Reducimos un poco el radio de los botones */
		cursor: pointer;
		transition: all 0.3s ease;
		color: #e2e8f0;
		width: 100%;
		font-size: 1em; /* Reajustamos el tamaño de la fuente */
	}

	.menu-izquierda button:hover {
		background-color: #2d3748;
		transform: translateX(5px);
	}

	.menu-izquierda button :global(svg) {
		margin-right: 10px; /* Ajuste del margen para el icono */
		width: 24px; /* Ajuste del tamaño del icono */
		height: 24px; /* Ajuste del tamaño del icono */
		color: #60a5fa;
	}
</style>
