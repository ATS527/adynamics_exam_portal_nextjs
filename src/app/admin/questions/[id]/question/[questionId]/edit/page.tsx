'use client'

import { use } from 'react'
import EditQuestionClient from './edit-question-client'

export default function EditQuestionPage({ params }: { params: Promise<{ id: string, questionId: string }> }) {
  const { id, questionId } = use(params)
  return <EditQuestionClient questionBankId={id} questionId={questionId} />
}
