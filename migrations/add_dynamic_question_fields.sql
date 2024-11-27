-- Add columns for dynamic questions
ALTER TABLE public.questions
ADD COLUMN IF NOT EXISTS template text,
ADD COLUMN IF NOT EXISTS variable_ranges jsonb,
ADD COLUMN IF NOT EXISTS option_generation_rules jsonb,
ADD COLUMN IF NOT EXISTS correct_answer_equation text;