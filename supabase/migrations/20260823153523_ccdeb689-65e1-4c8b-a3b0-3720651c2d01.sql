-- Future list sub-ranking within an estimated rank
ALTER TABLE public.future_levels ADD COLUMN IF NOT EXISTS sub_rank integer NOT NULL DEFAULT 1;

-- Level raters (scoped, non-admin staff role)
CREATE TABLE IF NOT EXISTS public.level_raters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  username text NOT NULL,
  can_main boolean NOT NULL DEFAULT false,
  can_future boolean NOT NULL DEFAULT false,
  can_extra boolean NOT NULL DEFAULT false,
  note text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS level_raters_username_lower_idx ON public.level_raters (lower(username));

GRANT SELECT ON public.level_raters TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.level_raters TO authenticated;
GRANT ALL ON public.level_raters TO service_role;

ALTER TABLE public.level_raters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Level raters are publicly readable" ON public.level_raters;
CREATE POLICY "Level raters are publicly readable"
ON public.level_raters FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins manage level raters" ON public.level_raters;
CREATE POLICY "Admins manage level raters"
ON public.level_raters FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.is_head_admin(auth.uid()))
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.is_head_admin(auth.uid()));

CREATE OR REPLACE FUNCTION public.is_level_rater(_user_id uuid, _list text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.level_raters lr
    WHERE lr.user_id = _user_id
      AND CASE _list
            WHEN 'main' THEN lr.can_main
            WHEN 'future' THEN lr.can_future
            WHEN 'extra' THEN lr.can_extra
            ELSE false
          END
  )
$$;

REVOKE ALL ON FUNCTION public.is_level_rater(uuid, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.is_level_rater(uuid, text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.can_manage_list(_user_id uuid, _list text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin')
      OR public.is_head_admin(_user_id)
      OR public.is_level_rater(_user_id, _list)
$$;

REVOKE ALL ON FUNCTION public.can_manage_list(uuid, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.can_manage_list(uuid, text) TO authenticated, service_role;

CREATE TRIGGER update_level_raters_updated_at
BEFORE UPDATE ON public.level_raters
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();