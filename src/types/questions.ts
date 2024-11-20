export interface BaseQuestion {
    id: string;
    question_type: 'static' | 'dynamic';
  }
  
  export interface StaticQuestion extends BaseQuestion {
    question_type: 'static';
    question_text: string;
    static_options: Array<{ id: string; option_text: string; is_correct: boolean }>;
  }
  
  export interface DynamicQuestion extends BaseQuestion {
    question_type: 'dynamic';
    dynamic_template: {
      id: string;
      template: string;
      variable_ranges: Record<string, { min: number; max: number }>;
      option_generation_rules: Record<string, string>;
      correct_answer_equation: string;
    };
  }
  
  export type Question = StaticQuestion | DynamicQuestion;