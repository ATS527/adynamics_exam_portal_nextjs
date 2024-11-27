'use client'

import QuestionBankViewClient from './question-bank-view-client'

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
  const [correctAnswerEquation, setCorrectAnswerEquation] = useState('')
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
    if (newQuestionType === 'static' && !newQuestionText.trim()) return
    if (newQuestionType === 'dynamic' && (!template.trim() || !variableRanges.trim() || !correctAnswerEquation.trim())) return

    try {
      let variableRangesObj = {}
      if (newQuestionType === 'dynamic') {
        try {
          variableRangesObj = JSON.parse(variableRanges)
        } catch (e) {
          alert('Invalid variable ranges format. Please use valid JSON.')
          return
        }
      }

      const { data, error } = await supabase
        .from('questions')
        .insert({
          question_text: newQuestionType === 'static' ? newQuestionText : '',
          question_type: newQuestionType,
          question_bank_id: id,
          ...(newQuestionType === 'dynamic' && {
            template,
            variable_ranges: variableRangesObj,
            correct_answer_equation: correctAnswerEquation
          })
        })
        .select()
        .single()

      if (error) throw error

      setQuestions([data, ...questions])
      setNewQuestionText('')
      setTemplate('')
      setVariableRanges('')
      setCorrectAnswerEquation('')
      setIsCreateDialogOpen(false)
    } catch (error) {
      console.error('Error creating question:', error)
      alert('Failed to create question')
    }
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
                  This will permanently delete the question bank "{questionBank.title}" and all its questions.
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
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Question</DialogTitle>
                <DialogDescription>
                  Add a new question to this question bank.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {newQuestionType === 'static' ? (
                  <div>
                    <Label htmlFor="questionText">Question Text</Label>
                    <Textarea
                      id="questionText"
                      value={newQuestionText}
                      onChange={(e) => setNewQuestionText(e.target.value)}
                      placeholder="Enter question text"
                    />
                  </div>
                ) : (
                  <>
                    <div>
                      <Label htmlFor="template">Question Template</Label>
                      <Textarea
                        id="template"
                        value={template}
                        onChange={(e) => setTemplate(e.target.value)}
                        placeholder="Enter template (e.g., 'What is {x} + {y}?')"
                      />
                    </div>
                    <div>
                      <Label htmlFor="variableRanges">Variable Ranges (JSON)</Label>
                      <Textarea
                        id="variableRanges"
                        value={variableRanges}
                        onChange={(e) => setVariableRanges(e.target.value)}
                        placeholder='{"x": {"min": 1, "max": 10}, "y": {"min": 1, "max": 10}}'
                      />
                    </div>
                    <div>
                      <Label htmlFor="correctAnswerEquation">Correct Answer Equation</Label>
                      <Input
                        id="correctAnswerEquation"
                        value={correctAnswerEquation}
                        onChange={(e) => setCorrectAnswerEquation(e.target.value)}
                        placeholder="x + y"
                      />
                    </div>
                  </>
                )}
                <div>
                  <Label htmlFor="questionType">Question Type</Label>
                  <select
                    id="questionType"
                    value={newQuestionType}
                    onChange={(e) => setNewQuestionType(e.target.value)}
                    className="w-full border rounded-md p-2"
                  >
                    <option value="static">Static</option>
                    <option value="dynamic">Dynamic</option>
                  </select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateQuestion}>Create</Button>
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
