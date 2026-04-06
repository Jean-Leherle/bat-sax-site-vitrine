import { createClient } from '@supabase/supabase-js'

// On récupère les variables d'environnement avec le bon préfixe VITE_
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

// Sécurité : on vérifie que les clés sont bien présentes
if (!supabaseUrl || !supabaseKey) {
  console.log("Supabase URL:", supabaseUrl);
  console.log("Supabase Key:", supabaseKey);
  throw new Error("Les variables d'environnement Supabase sont manquantes. Vérifiez votre fichier .env");
}

export const supabase = createClient(supabaseUrl, supabaseKey);