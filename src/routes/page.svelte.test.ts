<div class="popup-overlay" on:click|self={cerrarPopup}>
<div class="popup-modal">
  <div class="popup-header">
	<img src="/inventario.png" alt="Guardar" width="50" height="50" />
	<span>Inventario</span>



	</div>
	</div>
	</div>


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
	