-- Drop existing enum type if exists
DROP TYPE IF EXISTS public.question_type_enum CASCADE;

-- Recreate the enum type with our question types
CREATE TYPE public.question_type_enum AS ENUM (
    'static',
    'dynamic',
    'dynamic conditional',
    'dynamic text conditional'
);

-- Update questions table
ALTER TABLE public.questions
ADD COLUMN IF NOT EXISTS template text, -- For dynamic questions: "What is {x} + {y}?"
ADD COLUMN IF NOT EXISTS variable_ranges jsonb, -- Stores both range_values and enum_values
ADD COLUMN IF NOT EXISTS option_generation_rules jsonb; -- Stores rules for generating options

-- Add check constraints to ensure proper data structure based on question type
ALTER TABLE public.questions
ADD CONSTRAINT question_type_fields_check CHECK (
    CASE 
        -- Static questions should not have dynamic fields
        WHEN question_type = 'static' THEN
            template IS NULL AND
            variable_ranges IS NULL AND
            option_generation_rules IS NULL
            
        -- Dynamic questions must have all fields and proper structure
        WHEN question_type = 'dynamic' THEN
            template IS NOT NULL AND
            variable_ranges IS NOT NULL AND
            option_generation_rules IS NOT NULL AND
            jsonb_typeof(option_generation_rules) = 'object' AND
            option_generation_rules ? 'correct' AND
            option_generation_rules ? 'wrong1' AND
            option_generation_rules ? 'wrong2' AND
            option_generation_rules ? 'wrong3'
            
        -- Dynamic conditional questions must have proper structure
        WHEN question_type = 'dynamic conditional' THEN
            template IS NOT NULL AND
            variable_ranges IS NOT NULL AND
            jsonb_typeof(variable_ranges) = 'object' AND
            (
                variable_ranges ? 'range_values' OR
                variable_ranges ? 'enum_values'
            ) AND
            option_generation_rules IS NOT NULL AND
            jsonb_typeof(option_generation_rules) = 'object'
            
        -- Dynamic text conditional questions must have proper structure
        WHEN question_type = 'dynamic text conditional' THEN
            template IS NOT NULL AND
            variable_ranges IS NOT NULL AND
            jsonb_typeof(variable_ranges) = 'object' AND
            variable_ranges ? 'enum_values' AND
            option_generation_rules IS NOT NULL AND
            jsonb_typeof(option_generation_rules) = 'object'
            
        ELSE FALSE
    END
);

-- Add comments
COMMENT ON COLUMN public.questions.template IS 'Template for dynamic questions with variables in {brackets}, e.g., "What is {x} + {y}?"';
COMMENT ON COLUMN public.questions.variable_ranges IS 'JSON object containing range_values for numeric ranges and/or enum_values for text options';
COMMENT ON COLUMN public.questions.option_generation_rules IS 'Rules for generating options based on variables. Structure varies by question type:
- Dynamic: {"correct": [...], "wrong1": [...], "wrong2": [...], "wrong3": [...]}
- Dynamic Conditional: {"condition": [{"correct": [...], "wrong1": [...], "wrong2": [...], "wrong3": [...]}]}
- Dynamic Text Conditional: {"condition": {"correct": "text", "wrong1": "text", "wrong2": "text", "wrong3": "text"}}';

