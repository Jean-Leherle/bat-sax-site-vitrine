-- 1. Supprimer les tables communautaires et les profils
DROP TABLE IF EXISTS public.community_votes CASCADE;
DROP TABLE IF EXISTS public.community_tracks CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 2. Supprimer les fonctions et le trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.is_admin() cascade;

-- 3. Remettre les politiques de sécurité par défaut sur vos tables de base
-- (On supprime les règles "is_admin" et on remet une règle simple)
DROP POLICY IF EXISTS "Admin full access" ON public.concerts;
CREATE POLICY "Enable all for authenticated users" ON public.concerts FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admin full access" ON public.tracks;
CREATE POLICY "Enable all for authenticated users" ON public.tracks FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admin full access" ON public.concert_tracks;
CREATE POLICY "Enable all for authenticated users" ON public.concert_tracks FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admin full access" ON public.members;
CREATE POLICY "Enable all for authenticated users" ON public.members FOR ALL USING (auth.role() = 'authenticated');