import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const isValidUrl = (value: string) => {
  try {
    const url = new URL(value)
    return url.protocol === "http:" || url.protocol === "https:"
  } catch {
    return false
  }
}

const isSupabaseConfigured = Boolean(supabaseAnonKey) && Boolean(supabaseUrl) && isValidUrl(supabaseUrl)

export const supabase =
  isSupabaseConfigured
    ? createClient(supabaseUrl!, supabaseAnonKey!, {
        auth: {
          // Keep resident auth state isolated from other app tokens in this workspace.
          storageKey: "amenity-user-auth-token",
        },
      })
    : null
