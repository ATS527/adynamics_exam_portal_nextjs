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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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
  const [newQuestionType, setNewQuestionType] = useState<'static' | 'dynamic' | 'dynamic conditional' | 'dynamic text conditional'>('static')
  const [template, setTemplate] = useState('')
  const [variableRanges, setVariableRanges] = useState('')
  const [optionGenerationRules, setOptionGenerationRules] = useState('')
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
    if (newQuestionType !== 'static' && (!template.trim() || !variableRanges.trim() || !optionGenerationRules.trim())) return

    try {
      let variableRangesObj = {}
      let optionRulesObj = {}

      if (newQuestionType !== 'static') {
        try {
          variableRangesObj = JSON.parse(variableRanges)
          optionRulesObj = JSON.parse(optionGenerationRules)
        } catch (e) {
          setError('Invalid JSON format in variable ranges or option rules')
          return
        }
      }

      const { data, error } = await supabase
        .from('questions')
        .insert({
          question_bank_id: id,
          question_type: newQuestionType,
          ...(newQuestionType === 'static'
            ? { question_text: newQuestionText }
            : {
                template,
                variable_ranges: variableRangesObj,
                option_generation_rules: optionRulesObj,
              }),
        })
        .select()
        .single()

      if (error) throw error

      setQuestions([data, ...questions])
      setNewQuestionText('')
      setTemplate('')
      setVariableRanges('')
      setOptionGenerationRules('')
      setIsCreateDialogOpen(false)
    } catch (error: any) {
      console.error('Error creating question:', error)
      setError(error.message)
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

  const getTemplateExample = (type: string) => {
    switch (type) {
      case 'dynamic':
        return 'What is {x} + {y}?'
      case 'dynamic conditional':
        return 'Find Track (M)? If Track (T) is {x}° and Variation is {y}°{direction}'
      case 'dynamic text conditional':
        return 'What happens to Magnetic Compass when in the {hemisphere} Hemisphere and Accelerating in {direction} Direction?'
      default:
        return ''
    }
  }

  const getVariableRangesExample = (type: string) => {
    switch (type) {
      case 'dynamic':
        return '{"x": {"min": 1, "max": 10}, "y": {"min": 1, "max": 10}}'
      case 'dynamic conditional':
        return '{"range_values":{"x":{"min":0,"max":180},"y":{"min":0,"max":10}},"enum_values":{"direction":["W","E"]}}'
      case 'dynamic text conditional':
        return '{"enum_values":{"hemisphere":["Northern","Southern"],"direction":["North East","East"]}}'
      default:
        return ''
    }
  }

  const getOptionRulesExample = (type: string) => {
    switch (type) {
      case 'dynamic':
        return '{"correct": ["{x}+{y}","units"],"wrong1": ["{x} - {y}", "units"], "wrong2": ["{x} * {y}", "units"], "wrong3": ["{x} + {y} + 1", "units"]}'
      case 'dynamic conditional':
        return '{"direction === W":[{"correct":["x-y","units"],"wrong1":["{x} - {y} - 1","units"],"wrong2":["{x} * {y}","units"],"wrong3":["{x}+{y}","units"]}],"direction === E":[{"correct":["x+y","units"],"wrong1":["{x} + {y} + 1","units"],"wrong2":["{x} / {y}","units"],"wrong3":["{x}-{y}","units"]}]}'
      case 'dynamic text conditional':
        return '{"hemisphere === Northern && direction === North East":{"correct":"Apparent Turn to North Pole, Compass Turns Clockwise, Liquid Swirl increases error","wrong1":"Wrong Option 1","wrong2":"Wrong Option 2","wrong3":"Wrong Option 3"}}'
      default:
        return ''
    }
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
                  <Select
                    value={newQuestionType}
                    onValueChange={(value: any) => {
                      setNewQuestionType(value)
                      // Reset fields when type changes
                      setNewQuestionText('')
                      setTemplate('')
                      setVariableRanges('')
                      setOptionGenerationRules('')
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select question type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="static">Static</SelectItem>
                      <SelectItem value="dynamic">Dynamic</SelectItem>
                      <SelectItem value="dynamic conditional">Dynamic Conditional</SelectItem>
                      <SelectItem value="dynamic text conditional">Dynamic Text Conditional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {newQuestionType === 'static' ? (
                  <div className="space-y-2">
                    <Label>Question Text</Label>
                    <Textarea
                      value={newQuestionText}
                      onChange={(e) => setNewQuestionText(e.target.value)}
                      placeholder="Enter your question text"
                    />
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label>Question Template</Label>
                      <Textarea
                        value={template}
                        onChange={(e) => setTemplate(e.target.value)}
                        placeholder="Enter template with variables in {brackets}"
                      />
                      <p className="text-sm text-gray-500">
                        Example: {getTemplateExample(newQuestionType)}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label>Variable Ranges</Label>
                      <Textarea
                        value={variableRanges}
                        onChange={(e) => setVariableRanges(e.target.value)}
                        placeholder="Enter variable ranges in JSON format"
                      />
                      <p className="text-sm text-gray-500">
                        Example: {getVariableRangesExample(newQuestionType)}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label>Option Generation Rules</Label>
                      <Textarea
                        value={optionGenerationRules}
                        onChange={(e) => setOptionGenerationRules(e.target.value)}
                        placeholder="Enter option generation rules in JSON format"
                      />
                      <p className="text-sm text-gray-500">
                        Example: {getOptionRulesExample(newQuestionType)}
                      </p>
                    </div>
                  </>
                )}
              </div>

              <DialogFooter>
                <Button
                  onClick={handleCreateQuestion}
                  disabled={
                    newQuestionType === 'static'
                      ? !newQuestionText.trim()
                      : !template.trim() || !variableRanges.trim() || !optionGenerationRules.trim()
                  }
                >
                  Create Question
                </Button>
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
                  {question.question_text}
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
            No questions yet. Click &quot;Add Question&quot; to create one.
          </div>
        )}
      </div>
    </div>
  )
}
