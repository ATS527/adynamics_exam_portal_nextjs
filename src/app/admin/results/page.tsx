'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2, Eye } from 'lucide-react'

interface ExamResult {
  id: string
  exam: {
    id: string
    title: string
  }
  user_id: string
  user_name: string | null
  start_time: string
  end_time: string
  time_taken: number
  total_questions: number
  score: number
  correct_answers: number
  wrong_answers: number
  skipped_questions: number
}

interface AttemptDetail {
  question: string
  selected_option: string | null
  correct_option: string
  status: 'correct' | 'wrong' | 'skipped'
  isDynamic: boolean
  dynamicInfo: {
    template: string
    variableRanges: string
  } | null
}

// Helper function to format date
function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (diffInSeconds < 60) {
    return 'just now'
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    return `${hours} hour${hours > 1 ? 's' : ''} ago`
  } else {
    const days = Math.floor(diffInSeconds / 86400)
    return `${days} day${days > 1 ? 's' : ''} ago`
  }
}

export default function ResultsPage() {
  const [results, setResults] = useState<ExamResult[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [session, setSession] = useState<any>(null)
  const [selectedAttempt, setSelectedAttempt] = useState<ExamResult | null>(null)
  const [attemptDetails, setAttemptDetails] = useState<AttemptDetail[]>([])
  const [detailsLoading, setDetailsLoading] = useState(false)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    async function fetchResults() {
      if (!session) return

      try {
        // First get all exam attempts
        const { data: examAttempts, error: attemptsError } = await supabase
          .from('user_exam_attempts')
          .select(`
            id,
            exam:exams (
              id,
              title
            ),
            user_id,
            start_time,
            end_time,
            time_taken,
            total_questions,
            score,
            correct_answers,
            wrong_answers,
            skipped_questions
          `)
          .order('end_time', { ascending: false })

        if (attemptsError) throw attemptsError

        // Then get user details for each attempt
        const { data: users, error: usersError } = await supabase
          .from('users')
          .select('id, name')

        if (usersError) throw usersError

        // Map users to attempts
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const userMap = new Map(users.map((user: any) => [user.id, user.name]))
        
        const resultsWithNames = examAttempts.map(attempt => ({
          ...attempt,
          user_name: userMap.get(attempt.user_id) || 'Unknown User'
        }))

        setResults(resultsWithNames)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        console.error('Error fetching results:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchResults()
  }, [session])

  const handleViewDetails = async (attempt: ExamResult) => {
    setSelectedAttempt(attempt)
    setDetailsLoading(true)

    try {
      console.log('Fetching details for attempt:', attempt)

      // Fetch responses for this attempt
      const { data: responses, error: responsesError } = await supabase
        .from('user_question_responses')
        .select(`
          id,
          question_id,
          user_response,
          correct_answer,
          is_correct,
          questions!inner (
            id,
            question_text,
            question_type,
            template,
            variable_ranges,
            option_generation_rules
          )
        `)
        .eq('user_exam_attempt_id', attempt.id)

      console.log('Question responses:', responses)
      if (responsesError) {
        console.error('Error fetching responses:', responsesError)
        throw responsesError
      }

      // Transform the data into attempt details
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const details: AttemptDetail[] = responses?.map((response: any) => {
        const question = response.questions
        const questionText = question.question_text
        let dynamicInfo = null

        // If it's a dynamic question, prepare the dynamic info
        if (question.question_type === 'dynamic' && question.template) {
          const variableRanges = question.variable_ranges || {}
          const variableValues = Object.entries(variableRanges)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .map(([name, range]: [string, any]) => (
              `${name}: ${range.min}-${range.max}`
            ))
            .join(', ')
          
          dynamicInfo = {
            template: question.template,
            variableRanges: variableValues
          }
        }

        return {
          question: questionText,
          selected_option: response.user_response,
          correct_option: response.correct_answer,
          status: response.is_correct ? 'correct' : 
                 response.user_response ? 'wrong' : 'skipped',
          isDynamic: question.question_type === 'dynamic',
          dynamicInfo
        }
      }) || []
      
      setAttemptDetails(details)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error('Error fetching attempt details:', err)
    } finally {
      setDetailsLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <Card className="bg-destructive/10">
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Exam Results</CardTitle>
          <CardDescription>View all exam attempts and results</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableCaption>A list of all exam attempts</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Exam</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Correct</TableHead>
                <TableHead>Wrong</TableHead>
                <TableHead>Skipped</TableHead>
                <TableHead>Time Taken</TableHead>
                <TableHead>Completed</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((result) => (
                <TableRow key={result.id}>
                  <TableCell>{result.user_name}</TableCell>
                  <TableCell>{result.exam.title}</TableCell>
                  <TableCell>{result.score?.toFixed(1)}%</TableCell>
                  <TableCell>{result.correct_answers}</TableCell>
                  <TableCell>{result.wrong_answers}</TableCell>
                  <TableCell>{result.skipped_questions}</TableCell>
                  <TableCell>{Math.floor(result.time_taken / 60)}:{(result.time_taken % 60).toString().padStart(2, '0')}</TableCell>
                  <TableCell>{formatDate(result.end_time)}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleViewDetails(result)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!selectedAttempt} onOpenChange={() => setSelectedAttempt(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Attempt Details</DialogTitle>
            <DialogDescription>
              {selectedAttempt?.user_name}&apos;s attempt of {selectedAttempt?.exam.title}
            </DialogDescription>
          </DialogHeader>

          {detailsLoading ? (
            <div className="flex justify-center items-center p-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="space-y-6">
              {attemptDetails.map((detail, index) => (
                <div key={index} className="p-4 rounded-lg border">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <h3 className="font-medium">Question {index + 1}</h3>
                      <Badge
                        variant={
                          detail.status === 'correct'
                            ? 'default'
                            : detail.status === 'wrong'
                            ? 'destructive'
                            : 'secondary'
                        }
                        className={
                          detail.status === 'correct'
                            ? 'bg-green-500'
                            : undefined
                        }
                      >
                        {detail.status.charAt(0).toUpperCase() + detail.status.slice(1)}
                      </Badge>
                    </div>
                    <p className="text-gray-800">{detail.question}</p>
                    {detail.isDynamic && detail.dynamicInfo && (
                      <div className="mt-2 space-y-1 text-sm bg-gray-50 p-3 rounded-md">
                        <p className="font-medium text-gray-600">Dynamic Question Details:</p>
                        <p className="text-gray-600">
                          <span className="font-medium">Template:</span>{" "}
                          <code className="bg-gray-100 px-1 py-0.5 rounded">
                            {detail.dynamicInfo.template}
                          </code>
                        </p>
                        <p className="text-gray-600">
                          <span className="font-medium">Variable Ranges:</span>{" "}
                          <code className="bg-gray-100 px-1 py-0.5 rounded">
                            {detail.dynamicInfo.variableRanges}
                          </code>
                        </p>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-4 mt-3">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Selected Answer</p>
                        <p className="mt-1">{detail.selected_option || 'Not answered'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Correct Answer</p>
                        <p className="mt-1">{detail.correct_option}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
