export type QuestionType = 'static' | 'dynamic' | 'dynamic conditional' | 'dynamic text conditional';

export interface VariableRange {
  min?: number;
  max?: number;
  values?: string[];
}

export interface VariableRanges {
  [key: string]: VariableRange;
}

export interface StaticQuestion {
  id?: string;
  question_text: string;
  question_type: 'static';
  options: Array<{
    option_number: number;
    option_text: string;
    is_correct: boolean;
  }>;
  no_of_times: number;
}

export interface DynamicQuestion {
  id?: string;
  question_text: string;
  question_type: 'dynamic';
  template: string;
  variable_ranges: VariableRanges;
  option_generation_rules: {
    correct: string[];
    wrong1: string[];
    wrong2: string[];
    wrong3: string[];
  };
  no_of_times: number;
}

export interface DynamicConditionalQuestion {
  id?: string;
  question_text: string;
  question_type: 'dynamic conditional';
  template: string;
  variable_ranges: VariableRanges;
  option_generation_rules: {
    [condition: string]: {
      correct: string[];
      wrong1: string[];
      wrong2: string[];
      wrong3: string[];
    }[];
  };
  no_of_times: number;
}

export interface DynamicTextConditionalQuestion {
  id?: string;
  question_text: string;
  question_type: 'dynamic text conditional';
  template: string;
  variable_ranges: VariableRanges;
  option_generation_rules: {
    [condition: string]: {
      correct: string;
      wrong1: string;
      wrong2: string;
      wrong3: string;
    };
  };
  no_of_times: number;
}

export type Question = 
  | StaticQuestion 
  | DynamicQuestion 
  | DynamicConditionalQuestion 
  | DynamicTextConditionalQuestion;

export interface QuestionFormProps {
  question: Question;
  onUpdate: (question: Question) => void;
  onDelete?: () => void;
  onCancel?: () => void;
}
