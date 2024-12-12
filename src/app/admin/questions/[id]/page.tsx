'use client'

export default function QuestionBankPage({ params }: { params: { id: string } }) {
  return <QuestionBankViewClient id={params.id} />
}

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface Question {
  id: string
  question_text: string
  question_type: string
  created_at: string | null
  template?: string
  variable_ranges?: Record<string, { min: number; max: number }>
  option_generation_rules?: Record<string, any>
  correct_answer_equation?: string
  options?: Option[]
}

interface Option {
  id: string
  option_text: string
  is_correct: boolean
  question_id: string
  option_number: number
}

interface QuestionBank {
  id: string
  title: string
  description: string | null
}

export function QuestionBankViewClient({ id }: { id: string }) {
  const [questions, setQuestions] = useState<Question[]>([])
  const [questionBank, setQuestionBank] = useState<QuestionBank | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newQuestionText, setNewQuestionText] = useState('')
  const [newQuestionType, setNewQuestionType] = useState('static')
  const [template, setTemplate] = useState('')
  const [variableRanges, setVariableRanges] = useState('')
  const [optionGenerationRules, setOptionGenerationRules] = useState('')
  const [correctAnswerEquation, setCorrectAnswerEquation] = useState('')
  const [staticOptions, setStaticOptions] = useState([
    { option_text: '', is_correct: false },
    { option_text: '', is_correct: false },
    { option_text: '', is_correct: false },
    { option_text: '', is_correct: false }
  ])
  const [noOfTimes, setNoOfTimes] = useState(1)
  const router = useRouter()

  useEffect(() => {
    const fetchQuestionBank = async () => {
      try {
        const { data: bankData, error: bankError } = await supabase
          .from('question_banks')
          .select('*')
          .eq('id', id)
          .single()

        if (bankError) throw bankError
        setQuestionBank(bankData)

        const { data: questionsData, error: questionsError } = await supabase
          .from('questions')
          .select('*, options(*)')
          .eq('question_bank_id', id)
          .order('created_at', { ascending: false })

        if (questionsError) throw questionsError
        setQuestions(questionsData)
      } catch (error) {
        console.error('Error fetching question bank:', error)
        alert('Failed to load question bank')
      } finally {
        setIsLoading(false)
      }
    }

    fetchQuestionBank()
  }, [id])

  const handleCreateQuestion = async () => {
    setError(null);

    if (newQuestionType === 'static') {
      if (!newQuestionText.trim()) {
        setError('Please enter a question text for static questions');
        return;
      }

      const validOptions = staticOptions.filter(opt => opt.option_text.trim() !== '')
      if (validOptions.length < 2) {
        setError('Please provide at least 2 options');
        return;
      }

      const correctOptions = validOptions.filter(opt => opt.is_correct)
      if (correctOptions.length !== 1) {
        setError('Please mark exactly one option as correct');
        return;
      }
    }

    if (newQuestionType !== 'static') {
      if (!template.trim()) {
        setError(`Please provide a template for ${newQuestionType} questions`);
        return;
      }

      try {
        const parsedVariableRanges = JSON.parse(variableRanges);
        
        switch (newQuestionType) {
          case 'dynamic':
            Object.values(parsedVariableRanges).forEach(range => {
              if (typeof range.min !== 'number' || typeof range.max !== 'number') {
                throw new Error('Variable ranges must have numeric min and max values');
              }
            });
            break;

          case 'dynamic conditional':
            if (!parsedVariableRanges.range_values || !parsedVariableRanges.enum_values) {
              throw new Error('Dynamic conditional questions require both range and enum values');
            }
            break;

          case 'dynamic text conditional':
            if (!parsedVariableRanges.enum_values) {
              throw new Error('Dynamic text conditional questions require enum values');
            }
            break;
        }
      } catch (e) {
        setError(`Invalid variable ranges: ${e.message}`);
        return;
      }

      try {
        const parsedOptionRules = JSON.parse(optionGenerationRules);
        
        switch (newQuestionType) {
          case 'dynamic':
            if (!parsedOptionRules.correct || !parsedOptionRules.wrong1) {
              throw new Error('Dynamic questions must have "correct" and at least one "wrong" option');
            }
            Object.values(parsedOptionRules).forEach(option => {
              if (!Array.isArray(option) || option.length !== 2 || 
                  typeof option[0] !== 'string' || typeof option[1] !== 'string') {
                throw new Error('Each option must be an array with [equation, units]');
              }
            });
            break;

          case 'dynamic conditional':
            Object.values(parsedOptionRules).forEach(conditionOptions => {
              if (!Array.isArray(conditionOptions)) {
                throw new Error('Dynamic conditional options must be an array of condition-specific option sets');
              }
              
              conditionOptions.forEach(optionSet => {
                if (!optionSet.correct || !optionSet.wrong1) {
                  throw new Error('Each condition must have "correct" and at least one "wrong" option');
                }
                
                Object.values(optionSet).forEach(option => {
                  if (!Array.isArray(option) || option.length !== 2 || 
                      typeof option[0] !== 'string' || typeof option[1] !== 'string') {
                    throw new Error('Each option must be an array with [equation, units]');
                  }
                });
              });
            });
            break;

          case 'dynamic text conditional':
            Object.values(parsedOptionRules).forEach(optionSet => {
              if (!optionSet.correct || !optionSet.wrong1) {
                throw new Error('Each condition must have "correct" and at least one "wrong" option');
              }
              
              Object.values(optionSet).forEach(option => {
                if (typeof option !== 'string') {
                  throw new Error('Options must be strings for text conditional questions');
                }
              });
            });
            break;
        }
      } catch (e) {
        setError(`Invalid option generation rules: ${e.message}`);
        return;
      }
    }

    try {
      if (newQuestionType === 'static') {
        // Insert question first
        const { data: insertedQuestion, error: questionError } = await supabase
          .from('questions')
          .insert({
            question_bank_id: id,
            question_text: newQuestionText,
            question_type: 'static'
          })
          .select()
          .single()

        if (questionError) throw questionError

        // Insert options
        const optionsToInsert = staticOptions
          .filter(opt => opt.option_text.trim() !== '')
          .map((opt, index) => ({
            question_id: insertedQuestion.id,
            option_text: opt.option_text,
            is_correct: opt.is_correct,
            option_number: index + 1
          }))

        const { error: optionsError } = await supabase
          .from('options')
          .insert(optionsToInsert)

        if (optionsError) throw optionsError

        // Update questions state
        setQuestions([insertedQuestion, ...questions])
      } else {
        // Dynamic question creation
        const variableRangesObj = JSON.parse(variableRanges)
        const optionRulesObj = JSON.parse(optionGenerationRules)

        const { data, error } = await supabase
          .from('questions')
          .insert({
            question_bank_id: id,
            question_type: newQuestionType,
            template,
            variable_ranges: variableRangesObj,
            option_generation_rules: optionRulesObj,
            // Explicitly set question_text to template for non-static questions
            question_text: template || 'Dynamic Question',
            // Add number of times
            no_of_times: noOfTimes
          })
          .select()
          .single()

        if (error) throw error

        setQuestions([data, ...questions])
      }

      // Reset form
      setNewQuestionText('')
      setTemplate('')
      setVariableRanges('')
      setOptionGenerationRules('')
      setNoOfTimes(1)  // Reset to default
      setIsCreateDialogOpen(false)
    } catch (error: any) {
      console.error('Error creating question:', error)
      setError(error.message)
    }
  }

  const updateStaticOption = (index: number, field: 'option_text' | 'is_correct', value: string | boolean) => {
    const newOptions = [...staticOptions]
    newOptions[index] = {
      ...newOptions[index],
      [field]: value
    }
    setStaticOptions(newOptions)
  }

  const handleEditQuestion = (questionId: string) => {
    router.push(`/admin/questions/${id}/question/${questionId}/edit`)
  }

  const handleDeleteQuestionBank = async () => {
    try {
      const { error } = await supabase
        .from('question_banks')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting question bank:', error);
        throw error;
      }

      router.push('/admin/questions');
      router.refresh();
    } catch (error: any) {
      console.error('Error deleting question bank:', error);
      setError(`Failed to delete question bank: ${error.message}`);
    }
  };

  const getTemplateExample = (questionType: string) => {
    switch (questionType) {
      case 'dynamic':
        return 'What is {x} + {y}?';
      case 'dynamic conditional':
        return 'If {x} is greater than {y}, what is {x} - {y}?';
      case 'dynamic text conditional':
        return 'If {x} is greater than {y}, what is the {adjective} {noun}?';
      default:
        return '';
    }
  };

  const getVariableRangesExample = (questionType: string) => {
    switch (questionType) {
      case 'dynamic':
        return '{"x": {"min": 1, "max": 10}, "y": {"min": 1, "max": 10}}';
      case 'dynamic conditional':
        return '{"x": {"min": 1, "max": 10}, "y": {"min": 1, "max": 10}}';
      case 'dynamic text conditional':
        return '{"x": {"min": 1, "max": 10}, "y": {"min": 1, "max": 10}, "adjective": {"min": 1, "max": 10}, "noun": {"min": 1, "max": 10}}';
      default:
        return '';
    }
  };

  const getOptionRulesExample = (type: string) => {
    switch (type) {
      case 'static':
        return 'N/A'
      case 'dynamic':
        return JSON.stringify({
          "wrong1": ["{x} - {y}", "units"],
          "wrong2": ["{x} * {y}", "units"],
          "wrong3": ["{x} + {y} + 1", "units"],
          "correct": ["{x}+{y}", "units"]
        }, null, 2)
      case 'dynamic conditional':
        return JSON.stringify({
          "direction === E": [{
            "wrong1": ["{x} + {y} + 1", "units"],
            "wrong2": ["{x} / {y}", "units"],
            "wrong3": ["{x}-{y}", "units"],
            "correct": ["x+y", "units"]
          }],
          "direction === W": [{
            "wrong1": ["{x} - {y} - 1", "units"],
            "wrong2": ["{x} * {y}", "units"],
            "wrong3": ["{x}+{y}", "units"],
            "correct": ["x-y", "units"]
          }]
        }, null, 2)
      case 'dynamic text conditional':
        return JSON.stringify({
          "hemisphere === Northern && direction === East": {
            "wrong1": "Wrong Option 1",
            "wrong2": "Wrong Option 2", 
            "wrong3": "Wrong Option 3",
            "correct": "No error"
          },
          "hemisphere === Southern && direction === East": {
            "wrong1": "Wrong Option 1",
            "wrong2": "Wrong Option 2",
            "wrong3": "Wrong Option 3", 
            "correct": "No error whatsover"
          },
          "hemisphere === Northern && direction === North East": {
            "wrong1": "Wrong Option 1",
            "wrong2": "Wrong Option 2",
            "wrong3": "Wrong Option 3",
            "correct": "Apparent Turn to North Pole, Compass Turns Clockwise, Liquid Swirl increases error"
          },
          "hemisphere === Southern && direction === North East": {
            "wrong1": "Wrong Option 1", 
            "wrong2": "Wrong Option 2",
            "wrong3": "Wrong Option 3",
            "correct": "Apparent Turn to South Pole, Compass Turns Anti Clockwise, Liquid Swirl increases error"
          }
        }, null, 2)
      default:
        return ''
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!questionBank) {
    return (
      <div className="text-center text-red-600">
        Question bank not found
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{questionBank.title}</h1>
          {questionBank.description && (
            <p className="text-gray-600 mt-1">{questionBank.description}</p>
          )}
        </div>
        <div className="flex gap-4">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" /> Delete Question Bank
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete the question bank &quot;{questionBank.title}&quot; and all its questions.
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteQuestionBank}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Add Question
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
              <DialogHeader className="sticky top-0 bg-white z-10 pb-2">
                <DialogTitle>Add Question</DialogTitle>
                <DialogDescription>
                  Add a new question to this question bank.
                </DialogDescription>
              </DialogHeader>
              <div className="overflow-y-auto flex-grow pr-4">
                <div className="space-y-4">
                  {newQuestionType === 'static' ? (
                    <>
                      <div>
                        <Label htmlFor="questionText">Question Text</Label>
                        <Textarea
                          id="questionText"
                          value={newQuestionText}
                          onChange={(e) => setNewQuestionText(e.target.value)}
                          placeholder="Enter question text"
                          className="mb-4"
                        />
                      </div>
                      <div className="space-y-4">
                        <Label>Options</Label>
                        {staticOptions.map((option, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <Textarea
                              value={option.option_text}
                              onChange={(e) => updateStaticOption(index, 'option_text', e.target.value)}
                              placeholder={`Option ${index + 1}`}
                              className="flex-grow"
                            />
                            <div className="flex items-center">
                              <Label htmlFor={`correct-${index}`} className="mr-2">Correct</Label>
                              <input
                                id={`correct-${index}`}
                                type="checkbox"
                                checked={option.is_correct}
                                onChange={(e) => {
                                  // Uncheck all other options when one is checked
                                  const newOptions = staticOptions.map((opt, i) => ({
                                    ...opt,
                                    is_correct: i === index ? e.target.checked : false
                                  }))
                                  setStaticOptions(newOptions)
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <Label htmlFor="template">Question Template</Label>
                        <Textarea
                          id="template"
                          value={template}
                          onChange={(e) => setTemplate(e.target.value)}
                          placeholder={getTemplateExample(newQuestionType)}
                          className="min-h-[100px]"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Example template for {newQuestionType}: {getTemplateExample(newQuestionType)}
                        </p>
                      </div>
                      <div>
                        <Label htmlFor="variableRanges">Variable Ranges (JSON)</Label>
                        <Textarea
                          id="variableRanges"
                          value={variableRanges}
                          onChange={(e) => setVariableRanges(e.target.value)}
                          placeholder={getVariableRangesExample(newQuestionType)}
                          className="min-h-[100px]"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Example variable ranges for {newQuestionType}
                        </p>
                      </div>
                      <div>
                        <Label htmlFor="optionGenerationRules">Option Generation Rules (JSON)</Label>
                        <Textarea
                          id="optionGenerationRules"
                          value={optionGenerationRules}
                          onChange={(e) => setOptionGenerationRules(e.target.value)}
                          placeholder={getOptionRulesExample(newQuestionType)}
                          className="min-h-[150px]"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Specify options with their equations, units, and correctness
                        </p>
                      </div>
                      <div>
                        <Label htmlFor="noOfTimes">Number of Questions to Generate</Label>
                        <Input
                          id="noOfTimes"
                          type="number"
                          min="1"
                          max="100"
                          value={noOfTimes}
                          onChange={(e) => setNoOfTimes(Number(e.target.value))}
                          placeholder="Enter number of questions to generate"
                          className="w-full"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          How many variations of this question should be generated?
                        </p>
                      </div>
                    </>
                  )}
                  <div>
                    <Label htmlFor="questionType">Question Type</Label>
                    <select
                      id="questionType"
                      value={newQuestionType}
                      onChange={(e) => {
                        setNewQuestionType(e.target.value as 'static' | 'dynamic' | 'dynamic conditional' | 'dynamic text conditional')
                        // Reset form fields when type changes
                        setNewQuestionText('')
                        setStaticOptions([
                          { option_text: '', is_correct: false },
                          { option_text: '', is_correct: false },
                          { option_text: '', is_correct: false },
                          { option_text: '', is_correct: false }
                        ])
                        setTemplate('')
                        setVariableRanges('')
                        setOptionGenerationRules('')
                      }}
                      className="w-full border rounded-md p-2"
                    >
                      <option value="static">Static</option>
                      <option value="dynamic">Dynamic</option>
                      <option value="dynamic conditional">Dynamic Conditional</option>
                      <option value="dynamic text conditional">Dynamic Text Conditional</option>
                    </select>
                  </div>
                </div>
              </div>
              <DialogFooter className="flex justify-end items-center space-x-2 border-t pt-3 mt-4 bg-gray-50 px-6 py-4">
                <Button 
                  variant="outline" 
                  onClick={() => setIsCreateDialogOpen(false)}
                  className="mr-2"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateQuestion}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4">
        {error && (
          <div className="col-span-full p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">
            {error}
          </div>
        )}
        {questions.map((question) => (
          <div
            key={question.id}
            className="p-4 border rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start">
              <div className="space-y-2 flex-1">
                {question.question_type === 'static' ? (
                  <>
                    <p className="font-medium">{question.question_text}</p>
                    {question.options && question.options.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm font-medium text-gray-600">Options:</p>
                        <ul className="mt-1 space-y-1">
                          {question.options.map((option) => (
                            <li
                              key={option.id}
                              className={`text-sm ${
                                option.is_correct ? 'text-green-600 font-medium' : 'text-gray-600'
                              }`}
                            >
                              {option.is_correct && '✓ '}
                              {option.option_text}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <p className="font-medium">Template: {question.template}</p>
                    <div className="text-sm text-gray-600">
                      <p>Variables:</p>
                      <ul className="list-disc list-inside ml-4">
                        {question.variable_ranges && Object.entries(question.variable_ranges).map(([variable, range]) => (
                          <li key={variable}>
                            {variable}: {range.min} to {range.max}
                          </li>
                        ))}
                      </ul>
                      {question.option_generation_rules && (
                        <div className="mt-2">
                          <p className="font-medium">Option Generation Rules:</p>
                          <pre className="mt-1 text-xs bg-gray-50 p-2 rounded">
                            {JSON.stringify(question.option_generation_rules, null, 2)}
                          </pre>
                        </div>
                      )}
                      <p className="mt-2">Correct Answer: {question.correct_answer_equation}</p>
                    </div>
                  </>
                )}
                <p className="text-sm text-gray-500">
                  Type: {question.question_type}
                </p>
              </div>
              <Button variant="outline" onClick={() => handleEditQuestion(question.id)}>
                Edit
              </Button>
            </div>
          </div>
        ))}
      </div>

      {questions.length === 0 && (
        <div className="text-center text-gray-500">
          No questions found. Add one to get started.
        </div>
      )}
    </div>
  )
}
