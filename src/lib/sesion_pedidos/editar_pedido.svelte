<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { actualizarPedido, obtenerPedidoPorId } from '$lib/conexion_pedidos';

  export let pedido = {
    id: '',
    numero_orden: '',
    nombre_cliente: '',
    correo: '',
    telefono: '',
    direccion: '',
    metodo_pago: '',
    articulos: [],
    total: 0,
    estado: '',
    cantidad_productos: 0,
    notas: '',
    codigo_descuento: '',
    metodo_envio: '',
  };

  const dispatch = createEventDispatcher();
  let cargando = false;

  // Al montar el componente, si el pedido tiene un id, buscamos sus datos
  onMount(async () => {
    if (pedido.id) {
      try {
        cargando = true;
        console.log('Cargando datos del pedido ID:', pedido.id);
        
        const { data, error } = await obtenerPedidoPorId(pedido.id);
        
        if (error) {
          console.error('Error al obtener el pedido:', error);
          dispatch('error', { 
            tipo: 'carga', 
            mensaje: 'Error al cargar el pedido', 
            detalles: error.message 
          });
          return;
        }

        if (!data) {
          console.error('Pedido no encontrado');
          dispatch('error', {
            tipo: 'no-encontrado',
            mensaje: 'Pedido no encontrado'
          });
          return;
        }

        console.log('Datos del pedido cargados:', data);
        pedido = { ...pedido, ...data };
      } catch (err) {
        console.error('Error inesperado:', err);
        dispatch('error', {
          tipo: 'inesperado',
          mensaje: 'Error inesperado al cargar el pedido'
        });
      } finally {
        cargando = false;
      }
    }
  });

  // Guardar los cambios del pedido (actualización)
  async function guardarPedido() {
    try {
      console.log('Iniciando guardado del pedido:', pedido);
      cargando = true;
      
      if (!pedido.id) {
        throw new Error('ID de pedido no válido');
      }

      const { error } = await actualizarPedido(pedido.id, pedido);
      
      if (error) {
        console.error('Error en la respuesta de Supabase:', error);
        throw error;
      }

      console.log('Pedido actualizado correctamente');
      dispatch('guardado', { 
        pedido, 
        mensaje: 'Pedido actualizado correctamente' 
      });
    } catch (error) {
      console.error('Error al guardar el pedido:', error);
      dispatch('error', { 
        tipo: 'guardado',
        mensaje: 'Error al guardar los cambios',
        detalles: error.message,
        pedido
      });
    } finally {
      cargando = false;
    }
  }

  function cancelar() {
    console.log('Cancelando edición');
    dispatch('cancelar');
  }
</script>

