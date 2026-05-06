-- Transformation de imageUrl en tableau (text[])
ALTER TABLE public.concerts 
  ALTER COLUMN "imageUrl" TYPE text[] 
  USING CASE WHEN "imageUrl" IS NOT NULL THEN ARRAY["imageUrl"] ELSE '{}' END,
  ALTER COLUMN "imageUrl" SET DEFAULT '{}';

-- Transformation de videoUrl en tableau (text[])
ALTER TABLE public.concerts 
  ALTER COLUMN "videoUrl" TYPE text[] 
  USING CASE WHEN "videoUrl" IS NOT NULL THEN ARRAY["videoUrl"] ELSE '{}' END,
  ALTER COLUMN "videoUrl" SET DEFAULT '{}';