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
  variable_ranges: {
    range_values?: Record<string, { min: number; max: number }>;
    enum_values?: Record<string, string[]>;
  };
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
  variable_ranges: {
    enum_values: Record<string, string[]>;
  };
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

function formatDynamicTextVariableRanges(ranges: any) {
  if (!ranges || typeof ranges !== 'object') return {};
  
  // Initialize the structure with enum_values at the top level
  const formattedRanges: { enum_values: Record<string, string[]> } = {
    enum_values: {}
  };
  
  // If ranges already has enum_values at top level
  if (ranges.enum_values && typeof ranges.enum_values === 'object') {
    for (const key in ranges.enum_values) {
      formattedRanges.enum_values[key] = Array.isArray(ranges.enum_values[key]) ? 
        ranges.enum_values[key] : [ranges.enum_values[key]];
    }
  } 
  // If ranges has the values directly
  else {
    for (const key in ranges) {
      if (ranges[key] && ranges[key].values) {
        formattedRanges.enum_values[key] = Array.isArray(ranges[key].values) ? 
          ranges[key].values : [ranges[key].values];
      }
    }
  }
  
  return formattedRanges;
}

function formatDynamicConditionalVariableRanges(ranges: any) {
  if (!ranges || typeof ranges !== 'object') return {};
  
  const formattedRanges: {
    range_values?: Record<string, { min: number; max: number }>;
    enum_values?: Record<string, string[]>;
  } = {};
  
  // Handle numeric ranges
  if (ranges.range_values) {
    formattedRanges.range_values = {};
    for (const key in ranges.range_values) {
      if (ranges.range_values[key].min !== undefined && ranges.range_values[key].max !== undefined) {
        formattedRanges.range_values[key] = {
          min: Number(ranges.range_values[key].min),
          max: Number(ranges.range_values[key].max)
        };
      }
    }
  }
  
  // Handle enum values
  if (ranges.enum_values) {
    formattedRanges.enum_values = {};
    for (const key in ranges.enum_values) {
      formattedRanges.enum_values[key] = Array.isArray(ranges.enum_values[key]) ? 
        ranges.enum_values[key] : [ranges.enum_values[key]];
    }
  }
  
  return formattedRanges;
}

