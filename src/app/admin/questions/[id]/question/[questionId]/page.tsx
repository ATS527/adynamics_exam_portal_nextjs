import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { Card } from '@/components/ui/card'

interface Props {
  params: {
    id: string
    questionId: string
  }
}

export default async function QuestionPage({ params: { id, questionId } }: Props) {
  const supabase = createServerSupabaseClient()

  const { data: question, error } = await supabase
    .from('questions')
    .select('*, options(*)')
    .eq('id', questionId)
    .single()

  if (error || !question) {
    notFound()
  }

  const renderQuestionContent = () => {
    switch (question.question_type) {
      case 'static':
        return (
          <>
            <h2 className="text-xl font-semibold mb-4">{question.question_text}</h2>
            <div className="space-y-2">
              {question.options?.map((option: any) => (
                <div
                  key={option.id}
                  className={`p-3 rounded-lg border ${
                    option.is_correct ? 'border-green-500 bg-green-50' : 'border-gray-200'
                  }`}
                >
                  {option.option_text}
                </div>
              ))}
            </div>
          </>
        )

      case 'dynamic':
      case 'dynamic conditional':
      case 'dynamic text conditional':
        return (
          <>
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold">Template</h2>
                <p className="mt-2 p-3 bg-gray-50 rounded-lg">{question.template}</p>
              </div>

              <div>
                <h2 className="text-xl font-semibold">Variable Ranges</h2>
                <pre className="mt-2 p-3 bg-gray-50 rounded-lg overflow-auto">
                  {JSON.stringify(question.variable_ranges, null, 2)}
                </pre>
              </div>

              <div>
                <h2 className="text-xl font-semibold">Option Generation Rules</h2>
                <pre className="mt-2 p-3 bg-gray-50 rounded-lg overflow-auto">
                  {JSON.stringify(question.option_generation_rules, null, 2)}
                </pre>
              </div>
            </div>
          </>
        )

      default:
        return <p>Unknown question type</p>
    }
  }

  return (
    <div className="container mx-auto py-6">
      <div className="max-w-3xl mx-auto">
        <Card className="p-6">
          <div className="mb-4">
            <span className="text-sm font-medium px-2 py-1 rounded-full bg-blue-100 text-blue-800">
              {question.question_type}
            </span>
          </div>
          {renderQuestionContent()}
        </Card>
      </div>
    </div>
  )
}
