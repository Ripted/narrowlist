-- Level raters may append to the admin changelog so their list actions are auditable.
DROP POLICY IF EXISTS "Admins can insert changelog" ON public.admin_changelog;
CREATE POLICY "Admins and raters can insert changelog" ON public.admin_changelog
FOR INSERT WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR public.is_head_admin(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.level_raters lr
    WHERE lr.user_id = auth.uid()
      AND (lr.can_main OR lr.can_future OR lr.can_extra)
  )
);
