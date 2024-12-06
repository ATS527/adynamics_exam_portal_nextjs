-- Drop existing function if it exists
DROP FUNCTION IF EXISTS update_question_with_options(UUID, JSONB, JSONB);

-- Create a function to update a question and its options in a transaction
CREATE OR REPLACE FUNCTION update_question_with_options(
    p_question_id UUID,
    p_question_data JSONB,
    p_options JSONB
) RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
    v_question_type question_type_enum;
BEGIN
    -- Start transaction
    BEGIN
        -- Cast the question type to enum
        v_question_type := (p_question_data->>'question_type')::question_type_enum;

        -- Update the question based on question type
        IF v_question_type = 'static' THEN
            -- For static questions, set dynamic fields to null
            UPDATE public.questions
            SET
                question_text = COALESCE(p_question_data->>'question_text', question_text),
                question_type = v_question_type,
                template = NULL,
                variable_ranges = NULL,
                option_generation_rules = NULL,
                no_of_times = COALESCE((p_question_data->>'no_of_times')::integer, no_of_times),
                metadata = COALESCE((p_question_data->>'metadata')::jsonb, metadata),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = p_question_id
            RETURNING jsonb_build_object(
                'id', id,
                'question_text', question_text,
                'question_type', question_type::text,
                'no_of_times', no_of_times
            ) INTO v_result;
        ELSE
            -- For dynamic questions, update all fields
            UPDATE public.questions
            SET
                question_text = COALESCE(p_question_data->>'question_text', question_text),
                question_type = v_question_type,
                template = COALESCE(p_question_data->>'template', template),
                variable_ranges = COALESCE((p_question_data->>'variable_ranges')::jsonb, variable_ranges),
                option_generation_rules = COALESCE((p_question_data->>'option_generation_rules')::jsonb, option_generation_rules),
                no_of_times = COALESCE((p_question_data->>'no_of_times')::integer, no_of_times),
                metadata = COALESCE((p_question_data->>'metadata')::jsonb, metadata),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = p_question_id
            RETURNING jsonb_build_object(
                'id', id,
                'question_text', question_text,
                'question_type', question_type::text,
                'template', template,
                'variable_ranges', variable_ranges,
                'option_generation_rules', option_generation_rules,
                'no_of_times', no_of_times
            ) INTO v_result;
        END IF;

        -- Delete existing options for this question
        DELETE FROM public.options WHERE question_id = p_question_id;

        -- Insert new options if it's a static question
        IF v_question_type = 'static' AND p_options IS NOT NULL AND jsonb_array_length(p_options) > 0 THEN
            WITH inserted_options AS (
                INSERT INTO public.options (
                    question_id,
                    option_number,
                    option_text,
                    is_correct
                )
                SELECT 
                    p_question_id,
                    (value->>'option_number')::integer,
                    value->>'option_text',
                    (value->>'is_correct')::boolean
                FROM jsonb_array_elements(p_options)
                RETURNING jsonb_build_object(
                    'option_number', option_number,
                    'option_text', option_text,
                    'is_correct', is_correct
                ) as option_data
            )
            SELECT jsonb_set(
                v_result,
                '{options}',
                (SELECT jsonb_agg(option_data) FROM inserted_options)
            ) INTO v_result;
        END IF;

        RETURN v_result;
    EXCEPTION WHEN OTHERS THEN
        -- Rollback transaction on error
        RAISE EXCEPTION 'Error updating question: %', SQLERRM;
    END;
END;
$$ LANGUAGE plpgsql;
