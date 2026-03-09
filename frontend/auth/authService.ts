import { supabase } from "../lib/supabaseClient";

export const signInWithPassword = async ({ email, password }: { email: string; password: string }) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  return { user: data?.user, error };
};

export const fetchUserRole = async (userId: string) => {
  // Try 'users' table, fallback to 'profiles'
  let { data, error } = await supabase.from("users").select("role").eq("id", userId).single();
  if (error || !data) {
    ({ data, error } = await supabase.from("profiles").select("role").eq("id", userId).single());
  }
  return { role: data?.role, error };
};

export default {
  signInWithPassword,
  fetchUserRole,
};
