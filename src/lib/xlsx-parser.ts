import * as XLSX from 'xlsx';

interface BaseQuestion {
  question_text: string;
  no_of_times: number;
}

interface StaticQuestion extends BaseQuestion {
  question_type: 'static';
  options: {
    option_number: number;
    option_text: string;
    is_correct: boolean;
  }[];
}

interface DynamicQuestion extends BaseQuestion {
  question_type: 'dynamic';
  template: string;
  variable_ranges: Record<string, { min: number; max: number }>;
  option_generation_rules: {
    correct: string[];
    wrong1: string[];
    wrong2: string[];
    wrong3: string[];
  };
}

interface DynamicConditionalQuestion extends BaseQuestion {
  question_type: 'dynamic conditional';
  template: string;
  variable_ranges: Record<string, { min?: number; max?: number; values?: string[] }>;
  option_generation_rules: {
    [condition: string]: {
      correct: string[];
      wrong1: string[];
      wrong2: string[];
      wrong3: string[];
    }[];
  };
}

interface DynamicTextConditionalQuestion extends BaseQuestion {
  question_type: 'dynamic text conditional';
  template: string;
  variable_ranges: Record<string, { values: string[] }>;
  option_generation_rules: {
    [condition: string]: {
      correct: string;
      wrong1: string;
      wrong2: string;
      wrong3: string;
    };
  };
}

type QuestionData = StaticQuestion | DynamicQuestion | DynamicConditionalQuestion | DynamicTextConditionalQuestion;

export async function parseQuestionXLSX(file: File): Promise<QuestionData[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        const questions: QuestionData[] = jsonData.map((row: any) => {
          const baseQuestion = {
            question_text: row.question_text || '',
            no_of_times: parseInt(row.no_of_times) || 1
          };

          switch (row.question_type) {
            case 'static':
              return {
                ...baseQuestion,
                question_type: 'static' as const,
                options: [
                  { option_number: 1, option_text: row.option_1 || '', is_correct: row.correct_option === 1 || row.correct_option === '1' },
                  { option_number: 2, option_text: row.option_2 || '', is_correct: row.correct_option === 2 || row.correct_option === '2' },
                  { option_number: 3, option_text: row.option_3 || '', is_correct: row.correct_option === 3 || row.correct_option === '3' },
                  { option_number: 4, option_text: row.option_4 || '', is_correct: row.correct_option === 4 || row.correct_option === '4' }
                ].filter(opt => opt.option_text !== '')
              };

            case 'dynamic':
              return {
                ...baseQuestion,
                question_type: 'dynamic' as const,
                template: row.template || '',
                variable_ranges: JSON.parse(row.variable_ranges || '{}'),
                option_generation_rules: JSON.parse(row.option_generation_rules || '{}')
              };

            case 'dynamic conditional':
              return {
                ...baseQuestion,
                question_type: 'dynamic conditional' as const,
                template: row.template || '',
                variable_ranges: JSON.parse(row.variable_ranges || '{}'),
                option_generation_rules: JSON.parse(row.option_generation_rules || '{}')
              };

            case 'dynamic text conditional':
              return {
                ...baseQuestion,
                question_type: 'dynamic text conditional' as const,
                template: row.template || '',
                variable_ranges: JSON.parse(row.variable_ranges || '{}'),
                option_generation_rules: JSON.parse(row.option_generation_rules || '{}')
              };

            default:
              throw new Error(`Invalid question type: ${row.question_type}`);
          }
        });

        resolve(questions);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsArrayBuffer(file);
  });
}
