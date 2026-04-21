-- Level Packs tables
CREATE TABLE public.level_packs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  cover_url TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.level_packs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Packs viewable by everyone"
  ON public.level_packs FOR SELECT USING (true);

CREATE POLICY "Admins can manage packs"
  ON public.level_packs FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_level_packs_updated_at
  BEFORE UPDATE ON public.level_packs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.level_pack_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pack_id UUID NOT NULL REFERENCES public.level_packs(id) ON DELETE CASCADE,
  level_id UUID NOT NULL,
  level_type TEXT NOT NULL CHECK (level_type IN ('main', 'extended')),
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (pack_id, level_id, level_type)
);

ALTER TABLE public.level_pack_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pack items viewable by everyone"
  ON public.level_pack_items FOR SELECT USING (true);

CREATE POLICY "Admins can manage pack items"
  ON public.level_pack_items FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_level_pack_items_pack ON public.level_pack_items(pack_id);

-- Atomic profile claim RPC
CREATE OR REPLACE FUNCTION public.claim_or_create_profile(_username TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _profile_id UUID;
  _user_id UUID;
  _email TEXT;
  _existing_claim UUID;
BEGIN
  _user_id := auth.uid();
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Must be logged in to claim a profile';
  END IF;

  SELECT email INTO _email FROM auth.users WHERE id = _user_id;
  IF _email IS NULL THEN
    RAISE EXCEPTION 'User email not found';
  END IF;

  -- Find profile (case-insensitive)
  SELECT id INTO _profile_id
  FROM public.profiles
  WHERE LOWER(username) = LOWER(_username)
  LIMIT 1;

  -- Create profile if missing (creator-only case)
  IF _profile_id IS NULL THEN
    INSERT INTO public.profiles (username, user_id, extra_points, total_points)
    VALUES (_username, NULL, 0, 0)
    RETURNING id INTO _profile_id;
  ELSE
    -- Block if already claimed by another user
    IF EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = _profile_id AND user_id IS NOT NULL AND user_id <> _user_id
    ) THEN
      RAISE EXCEPTION 'Profile already claimed by another user';
    END IF;
  END IF;

  -- Check existing pending claim
  SELECT id INTO _existing_claim
  FROM public.profile_claim_requests
  WHERE user_id = _user_id AND profile_id = _profile_id AND status = 'pending'
  LIMIT 1;

  IF _existing_claim IS NULL THEN
    INSERT INTO public.profile_claim_requests (user_id, profile_id, email, status)
    VALUES (_user_id, _profile_id, _email, 'pending');
  END IF;

  RETURN _profile_id;
END;
$$;