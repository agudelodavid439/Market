// Ejecuta esto temporalmente en tu componente para pruebas
async function testSupabaseConnection() {
	const testData = { notas: 'Prueba ' + Date.now() };
	const { data, error } = await supabase
	  .from('pedidos')
	  .update(testData)
	  .eq('id', pedido.id)
	  .select();
	
	console.log('Resultado prueba:', { data, error });
  }