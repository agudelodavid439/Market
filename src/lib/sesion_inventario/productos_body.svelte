<script lang="ts">
  import { onMount } from 'svelte';
  import { obtenerProductos, guardarProducto } from '$lib/conexion_products';
  import EditarProductos from '$lib/sesion_inventario/editar_producto.svelte';
  

  let productos = [];
  let error = null;
  let productoEditado = null;
  let mostrarEditor = false;

  let showPopup = false;

  onMount(async () => {
    try {
      productos = await obtenerProductos();
    } catch (err) {
      error = "Error al cargar productos.";
      console.error(err);
    }
  });

  // Export function to open popup
  export function abrirPopup() {
    showPopup = true;
  }

  // Export function to close popup
  export function cerrarPopup() {
    showPopup = false;
  }

  async function cargarProductos() {
    const { data, error: fetchError } = await obtenerProductos();
    if (fetchError) {
      error = fetchError.message;
    } else {
      productos = data;
    }
  }

  onMount(cargarProductos);

  function abrirEditor(producto = null) {
    productoEditado = producto || {
      id: '',
      col_nombre: '',
      col_precio_compra: 0,
      col_precio_puerta: 0,
      col_precio_puerta11: 0,
      col_precio_domicilio: 0,
      col_precio_domicilio11: 0,
      col_stock: 0,
      col_descripcion: '',
      col_imagen: '',
      isTrusted: true,
    };
    mostrarEditor = true;
  }

  async function manejarGuardado(event) {
    const productoActualizado = event.detail;
    let esNuevo = !productoActualizado.id; // <-- vuelve a poner esta línea aquí

    console.log('DEBUG col_nombre:', productoActualizado.col_nombre, JSON.stringify(productoActualizado));
    // Validación: col_nombre no debe estar vacío
    if (!productoActualizado.col_nombre || productoActualizado.col_nombre.trim() === "") {
      error = 'El nombre del producto es obligatorio.';
      return;
    }  
    try {
        const { data: productoReal, error: errorGuardado } = await guardarProducto(productoActualizado);

        if (errorGuardado) {
          error = errorGuardado.message;
          return;
        }

        if (esNuevo) {
          productos = [...productos, productoReal];
        } else {
          productos = productos.map(p =>
            p.id === productoActualizado.id ? { ...productoReal, id: productoReal.id } : p
          );
        }

        mostrarEditor = false;
        await cargarProductos(); // ✅ REFRESCA productos desde DB luego de guardar

      } catch (err) {
        console.error('[manejarGuardado] Error al guardar producto:', err);
        error = err.message;
      }
  }

  function manejarEliminado(event) {
    const idEliminado = event.detail;
    productos = productos.filter(p => p.id !== idEliminado);
    mostrarEditor = false;
  }
</script>

