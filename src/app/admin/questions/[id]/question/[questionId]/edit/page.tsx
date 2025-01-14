'use client'

import { use } from 'react'
import { Toaster } from '@/components/ui/toaster'
import EditQuestionClient from './edit-question-client'

export default function EditQuestionPage({ params }: { params: Promise<{ id: string, questionId: string }> }) {
  const { id, questionId } = use(params)
  return (
    <div className="container mx-auto">
      <EditQuestionClient questionBankId={id} questionId={questionId} />
      <Toaster />
    </div>
  )
}