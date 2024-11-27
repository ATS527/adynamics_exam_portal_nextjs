'use client'

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

export default function QuestionBankViewClient({ id }: { id: string }) {
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
        setError('Failed to load question bank')
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
          setError('Invalid variable ranges format. Please use valid JSON.')
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
      setError('Failed to create question')
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
        .eq('id', id)

      if (error) throw error

      router.push('/admin/questions')
      router.refresh()
    } catch (error: any) {
      console.error('Error deleting question bank:', error)
      setError(`Failed to delete question bank: ${error.message}`)
    }
  }

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

        <div className="flex items-center gap-4">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Question
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Question</DialogTitle>
                <DialogDescription>
                  Create a new question for this question bank.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Question Type</Label>
                  <select
                    value={newQuestionType}
                    onChange={(e) => setNewQuestionType(e.target.value)}
                    className="w-full border rounded-md p-2"
                  >
                    <option value="static">Static</option>
                    <option value="dynamic">Dynamic</option>
                  </select>
                </div>

                {newQuestionType === 'static' ? (
                  <div className="space-y-2">
                    <Label>Question Text</Label>
                    <Textarea
                      value={newQuestionText}
                      onChange={(e) => setNewQuestionText(e.target.value)}
                      placeholder="Enter your question here..."
                    />
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label>Template</Label>
                      <Textarea
                        value={template}
                        onChange={(e) => setTemplate(e.target.value)}
                        placeholder="Enter template with variables in {braces}..."
                      />
                      <p className="text-sm text-gray-500">
                        Example: What is {'{x}'} + {'{y}'}?
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label>Variable Ranges (JSON format)</Label>
                      <Textarea
                        value={variableRanges}
                        onChange={(e) => setVariableRanges(e.target.value)}
                        placeholder='{"x": {"min": 1, "max": 10}, "y": {"min": 1, "max": 10}}'
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Correct Answer Equation</Label>
                      <Input
                        value={correctAnswerEquation}
                        onChange={(e) => setCorrectAnswerEquation(e.target.value)}
                        placeholder="x + y"
                      />
                      <p className="text-sm text-gray-500">
                        Use variable names in your equation
                      </p>
                    </div>
                  </>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateQuestion}>Create</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Bank
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the
                  question bank and all its questions.
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
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {questions.map((question) => (
          <div
            key={question.id}
            className="border rounded-lg p-4 hover:border-gray-400 cursor-pointer transition-colors"
            onClick={() => handleEditQuestion(question.id)}
          >
            <div className="flex justify-between items-start">
              <div>
                <div className="font-medium">
                  {question.question_type === 'static' ? (
                    question.question_text
                  ) : (
                    question.template
                  )}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  Type: {question.question_type}
                </div>
              </div>
            </div>
          </div>
        ))}

        {questions.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            No questions yet. Click "Add Question" to create one.
          </div>
        )}
      </div>
    </div>
  )
}
