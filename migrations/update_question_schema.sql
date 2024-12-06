-- Create enum for question types if not exists
DO $$ BEGIN
    CREATE TYPE question_type_enum AS ENUM ('static', 'dynamic', 'dynamic conditional', 'dynamic text conditional');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- First, add columns without constraints
ALTER TABLE public.questions
ADD COLUMN IF NOT EXISTS question_text TEXT,
ADD COLUMN IF NOT EXISTS question_type question_type_enum,
ADD COLUMN IF NOT EXISTS template TEXT,
ADD COLUMN IF NOT EXISTS variable_ranges JSONB,
ADD COLUMN IF NOT EXISTS option_generation_rules JSONB,
ADD COLUMN IF NOT EXISTS no_of_times INTEGER,
ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Update existing rows to have default values
UPDATE public.questions 
SET question_text = COALESCE(question_text, ''),
    question_type = COALESCE(question_type::question_type_enum, 'static'::question_type_enum),
    no_of_times = COALESCE(no_of_times, 1);

-- Now add NOT NULL constraints
ALTER TABLE public.questions
ALTER COLUMN question_text SET NOT NULL,
ALTER COLUMN question_type SET NOT NULL,
ALTER COLUMN question_type SET DEFAULT 'static'::question_type_enum,
ALTER COLUMN no_of_times SET NOT NULL,
ALTER COLUMN no_of_times SET DEFAULT 1;

-- Drop existing options table if it exists
DROP TABLE IF EXISTS public.options CASCADE;

-- Create options table
CREATE TABLE public.options (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    option_number INTEGER NOT NULL,
    option_text TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(question_id, option_number)
);

-- Drop existing constraints if they exist
DO $$ BEGIN
    ALTER TABLE public.questions DROP CONSTRAINT IF EXISTS check_no_of_times;
    ALTER TABLE public.questions DROP CONSTRAINT IF EXISTS valid_question_type;
    ALTER TABLE public.questions DROP CONSTRAINT IF EXISTS questions_question_type_check;
EXCEPTION
    WHEN undefined_object THEN null;
END $$;

-- Add constraints
ALTER TABLE public.questions
ADD CONSTRAINT check_no_of_times CHECK (no_of_times > 0),
ADD CONSTRAINT valid_question_type CHECK (
    CASE 
        WHEN question_type = 'static' THEN 
            template IS NULL
        WHEN question_type IN ('dynamic', 'dynamic conditional', 'dynamic text conditional') THEN 
            template IS NOT NULL
        ELSE false
    END
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_questions_type ON public.questions(question_type);
CREATE INDEX IF NOT EXISTS idx_options_question ON public.options(question_id);

-- Drop existing triggers if they exist
DO $$ BEGIN
    DROP TRIGGER IF EXISTS update_questions_updated_at ON public.questions;
    DROP TRIGGER IF EXISTS update_options_updated_at ON public.options;
EXCEPTION
    WHEN undefined_object THEN null;
END $$;

-- Add trigger for updating the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_questions_updated_at
    BEFORE UPDATE ON public.questions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_options_updated_at
    BEFORE UPDATE ON public.options
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
