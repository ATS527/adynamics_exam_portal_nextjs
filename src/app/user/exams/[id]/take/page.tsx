'use client'

import { use, useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'

interface Question {
  id: string
  question_text: string
  question_type: string
}

interface StaticOption {
  id: string
  option_text: string
  is_correct: boolean
  question_id: string
}

interface DynamicQuestionTemplate {
  id: string
  question_id: string
  template: string
  variable_ranges: Record<string, { min: number; max: number }>
  correct_answer_equation: string
  option_generation_rules: Record<string, string>
}

interface ExamQuestion {
  id: string
  exam_id: string
  question_id: string
  question: Question
}

interface Exam {
  id: string
  title: string
  duration_minutes: number
  force_time: number
  exam_questions: ExamQuestion[]
}

interface DynamicQuestion {
  question_text: string
  options: { id: string; option_text: string; is_correct: boolean }[]
  variables: Record<string, number>
}

const safeEvaluate = (expression: string, variables: Record<string, number>): number => {
  try {
    const variableNames = Object.keys(variables)
    const variableValues = Object.values(variables)
    
    const processedExpression = expression.replace(/\{(\w+)\}/g, (_, v) => v)
    
    const fn = new Function(...variableNames, `return ${processedExpression}`)
    return fn(...variableValues)
  } catch (error) {
    console.error('Error evaluating expression:', error, 'Expression:', expression, 'Variables:', variables)
    return 0
  }
}

const renderQuestionText = (text: string, variables: Record<string, number> | undefined) => {
  if (!variables) return text

  const operatorMap: Record<string, string> = {
    '+': '&#43;',
    '-': '&#8722;',
    '*': '&#215;',
    '/': '&#247;',
    '=': '&#61;'
  }

  let processedText = text
  Object.entries(operatorMap).forEach(([operator, entity]) => {
    processedText = processedText.replace(new RegExp('\\' + operator, 'g'), entity)
  })

  return processedText.replace(/\{(\w+)\}/g, (match, variable) => {
    const value = variables[variable]
    return value !== undefined ? value.toString() : match
  })
}

export default function ExamTakingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [exam, setExam] = useState<Exam | null>(null)
  const [staticOptions, setStaticOptions] = useState<Record<string, StaticOption[]>>({})
  const [dynamicQuestions, setDynamicQuestions] = useState<Record<string, DynamicQuestion>>({})
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [forceTimeLeft, setForceTimeLeft] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [submissionError, setSubmissionError] = useState<string | null>(null)
  const [submissionSuccess, setSubmissionSuccess] = useState(false)
  const router = useRouter()

  const generateDynamicQuestion = useCallback((template: DynamicQuestionTemplate): DynamicQuestion => {
    const variables: Record<string, number> = {}
    Object.entries(template.variable_ranges).forEach(([variable, range]) => {
      variables[variable] = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min
    })

    const questionText = template.template.replace(/\{(\w+)\}/g, (_, v) => variables[v]?.toString() || '')

    const options = Object.entries(template.option_generation_rules).map(([key, expression]) => {
      const result = safeEvaluate(expression, variables)
      
      return {
        id: `option_${key}`,
        option_text: Number.isInteger(result) ? result.toString() : result.toFixed(2),
        is_correct: key === 'correct'
      }
    })

    const correctAnswer = safeEvaluate(template.correct_answer_equation, variables)
    const correctOption = options.find(option => option.is_correct)
    
    // If there's no correct option or it doesn't match the correct answer, replace it
    if (!correctOption) {
      options.push({
        id: `option_correct_${options.length}`,
        option_text: Number.isInteger(correctAnswer) ? correctAnswer.toString() : correctAnswer.toFixed(2),
        is_correct: true
      })
    } else if (parseFloat(correctOption.option_text) !== correctAnswer) {
      correctOption.option_text = Number.isInteger(correctAnswer) ? correctAnswer.toString() : correctAnswer.toFixed(2)
    }

    // Remove duplicate options if any
    const uniqueOptions = Array.from(
      new Map(options.map(item => [item.option_text, item])).values()
    )

    // Generate additional options if needed to reach exactly 4 options
    while (uniqueOptions.length < 4) {
      const newValue = correctAnswer + Math.floor(Math.random() * 10) - 5
      if (!uniqueOptions.some(o => parseFloat(o.option_text) === newValue)) {
        uniqueOptions.push({
          id: `option_generated_${uniqueOptions.length}`,
          option_text: Number.isInteger(newValue) ? newValue.toString() : newValue.toFixed(2),
          is_correct: false
        })
      }
    }

    // If we have more than 4 options, keep only 4 (ensuring we keep the correct answer)
    if (uniqueOptions.length > 4) {
      const correctOption = uniqueOptions.find(o => o.is_correct)!
      const incorrectOptions = uniqueOptions.filter(o => !o.is_correct)
      // Randomly select 3 incorrect options
      const selectedIncorrect = incorrectOptions
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
      uniqueOptions.splice(0, uniqueOptions.length, correctOption, ...selectedIncorrect)
    }

    const shuffledOptions = [...uniqueOptions].sort(() => Math.random() - 0.5)

    return {
      question_text: questionText,
      options: shuffledOptions,
      variables
    }
  }, [])

  const fetchExamDetails = useCallback(async () => {
    try {
      setIsLoading(true)
      const { data: examData, error: examError } = await supabase
        .from('exams')
        .select(`
          id,
          title,
          duration_minutes,
          force_time,
          exam_questions (
            id,
            question_id,
            question:questions (
              id,
              question_text,
              question_type
            )
          )
        `)
        .eq('id', id)
        .single()

      if (examError) throw examError

      setExam(examData)
      setTimeLeft(examData.duration_minutes * 60)
      setForceTimeLeft(examData.force_time)

      const staticQuestionIds = examData.exam_questions
        .filter((eq: ExamQuestion) => eq.question.question_type === 'static')
        .map((eq: ExamQuestion) => eq.question_id)

      if (staticQuestionIds.length > 0) {
        const { data: staticOptionsData, error: staticOptionsError } = await supabase
          .from('static_options')
          .select('*')
          .in('question_id', staticQuestionIds)

        if (staticOptionsError) throw staticOptionsError

        const optionsByQuestionId = (staticOptionsData || []).reduce((acc: Record<string, StaticOption[]>, option: StaticOption) => {
          if (!acc[option.question_id]) {
            acc[option.question_id] = []
          }
          acc[option.question_id].push(option)
          return acc
        }, {})

        setStaticOptions(optionsByQuestionId)
      }

      const dynamicQuestionIds = examData.exam_questions
        .filter((eq: ExamQuestion) => eq.question.question_type === 'dynamic')
        .map((eq: ExamQuestion) => eq.question_id)

      if (dynamicQuestionIds.length > 0) {
        const { data: dynamicTemplatesData, error: dynamicTemplatesError } = await supabase
          .from('dynamic_question_templates')
          .select('*')
          .in('question_id', dynamicQuestionIds)

        if (dynamicTemplatesError) throw dynamicTemplatesError

        const generatedDynamicQuestions: Record<string, DynamicQuestion> = {}
        dynamicTemplatesData.forEach((template: DynamicQuestionTemplate) => {
          generatedDynamicQuestions[template.question_id] = generateDynamicQuestion(template)
        })

        setDynamicQuestions(generatedDynamicQuestions)
      }
    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }, [id, generateDynamicQuestion])

  useEffect(() => {
    fetchExamDetails()
  }, [fetchExamDetails])

  useEffect(() => {
    if (timeLeft === null) return

    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime === null || prevTime <= 0) {
          clearInterval(timer)
          handleSubmit()
          return 0
        }
        return prevTime - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft])

  useEffect(() => {
    if (forceTimeLeft === null) return

    const timer = setInterval(() => {
      setForceTimeLeft((prevTime) => {
        if (prevTime === null || prevTime <= 0) {
          clearInterval(timer)
          return 0
        }
        return prevTime - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [forceTimeLeft, currentQuestionIndex])

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers((prevAnswers) => ({
      ...prevAnswers,
      [questionId]: answer
    }))
  }

  const handleNextQuestion = () => {
    if (exam && currentQuestionIndex < exam.exam_questions.length - 1) {
      setCurrentQuestionIndex((prevIndex) => prevIndex + 1)
      setForceTimeLeft(exam.force_time)
    }
  }

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prevIndex) => prevIndex - 1)
      setForceTimeLeft(exam.force_time)
    }
  }

  const handleResetQuestion = () => {
    if (exam) {
      const currentQuestionId = exam.exam_questions[currentQuestionIndex].question.id
      setAnswers((prevAnswers) => {
        const newAnswers = { ...prevAnswers }
        delete newAnswers[currentQuestionId]
        return newAnswers
      })
    }
  }

  const handleSubmit = async () => {
    if (!exam) return

    setIsSubmitting(true)
    setSubmissionError(null)

    try {
      const unansweredQuestions = exam.exam_questions.filter(
        (q) => !answers[q.question_id]
      )

      if (unansweredQuestions.length > 0) {
        throw new Error(`Please answer all questions before submitting. ${unansweredQuestions.length} question(s) unanswered.`)
      }

      const { data: session } = await supabase.auth.getSession()
      if (!session.session) {
        throw new Error('User not authenticated')
      }

      const { data: attemptData, error: attemptError } = await supabase
        .from('user_exam_attempts')
        .insert({
          exam_id: exam.id,
          user_id: session.session.user.id,
          start_time: new Date(Date.now() - (timeLeft ?? 0) * 1000).toISOString(),
          end_time: new Date().toISOString(),
          total_questions: exam.exam_questions.length,
          time_taken: exam.duration_minutes * 60 - (timeLeft ?? 0),
        })
        .select()
        .single()

      if (attemptError) throw attemptError

      const questionResponses = Object.entries(answers).map(([questionId, userResponse]) => {
        return {
          user_exam_attempt_id: attemptData.id,
          question_id: questionId,
          selected_option_id: userResponse,
          selected_time: new Date().toISOString()
        }
      })

      const { error: responsesError } = await supabase
        .from('user_question_responses')
        .insert(questionResponses)

      if (responsesError) throw responsesError

      setSubmissionSuccess(true)
      setTimeout(() => {
        router.push('/user/dashboard')
      }, 3000)
    } catch (error: any) {
      console.error('Error submitting exam:', error.message)
      setSubmissionError(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error || !exam) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error || "Failed to load exam. Please try again."}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const currentExamQuestion = exam.exam_questions[currentQuestionIndex]
  const currentQuestion = currentExamQuestion.question
  const currentOptions = currentQuestion.question_type === 'static' 
    ? staticOptions[currentQuestion.id] || []
    : dynamicQuestions[currentQuestion.id]?.options || []

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>{exam.title}</span>
            <span>Time Left: {Math.floor((timeLeft ?? 0) / 60)}:{((timeLeft ?? 0) % 60).toString().padStart(2, '0')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-between items-center">
            <div>Question {currentQuestionIndex + 1} of {exam.exam_questions.length}</div>
            <div>Force Time: {forceTimeLeft}s</div>
          </div>
          <ScrollArea className="h-60 rounded-md border p-4">
            <h3 
              className="text-lg font-semibold mb-4"
              dangerouslySetInnerHTML={{
                __html: currentQuestion.question_type === 'static' 
                  ? currentQuestion.question_text 
                  : renderQuestionText(
                      dynamicQuestions[currentQuestion.id]?.question_text || '',
                      dynamicQuestions[currentQuestion.id]?.variables
                    )
              }}
            />
            <RadioGroup
              value={answers[currentQuestion.id] || ''}
              onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
            >
              {currentOptions.map((option, index) => (
                <div key={option.id} className="flex items-center space-x-2 mb-2">
                  <RadioGroupItem value={option.id} id={`option-${index}`} />
                  <Label htmlFor={`option-${index}`}>
                    {String.fromCharCode(65 + index)}. {' '}
                    <span dangerouslySetInnerHTML={{
                      __html: renderQuestionText(option.option_text, dynamicQuestions[currentQuestion.id]?.variables)
                    }} />
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </ScrollArea>
          <div className="flex flex-wrap gap-2">
            {exam.exam_questions.map((_, index) => (
              <Button
                key={index}
                variant={index === currentQuestionIndex ? "default" : "outline"}
                onClick={() => {
                  setCurrentQuestionIndex(index)
                  setForceTimeLeft(exam.force_time)
                }}
              >
                {index + 1}
              </Button>
            ))}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <div>
            <Button onClick={handlePreviousQuestion} disabled={currentQuestionIndex === 0}>Previous</Button>
          </div>
          <div className="space-x-2">
            <Button onClick={handleResetQuestion} variant="outline">Reset</Button>
            <Button onClick={handleNextQuestion} disabled={currentQuestionIndex === exam.exam_questions.length - 1}>Next</Button>
            <Button onClick={() => setShowConfirmDialog(true)} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Submit Exam
            </Button>
          </div>
        </CardFooter>
      </Card>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Exam Submission</DialogTitle>
            <DialogDescription>
              Are you sure you want to submit your exam? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>Confirm Submission</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {submissionError && (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{submissionError}</AlertDescription>
        </Alert>
      )}

      {submissionSuccess && (
        <Alert variant="default" className="mt-4">
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>Your exam has been submitted successfully. Redirecting to dashboard...</AlertDescription>
        </Alert>
      )}
    </div>
  )
}