-- Function to validate variable_ranges structure
CREATE OR REPLACE FUNCTION public.validate_variable_ranges()
RETURNS trigger AS $$
BEGIN
    -- For dynamic questions with numeric ranges
    IF NEW.question_type = 'dynamic' THEN
        -- Check each key in variable_ranges has min and max
        IF NOT (
            SELECT bool_and(value ? 'min' AND value ? 'max')
            FROM jsonb_each(NEW.variable_ranges)
        ) THEN
            RAISE EXCEPTION 'Dynamic questions must have min and max values for each variable';
        END IF;
    
    -- For dynamic conditional questions
    ELSIF NEW.question_type = 'dynamic conditional' THEN
        -- Check range_values structure if present
        IF NEW.variable_ranges ? 'range_values' THEN
            IF NOT (
                SELECT bool_and(value ? 'min' AND value ? 'max')
                FROM jsonb_each(NEW.variable_ranges->'range_values')
            ) THEN
                RAISE EXCEPTION 'Range values must have min and max values';
            END IF;
        END IF;
        
        -- Check enum_values structure if present
        IF NEW.variable_ranges ? 'enum_values' THEN
            IF NOT (
                SELECT bool_and(jsonb_typeof(value) = 'array')
                FROM jsonb_each(NEW.variable_ranges->'enum_values')
            ) THEN
                RAISE EXCEPTION 'Enum values must be arrays';
            END IF;
        END IF;
    
    -- For dynamic text conditional questions
    ELSIF NEW.question_type = 'dynamic text conditional' THEN
        -- Must have enum_values and they must be arrays
        IF NOT (
            NEW.variable_ranges ? 'enum_values' AND
            (
                SELECT bool_and(jsonb_typeof(value) = 'array')
                FROM jsonb_each(NEW.variable_ranges->'enum_values')
            )
        ) THEN
            RAISE EXCEPTION 'Dynamic text conditional questions must have enum_values as arrays';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for variable_ranges validation
DROP TRIGGER IF EXISTS validate_variable_ranges_trigger ON public.questions;
CREATE TRIGGER validate_variable_ranges_trigger
    BEFORE INSERT OR UPDATE ON public.questions
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_variable_ranges();

-- Function to validate option_generation_rules structure
CREATE OR REPLACE FUNCTION public.validate_option_generation_rules()
RETURNS trigger AS $$
BEGIN
    -- For dynamic questions
    IF NEW.question_type = 'dynamic' THEN
        IF NOT (
            NEW.option_generation_rules ? 'correct' AND
            NEW.option_generation_rules ? 'wrong1' AND
            NEW.option_generation_rules ? 'wrong2' AND
            NEW.option_generation_rules ? 'wrong3' AND
            jsonb_typeof(NEW.option_generation_rules->'correct') = 'array' AND
            jsonb_typeof(NEW.option_generation_rules->'wrong1') = 'array' AND
            jsonb_typeof(NEW.option_generation_rules->'wrong2') = 'array' AND
            jsonb_typeof(NEW.option_generation_rules->'wrong3') = 'array'
        ) THEN
            RAISE EXCEPTION 'Dynamic questions must have correct and wrong1-3 options as arrays';
        END IF;
    
    -- For dynamic conditional questions
    ELSIF NEW.question_type = 'dynamic conditional' THEN
        -- Each condition should have correct and wrong1-3 options as arrays
        IF NOT (
            SELECT bool_and(
                jsonb_typeof(value) = 'array' AND
                jsonb_array_length(value) > 0 AND
                (
                    SELECT bool_and(
                        value ? 'correct' AND
                        value ? 'wrong1' AND
                        value ? 'wrong2' AND
                        value ? 'wrong3'
                    )
                    FROM jsonb_array_elements(value)
                )
            )
            FROM jsonb_each(NEW.option_generation_rules)
        ) THEN
            RAISE EXCEPTION 'Dynamic conditional questions must have valid option rules for each condition';
        END IF;
    
    -- For dynamic text conditional questions
    ELSIF NEW.question_type = 'dynamic text conditional' THEN
        -- Each condition should have correct and wrong1-3 options as text
        IF NOT (
            SELECT bool_and(
                jsonb_typeof(value) = 'object' AND
                value ? 'correct' AND
                value ? 'wrong1' AND
                value ? 'wrong2' AND
                value ? 'wrong3' AND
                jsonb_typeof(value->'correct') = 'string' AND
                jsonb_typeof(value->'wrong1') = 'string' AND
                jsonb_typeof(value->'wrong2') = 'string' AND
                jsonb_typeof(value->'wrong3') = 'string'
            )
            FROM jsonb_each(NEW.option_generation_rules)
        ) THEN
            RAISE EXCEPTION 'Dynamic text conditional questions must have text options for each condition';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for option_generation_rules validation
DROP TRIGGER IF EXISTS validate_option_generation_rules_trigger ON public.questions;
CREATE TRIGGER validate_option_generation_rules_trigger
    BEFORE INSERT OR UPDATE ON public.questions
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_option_generation_rules();
