
DROP POLICY IF EXISTS "Counselors can update their own profile" ON public.counselor_profiles;
CREATE POLICY "Counselors can update their own profile" ON public.counselor_profiles
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Students can update their appointments" ON public.appointments;
CREATE POLICY "Students can update their appointments" ON public.appointments
  FOR UPDATE USING (auth.uid() = student_id)
  WITH CHECK (
    auth.uid() = student_id
    AND student_id = (SELECT student_id FROM public.appointments a WHERE a.id = appointments.id)
    AND counselor_id = (SELECT counselor_id FROM public.appointments a WHERE a.id = appointments.id)
  );

DROP POLICY IF EXISTS "Counselors can update their appointments" ON public.appointments;
CREATE POLICY "Counselors can update their appointments" ON public.appointments
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.counselor_profiles cp
      WHERE cp.id = appointments.counselor_id AND cp.user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.counselor_profiles cp
      WHERE cp.id = appointments.counselor_id AND cp.user_id = auth.uid())
    AND student_id = (SELECT student_id FROM public.appointments a WHERE a.id = appointments.id)
    AND counselor_id = (SELECT counselor_id FROM public.appointments a WHERE a.id = appointments.id)
  );
