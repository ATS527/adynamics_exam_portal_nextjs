'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface QuestionBank {
  id: string
  title: string
  description: string | null
}

export default function QuestionBankEditPage({ params }: { params: { id: string } }) {
  return <QuestionBankEditClient id={params.id} />
}

function QuestionBankEditClient({ id }: { id: string }) {
  const [questionBank, setQuestionBank] = useState<QuestionBank | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const fetchQuestionBank = async () => {
      try {
        const { data, error } = await supabase
          .from('question_banks')
          .select('*')
          .eq('id', id)
          .single()

        if (error) throw error

        setQuestionBank(data)
        setTitle(data.title)
        setDescription(data.description || '')
      } catch (error) {
        console.error('Error fetching question bank:', error)
        alert('Failed to load question bank')
      } finally {
        setIsLoading(false)
      }
    }

    fetchQuestionBank()
  }, [id])

  const handleSave = async () => {
    if (!title.trim()) return

    try {
      setIsSaving(true)
      const { error } = await supabase
        .from('question_banks')
        .update({
          title,
          description: description || null
        })
        .eq('id', id)

      if (error) throw error

      router.push('/admin/questions')
    } catch (error) {
      console.error('Error updating question bank:', error)
      alert('Failed to update question bank')
    } finally {
      setIsSaving(false)
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
    <div className="space-y-6 flex flex-col items-center">
      <div className="w-full max-w-2xl flex items-start">
        <h1 className="text-2xl text-start font-bold mt-5 mb-3">Edit Question Bank</h1>
      </div>

      <div className="space-y-4 max-w-2xl w-full">
        <div className='w-full'>
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter bank title"
            className='w-full'
          />
        </div>
        <div className='w-full'>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter bank description"
             className='w-full'
          />
        </div>
        <div className="flex gap-2 justify-end">
          <Button
            variant="outline"
            onClick={() => router.push('/admin/questions')}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
