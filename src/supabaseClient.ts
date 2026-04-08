import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log("Supabase URL:", supabaseUrl);
  console.log("Supabase Key:", supabaseKey);
  throw new Error("Les variables d'environnement Supabase sont manquantes. Vérifiez votre fichier .env");
}

export const supabase = createClient(supabaseUrl, supabaseKey);