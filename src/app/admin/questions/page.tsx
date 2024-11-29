'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Loader2, Plus, Download } from 'lucide-react'
import { parseQuestionXLSX } from '@/lib/xlsx-parser'
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

interface QuestionBank {
  id: string
  title: string
  description: string | null
  created_at: string | null
  updated_at: string | null
}

export default function QuestionBankPage() {
  const [questionBanks, setQuestionBanks] = useState<QuestionBank[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newBankTitle, setNewBankTitle] = useState('')
  const [newBankDescription, setNewBankDescription] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchQuestionBanks = async () => {
      const { data, error } = await supabase
        .from('question_banks')
        .select('*')
        .order('created_at', { ascending: false })

      if (!error && data) {
        setQuestionBanks(data)
      }
      setIsLoading(false)
    }

    fetchQuestionBanks()
  }, [])

  const handleCreateBank = async () => {
    if (!newBankTitle.trim()) return

    try {
      setError(null);
      const { data: bankData, error: bankError } = await supabase
        .from('question_banks')
        .insert({
          title: newBankTitle,
          description: newBankDescription || null
        })
        .select()
        .single()

      if (bankError) throw bankError

      if (selectedFile) {
        try {
          const questions = await parseQuestionXLSX(selectedFile);
          
          // Insert questions
          for (const question of questions) {
            // Insert the question
            const { data: questionData, error: questionError } = await supabase
              .from('questions')
              .insert({
                question_text: question.questionType === 'static' ? question.questionText : '',
                question_type: question.questionType,
                question_bank_id: bankData.id,
                ...(question.questionType === 'dynamic' && {
                  template: question.template,
                  variable_ranges: question.variableRanges,
                  option_generation_rules: question.optionGenerationRules,
                  correct_answer_equation: question.correctAnswerEquation
                })
              })
              .select()
              .single();

            if (questionError) {
              console.error('Question insertion error:', questionError);
              throw questionError;
            }

            // For static questions, insert options
            if (question.questionType === 'static' && question.options.length > 0) {
              const { error: optionsError } = await supabase
                .from('options')
                .insert(
                  question.options.map(opt => ({
                    question_id: questionData.id,
                    option_text: opt.optionText,
                    is_correct: opt.isCorrect
                  }))
                );

              if (optionsError) {
                console.error('Options insertion error:', optionsError);
                throw optionsError;
              }
            }
          }
        } catch (error: any) {
          console.error('Error processing XLSX:', error);
          throw new Error('Failed to process question file: ' + error.message);
        }
      }

      setQuestionBanks([bankData, ...questionBanks])
      setNewBankTitle('')
      setNewBankDescription('')
      setSelectedFile(null)
      setIsCreateDialogOpen(false)
    } catch (error: any) {
      console.error('Error creating question bank:', error)
      setError(error.message)
    }
  }

  const handleViewQuestions = (bankId: string) => {
    router.push(`/admin/questions/${bankId}`)
  }

  const handleEditBank = (bankId: string) => {
    router.push(`/admin/questions/${bankId}/edit`)
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Question Banks</h1>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Create Question Bank
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Question Bank</DialogTitle>
              <DialogDescription>
                Create a new question bank and optionally import questions from an Excel file.
              </DialogDescription>
            </DialogHeader>
            {error && (
              <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">
                {error}
              </div>
            )}
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={newBankTitle}
                  onChange={(e) => setNewBankTitle(e.target.value)}
                  placeholder="Enter bank title"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newBankDescription}
                  onChange={(e) => setNewBankDescription(e.target.value)}
                  placeholder="Enter bank description"
                />
              </div>
              <div className="space-y-2">
                <Label>Questions File (Optional)</Label>
                <div className="flex items-center gap-4">
                  <Input
                    type="file"
                    accept=".xlsx"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    onClick={() => window.open('/templates/Adynamics Question Template.xlsx')}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Template
                  </Button>
                </div>
                <p className="text-sm text-gray-500">
                  Upload an Excel file with questions. Download the template to see the required format.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setIsCreateDialogOpen(false)
                setError(null)
                setSelectedFile(null)
              }}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreateBank}
                disabled={!newBankTitle.trim()}
              >
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {questionBanks.map((bank) => (
          <div
            key={bank.id}
            className="p-4 border rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <h2 className="text-xl font-semibold">{bank.title}</h2>
            {bank.description && (
              <p className="text-gray-600 mt-2">{bank.description}</p>
            )}
            <div className="mt-4 flex gap-2">
              <Button variant="outline" onClick={() => handleViewQuestions(bank.id)}>
                View Questions
              </Button>
              <Button variant="outline" onClick={() => handleEditBank(bank.id)}>
                Edit
              </Button>
            </div>
          </div>
        ))}
      </div>

      {questionBanks.length === 0 && (
        <div className="text-center text-gray-500">
          No question banks found. Create one to get started.
        </div>
      )}
    </div>
  )
}
