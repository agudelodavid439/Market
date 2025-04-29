<script lang="ts">
  import { onMount } from 'svelte';
  import { obtenerPedidos, actualizarPedido, eliminarPedido } from '$lib/conexion_pedidos';
  import EditarPedido from '$lib/sesion_pedidos/editar_pedido.svelte';

  let pedidos = [];
  let error = null;
  let pedidoEditado = null;
  let mostrarEditor = false;

  // Función para cargar los pedidos
  onMount(async () => {
    const { data, error: fetchError } = await obtenerPedidos();
    if (fetchError) {
      error = fetchError.message;
    } else {
      pedidos = data;
    }
  });

  // Función para abrir el editor de pedido, solo para editar pedidos existentes
  function abrirEditor(pedido) {
    pedidoEditado = { ...pedido }; // Crear una copia del pedido para la edición
    mostrarEditor = true;
  }

  // Función para manejar el guardado de un pedido editado
  function manejarGuardado(pedidoActualizado) {
    // Actualizamos el pedido en el arreglo de pedidos con los nuevos datos
    pedidos = pedidos.map(p => p.id === pedidoActualizado.id ? pedidoActualizado : p);
    mostrarEditor = false;
  }

  // Función para eliminar un pedido
  async function handleEliminarPedido(id) {
    if (confirm('¿Estás seguro de que deseas eliminar este pedido?')) {
      const { error } = await eliminarPedido(id);
      
      if (error) {
        console.error('Error al eliminar pedido:', error);
      } else {
        pedidos = pedidos.filter(p => p.id !== id);
      }
    }
  }
</script>

<style>
  .pedidos-grid { display: flex; flex-wrap: wrap; gap: 1rem; }
  .pedido { 
    border: 1px solid #ccc; 
    padding: 1rem; 
    width: 300px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }
  .editor-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }
  .acciones {
    display: flex;
    gap: 0.5rem;
    margin-top: 1rem;
  }
  .btn-editar {
    background: #2196F3;
    color: white;
    border: none;
    padding: 0.5rem;
    border-radius: 4px;
    cursor: pointer;
  }
  .btn-eliminar {
    background: #f44336;
    color: white;
    border: none;
    padding: 0.5rem;
    border-radius: 4px;
    cursor: pointer;
  }
</style>

<!-- Botón para editar un pedido -->
{#if pedidos.length === 0}
  <p>Cargando pedidos...</p>
{:else}
  <div class="pedidos-grid">
    {#each pedidos as pedido (pedido.id)}
      <div class="pedido">
        <h3>Orden #{pedido.numero_orden}</h3>
        <p><strong>ID:</strong> {pedido.id}</p> <!-- Mostrar el ID aquí -->
        <p><strong>Cliente:</strong> {pedido.nombre_cliente}</p>
        <p><strong>Correo:</strong> {pedido.correo}</p>
        <p><strong>Teléfono:</strong> {pedido.telefono}</p>
        <p><strong>Dirección:</strong> {pedido.direccion}</p>
        <p><strong>Método de Pago:</strong> {pedido.metodo_pago}</p>
        <p><strong>Total:</strong> ${pedido.total}</p>
        <p><strong>Estado:</strong> {pedido.estado}</p>
        <p><strong>Método de Envío:</strong> {pedido.metodo_envio}</p>
        <div class="acciones">
          <!-- Botón para editar un pedido -->
          <button class="btn-editar" on:click={() => abrirEditor(pedido)}>✏️ Editar</button>
          <!-- Botón para eliminar un pedido -->
          <button class="btn-eliminar" on:click={() => handleEliminarPedido(pedido.id)}>🗑️ Eliminar</button>
        </div>
      </div>
    {/each}
  </div>
{/if}

<!-- Editor de pedidos -->
{#if mostrarEditor}
  <div class="editor-container">
    <EditarPedido
      bind:pedido={pedidoEditado}
      on:guardado={manejarGuardado}
      on:cancelar={() => mostrarEditor = false}
    />
  </div>
{/if}
