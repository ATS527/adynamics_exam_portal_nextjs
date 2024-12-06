--
-- PostgreSQL database dump
--

-- Dumped from database version 15.6
-- Dumped by pg_dump version 16.2 (Postgres.app)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: pg_database_owner
--

CREATE SCHEMA public;


ALTER SCHEMA public OWNER TO pg_database_owner;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: pg_database_owner
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: question_type_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.question_type_enum AS ENUM (
    'static',
    'dynamic',
    'dynamic conditional',
    'dynamic text conditional'
);


ALTER TYPE public.question_type_enum OWNER TO postgres;

--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.users (id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.handle_new_user() OWNER TO postgres;

--
-- Name: update_modified_column(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_modified_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_modified_column() OWNER TO postgres;

--
-- Name: update_question_with_options(uuid, jsonb, jsonb); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_question_with_options(p_question_id uuid, p_question_data jsonb, p_options jsonb) RETURNS jsonb
    LANGUAGE plpgsql
    AS $$
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
$$;


ALTER FUNCTION public.update_question_with_options(p_question_id uuid, p_question_data jsonb, p_options jsonb) OWNER TO postgres;

--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updated_at_column() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: exam_questions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.exam_questions (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    exam_id uuid,
    question_id uuid
);


ALTER TABLE public.exam_questions OWNER TO postgres;

--
-- Name: exams; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.exams (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    title text NOT NULL,
    description text,
    duration_minutes integer NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    instructions text[],
    message text,
    start_time timestamp with time zone,
    end_time timestamp with time zone,
    force_time integer,
    is_premium boolean DEFAULT false NOT NULL,
    cost numeric(10,2)
);


ALTER TABLE public.exams OWNER TO postgres;

--
-- Name: options; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.options (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    question_id uuid NOT NULL,
    option_number integer NOT NULL,
    option_text text NOT NULL,
    is_correct boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.options OWNER TO postgres;

--
-- Name: question_banks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.question_banks (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    title text NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.question_banks OWNER TO postgres;

--
-- Name: questions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.questions (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    question_bank_id uuid,
    question_text text NOT NULL,
    question_type text DEFAULT 'static'::public.question_type_enum NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    template text,
    variable_ranges jsonb,
    option_generation_rules jsonb,
    correct_answer_equation text,
    no_of_times integer DEFAULT 1 NOT NULL,
    metadata jsonb,
    CONSTRAINT check_no_of_times CHECK ((no_of_times > 0)),
    CONSTRAINT valid_question_type CHECK (
CASE
    WHEN (question_type = 'static'::text) THEN (template IS NULL)
    WHEN (question_type = ANY (ARRAY['dynamic'::text, 'dynamic conditional'::text, 'dynamic text conditional'::text])) THEN (template IS NOT NULL)
    ELSE false
END)
);


ALTER TABLE public.questions OWNER TO postgres;

--
-- Name: user_answers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_answers (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    attempt_id uuid,
    question_id uuid,
    selected_option text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);


ALTER TABLE public.user_answers OWNER TO postgres;

--
-- Name: user_exam_attempts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_exam_attempts (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid,
    exam_id uuid,
    start_time timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    end_time timestamp with time zone,
    score numeric(5,2),
    total_questions integer,
    correct_answers integer,
    wrong_answers integer,
    skipped_questions integer,
    time_taken integer
);


ALTER TABLE public.user_exam_attempts OWNER TO postgres;

--
-- Name: user_question_responses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_question_responses (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_exam_attempt_id uuid,
    question_id uuid,
    user_response text,
    is_correct boolean,
    correct_answer text
);


ALTER TABLE public.user_question_responses OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id uuid NOT NULL,
    role text DEFAULT 'user'::text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    name text
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: exam_questions exam_questions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exam_questions
    ADD CONSTRAINT exam_questions_pkey PRIMARY KEY (id);


--
-- Name: exams exams_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exams
    ADD CONSTRAINT exams_pkey PRIMARY KEY (id);


--
-- Name: options options_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.options
    ADD CONSTRAINT options_pkey PRIMARY KEY (id);


--
-- Name: options options_question_id_option_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.options
    ADD CONSTRAINT options_question_id_option_number_key UNIQUE (question_id, option_number);


--
-- Name: question_banks question_banks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.question_banks
    ADD CONSTRAINT question_banks_pkey PRIMARY KEY (id);


--
-- Name: questions questions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT questions_pkey PRIMARY KEY (id);


--
-- Name: user_answers unique_attempt_question; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_answers
    ADD CONSTRAINT unique_attempt_question UNIQUE (attempt_id, question_id);


--
-- Name: user_answers user_answers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_answers
    ADD CONSTRAINT user_answers_pkey PRIMARY KEY (id);


--
-- Name: user_exam_attempts user_exam_attempts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_exam_attempts
    ADD CONSTRAINT user_exam_attempts_pkey PRIMARY KEY (id);


--
-- Name: user_question_responses user_question_responses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_question_responses
    ADD CONSTRAINT user_question_responses_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_options_question; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_options_question ON public.options USING btree (question_id);


--
-- Name: idx_questions_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_questions_type ON public.questions USING btree (question_type);


--
-- Name: exams update_exams_modtime; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_exams_modtime BEFORE UPDATE ON public.exams FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();


--
-- Name: options update_options_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_options_updated_at BEFORE UPDATE ON public.options FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: question_banks update_question_banks_modtime; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_question_banks_modtime BEFORE UPDATE ON public.question_banks FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();


--
-- Name: questions update_questions_modtime; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_questions_modtime BEFORE UPDATE ON public.questions FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();


--
-- Name: questions update_questions_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_questions_updated_at BEFORE UPDATE ON public.questions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: exam_questions exam_questions_exam_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exam_questions
    ADD CONSTRAINT exam_questions_exam_id_fkey FOREIGN KEY (exam_id) REFERENCES public.exams(id) ON DELETE CASCADE;


--
-- Name: exam_questions exam_questions_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exam_questions
    ADD CONSTRAINT exam_questions_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.questions(id) ON DELETE CASCADE;


--
-- Name: options options_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.options
    ADD CONSTRAINT options_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.questions(id) ON DELETE CASCADE;


--
-- Name: questions questions_question_bank_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT questions_question_bank_id_fkey FOREIGN KEY (question_bank_id) REFERENCES public.question_banks(id) ON DELETE CASCADE;


--
-- Name: user_answers user_answers_attempt_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_answers
    ADD CONSTRAINT user_answers_attempt_id_fkey FOREIGN KEY (attempt_id) REFERENCES public.user_exam_attempts(id) ON DELETE CASCADE;


--
-- Name: user_answers user_answers_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_answers
    ADD CONSTRAINT user_answers_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.exam_questions(id) ON DELETE CASCADE;


--
-- Name: user_exam_attempts user_exam_attempts_exam_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_exam_attempts
    ADD CONSTRAINT user_exam_attempts_exam_id_fkey FOREIGN KEY (exam_id) REFERENCES public.exams(id) ON DELETE CASCADE;


--
-- Name: user_exam_attempts user_exam_attempts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_exam_attempts
    ADD CONSTRAINT user_exam_attempts_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_question_responses user_question_responses_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_question_responses
    ADD CONSTRAINT user_question_responses_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.questions(id) ON DELETE CASCADE;


--
-- Name: user_question_responses user_question_responses_user_exam_attempt_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_question_responses
    ADD CONSTRAINT user_question_responses_user_exam_attempt_id_fkey FOREIGN KEY (user_exam_attempt_id) REFERENCES public.user_exam_attempts(id) ON DELETE CASCADE;


--
-- Name: users users_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id);


--
-- Name: users Users can update own data; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update own data" ON public.users FOR UPDATE USING ((auth.uid() = id));


--
-- Name: users Users can view own data; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view own data" ON public.users FOR SELECT USING ((auth.uid() = id));


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: pg_database_owner
--

GRANT USAGE ON SCHEMA public TO postgres;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;


--
-- Name: FUNCTION handle_new_user(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.handle_new_user() TO anon;
GRANT ALL ON FUNCTION public.handle_new_user() TO authenticated;
GRANT ALL ON FUNCTION public.handle_new_user() TO service_role;


--
-- Name: FUNCTION update_modified_column(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.update_modified_column() TO anon;
GRANT ALL ON FUNCTION public.update_modified_column() TO authenticated;
GRANT ALL ON FUNCTION public.update_modified_column() TO service_role;


--
-- Name: FUNCTION update_question_with_options(p_question_id uuid, p_question_data jsonb, p_options jsonb); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.update_question_with_options(p_question_id uuid, p_question_data jsonb, p_options jsonb) TO anon;
GRANT ALL ON FUNCTION public.update_question_with_options(p_question_id uuid, p_question_data jsonb, p_options jsonb) TO authenticated;
GRANT ALL ON FUNCTION public.update_question_with_options(p_question_id uuid, p_question_data jsonb, p_options jsonb) TO service_role;


--
-- Name: FUNCTION update_updated_at_column(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.update_updated_at_column() TO anon;
GRANT ALL ON FUNCTION public.update_updated_at_column() TO authenticated;
GRANT ALL ON FUNCTION public.update_updated_at_column() TO service_role;


--
-- Name: TABLE exam_questions; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.exam_questions TO anon;
GRANT ALL ON TABLE public.exam_questions TO authenticated;
GRANT ALL ON TABLE public.exam_questions TO service_role;


--
-- Name: TABLE exams; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.exams TO anon;
GRANT ALL ON TABLE public.exams TO authenticated;
GRANT ALL ON TABLE public.exams TO service_role;


--
-- Name: TABLE options; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.options TO anon;
GRANT ALL ON TABLE public.options TO authenticated;
GRANT ALL ON TABLE public.options TO service_role;


--
-- Name: TABLE question_banks; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.question_banks TO anon;
GRANT ALL ON TABLE public.question_banks TO authenticated;
GRANT ALL ON TABLE public.question_banks TO service_role;


--
-- Name: TABLE questions; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.questions TO anon;
GRANT ALL ON TABLE public.questions TO authenticated;
GRANT ALL ON TABLE public.questions TO service_role;


--
-- Name: TABLE user_answers; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.user_answers TO anon;
GRANT ALL ON TABLE public.user_answers TO authenticated;
GRANT ALL ON TABLE public.user_answers TO service_role;


--
-- Name: TABLE user_exam_attempts; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.user_exam_attempts TO anon;
GRANT ALL ON TABLE public.user_exam_attempts TO authenticated;
GRANT ALL ON TABLE public.user_exam_attempts TO service_role;


--
-- Name: TABLE user_question_responses; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.user_question_responses TO anon;
GRANT ALL ON TABLE public.user_question_responses TO authenticated;
GRANT ALL ON TABLE public.user_question_responses TO service_role;


--
-- Name: TABLE users; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.users TO anon;
GRANT ALL ON TABLE public.users TO authenticated;
GRANT ALL ON TABLE public.users TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO service_role;


--
-- PostgreSQL database dump complete
--