<style>
  .productos-grid { display: flex; flex-wrap: wrap; gap: 1rem; }
  .producto { border: 1px solid #ccc; padding: 1rem; width: 300px; }
  .producto img { width: 100%; height: 200px; object-fit: cover; border-radius: 4px; margin-bottom: 1rem; }

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

  .seccion-productos {
    height: 400px; /* Define la altura que activa el scrolling */
    overflow-y: auto; /* Habilita el scroll vertical */
  }
  .elemento-producto {
    padding: 10px;
    border-bottom: 1px solid #ccc;
  }
  /* Personalización de la barra de desplazamiento */
  .seccion-productos::-webkit-scrollbar {
    width: 10px;
  }
  .seccion-productos::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 10px;
  }
  .seccion-productos::-webkit-scrollbar-thumb:hover {
    background: #555;
  }
  .nuevo-producto-btn {
    margin: 1rem 0;
    padding: 0.5rem 10rem;
    background: #4CAF50;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }

  	  /* CAPA OSCURA DE FONDO DEL POPUP */
      .popup-overlay {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		background: rgba(0, 0, 0, 0.35);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 2000;
	  }
	
	  /* CONTENEDOR DEL POPUP */
	  .popup-modal {
		position: relative;
		background: white;
		border-radius: 12px;
		box-shadow: 0 4px 24px rgba(0, 0, 0, 0.18);
		width: 80vw;
		max-width: 1000px;
		min-width: 320px;
		max-height: 80vh;
		min-height: 180px;
		overflow: hidden;
		display: flex;
		flex-direction: column;
		animation: popupIn 0.25s cubic-bezier(0.4, 0, 0.2, 1);
	  }
	
	  /* ANIMACIÓN DE ENTRADA DEL POPUP */
	  @keyframes popupIn {
		from { transform: scale(0.85); opacity: 0; }
		to   { transform: scale(1); opacity: 1; }
	  }
	
	  /* HEADER DEL POPUP */
	  .popup-header {
		background: linear-gradient(90deg, #0b2c4d, #1a4a7a);
		color: white;
		font-weight: bold;
		font-size: 2rem;
		padding: 14px 18px;
		display: flex;
		align-items: center;
		justify-content: space-between;
	  }
	
	  /* CUERPO DEL POPUP */
	  .popup-content {
		padding: 18px;
		color: #222;
		overflow-y: auto;
		flex: 1 1 auto;
		min-height: 0;
		max-height: calc(80vh - 56px); /* Resta la altura del header del popup */
	  }
      /* Ajuste global para que el contenido no quede tapado por el header */
  :global(main) {
    margin-top: 60px;
  }

    /* HEADER FIJO SUPERIOR */
    .cerrar-btn {
  position: absolute;
  top: 10px;
  right: 12px;
  background: rgba(0, 0, 0, 0);
  border: 2px solid #ffffff;
  border-radius: 90%;
  width: 50px;
  height: 50px;
  font-weight: bold;
  cursor: pointer;
  z-index: 2001;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
  transition: transform 0.2s cubic-bezier(0.4,0,0.2,1);
}
.cerrar-btn::before {
  content: "×";
  font-size: 4rem;
  color: #ffffff;
  line-height: 1;
}
.cerrar-btn:hover,
.cerrar-btn:focus {
  transform: scale(1.2);
}


</style>

<div class="popup-overlay" >
  <div class="popup-modal">

   
    <div class="popup-header">
    <img src="/inventario.png" alt="Guardar" width="50" height="50" />
    <button class="nuevo-producto-btn" on:click={() => abrirEditor()}>
      ＋ Nuevo Producto
      </button>
    
    <span>Inventario</span>

      <!-- Botón de cierre POSICIONADO CORRECTAMENTE -->
  <div class="cerrar-btn" on:click|self={togglePopup}>

    <button 
    class=".cerrar-btn" 
    on:click={togglePopup}
    style="position: absolute; top: 12px; right: 12px;"
  >
  </button>

</div>

  </div>


  {#if error}
  <p class="error">{error}</p>
{:else if productos.length === 0}
  <p>Cargando productos...</p>
{:else}

<!-- Esta es la sección de productos con scroll inteligente -->
<div class="seccion-productos">
  <VirtualList {items} {items} itemSize={80} class="lista-virtual">
    {#each productos as producto (producto.id)}
      <div class="elemento-producto">
        <h2>{producto.nombre}</h2>
        <p>Precio: ${producto.precio}</p>
        <p>Descripción: {producto.descripcion}</p>
        <p>Stock: {producto.stock}</p>
        <button on:click={() => editarProducto(producto.id)}>✏️ Editar</button>
      </div>
    {/each}
  </VirtualList>
</div>

{#if mostrarEditor}
  <div class="editor-container">
    <EditarProductos 
      bind:producto={productoEditado}
      on:guardado={manejarGuardado}
      on:cancelar={() => mostrarEditor = false}
      on:eliminado={manejarEliminado}
    />
  </div>
{/if}

{#if productoEditado && !mostrarEditor}
  <div class="resultado-edicion">
    <h3>Último producto modificado:</h3>
    <pre>{JSON.stringify(productoEditado, null, 2)}</pre>
  </div>
{/if}



</div>
</div>



