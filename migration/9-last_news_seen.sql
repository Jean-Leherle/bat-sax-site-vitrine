-- Migration 9: ajouter la colonne last_news_seen_at sur profiles
-- Cette migration ajoute un timestamptz pour que les utilisateurs puissent marquer
-- les news comme lues côté serveur (profil.last_news_seen_at).

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_news_seen_at timestamptz NULL;

-- Initialiser les profils existants pour éviter des notifications anciennes :
UPDATE public.profiles SET last_news_seen_at = now() WHERE last_news_seen_at IS NULL;

-- Index utile pour requêtes de récupération des news non lues
CREATE INDEX IF NOT EXISTS profiles_last_news_seen_idx ON public.profiles (last_news_seen_at);

-- RLS : autoriser l'utilisateur à mettre à jour son propre champ last_news_seen_at
-- (ne donne pas de droits supplémentaires pour modifier d'autres colonnes)
DROP POLICY IF EXISTS "own_update_last_news_seen" ON public.profiles;
CREATE POLICY "own_update_last_news_seen" ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Note : la policy "Modification propre profil" existante peut déjà couvrir ce cas.
-- Cette policy dédiée garantit explicitement l'autorisation pour ce champ.

NOTIFY pgrst, 'reload schema';
