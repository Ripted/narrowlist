-- Allow level raters to manage the lists they have been granted access to,
-- in addition to admins/head admins (see public.can_manage_list).

DROP POLICY IF EXISTS "Admins can manage levels" ON public.levels;
CREATE POLICY "Admins and main raters can manage levels"
  ON public.levels FOR ALL
  USING (public.can_manage_list(auth.uid(), 'main'))
  WITH CHECK (public.can_manage_list(auth.uid(), 'main'));

DROP POLICY IF EXISTS "Admins can manage future levels" ON public.future_levels;
CREATE POLICY "Admins and future raters can manage future levels"
  ON public.future_levels FOR ALL
  USING (public.can_manage_list(auth.uid(), 'future'))
  WITH CHECK (public.can_manage_list(auth.uid(), 'future'));

DROP POLICY IF EXISTS "Admins can manage extended levels" ON public.extended_levels;
CREATE POLICY "Admins and extra raters can manage extended levels"
  ON public.extended_levels FOR ALL
  USING (public.can_manage_list(auth.uid(), 'extra'))
  WITH CHECK (public.can_manage_list(auth.uid(), 'extra'));