<style>
  :root {
    --color-primary: #4361ee;
    --color-success: #4cc9f0;
    --color-danger: #f72585;
    --color-warning: #f8961e;
    --color-text: #2b2d42;
    --color-border: #e9ecef;
    --radius: 8px;
    --shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    --transition: all 0.2s ease;
  }

  .editor {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    padding: 2rem;
    border-radius: var(--radius);
    width: min(95%, 750px);
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: var(--shadow);
    z-index: 100;
    border: 1px solid var(--color-border);
    transition: var(--transition);
  }

  h2 {
    color: var(--color-primary);
    margin: 0 0 1.5rem;
    font-size: 1.5rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .loading-indicator {
    display: inline-block;
    width: 1rem;
    height: 1rem;
    border: 2px solid rgba(255,255,255,0.3);
    border-radius: 50%;
    border-top-color: white;
    animation: spin 1s ease-in-out infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .form-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 1.25rem;
    margin-bottom: 1.5rem;
  }

  .form-group {
    margin-bottom: 0;
    position: relative;
  }

  label {
    display: block;
    margin-bottom: 0.5rem;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--color-text);
  }

  input, textarea, select {
    width: 100%;
    padding: 0.625rem 0.75rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius);
    font-size: 0.875rem;
    transition: var(--transition);
    background: white;
  }

  input:focus, textarea:focus, select:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 2px rgba(67, 97, 238, 0.1);
  }

  textarea {
    min-height: 100px;
    resize: vertical;
    line-height: 1.5;
  }

  input[readonly], select[disabled] {
    background-color: #f8f9fa;
    cursor: not-allowed;
    opacity: 0.8;
  }

  .buttons {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    padding-top: 1rem;
    border-top: 1px solid var(--color-border);
    margin-top: 1rem;
  }

  button {
    padding: 0.625rem 1.25rem;
    border-radius: var(--radius);
    font-weight: 500;
    font-size: 0.875rem;
    cursor: pointer;
    transition: var(--transition);
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  button:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .save {
    background: var(--color-primary);
    color: white;
    border: none;
  }

  .save:hover:not(:disabled) {
    background: #3a56d4;
    transform: translateY(-1px);
  }

  .cancel {
    background: white;
    color: var(--color-danger);
    border: 1px solid var(--color-danger);
  }

  .cancel:hover {
    background: #fdf2f5;
  }

  .status-badge {
    display: inline-block;
    padding: 0.25rem 0.5rem;
    border-radius: var(--radius);
    font-size: 0.75rem;
    font-weight: 600;
    margin-left: 0.5rem;
  }

  .status-pendiente { background: #fff3bf; color: #5c4800; }
  .status-procesando { background: #d0ebff; color: #002b5c; }
  .status-enviado { background: #e6fcf5; color: #006644; }
  .status-entregado { background: #ebfbee; color: #2b8a3e; }
  .status-cancelado { background: #ffe3e3; color: #c92a2a; }
</style>

<div class="editor">
  <h2>
    {pedido.id ? `Editar Pedido #${pedido.numero_orden}` : 'Nuevo Pedido'}
    {#if pedido.estado}
      <span class="status-badge status-{pedido.estado}">
        {pedido.estado.charAt(0).toUpperCase() + pedido.estado.slice(1)}
      </span>
    {/if}
    {#if cargando}
      <span class="loading-indicator"></span>
    {/if}
  </h2>
  
  <div class="form-grid">
    <div class="form-group">
      <label for="id">ID</label>
      <input type="text" id="id" bind:value={pedido.id} readonly>
    </div>
    
    <div class="form-group">
      <label for="numero_orden">N° Orden</label>
      <input type="text" id="numero_orden" bind:value={pedido.numero_orden} readonly>
    </div>

    <div class="form-group">
      <label for="nombre_cliente">Cliente</label>
      <input type="text" id="nombre_cliente" bind:value={pedido.nombre_cliente} disabled={cargando}>
    </div>

    <div class="form-group">
      <label for="correo">Correo</label>
      <input type="email" id="correo" bind:value={pedido.correo} disabled={cargando}>
    </div>

    <div class="form-group">
      <label for="telefono">Teléfono</label>
      <input type="tel" id="telefono" bind:value={pedido.telefono} disabled={cargando}>
    </div>

    <div class="form-group">
      <label for="metodo_pago">Método Pago</label>
      <select id="metodo_pago" bind:value={pedido.metodo_pago} disabled={cargando}>
        <option value="">Seleccione</option>
        <option value="efectivo">Efectivo</option>
        <option value="tarjeta">Tarjeta</option>
        <option value="transferencia">Transferencia</option>
      </select>
    </div>

    <div class="form-group">
      <label for="total">Total</label>
      <input type="number" id="total" bind:value={pedido.total} readonly>
    </div>

    <div class="form-group">
      <label for="estado">Estado</label>
      <select id="estado" bind:value={pedido.estado} disabled={cargando}>
        <option value="">Seleccione</option>
        <option value="pendiente">Pendiente</option>
        <option value="procesando">Procesando</option>
        <option value="enviado">Enviado</option>
        <option value="entregado">Entregado</option>
        <option value="cancelado">Cancelado</option>
      </select>
    </div>

    <div class="form-group">
      <label for="metodo_envio">Método Envío</label>
      <select id="metodo_envio" bind:value={pedido.metodo_envio} disabled={cargando}>
        <option value="">Seleccione</option>
        <option value="express">Motorizado</option>
        <option value="recogida">Recogida en tienda</option>
      </select>
    </div>
  </div>

  <div class="form-group">
    <label for="direccion">Dirección</label>
    <textarea id="direccion" bind:value={pedido.direccion} disabled={cargando}></textarea>
  </div>

  <div class="form-group">
    <label for="notas">Notas</label>
    <textarea id="notas" bind:value={pedido.notas} disabled={cargando}></textarea>
  </div>

  <div class="buttons">
    <button class="cancel" on:click={cancelar} disabled={cargando}>
      {#if cargando}<span class="loading-indicator"></span>{/if}
      Cancelar
    </button>
    <button class="save" on:click={guardarPedido} disabled={cargando}>
      {#if cargando}<span class="loading-indicator"></span>{/if}
      Guardar Cambios
    </button>
  </div>
</div>