-- 1. On s'assure que le bucket existe
INSERT INTO storage.buckets (id, name, public) 
VALUES ('batsax-media', 'batsax-media', true)
ON CONFLICT (id) DO NOTHING;

-- 2. On nettoie les anciennes politiques de stockage
DROP POLICY IF EXISTS "Accès public en lecture" ON storage.objects;
DROP POLICY IF EXISTS "Admins peuvent tout faire" ON storage.objects;

-- 3. Politique de lecture : Tout le monde peut voir les images/vidéos
CREATE POLICY "Accès public en lecture" ON storage.objects
FOR SELECT USING (bucket_id = 'batsax-media');

-- 4. Politique d'écriture : Seuls les admins (via notre fonction is_admin) peuvent modifier
CREATE POLICY "Admins peuvent tout faire" ON storage.objects
FOR ALL 
USING (bucket_id = 'batsax-media' AND public.is_admin())
WITH CHECK (bucket_id = 'batsax-media' AND public.is_admin());
