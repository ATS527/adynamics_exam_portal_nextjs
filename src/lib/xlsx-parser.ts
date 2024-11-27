import * as XLSX from 'xlsx';

interface StaticQuestionData {
  questionText: string;
  questionType: 'static';
  options: {
    optionText: string;
    isCorrect: boolean;
  }[];
}

interface DynamicQuestionData {
  questionText: string;
  questionType: 'dynamic';
  template: string;
  variableRanges: Record<string, { min: number; max: number }>;
  optionGenerationRules: {
    correct: string;
    wrong1: string;
    wrong2: string;
    wrong3: string;
  };
  correctAnswerEquation: string;
}

type QuestionData = StaticQuestionData | DynamicQuestionData;

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
          if (row.question_type === 'dynamic') {
            // Parse dynamic question
            return {
              questionText: '', // Dynamic questions use template
              questionType: 'dynamic' as const,
              template: row.template,
              variableRanges: JSON.parse(row.variable_ranges || '{}'),
              optionGenerationRules: JSON.parse(row.option_generation_rules || '{}'),
              correctAnswerEquation: row.correct_answer_equation
            };
          } else {
            // Parse static question
            const options = [];
            for (let i = 1; i <= 4; i++) {
              const optionText = row[`option_${i}`];
              if (optionText) {
                options.push({
                  optionText,
                  isCorrect: parseInt(row.correct_option) === i
                });
              }
            }

            return {
              questionText: row.question_text,
              questionType: 'static' as const,
              options
            };
          }
        });

        resolve(questions);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
}
