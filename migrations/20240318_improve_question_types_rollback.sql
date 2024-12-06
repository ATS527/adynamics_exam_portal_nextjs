-- Drop triggers and functions
DROP TRIGGER IF EXISTS validate_option_generation_rules_trigger ON public.questions;
DROP FUNCTION IF EXISTS public.validate_option_generation_rules();

DROP TRIGGER IF EXISTS validate_variable_ranges_trigger ON public.questions;
DROP FUNCTION IF EXISTS public.validate_variable_ranges();

-- Remove constraints
ALTER TABLE public.questions DROP CONSTRAINT IF EXISTS question_type_fields_check;

-- Remove columns
ALTER TABLE public.questions 
DROP COLUMN IF EXISTS template,
DROP COLUMN IF EXISTS variable_ranges,
DROP COLUMN IF EXISTS option_generation_rules;

-- Drop and recreate the enum type with original values
DROP TYPE IF EXISTS public.question_type_enum CASCADE;
CREATE TYPE public.question_type_enum AS ENUM (
    'static',
    'dynamic'
);
