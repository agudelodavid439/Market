// $lib/users.js
import { supabase } from '$lib/supabaseclient';

export async function obtenerUsuarios() {
  const { data, error } = await supabase
    .from('user_registrations')
    .select('id, ip_address, registration_timestamp, name, phone_number, email, password, avatar, login, new_registration, coupons, with_google, with_facebook, user_id')
    .order('id', { ascending: true });
  return { data, error };
}

export async function actualizarUsuario(id, updatedData) {
  const { error } = await supabase
    .from('user_registrations')
    .update(updatedData)
    .eq('id', id);
  return { error };
}