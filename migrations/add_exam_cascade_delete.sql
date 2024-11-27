-- Add cascade delete to exam_questions table
ALTER TABLE public.exam_questions
DROP CONSTRAINT IF EXISTS exam_questions_exam_id_fkey,
ADD CONSTRAINT exam_questions_exam_id_fkey
  FOREIGN KEY (exam_id)
  REFERENCES public.exams(id)
  ON DELETE CASCADE;

-- Add cascade delete to exam_submissions table (if it exists)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'exam_submissions'
  ) THEN
    ALTER TABLE public.exam_submissions
    DROP CONSTRAINT IF EXISTS exam_submissions_exam_id_fkey,
    ADD CONSTRAINT exam_submissions_exam_id_fkey
      FOREIGN KEY (exam_id)
      REFERENCES public.exams(id)
      ON DELETE CASCADE;
  END IF;
END $$;
