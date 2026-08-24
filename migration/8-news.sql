-- Activer extension pour gen_random_uuid (Supabase/Postgres)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Fonction de sanitization très simple : supprime les balises HTML
CREATE OR REPLACE FUNCTION public.sanitize_text(txt text)
RETURNS text
LANGUAGE sql
IMMUTABLE AS $$
  SELECT regexp_replace($1, '<[^>]*>', '', 'g');
$$;

DROP TABLE IF EXISTS public.news;
-- Table news
CREATE TABLE IF NOT EXISTS public.news (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL CHECK (char_length(title) <= 200),
  content text CHECK (char_length(content) <= 4000),
  target_user uuid NULL,
  link text NULL CHECK (char_length(link) <= 512),
  start_at timestamptz NOT NULL DEFAULT now(),
  end_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes utiles
CREATE INDEX IF NOT EXISTS news_start_end_idx ON public.news (start_at, end_at);
CREATE INDEX IF NOT EXISTS news_target_user_idx ON public.news (target_user);
CREATE INDEX IF NOT EXISTS news_created_at_idx ON public.news (created_at);

-- Activer RLS
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;

-- Policy: SELECT
-- Les news globales sont visibles par tous.
-- Les news de type 'user' ne sont visibles que par le user ciblé (target_user = auth.uid()).
DROP POLICY IF EXISTS select_news_public_and_targeted ON public.news;

CREATE POLICY select_news_public_and_targeted ON public.news
  FOR SELECT
  USING (
    (target_user IS NULL)
    OR (target_user = auth.uid())
  );

-- Policy: INSERT / UPDATE / DELETE -> uniquement admins (profil.role = 'admin')
-- Remplacez la sous-requête par la logique correspondant à votre table `profiles`.
DROP POLICY IF EXISTS manage_news_admins_only ON public.news;
CREATE POLICY "manage_news_admins_only" ON public.news
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Exemple de fonction trigger : créer une news quand un nouveau concert est inséré
-- ATTENTION : adaptez les noms de colonnes (title, date, location) à votre table `concerts`.
CREATE OR REPLACE FUNCTION public._on_concert_insert_create_news()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  -- Ne pas créer si concert privé ou si start_at dans le futur selon votre logique
    INSERT INTO public.news (title, content, link, start_at, end_at, created_at)
    VALUES (
      'Nouveau concert ajouté : ' || COALESCE(NEW.name, 'Concert'),
      public.sanitize_text(
        COALESCE(NEW.name, '') || ' — ' || COALESCE(NEW.location, '') || ' le ' || COALESCE(TO_CHAR(NEW.date, 'YYYY-MM-DD HH24:MI'), '')
      ),
      '/concerts/' || COALESCE(NEW.id::text, ''), -- lien vers la page détail
      COALESCE(NEW.date, now()),
      COALESCE(NEW.date, now()) + interval '1 day',
      now()
    );
  RETURN NEW;
END;
$$;

-- Créer trigger (ajustez le nom de la table concerts si nécessaire)
DROP TRIGGER IF EXISTS trg_concert_insert_news ON public.concerts;
CREATE TRIGGER trg_concert_insert_news
AFTER INSERT ON public.concerts
FOR EACH ROW
EXECUTE FUNCTION public._on_concert_insert_create_news();

-- Fonction trigger pour UPDATE sur concerts : crée une news si des champs importants changent
CREATE OR REPLACE FUNCTION public._on_concert_update_create_news()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  -- Ne pas créer de news si seules des modifications liées aux setlists (concert_tracks) ont été faites
  -- (ici on compare les champs importants : name, location, date)
  IF (OLD.name IS DISTINCT FROM NEW.name) OR (OLD.location IS DISTINCT FROM NEW.location) OR (OLD.date IS DISTINCT FROM NEW.date) THEN
    INSERT INTO public.news (title, content, link, start_at, end_at, created_at)
    VALUES (
      'Concert modifié : ' || COALESCE(NEW.name, 'Concert'),
      public.sanitize_text(
        'Modification du concert : ' || COALESCE(NEW.name, '') || ' — ' || COALESCE(NEW.location, '') || ' le ' || COALESCE(TO_CHAR(NEW.date, 'YYYY-MM-DD HH24:MI'), '')
      ),
      '/concerts/' || COALESCE(NEW.id::text, ''),
      now(),
      now() + interval '1 day',
      now()
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_concert_update_news ON public.concerts;
CREATE TRIGGER trg_concert_update_news
AFTER UPDATE ON public.concerts
FOR EACH ROW
EXECUTE FUNCTION public._on_concert_update_create_news();

-- Exemple : trigger pour changement de statut d'une proposition (proposals)
-- Adaptez `proposals` et les colonnes `user_id` / `status`.
CREATE OR REPLACE FUNCTION public._on_proposal_status_change_create_news()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF (TG_OP = 'UPDATE') THEN
    IF (OLD.status IS DISTINCT FROM NEW.status) THEN
      INSERT INTO public.news (title, content, target_user, link, start_at, end_at, created_at)
      VALUES (
        'Statut modifié de votre proposition',
        public.sanitize_text('Votre proposition a changé de statut : ' || COALESCE(NEW.status, '')),
        NEW.user_id,
        '/saves', -- lien vers la page concernée
        now(),
        now() + interval '7 days',
        now()
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Créer trigger (ajustez le nom et les colonnes si besoin)
-- Créer trigger pour changements de statut sur suggestions communautaires
DROP TRIGGER IF EXISTS trg_community_track_status_change ON public.community_tracks;
CREATE TRIGGER trg_community_track_status_change
AFTER UPDATE ON public.community_tracks
FOR EACH ROW
EXECUTE FUNCTION public._on_proposal_status_change_create_news();

-- Notes XSS / sécurité :
-- 1) Le champ `content` est nettoyé par la fonction SQL `sanitize_text` (suppression basique des balises HTML).
--    C'est une protection simple côté DB mais ne remplace pas une politique stricte côté frontend.
-- 2) Côté frontend, n'affichez jamais `content` en HTML non-échappé. Utilisez des sorties textuelles (innerText) ou des fonctions d'échappement.
-- 3) Limitez la longueur des champs (checks ci-dessus) pour réduire les risques d'abus.
-- 4) RLS protège la lecture/écriture : seules les news globales sont publiques, les news user sont accessibles uniquement par leur destinataire.
-- 5) Prévoyez une interface admin (côté app) pour créer/éditer news plutôt que de permettre des inserts publics.

-- Ajoutez des policies supplémentaires si vous avez un rôle 'admin' stocké ailleurs, ou si vos noms de tables diffèrent.