export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      dynamic_question_templates: {
        Row: {
          correct_answer_equation: string
          id: string
          option_generation_rules: Json
          question_id: string | null
          template: string
          variable_ranges: Json
        }
        Insert: {
          correct_answer_equation: string
          id?: string
          option_generation_rules: Json
          question_id?: string | null
          template: string
          variable_ranges: Json
        }
        Update: {
          correct_answer_equation?: string
          id?: string
          option_generation_rules?: Json
          question_id?: string | null
          template?: string
          variable_ranges?: Json
        }
        Relationships: [
          {
            foreignKeyName: "dynamic_question_templates_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_questions: {
        Row: {
          exam_id: string | null
          id: string
          question_id: string | null
        }
        Insert: {
          exam_id?: string | null
          id?: string
          question_id?: string | null
        }
        Update: {
          exam_id?: string | null
          id?: string
          question_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exam_questions_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_questions_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      exams: {
        Row: {
          cost: number | null
          created_at: string | null
          description: string | null
          duration_minutes: number
          end_time: string | null
          force_time: number | null
          id: string
          instructions: string[] | null
          is_premium: boolean
          message: string | null
          start_time: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          cost?: number | null
          created_at?: string | null
          description?: string | null
          duration_minutes: number
          end_time?: string | null
          force_time?: number | null
          id?: string
          instructions?: string[] | null
          is_premium?: boolean
          message?: string | null
          start_time?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          cost?: number | null
          created_at?: string | null
          description?: string | null
          duration_minutes?: number
          end_time?: string | null
          force_time?: number | null
          id?: string
          instructions?: string[] | null
          is_premium?: boolean
          message?: string | null
          start_time?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      options: {
        Row: {
          id: string
          question_id: string
          option_text: string
          is_correct: boolean
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          question_id: string
          option_text: string
          is_correct?: boolean
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          question_id?: string
          option_text?: string
          is_correct?: boolean
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "options_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          }
        ]
      }
      question_banks: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      questions: {
        Row: {
          created_at: string | null
          id: string
          question_bank_id: string | null
          question_text: string
          question_type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          question_bank_id?: string | null
          question_text: string
          question_type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          question_bank_id?: string | null
          question_text?: string
          question_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "questions_question_bank_id_fkey"
            columns: ["question_bank_id"]
            isOneToOne: false
            referencedRelation: "question_banks"
            referencedColumns: ["id"]
          },
        ]
      }
      static_options: {
        Row: {
          id: string
          is_correct: boolean
          option_text: string
          question_id: string | null
        }
        Insert: {
          id?: string
          is_correct?: boolean
          option_text: string
          question_id?: string | null
        }
        Update: {
          id?: string
          is_correct?: boolean
          option_text?: string
          question_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "static_options_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_exam_attempts: {
        Row: {
          correct_answers: number | null
          end_time: string | null
          exam_id: string | null
          id: string
          score: number | null
          skipped_questions: number | null
          start_time: string | null
          time_taken: string | null
          total_questions: number | null
          user_id: string | null
          wrong_answers: number | null
        }
        Insert: {
          correct_answers?: number | null
          end_time?: string | null
          exam_id?: string | null
          id?: string
          score?: number | null
          skipped_questions?: number | null
          start_time?: string | null
          time_taken?: string | null
          total_questions?: number | null
          user_id?: string | null
          wrong_answers?: number | null
        }
        Update: {
          correct_answers?: number | null
          end_time?: string | null
          exam_id?: string | null
          id?: string
          score?: number | null
          skipped_questions?: number | null
          start_time?: string | null
          time_taken?: string | null
          total_questions?: number | null
          user_id?: string | null
          wrong_answers?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_exam_attempts_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
        ]
      }
      user_question_responses: {
        Row: {
          correct_answer: string | null
          id: string
          is_correct: boolean | null
          question_id: string | null
          user_exam_attempt_id: string | null
          user_response: string | null
        }
        Insert: {
          correct_answer?: string | null
          id?: string
          is_correct?: boolean | null
          question_id?: string | null
          user_exam_attempt_id?: string | null
          user_response?: string | null
        }
        Update: {
          correct_answer?: string | null
          id?: string
          is_correct?: boolean | null
          question_id?: string | null
          user_exam_attempt_id?: string | null
          user_response?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_question_responses_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_question_responses_user_exam_attempt_id_fkey"
            columns: ["user_exam_attempt_id"]
            isOneToOne: false
            referencedRelation: "user_exam_attempts"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          id: string
          name: string | null
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          name?: string | null
          role?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string | null
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
