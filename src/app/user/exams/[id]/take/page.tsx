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
import { Badge } from '@/components/ui/badge';
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
  no_of_times?: number
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

interface GeneratedQuestion {
  id: string
  question_text: string
  options: {
    option_text: string
    is_correct: boolean
  }[]
  exam_question_id: string
  original_question_id: string
  instance_index: number
}

// Add a utility function for shuffling arrays
const shuffleArray = <T extends any>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

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
    // Shuffle options for static questions
    const shuffledOptions = shuffleArray(question.options).map((option: any) => ({
      option_text: option.option_text,
      is_correct: option.is_correct
    }));

    return {
      id: question.id,
      question_text: question.question_text,
      options: shuffledOptions
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

    // Shuffle the generated options
    const shuffledOptions = shuffleArray(uniqueOptions);
    
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

    // Shuffle the generated options
    const shuffledOptions = shuffleArray(matchingOptions);
    
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
  const [questionOrder, setQuestionOrder] = useState<Record<string, number>>({});
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
              options (*),
              no_of_times
            )
          )
        `)
        .eq('id', id)
        .single()

      if (examError) throw examError

      // Transform exam_questions and generate multiple instances based on no_of_times
      const expandedExamQuestions = examData.exam_questions.flatMap((eq: any) => {
        const timesToGenerate = eq.question.no_of_times || 1;
        return Array(timesToGenerate).fill(null).map((_, instanceIndex) => ({
          ...eq,
          id: `${eq.id}_${instanceIndex}`,
          question: {
            ...eq.question,
            id: `${eq.question.id}_${instanceIndex}`,
            options: eq.question.options || []
          }
        }));
      });

      // Shuffle the expanded questions
      const shuffledExamQuestions = shuffleArray(expandedExamQuestions);

      const transformedExamData = {
        ...examData,
        exam_questions: shuffledExamQuestions
      };
      
      setExam(transformedExamData)
      setTimeLeft(examData.duration_minutes * 60)
      setForceTimeLeft(examData.force_time)

      // Generate questions using our question generator
      const generated = transformedExamData.exam_questions.map((eq: ExamQuestion) => {
        const { question } = eq;
        try {
          const generatedQuestion = generateQuestion(question);
          return {
            ...generatedQuestion,
            id: eq.question.id,
            exam_question_id: eq.id,
            original_question_id: question.id.split('_')[0],
            instance_index: parseInt(question.id.split('_')[1] || '0')
          };
        } catch (error) {
          console.error('Error generating question:', error);
          return {
            id: question.id,
            question_text: 'Error generating question',
            options: [],
            exam_question_id: eq.id,
            original_question_id: question.id.split('_')[0],
            instance_index: parseInt(question.id.split('_')[1] || '0')
          };
        }
      });

      // Store the original order for submission
      const questionOrder = shuffledExamQuestions.map(eq => ({
        id: eq.question.id,
        originalIndex: examData.exam_questions.findIndex(
          (original: any) => original.question.id.split('_')[0] === eq.question.id.split('_')[0]
        )
      }));
      
      setGeneratedQuestions(generated);
      // Store the question order in state
      setQuestionOrder(questionOrder.reduce((acc, curr) => ({ ...acc, [curr.id]: curr.originalIndex }), {}));
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
    if (timeLeft === null || submissionSuccess || isLoading) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null) return null;
        if (prev <= 0) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, submissionSuccess, isLoading]);

  useEffect(() => {
    if (timeLeft === null || timeLeft > 300) return;
    
    if (timeLeft === 300) {
      // toast({
      //   title: "5 minutes remaining",
      //   description: "Your exam will be automatically submitted when the time is up.",
      //   variant: "destructive",
      // });
    } else if (timeLeft === 60) {
      // toast({
      //   title: "1 minute remaining",
      //   description: "Your exam will be automatically submitted soon.",
      //   variant: "destructive",
      // });
    }
  }, [timeLeft]);

  useEffect(() => {
    if (!exam || !currentQuestion) return;

    const questionId = currentQuestion.id;
    
    // If this question hasn't been visited before
    if (!visitedQuestions.has(questionId)) {
      setVisitedQuestions(prev => new Set([...prev, questionId]));
      setForceTimeLeft(exam.force_time);
    }
  }, [exam, currentQuestion]);

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
    try {
      setIsSubmitting(true)

      const { data: session } = await supabase.auth.getSession()
      if (!session.session) {
        throw new Error('User not authenticated')
      }

      // Calculate start time based on exam duration and time left
      const totalExamSeconds = exam.duration_minutes * 60
      const remainingSeconds = timeLeft ?? 0
      const elapsedSeconds = totalExamSeconds - remainingSeconds
      const startTime = new Date(Date.now() - (elapsedSeconds * 1000))

      // Prepare attempt data
      const attemptData = {
        exam_id: exam.id,
        user_id: session.session.user.id,
        start_time: startTime.toISOString(),
        end_time: new Date().toISOString(),
      }

      // Insert exam attempt
      const { data: savedAttempt, error: attemptError } = await supabase
        .from('user_exam_attempts')
        .insert(attemptData)
        .select()
        .single()

      if (attemptError) {
        console.error('Attempt Error:', attemptError)
        throw new Error('Failed to save exam attempt')
      }

      // Helper function to extract base UUID
      const extractBaseUuid = (id: string) => {
        // Split by underscore and take the first part (base UUID)
        const parts = id.split('_')
        return parts[0]
      }

      // Calculate exam results
      const totalQuestions = exam.exam_questions.length
      const processedQuestions = exam.exam_questions.map((eq) => {
        const questionId = eq.question.id
        const userAnswer = answers[questionId]
        
        // If no answer provided, mark as skipped
        if (!userAnswer) {
          return { 
            status: 'skipped',
            questionId: extractBaseUuid(questionId),
            userAnswer: null,
            isCorrect: false,
            correctAnswer: null
          }
        }

        // For dynamic questions, find the correct options
        const options = eq.question.question_type === 'static' 
          ? eq.question.options || []
          : generatedQuestions.find(gq => gq.exam_question_id === eq.id)?.options || []
        
        const selectedOption = options.find(opt => opt.option_text === userAnswer)
        const correctOption = options.find(opt => opt.is_correct)
        
        return {
          status: selectedOption?.is_correct ? 'correct' : 'wrong',
          questionId: extractBaseUuid(questionId),
          userAnswer: userAnswer,
          isCorrect: selectedOption?.is_correct || false,
          correctAnswer: correctOption?.option_text || null
        }
      })

      // Count results
      const correctAnswers = processedQuestions.filter(q => q.status === 'correct').length
      const wrongAnswers = processedQuestions.filter(q => q.status === 'wrong').length
      const skippedQuestions = processedQuestions.filter(q => q.status === 'skipped').length

      // Calculate score (percentage of correct answers)
      const score = Math.round((correctAnswers / totalQuestions) * 100)

      // Prepare detailed question responses
      const questionResponses = processedQuestions.map((question) => ({
        user_exam_attempt_id: savedAttempt.id,
        question_id: question.questionId,
        user_response: question.userAnswer,
        is_correct: question.status === 'correct',
        correct_answer: question.correctAnswer,
        metadata: JSON.stringify({
          status: question.status,
          original_question_id: question.questionId
        })
      }))

      // Insert question responses
      if (questionResponses.length > 0) {
        const { error: responsesError } = await supabase
          .from('user_question_responses')
          .insert(questionResponses)

        if (responsesError) {
          console.error('Responses Error:', JSON.stringify(responsesError))
        }
      }

      // Update user exam attempt with results
      const { error: updateError } = await supabase
        .from('user_exam_attempts')
        .update({
          score: score,
          total_questions: totalQuestions,
          correct_answers: correctAnswers,
          wrong_answers: wrongAnswers,
          skipped_questions: skippedQuestions,
          time_taken: elapsedSeconds // time taken in seconds
        })
        .eq('id', savedAttempt.id)

      if (updateError) {
        console.error('Update Error:', JSON.stringify(updateError))
        throw new Error('Failed to save exam results')
      }

      setSubmissionSuccess(true)
      setTimeout(() => {
        router.push('/user/dashboard')
      }, 3000)
    } catch (error: any) {
      console.error('Error submitting exam:', error.message || error)
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
            disabled={!hasAnswer}
          >
            Reset
          </Button>
          <Button
            onClick={handleConfirmQuestion}
            disabled={!hasAnswer || isConfirmed}
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
            {forceTimeLeft !== null && forceTimeLeft > 0 && (
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
              key={eq.question.id}
              variant={
                isConfirmed
                  ? 'default'
                  : isAnswered
                  ? 'secondary'
                  : 'outline'
              }
              className={cn(
                'w-10 h-10',
                isCurrent && 'ring-2 ring-primary',
                isConfirmed && 'bg-green-500 hover:bg-green-600'
              )}
              onClick={() => handleQuestionChange(index)}
            >
              {index + 1}
            </Button>
          );
        })}
      </div>

      <div className="mt-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">
            Question {currentQuestionIndex + 1}
            {currentQuestion?.question_type !== 'static' && (
              <span className="ml-2 text-sm text-gray-500">
                (Dynamic Question)
              </span>
            )}
          </h3>
          <Badge variant={
            confirmedQuestions.has(currentQuestion?.id || '') 
              ? "default" 
              : "secondary"
          }>
            {confirmedQuestions.has(currentQuestion?.id || '') 
              ? "Confirmed" 
              : "Not Confirmed"
            }
          </Badge>
        </div>
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