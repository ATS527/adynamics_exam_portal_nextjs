import { Database } from '@/types/supabase';

type Question = Database['public']['Tables']['questions']['Row'];

interface GeneratedOption {
  option_text: string;
  is_correct: boolean;
}

interface GeneratedQuestion {
  id: string;
  question_text: string;
  options: GeneratedOption[];
}

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function evaluateExpression(expression: string, variables: Record<string, number | string>): string {
  // Replace variables in expression
  let evalExpression = expression;
  for (const [key, value] of Object.entries(variables)) {
    evalExpression = evalExpression.replace(new RegExp(`{${key}}`, 'g'), value.toString());
  }
  
  try {
    // For numeric expressions, evaluate them
    if (/^[\d\s+\-*/().]+$/.test(evalExpression)) {
      return eval(evalExpression).toString();
    }
    // For text expressions, return as is
    return evalExpression;
  } catch (error) {
    console.error('Error evaluating expression:', error);
    return expression;
  }
}

function generateVariables(variableRanges: any): Record<string, number | string> {
  const variables: Record<string, number | string> = {};

  // Handle numeric ranges
  if (variableRanges.range_values) {
    for (const [key, range] of Object.entries<any>(variableRanges.range_values)) {
      variables[key] = getRandomInt(range.min, range.max);
    }
  }

  // Handle enum values
  if (variableRanges.enum_values) {
    for (const [key, values] of Object.entries<string[]>(variableRanges.enum_values)) {
      variables[key] = values[Math.floor(Math.random() * values.length)];
    }
  }

  return variables;
}

function generateDynamicOptions(
  variables: Record<string, number | string>,
  rules: any
): GeneratedOption[] {
  const options: GeneratedOption[] = [];

  // Add correct option
  const correctOption = evaluateExpression(rules.correct[0], variables);
  options.push({
    option_text: correctOption + (rules.correct[1] ? ` ${rules.correct[1]}` : ''),
    is_correct: true
  });

  // Add wrong options
  ['wrong1', 'wrong2', 'wrong3'].forEach(key => {
    if (rules[key]) {
      const wrongOption = evaluateExpression(rules[key][0], variables);
      options.push({
        option_text: wrongOption + (rules[key][1] ? ` ${rules[key][1]}` : ''),
        is_correct: false
      });
    }
  });

  return options;
}

function generateDynamicConditionalOptions(
  variables: Record<string, number | string>,
  rules: any
): GeneratedOption[] {
  // Find the matching condition
  for (const [condition, ruleSet] of Object.entries<any>(rules)) {
    const conditionParts = condition.split('===').map(part => part.trim());
    const variableValue = variables[conditionParts[0]];
    const expectedValue = conditionParts[1].replace(/['"]/g, '');

    if (variableValue.toString() === expectedValue) {
      return generateDynamicOptions(variables, ruleSet[0]);
    }
  }

  return [];
}

function generateDynamicTextConditionalOptions(
  variables: Record<string, number | string>,
  rules: any
): GeneratedOption[] {
  // Find the matching condition
  for (const [condition, options] of Object.entries<any>(rules)) {
    const conditionParts = condition.split('&&').map(part => {
      const [variable, value] = part.split('===').map(p => p.trim());
      return { variable, value: value.replace(/['"]/g, '') };
    });

    const conditionMet = conditionParts.every(({ variable, value }) => 
      variables[variable.split(' ')[0]]?.toString() === value
    );

    if (conditionMet) {
      return [
        { option_text: options.correct, is_correct: true },
        { option_text: options.wrong1, is_correct: false },
        { option_text: options.wrong2, is_correct: false },
        { option_text: options.wrong3, is_correct: false }
      ];
    }
  }

  return [];
}

export function generateQuestion(question: Question): GeneratedQuestion {
  switch (question.question_type) {
    case 'static':
      return {
        id: question.id,
        question_text: question.question_text,
        options: question.options?.map(opt => ({
          option_text: opt.option_text,
          is_correct: opt.is_correct
        })) || []
      };

    case 'dynamic': {
      const variables = generateVariables(question.variable_ranges);
      const questionText = evaluateExpression(question.template || '', variables);
      const options = generateDynamicOptions(variables, question.option_generation_rules);

      return {
        id: question.id,
        question_text: questionText,
        options
      };
    }

    case 'dynamic conditional': {
      const variables = generateVariables(question.variable_ranges);
      const questionText = evaluateExpression(question.template || '', variables);
      const options = generateDynamicConditionalOptions(variables, question.option_generation_rules);

      return {
        id: question.id,
        question_text: questionText,
        options
      };
    }

    case 'dynamic text conditional': {
      const variables = generateVariables(question.variable_ranges);
      const questionText = evaluateExpression(question.template || '', variables);
      const options = generateDynamicTextConditionalOptions(variables, question.option_generation_rules);

      return {
        id: question.id,
        question_text: questionText,
        options
      };
    }

    default:
      throw new Error(`Unsupported question type: ${question.question_type}`);
  }
}
