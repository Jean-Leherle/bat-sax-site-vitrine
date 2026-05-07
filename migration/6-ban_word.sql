-- ==========================================
-- 1. TABLE DES MOTS BANNIS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.banned_words (
    word TEXT PRIMARY KEY
);

-- Insertion de quelques exemples (facilement modifiables via l'interface Supabase)
INSERT INTO public.banned_words (word) VALUES 
('admin'), ('batsax'), ('moderateur'), ('root'), ('system')
ON CONFLICT DO NOTHING;

-- RLS pour la table des mots bannis (Lecture publique, écriture admin uniquement)
ALTER TABLE public.banned_words ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lecture publique banned_words" ON public.banned_words;
CREATE POLICY "Lecture publique banned_words" ON public.banned_words FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin full access banned_words" ON public.banned_words;
CREATE POLICY "Admin full access banned_words" ON public.banned_words FOR ALL USING (public.is_admin());


-- ==========================================
-- 2. FONCTION DE VÉRIFICATION
-- ==========================================
-- Cette fonction vérifie si le pseudo contient un mot banni
CREATE OR REPLACE FUNCTION public.check_username_content(username TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN NOT EXISTS (
        SELECT 1 
        FROM public.banned_words 
        WHERE LOWER(username) LIKE '%' || LOWER(word) || '%'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ==========================================
-- 3. AJOUT DES CONTRAINTES SUR PROFILES
-- ==========================================

-- Nettoyage préventif au cas où le script est relancé
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS username_length_check;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS username_banned_content_check;

-- Contrainte de longueur (3 à 15 caractères)
ALTER TABLE public.profiles 
ADD CONSTRAINT username_length_check 
CHECK (char_length(username) >= 3 AND char_length(username) <= 15);

-- Contrainte de contenu banni : 
-- L'astuce est ici -> "role = 'admin' OR ..."
-- Si l'utilisateur est admin, la contrainte valide immédiatement sans chercher de mots bannis !
ALTER TABLE public.profiles 
ADD CONSTRAINT username_banned_content_check 
CHECK (role = 'admin' OR public.check_username_content(username));