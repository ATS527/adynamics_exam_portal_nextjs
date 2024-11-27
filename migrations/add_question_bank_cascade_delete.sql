-- Add cascade delete to questions table
ALTER TABLE public.questions
DROP CONSTRAINT IF EXISTS questions_question_bank_id_fkey,
ADD CONSTRAINT questions_question_bank_id_fkey
  FOREIGN KEY (question_bank_id)
  REFERENCES public.question_banks(id)
  ON DELETE CASCADE;

-- Add cascade delete to options table
ALTER TABLE public.options
DROP CONSTRAINT IF EXISTS options_question_id_fkey,
ADD CONSTRAINT options_question_id_fkey
  FOREIGN KEY (question_id)
  REFERENCES public.questions(id)
  ON DELETE CASCADE;
