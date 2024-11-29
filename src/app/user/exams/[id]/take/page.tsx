'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { use } from 'react'
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

export default function ExamTakingPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const { id } = resolvedParams
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
  const [confirmedQuestions, setConfirmedQuestions] = useState<Set<string>>(new Set())
  const [visitedQuestions, setVisitedQuestions] = useState<Set<string>>(new Set())
  const [isQuestionLocked, setIsQuestionLocked] = useState(false)
  const router = useRouter()

  const generateDynamicQuestion = useCallback((template: DynamicQuestionTemplate): DynamicQuestion => {
    // Generate random variables based on ranges
    const variables: Record<string, number> = {}
    Object.entries(template.variable_ranges).forEach(([variable, range]) => {
      variables[variable] = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min
    })

    // Generate the question text with the variables
    const questionText = template.template.replace(/\{(\w+)\}/g, (_, v) => variables[v]?.toString() || '')

    // Generate options by evaluating each mathematical expression
    const options = Object.entries(template.option_generation_rules).map(([key, expression]) => {
      // Replace variables in the expression with their values
      const evaluatedExpression = expression.replace(/\{(\w+)\}/g, (_, v) => variables[v]?.toString() || '0')
      
      // Evaluate the expression
      const result = safeEvaluate(evaluatedExpression, variables)
      
      return {
        id: key,
        option_text: Number.isInteger(result) ? result.toString() : result.toFixed(2),
        is_correct: key === 'correct'
      }
    })

    // Ensure we have the correct answer option
    const correctAnswer = safeEvaluate(template.correct_answer_equation, variables)
    const correctOption = options.find(option => option.is_correct)

    if (!correctOption) {
      options.push({
        id: 'correct',
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
      // Generate wrong options by adding or subtracting a random value between 1 and 10 from the correct answer
      const offset = Math.floor(Math.random() * 10) + 1
      const sign = Math.random() < 0.5 ? 1 : -1
      const newValue = correctAnswer + (offset * sign)
      
      if (!uniqueOptions.some(o => parseFloat(o.option_text) === newValue)) {
        uniqueOptions.push({
          id: `wrong_${uniqueOptions.length}`,
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

    // Shuffle the options
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
      // First fetch exam with questions and their dynamic templates
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
              question_type,
              template,
              variable_ranges,
              option_generation_rules,
              correct_answer_equation
            )
          )
        `)
        .eq('id', id)
        .single()

        console.log('Fetched exam data:', examData);

      if (examError) throw examError
      
      // Transform exam_questions to have nested question data
      const transformedExamData = {
        ...examData,
        exam_questions: examData.exam_questions.map((eq: any) => ({
          ...eq,
          question: {
            ...eq.question
          }
        }))
      };
      
      setExam(transformedExamData)
      setTimeLeft(examData.duration_minutes * 60)
      setForceTimeLeft(examData.force_time) // force_time is already in seconds

      // Fetch static options
      const staticQuestionIds = transformedExamData.exam_questions
        .filter((eq: ExamQuestion) => eq.question.question_type === 'static')
        .map((eq: ExamQuestion) => eq.question.id)

      if (staticQuestionIds.length > 0) {
        const { data: staticOptionsData, error: staticOptionsError } = await supabase
          .from('options')
          .select('*')
          .in('question_id', staticQuestionIds)
          .order('id')

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

      // Generate dynamic questions
      const dynamicQuestions: Record<string, DynamicQuestion> = {}
      transformedExamData.exam_questions
        .filter((eq: any) => eq.question.question_type === 'dynamic')
        .forEach((eq: any) => {
          if (eq.question.template && eq.question.variable_ranges && eq.question.option_generation_rules && eq.question.correct_answer_equation) {
            dynamicQuestions[eq.question.id] = generateDynamicQuestion({
              id: eq.question.id,
              question_id: eq.question.id,
              template: eq.question.template,
              variable_ranges: eq.question.variable_ranges,
              correct_answer_equation: eq.question.correct_answer_equation,
              option_generation_rules: eq.question.option_generation_rules
            })
          }
        })

      setDynamicQuestions(dynamicQuestions)

    } catch (error: any) {
      console.error("Error fetching exam details:", error);
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft])

  useEffect(() => {
    if (exam) {
      const currentQuestionId = exam.exam_questions[currentQuestionIndex].question.id
      if (!visitedQuestions.has(currentQuestionId)) {
        setVisitedQuestions(prev => new Set([...prev, currentQuestionId]))
        setForceTimeLeft(exam.force_time) // force_time is already in seconds
        setIsQuestionLocked(true)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestionIndex, exam])

  useEffect(() => {
    if (forceTimeLeft === null || forceTimeLeft === 0) return

    const timer = setInterval(() => {
      setForceTimeLeft((prevTime) => {
        if (prevTime === null || prevTime <= 0) {
          clearInterval(timer)
          setIsQuestionLocked(false)
          return 0
        }
        return prevTime - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [forceTimeLeft])

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers((prevAnswers) => ({
      ...prevAnswers,
      [questionId]: answer
    }))
  }

  const handleConfirmQuestion = () => {
    if (!exam) return
    const currentQuestionId = exam.exam_questions[currentQuestionIndex].question.id
    setConfirmedQuestions(prev => new Set([...prev, currentQuestionId]))
    setIsQuestionLocked(false)
    setForceTimeLeft(0)
    if (currentQuestionIndex < exam.exam_questions.length - 1) {
      handleNextQuestion()
    }
  }

  const startForceTimerIfUnvisited = (questionId: string) => {
    if (!visitedQuestions.has(questionId) && exam) {
      setForceTimeLeft(exam.force_time) // force_time is already in seconds
      setIsQuestionLocked(true)
      setVisitedQuestions(prev => new Set([...prev, questionId]))
    } else {
      setForceTimeLeft(0)
      setIsQuestionLocked(false)
    }
  }

  const handleNextQuestion = () => {
    if (!isQuestionLocked && exam && currentQuestionIndex < exam.exam_questions.length - 1) {
      const nextIndex = currentQuestionIndex + 1
      const nextQuestionId = exam.exam_questions[nextIndex].question.id
      setCurrentQuestionIndex(nextIndex)
      startForceTimerIfUnvisited(nextQuestionId)
    }
  }

  const handlePreviousQuestion = () => {
    if (!isQuestionLocked && currentQuestionIndex > 0) {
      const prevIndex = currentQuestionIndex - 1
      const prevQuestionId = exam?.exam_questions[prevIndex]?.question.id
      setCurrentQuestionIndex(prevIndex)
      if (prevQuestionId) startForceTimerIfUnvisited(prevQuestionId)
    }
  }

  const handleQuestionNavigation = (index: number) => {
    if (!isQuestionLocked && exam) {
      const targetQuestionId = exam.exam_questions[index].question.id
      setCurrentQuestionIndex(index)
      startForceTimerIfUnvisited(targetQuestionId)
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

      // Calculate timestamps
      const now = new Date()
      const timeTakenSeconds = Math.floor(exam.duration_minutes * 60 - (timeLeft ?? 0))
      
      // Format dates in ISO format for Supabase timestamptz
      const formatDate = (date: Date) => {
        return date.toISOString()
      }

      // Calculate start time based on current time minus time taken
      const startTime = new Date(now.getTime() - (timeTakenSeconds * 1000))

      // Calculate exam statistics
      let correctAnswers = 0
      let wrongAnswers = 0
      let skippedQuestions = 0

      exam.exam_questions.forEach((eq) => {
        const questionId = eq.question.id
        const userAnswer = answers[questionId]
        
        if (!userAnswer) {
          skippedQuestions++
          return
        }

        const options = eq.question.question_type === 'static' 
          ? staticOptions[questionId] || []
          : dynamicQuestions[questionId]?.options || []
        
        const selectedOption = options.find(opt => opt.id === userAnswer)
        if (selectedOption?.is_correct) {
          correctAnswers++
        } else {
          wrongAnswers++
        }
      })

      // Calculate score as percentage
      const totalQuestions = exam.exam_questions.length
      const score = (correctAnswers / totalQuestions) * 100

      const attemptData = {
        exam_id: exam.id,
        user_id: session.session.user.id,
        start_time: formatDate(startTime),
        end_time: formatDate(now),
        total_questions: totalQuestions,
        time_taken: timeTakenSeconds,
        score: score,
        correct_answers: correctAnswers,
        wrong_answers: wrongAnswers,
        skipped_questions: skippedQuestions
      }

      console.log('Submitting attempt data:', attemptData)

      const { data: savedAttempt, error: attemptError } = await supabase
        .from('user_exam_attempts')
        .insert(attemptData)
        .select()
        .single()

      if (attemptError) {
        console.error('Attempt Error:', attemptError, 'Attempt Data:', attemptData)
        throw new Error('Failed to save exam attempt')
      }

      const questionResponses = Object.entries(answers).map(([questionId, userResponse]) => {
        const question = exam.exam_questions.find(q => q.question_id === questionId)?.question
        const options = question?.question_type === 'static' 
          ? staticOptions[question.id] || []
          : dynamicQuestions?.[questionId]?.options || []
        const selectedOption = options.find(opt => opt.id === userResponse)
        const correctOption = options.find(opt => opt.is_correct)
        
        return {
          user_exam_attempt_id: savedAttempt.id,
          question_id: questionId,
          user_response: selectedOption?.option_text || null,
          correct_answer: correctOption?.option_text || null,
          is_correct: selectedOption?.is_correct || false
        }
      })

      const { error: responsesError } = await supabase
        .from('user_question_responses')
        .insert(questionResponses)

      if (responsesError) {
        console.error('Responses Error:', responsesError)
        throw new Error('Failed to save question responses')
      }

      setSubmissionSuccess(true)
      setTimeout(() => {
        router.push('/user/dashboard')
      }, 3000)
    } catch (error: any) {
      console.error('Error submitting exam:', error)
      setSubmissionError(error.message || 'Failed to submit exam')
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
            {forceTimeLeft !== null && (
              forceTimeLeft > 0 && (
                <div>Force Time: {Math.floor((forceTimeLeft) / 60)}:{(forceTimeLeft % 60).toString().padStart(2, '0')}</div>
              )
            )}
          </div>
          <ScrollArea className="h-[calc(100vh-400px)] rounded-md border p-4">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">
                {currentQuestion.question_type === 'static' 
                  ? currentQuestion.question_text 
                  : (dynamicQuestions[currentQuestion.id]?.question_text || 'Loading dynamic question...')}
              </h3>
              {currentOptions.length > 0 ? (
                <RadioGroup
                  value={answers[currentQuestion.id] || ''}
                  onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
                  className="space-y-2"
                >
                  {currentOptions.map((option, index) => (
                    <div key={option.id} className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100">
                      <RadioGroupItem value={option.id} id={`option-${index}`} />
                      <Label className="cursor-pointer flex-grow" htmlFor={`option-${index}`}>
                        {String.fromCharCode(65 + index)}. {option.option_text}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              ) : (
                <div className="text-center text-gray-500">
                  No options available for this question
                </div>
              )}
            </div>
          </ScrollArea>
          <div className="flex flex-wrap gap-2">
            {exam.exam_questions.map((eq, index) => {
              const questionId = eq.question.id;
              const isConfirmed = confirmedQuestions.has(questionId);
              const isAnswered = !!answers[questionId];
              
              let variant: "default" | "outline" | "secondary" | "success" = "outline";
              if (index === currentQuestionIndex) variant = "default";
              else if (isConfirmed) variant = "success";
              else if (isAnswered) variant = "secondary";

              return (
                <Button
                  key={index}
                  variant={variant}
                  onClick={() => handleQuestionNavigation(index)}
                  disabled={isQuestionLocked}
                  className="w-10 h-10"
                >
                  {index + 1}
                </Button>
              );
            })}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <div>
            <Button onClick={handlePreviousQuestion} disabled={currentQuestionIndex === 0 || isQuestionLocked}>Previous</Button>
          </div>
          <div className="space-x-2">
            <Button onClick={handleResetQuestion} variant="outline" disabled={isQuestionLocked}>Reset</Button>
            <Button 
              onClick={handleConfirmQuestion}
              variant="success"
              disabled={!answers[currentQuestion.id] || confirmedQuestions.has(currentQuestion.id)}
            >
              Confirm Answer
            </Button>
            <Button onClick={handleNextQuestion} disabled={currentQuestionIndex === exam.exam_questions.length - 1 || isQuestionLocked}>Next</Button>
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