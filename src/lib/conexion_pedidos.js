// src/lib/conexion_pedidos.js
import { supabase } from '$lib/supabaseclient';

// Función para crear un nuevo pedido
export async function crearPedido(pedidoData) {
  const { data, error } = await supabase
    .from('pedidos')
    .insert([pedidoData])
    .select();
  return { data, error };
}

// Función para obtener todos los pedidos ordenados por ID
export async function obtenerPedidos() {
  const { data, error } = await supabase
    .from('pedidos')
    .select('id, numero_orden, nombre_cliente, correo, telefono, direccion, metodo_pago, articulos, total, estado, fecha_creacion, fecha_actualizacion, cantidad_productos, contador_ordenes_correo, contador_ordenes_telefono, imagenes_productos, notas, codigo_descuento, metodo_envio, fecha_entrega_estimada')
    .order('id', { ascending: true });
  return { data, error };
}

// Función para obtener un pedido específico por ID
export async function obtenerPedidoPorId(id) {
  const { data, error } = await supabase
    .from('pedidos')
    .select('id, numero_orden, nombre_cliente, correo, telefono, direccion, metodo_pago, articulos, total, estado, fecha_creacion, fecha_actualizacion, cantidad_productos, contador_ordenes_correo, contador_ordenes_telefono, imagenes_productos, notas, codigo_descuento, metodo_envio, fecha_entrega_estimada')
    .eq('id', id)
    .single();
  return { data, error };
}

// Función para actualizar un pedido específico por ID
export async function actualizarPedido(id, updatedData) {
  const { error } = await supabase
    .from('pedidos')
    .update(updatedData)
    .eq('id', id);
  return { error };
}

// Función para eliminar un pedido específico por ID
export async function eliminarPedido(id) {
  const { error } = await supabase
    .from('pedidos')
    .delete()
    .eq('id', id);
  return { error };
}

export async function obtenerCategorias() {
  try {
    // Cambiamos 'productos' por 'products' que es el nombre correcto de la tabla
    const { data, error } = await supabase
      .from('products') // Corregido: 'productos' → 'products'
      .select('col_tipo')
      .not('col_tipo', 'is', null)
      .order('col_tipo', { ascending: true });
    
    if (error) throw error;
    
    // Protección contra data null
    if (!data) {
      return { data: [], error: null };
    }
    
    // Eliminar duplicados
    const categoriasUnicas = [...new Set(data.map(item => item.col_tipo))];
    
    return { data: categoriasUnicas, error: null };
  } catch (err) {
    console.error("Error al obtener categorías:", err);
    return { data: [], error: err };
  }
}