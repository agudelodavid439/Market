import { createClient } from '@supabase/supabase-js';

// ANCHOR - Conexión a la base de datos central
// Configuramos la conexión a nuestra "bodega digital" donde guardamos toda la información
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabaseServiceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
  console.error('Faltan las variables de entorno de Supabase. Verifica tu archivo .env');
  throw new Error('Credenciales de Supabase no configuradas');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true
  }
});
