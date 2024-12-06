-- Add new columns for dynamic questions
ALTER TABLE public.questions
ADD COLUMN IF NOT EXISTS template text,
ADD COLUMN IF NOT EXISTS variable_ranges jsonb,
ADD COLUMN IF NOT EXISTS option_generation_rules jsonb,
ADD COLUMN IF NOT EXISTS correct_answer_equation text;

-- Create a table for dynamic options (for dynamic and dynamic conditional questions)
CREATE TABLE IF NOT EXISTS public.dynamic_options (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    question_id uuid NOT NULL,
    option_template text NOT NULL,
    is_correct boolean NOT NULL DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT dynamic_options_pkey PRIMARY KEY (id),
    CONSTRAINT dynamic_options_question_id_fkey FOREIGN KEY (question_id)
        REFERENCES public.questions(id) ON DELETE CASCADE
);

-- Create a table for dynamic text conditional options
CREATE TABLE IF NOT EXISTS public.dynamic_text_options (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    question_id uuid NOT NULL,
    condition_text text NOT NULL,
    option_text text NOT NULL,
    is_correct boolean NOT NULL DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT dynamic_text_options_pkey PRIMARY KEY (id),
    CONSTRAINT dynamic_text_options_question_id_fkey FOREIGN KEY (question_id)
        REFERENCES public.questions(id) ON DELETE CASCADE
);

-- Add triggers for updated_at columns
CREATE TRIGGER set_timestamp_dynamic_options
    BEFORE UPDATE ON public.dynamic_options
    FOR EACH ROW
    EXECUTE FUNCTION public.update_modified_column();

CREATE TRIGGER set_timestamp_dynamic_text_options
    BEFORE UPDATE ON public.dynamic_text_options
    FOR EACH ROW
    EXECUTE FUNCTION public.update_modified_column();

-- Grant permissions
GRANT ALL ON TABLE public.dynamic_options TO anon;
GRANT ALL ON TABLE public.dynamic_options TO authenticated;
GRANT ALL ON TABLE public.dynamic_options TO service_role;

GRANT ALL ON TABLE public.dynamic_text_options TO anon;
GRANT ALL ON TABLE public.dynamic_text_options TO authenticated;
GRANT ALL ON TABLE public.dynamic_text_options TO service_role;

-- Add comments
COMMENT ON TABLE public.dynamic_options IS 'Stores dynamic options for dynamic and dynamic conditional questions';
COMMENT ON TABLE public.dynamic_text_options IS 'Stores conditional text options for dynamic text conditional questions';

COMMENT ON COLUMN public.questions.template IS 'Template for dynamic questions with variables in {brackets}';
COMMENT ON COLUMN public.questions.variable_ranges IS 'JSON object defining the ranges or values for variables';
COMMENT ON COLUMN public.questions.option_generation_rules IS 'Rules for generating options based on variables';
COMMENT ON COLUMN public.questions.correct_answer_equation IS 'Equation to calculate correct answer for dynamic questions';
