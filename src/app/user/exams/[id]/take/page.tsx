'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { use } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { cn } from '@/lib/utils';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react'

interface Question {
  id: string
  question_text: string
  question_type: string
  template?: string
  variable_ranges?: any
  option_generation_rules?: any
  options?: any[]
}

interface StaticOption {
  id: string
  option_text: string
  is_correct: boolean
  question_id: string
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

interface GeneratedQuestion {
  id: string
  question_text: string
  options: {
    option_text: string
    is_correct: boolean
  }[]
}

const safeEvaluate = (expression: string | [string, string], variables: Record<string, number>): { value: string, unit: string } => {
  try {
    if (Array.isArray(expression)) {
      const [expr, unit] = expression;
      // Replace variables in the expression
      const evaluatedExpr = expr.replace(/\{(\w+)\}/g, (_, v) => {
        const value = variables[v];
        return value !== undefined ? value.toString() : '0';
      });
      
      // Evaluate the mathematical expression
      const result = Function(...Object.keys(variables), `return ${evaluatedExpr}`)(...Object.values(variables));
      return { value: result.toString(), unit };
    } else {
      // For backwards compatibility with string expressions
      const evaluatedExpr = expression.replace(/\{(\w+)\}/g, (_, v) => {
        const value = variables[v];
        return value !== undefined ? value.toString() : '0';
      });
      const result = Function(...Object.keys(variables), `return ${evaluatedExpr}`)(...Object.values(variables));
      return { value: result.toString(), unit: '' };
    }
  } catch (error) {
    console.error('Error evaluating expression:', error, { expression, variables });
    return { value: '0', unit: '' };
  }
}

const generateQuestion = (question: Question): GeneratedQuestion => {
  if (question.question_type === 'static') {
    return {
      id: question.id,
      question_text: question.question_text,
      options: question.options.map((option: any) => ({
        option_text: option.option_text,
        is_correct: option.is_correct
      }))
    }
  } else if (question.question_type === 'dynamic') {
    // Generate random variables based on ranges
    const variables: Record<string, number> = {}
    try {
      Object.entries(question.variable_ranges).forEach(([variable, range]) => {
        if (typeof range === 'object' && range !== null && 'min' in range && 'max' in range) {
          variables[variable] = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min
        } else {
          console.error('Invalid range format:', range)
        }
      })
    } catch (error) {
      console.error('Error generating variables:', error)
    }
    console.log('Generated variables:', variables)

    // Generate the question text with the variables
    const questionText = question.template.replace(/\{(\w+)\}/g, (_, v) => {
      const value = variables[v]
      return value !== undefined ? value.toString() : ''
    })

    // Generate options based on rules
    let rules: Record<string, [string, string]> = {}
    try {
      rules = typeof question.option_generation_rules === 'string' 
        ? JSON.parse(question.option_generation_rules)
        : question.option_generation_rules;
    } catch (error) {
      console.error('Error parsing option generation rules:', error)
    }

    const options = Object.entries(rules).map(([key, expression]) => {
      try {
        const { value, unit } = safeEvaluate(expression, variables)
        const optionText = unit ? `${value} ${unit}` : value
        console.log('Option evaluation:', { key, expression, result: optionText })
        
        return {
          option_text: optionText,
          is_correct: key === 'correct'
        }
      } catch (error) {
        console.error('Error generating option:', error)
        return {
          option_text: 'Error',
          is_correct: false
        }
      }
    })

    // Filter out any duplicate options and ensure we have 4 unique options
    const uniqueOptions = options.reduce((acc: any[], option) => {
      if (!acc.some(o => o.option_text === option.option_text)) {
        acc.push(option)
      }
      return acc
    }, [])

    // Keep only 4 options (ensuring we keep the correct answer)
    if (uniqueOptions.length > 4) {
      const correctOption = uniqueOptions.find(o => o.is_correct)!
      const incorrectOptions = uniqueOptions.filter(o => !o.is_correct)
      const selectedIncorrect = incorrectOptions
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
      uniqueOptions.splice(0, uniqueOptions.length, correctOption, ...selectedIncorrect)
    }

    // Shuffle the options
    const shuffledOptions = [...uniqueOptions].sort(() => Math.random() - 0.5)

    return {
      id: question.id,
      question_text: questionText,
      options: shuffledOptions
    }
  } else if (question.question_type === 'dynamic conditional' || question.question_type === 'dynamic text conditional') {
    // Generate variables based on ranges
    const variables: Record<string, any> = {}
    try {
      if (question.variable_ranges.range_values) {
        Object.entries(question.variable_ranges.range_values).forEach(([variable, range]: [string, any]) => {
          variables[variable] = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min
        })
      }
      if (question.variable_ranges.enum_values) {
        Object.entries(question.variable_ranges.enum_values).forEach(([variable, values]: [string, any]) => {
          variables[variable] = values[Math.floor(Math.random() * values.length)]
        })
      }
    } catch (error) {
      console.error('Error generating variables:', error)
    }
    console.log('Generated variables:', variables)

    // Generate the question text with the variables
    const questionText = question.template.replace(/\{(\w+)\}/g, (_, v) => {
      const value = variables[v]
      return value !== undefined ? value.toString() : ''
    })

    // Find matching condition and get its options
    let matchingOptions = null
    try {
      const rules = question.option_generation_rules
      console.log('Rules:', rules)
      
      for (const [condition, options] of Object.entries(rules)) {
        console.log('\nChecking condition:', condition)
        console.log('Current variables:', variables)

        // Parse the condition into parts
        const parts = condition.split('&&').map(part => part.trim())
        let allConditionsMet = true

        for (const part of parts) {
          // Extract variable and value from each condition part
          const [variable, value] = part.split('===').map(s => s.trim())
          const variableValue = variables[variable]
          const expectedValue = value.replace(/^["']|["']$/g, '') // Remove quotes if present

          console.log(`Checking ${variable}=${variableValue} against ${expectedValue}`)
          
          // Case-insensitive string comparison
          if (typeof variableValue === 'string' && typeof expectedValue === 'string') {
            if (variableValue.toLowerCase() !== expectedValue.toLowerCase()) {
              allConditionsMet = false
              break
            }
          } else {
            // Numeric comparison
            if (variableValue != expectedValue) { // Use loose equality for number/string comparison
              allConditionsMet = false
              break
            }
          }
        }

        if (allConditionsMet) {
          console.log('Condition matched!')
          if (question.question_type === 'dynamic text conditional') {
            // For text conditional, use the options directly
            matchingOptions = [{
              option_text: options.correct,
              is_correct: true
            }, {
              option_text: options.wrong1,
              is_correct: false
            }, {
              option_text: options.wrong2,
              is_correct: false
            }, {
              option_text: options.wrong3,
              is_correct: false
            }]
          } else {
            // For dynamic conditional, evaluate the expressions
            matchingOptions = [{
              ...safeEvaluate(options[0].correct, variables),
              is_correct: true
            }, {
              ...safeEvaluate(options[0].wrong1, variables),
              is_correct: false
            }, {
              ...safeEvaluate(options[0].wrong2, variables),
              is_correct: false
            }, {
              ...safeEvaluate(options[0].wrong3, variables),
              is_correct: false
            }].map(opt => ({
              option_text: opt.unit ? `${opt.value} ${opt.unit}` : opt.value,
              is_correct: opt.is_correct
            }))
          }
          break
        }
      }
    } catch (error) {
      console.error('Error evaluating conditions:', error)
    }

    if (!matchingOptions) {
      console.error('No matching condition found for variables:', variables)
      matchingOptions = []
    }

    // Shuffle the options
    const shuffledOptions = [...matchingOptions].sort(() => Math.random() - 0.5)

    return {
      id: question.id,
      question_text: questionText,
      options: shuffledOptions
    }
  } else {
    return {
      id: question.id,
      question_text: question.question_text,
      options: []
    }
  }
}

export default function ExamTakingPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const { id } = resolvedParams
  const [exam, setExam] = useState<Exam | null>(null)
  const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestion[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [forceTimeLeft, setForceTimeLeft] = useState<number | null>(null)
  const [visitedQuestions, setVisitedQuestions] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [submissionError, setSubmissionError] = useState<string | null>(null)
  const [submissionSuccess, setSubmissionSuccess] = useState(false)
  const [confirmedQuestions, setConfirmedQuestions] = useState<Set<string>>(new Set())
  const router = useRouter()

  // Get current question from exam state
  const currentQuestion = exam?.exam_questions[currentQuestionIndex]?.question;
  const currentGeneratedQuestion = generatedQuestions[currentQuestionIndex];

  const fetchExamDetails = useCallback(async () => {
    try {
      setIsLoading(true)      
      // First fetch exam with questions
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
              options (*)
            )
          )
        `)
        .eq('id', id)
        .single()

      if (examError) throw examError

      // Transform exam_questions to have nested question data
      const transformedExamData = {
        ...examData,
        exam_questions: examData.exam_questions.map((eq: any) => ({
          ...eq,
          question: {
            ...eq.question,
            options: eq.question.options || []
          }
        }))
      };
      
      setExam(transformedExamData)
      setTimeLeft(examData.duration_minutes * 60)
      setForceTimeLeft(examData.force_time)

      // Generate questions using our new question generator
      const generated = transformedExamData.exam_questions.map((eq: ExamQuestion) => {
        const { question } = eq;
        try {
          return {
            ...generateQuestion(question),
            exam_question_id: eq.id
          };
        } catch (error) {
          console.error('Error generating question:', error);
          return {
            id: question.id,
            question_text: 'Error generating question',
            options: [],
            exam_question_id: eq.id
          };
        }
      });

      setGeneratedQuestions(generated)
      setIsLoading(false)
    } catch (error) {
      console.error('Error fetching exam:', error)
      setError('Failed to load exam')
      setIsLoading(false)
    }
  }, [id])

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

  // Start force timer when visiting a new question
  useEffect(() => {
    if (!exam || !currentQuestion) return;

    const questionId = currentQuestion.id;
    
    // If this question hasn't been visited before
    if (!visitedQuestions.has(questionId)) {
      setVisitedQuestions(prev => new Set([...prev, questionId]));
      setForceTimeLeft(exam.force_time);
    }
  }, [exam, currentQuestion]);

  // Handle force timer countdown
  useEffect(() => {
    if (forceTimeLeft === null || forceTimeLeft === 0) return;

    const timer = setInterval(() => {
      setForceTimeLeft(prev => {
        if (prev === null || prev <= 0) return 0;
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [forceTimeLeft]);

  // Prevent navigation during force timer
  const isNavigationLocked = forceTimeLeft !== null && forceTimeLeft > 0;

  const handleQuestionChange = (index: number) => {
    // Prevent navigation if force timer is active
    if (isNavigationLocked) {
      return;
    }
    setCurrentQuestionIndex(index);
  };

  const handleAnswerChange = (value: string) => {
    if (!currentQuestion) return;
    
    // When answer changes, remove the question from confirmed questions
    setConfirmedQuestions(prev => {
      const newSet = new Set(prev);
      newSet.delete(currentQuestion.id);
      return newSet;
    });
    
    // Update the answer
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: value
    }));
  };

  const handleConfirmQuestion = () => {
    if (!currentQuestion) return;
    setConfirmedQuestions(prev => {
      const newSet = new Set(prev);
      newSet.add(currentQuestion.id);
      return newSet;
    });
  };

  const handleResetQuestion = () => {
    if (!currentQuestion) return;
    
    // Remove the answer and confirmed status
    setAnswers(prev => {
      const newAnswers = { ...prev };
      delete newAnswers[currentQuestion.id];
      return newAnswers;
    });
    
    setConfirmedQuestions(prev => {
      const newSet = new Set(prev);
      newSet.delete(currentQuestion.id);
      return newSet;
    });
  };

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
          ? eq.question.options || []
          : generatedQuestions.find(gq => gq.exam_question_id === eq.id)?.options || []
        
        const selectedOption = options.find(opt => opt.option_text === userAnswer)
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
        const examQuestion = exam.exam_questions.find(q => q.question_id === questionId);
        const question = examQuestion?.question;
        
        let options = [];
        let generatedQuestionText = null;
        let templateText = question?.template || '';
        
        if (question?.question_type === 'static') {
          options = question.options || [];
          generatedQuestionText = question.question_text;
        } else {
          // For all dynamic question types, find the generated question using exam_question_id
          const generatedQuestion = generatedQuestions.find(gq => gq.exam_question_id === examQuestion?.id);
          if (generatedQuestion) {
            options = generatedQuestion.options || [];
            generatedQuestionText = generatedQuestion.question_text;
            
            // If generated question text is not available, try to get it from the template
            if (!generatedQuestionText && ['dynamic conditional', 'dynamic text conditional'].includes(question?.question_type || '')) {
              generatedQuestionText = templateText;
            }
          }
        }
        
        const selectedOption = options.find(opt => opt.option_text === userResponse);
        const correctOption = options.find(opt => opt.is_correct);
        
        // Create metadata object with additional information
        const metadata = {
          question_type: question?.question_type || 'static',
          template: templateText,
          generated_question: generatedQuestionText,
          original_question_text: question?.question_text,
          options: options,
          variable_ranges: question?.variable_ranges,
          option_generation_rules: question?.option_generation_rules
        };
        
        // For debugging
        console.log('Question Response:', {
          id: questionId,
          type: question?.question_type,
          template: templateText,
          generated: generatedQuestionText,
          userResponse,
          correctAnswer: correctOption?.option_text
        });
        
        return {
          user_exam_attempt_id: savedAttempt.id,
          question_id: questionId,
          user_response: userResponse,
          correct_answer: correctOption?.option_text || null,
          is_correct: selectedOption?.is_correct || false,
          metadata: metadata
        }
      });

      console.log('Saving question responses:', questionResponses);

      // First, ensure we have the correct table structure
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

  const renderQuestion = () => {
    if (!currentGeneratedQuestion) return null;

    const currentAnswer = currentQuestion ? answers[currentQuestion.id] : '';
    const isConfirmed = currentQuestion ? confirmedQuestions.has(currentQuestion.id) : false;
    const hasAnswer = Boolean(currentAnswer);

    return (
      <div className="space-y-6">
        <div className="text-lg font-medium">
          {currentGeneratedQuestion.question_text}
        </div>

        <RadioGroup
          value={currentAnswer || ''}
          onValueChange={handleAnswerChange}
          className="space-y-4"
        >
          <div className="space-y-2">
            {currentGeneratedQuestion.options.map((option, index) => (
              <div key={index} className="flex items-center space-x-2 p-2 rounded hover:bg-gray-50">
                <RadioGroupItem
                  value={option.option_text}
                  id={`option-${index}`}
                  disabled={isConfirmed}
                />
                <Label htmlFor={`option-${index}`}>{option.option_text}</Label>
              </div>
            ))}
          </div>
        </RadioGroup>

        <div className="flex justify-end space-x-4 mt-4">
          <Button
            variant="outline"
            onClick={handleResetQuestion}
            disabled={!hasAnswer || isNavigationLocked}
          >
            Reset
          </Button>
          <Button
            onClick={handleConfirmQuestion}
            disabled={!hasAnswer || isConfirmed || isNavigationLocked}
          >
            Confirm Answer
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <div className="space-y-2">
              <div>
                Question {currentQuestionIndex + 1} of {exam.exam_questions.length}
              </div>
              <div className="text-sm text-muted-foreground">
                Exam Duration: {Math.floor((timeLeft ?? 0) / 60)}:{((timeLeft ?? 0) % 60).toString().padStart(2, '0')}
              </div>
            </div>
            {isNavigationLocked && (
              <div className={cn(
                "text-sm font-medium",
                forceTimeLeft <= 10 ? "text-red-500" : "text-gray-500"
              )}>
                Question Time: {Math.floor(forceTimeLeft / 60)}:{(forceTimeLeft % 60).toString().padStart(2, '0')}
              </div>
            )}
          </CardTitle>
        </CardHeader>

        <CardContent>
          <ScrollArea className="h-[calc(100vh-400px)] rounded-md border p-4">
            {renderQuestion()}
          </ScrollArea>
        </CardContent>

        <CardFooter className="flex justify-between">
          <div className="space-x-2">
            <Button
              onClick={() => handleQuestionChange(currentQuestionIndex - 1)}
              disabled={currentQuestionIndex === 0 || isNavigationLocked}
            >
              Previous
            </Button>
            <Button
              onClick={() => handleQuestionChange(currentQuestionIndex + 1)}
              disabled={currentQuestionIndex === exam.exam_questions.length - 1 || isNavigationLocked}
            >
              Next
            </Button>
          </div>

          <div className="space-x-2">
            <Button 
              onClick={() => setShowConfirmDialog(true)}
              variant="destructive"
              disabled={isNavigationLocked}
            >
              Submit Exam
            </Button>
          </div>
        </CardFooter>
      </Card>

      <div className="mt-4 flex flex-wrap gap-2">
        {exam.exam_questions.map((eq, index) => {
          const isAnswered = answers[eq.question.id] !== undefined;
          const isConfirmed = confirmedQuestions.has(eq.question.id);
          const isCurrent = index === currentQuestionIndex;
          
          return (
            <Button
              key={eq.id}
              variant={isConfirmed ? "success" : isAnswered ? "secondary" : isCurrent ? "default" : "outline"}
              size="sm"
              onClick={() => handleQuestionChange(index)}
              disabled={isNavigationLocked}
              className={cn(
                isNavigationLocked && "cursor-not-allowed opacity-50",
                isCurrent && "ring-2 ring-primary"
              )}
            >
              {index + 1}
            </Button>
          );
        })}
      </div>

      {timeLeft !== null && timeLeft <= 300 && (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Warning</AlertTitle>
          <AlertDescription>
            Less than {Math.ceil(timeLeft / 60)} minutes remaining in the exam!
          </AlertDescription>
        </Alert>
      )}

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