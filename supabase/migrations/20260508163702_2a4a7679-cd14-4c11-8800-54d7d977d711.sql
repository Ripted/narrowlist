CREATE TABLE public.hts_cup_rounds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  round_name text NOT NULL,
  level_ids text[] NOT NULL DEFAULT '{}',
  player_usernames text[] NOT NULL DEFAULT '{}',
  qualify_limit integer NOT NULL DEFAULT 3,
  webhook_url text NOT NULL DEFAULT '',
  enabled boolean NOT NULL DEFAULT true,
  last_posted_at timestamptz,
  last_payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.hts_cup_rounds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage HTS cup rounds"
ON public.hts_cup_rounds FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_hts_cup_rounds_updated_at
BEFORE UPDATE ON public.hts_cup_rounds
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();