function safeJSONParse(value: any, defaultValue: any = {}) {
  if (!value) return defaultValue;
  if (typeof value === 'object') return value;

  try {
    // Convert to string and clean up basic formatting
    let cleanValue = value.toString()
      .trim()
      // Remove BOM and other special characters
      .replace(/^\uFEFF/, '')
      // Replace curly quotes with straight quotes
      .replace(/[\u201C\u201D]/g, '"')
      // Remove any zero-width spaces
      .replace(/[\u200B-\u200D\uFFFD]/g, '');

    // If it's wrapped in quotes
    if (cleanValue.startsWith('"') && cleanValue.endsWith('"')) {
      try {
        // Try parsing as a JSON string
        const parsed = JSON.parse(cleanValue);
        if (typeof parsed === 'string') {
          cleanValue = parsed;
        } else {
          return parsed;
        }
      } catch (e) {
        // Remove outer quotes if parse fails
        cleanValue = cleanValue.slice(1, -1);
      }
    }

    // Clean up Excel's string formatting
    cleanValue = cleanValue
      // Fix Excel's quote escaping
      .replace(/"{2,}/g, '"')           // Fix double quotes
      .replace(/\\"/g, '"')             // Fix escaped quotes
      .replace(/\\"(?=[^"]*")/g, '"')   // Fix escaped quotes before real quotes
      // Fix Excel's brace handling
      .replace(/^"?{/g, '{')            // Fix start brace
      .replace(/}"?$/g, '}')            // Fix end brace
      .replace(/\\+(?=["{}])/g, '')     // Remove extra backslashes
      // Fix property names and values
      .replace(/([{,])\s*"?([^":,}\]]+)"?\s*:/g, '$1"$2":')  // Fix property names
      .replace(/:\s*"([^"]*?)"(?=[,}])/g, ':"$1"');          // Fix value quotes

    try {
      return JSON.parse(cleanValue);
    } catch (parseError) {
      // Try one more time with aggressive cleanup
      try {
        cleanValue = cleanValue
          // Aggressively fix property names
          .replace(/([{,])\s*([^":,}\]]+)\s*:/g, '$1"$2":')
          // Fix array values
          .replace(/:\s*\[(.*?)\]/g, (match, contents) => {
            const fixedContents = contents
              .split(',')
              .map((item: string) => `"${item.trim()}"`)
              .join(',');
            return `:[${fixedContents}]`;
          })
          // Remove any trailing commas
          .replace(/,\s*([\]}])/g, '$1');

        return JSON.parse(cleanValue);
      } catch (finalError) {
        return defaultValue;
      }
    }
  } catch (e) {
    return defaultValue;
  }
}

function ensureOptionsAreArrays(rules: any, questionType: string): any {
  if (!rules) return rules;

  console.log('Input rules:', rules);
  console.log('Question type:', questionType);

  // For dynamic conditional questions
  if (typeof rules === 'object' && Object.keys(rules).some(key => key.includes('==='))) {
    console.log('Processing conditional rules');
    
    const processedRules = Object.fromEntries(
      Object.entries(rules).map(([condition, options]) => {
        console.log('Processing condition:', condition);
        console.log('Options:', options);

        if (questionType === 'dynamic text conditional') {
          // For text conditional, keep the options as direct string values
          if (typeof options === 'object' && !Array.isArray(options)) {
            const processed = {
              correct: options.correct,
              wrong1: options.wrong1,
              wrong2: options.wrong2,
              wrong3: options.wrong3
            };
            console.log('Processed text options:', processed);
            return [condition, processed];
          }
          return [condition, options];
        } else {
          // For regular dynamic conditional
          if (Array.isArray(options)) {
            // If it's already an array, process each item
            const processed = options.map(opt => ({
              ...opt,
              correct: Array.isArray(opt.correct) ? opt.correct : [opt.correct],
              wrong1: Array.isArray(opt.wrong1) ? opt.wrong1 : [opt.wrong1],
              wrong2: Array.isArray(opt.wrong2) ? opt.wrong2 : [opt.wrong2],
              wrong3: Array.isArray(opt.wrong3) ? opt.wrong3 : [opt.wrong3]
            }));
            return [condition, processed];
          } else if (typeof options === 'object') {
            // If it's an object with direct options
            const processed = {
              correct: Array.isArray(options.correct) ? options.correct : [options.correct],
              wrong1: Array.isArray(options.wrong1) ? options.wrong1 : [options.wrong1],
              wrong2: Array.isArray(options.wrong2) ? options.wrong2 : [options.wrong2],
              wrong3: Array.isArray(options.wrong3) ? options.wrong3 : [options.wrong3]
            };
            return [condition, [processed]];
          }
          return [condition, options];
        }
      })
    );

    console.log('Final processed rules:', processedRules);
    return processedRules;
  }

  // For regular dynamic questions with options
  if (typeof rules === 'object' && (rules.correct || rules.wrong1)) {
    return {
      correct: Array.isArray(rules.correct) ? rules.correct : [rules.correct],
      wrong1: Array.isArray(rules.wrong1) ? rules.wrong1 : [rules.wrong1],
      wrong2: Array.isArray(rules.wrong2) ? rules.wrong2 : [rules.wrong2],
      wrong3: Array.isArray(rules.wrong3) ? rules.wrong3 : [rules.wrong3]
    };
  }

  // For other objects (like enum_values), return as is
  return rules;
}

export async function parseQuestionXLSX(file: File): Promise<QuestionData[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        
        // Read raw strings for static questions, but parse JSON fields normally
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          raw: false, // Keep as false to get formatted strings
          defval: ''  // Default value for empty cells
        });

        const questions: QuestionData[] = jsonData.map((row: any) => {
          const baseQuestion = {
            question_text: row.question_text || '',
            no_of_times: parseInt(row.no_of_times) || 1
          };

          switch (row.question_type) {
            case 'static': {
              // For static questions, format the numbers as percentages
              const formatOption = (value: any) => {
                if (value === undefined || value === null) return '';
                // Try to detect if it's a percentage value
                const numValue = parseFloat(value);
                if (!isNaN(numValue)) {
                  // Keep the original value and just ensure it has 2 decimal places
                  return numValue.toFixed(2) + '%';
                }
                return value.toString();
              };

              const options = [
                { 
                  option_number: 1, 
                  option_text: formatOption(row.option_1), 
                  is_correct: row.correct_option === 1 || row.correct_option === '1'
                },
                { 
                  option_number: 2, 
                  option_text: formatOption(row.option_2), 
                  is_correct: row.correct_option === 2 || row.correct_option === '2'
                },
                { 
                  option_number: 3, 
                  option_text: formatOption(row.option_3), 
                  is_correct: row.correct_option === 3 || row.correct_option === '3'
                },
                { 
                  option_number: 4, 
                  option_text: formatOption(row.option_4), 
                  is_correct: row.correct_option === 4 || row.correct_option === '4'
                }
              ];

              return {
                ...baseQuestion,
                question_type: 'static' as const,
                options
              };
            }

            case 'dynamic': {
              const dynamicRanges = safeJSONParse(row.variable_ranges);
              const optionRules = ensureOptionsAreArrays(safeJSONParse(row.option_generation_rules), 'dynamic');

              return {
                ...baseQuestion,
                question_type: 'dynamic' as const,
                template: row.template || '',
                variable_ranges: Object.fromEntries(
                  Object.entries(dynamicRanges).map(([key, value]: [string, any]) => [
                    key,
                    {
                      min: Number(value.min),
                      max: Number(value.max)
                    }
                  ])
                ),
                option_generation_rules: optionRules
              };
            }

            case 'dynamic conditional': {
              const ranges = safeJSONParse(row.variable_ranges);
              const rules = ensureOptionsAreArrays(safeJSONParse(row.option_generation_rules), 'dynamic conditional');

              return {
                ...baseQuestion,
                question_type: 'dynamic conditional' as const,
                template: row.template || '',
                variable_ranges: formatDynamicConditionalVariableRanges(ranges),
                option_generation_rules: rules
              };
            }

            case 'dynamic text conditional': {
              const ranges = safeJSONParse(row.variable_ranges);
              const rawRules = safeJSONParse(row.option_generation_rules);
              
              console.log('Raw text conditional rules:', rawRules);
              const rules = ensureOptionsAreArrays(rawRules, 'dynamic text conditional');
              console.log('Processed text conditional rules:', rules);

              return {
                ...baseQuestion,
                question_type: 'dynamic text conditional' as const,
                template: row.template || '',
                variable_ranges: formatDynamicTextVariableRanges(ranges),
                option_generation_rules: rules
              };
            }

            default:
              throw new Error(`Invalid question type: ${row.question_type}`);
          }
        });

        resolve(questions);
      } catch (error) {
        console.error('XLSX Parse Error:', error);
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsArrayBuffer(file);
  });
}
