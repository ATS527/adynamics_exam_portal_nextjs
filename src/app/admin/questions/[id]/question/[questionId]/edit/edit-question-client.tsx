'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dot, Loader2, Plus, X } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'

interface Question {
  id: string
  question_text: string
  question_type: string
  template?: string
  variable_ranges?: Record<string, { min: number; max: number } | { enum_values: string[] } | { enums: string[] }>
  option_generation_rules?: Record<string, any>
  no_of_times?: number
}

interface Option {
  id: string
  option_text: string
  is_correct: boolean
  question_id: string
}

export default function EditQuestionClient({
  questionBankId,
  questionId,
}: {
  questionBankId: string
  questionId: string
}) {
  const [question, setQuestion] = useState<Question | null>(null)
  const [questionType, setQuestionType] = useState<'static' | 'dynamic' | 'dynamic conditional' | 'dynamic text conditional'>('static')
  const [questionText, setQuestionText] = useState('')
  const [template, setTemplate] = useState('')
  const [variableRanges, setVariableRanges] = useState('')
  const [optionGenerationRules, setOptionGenerationRules] = useState('')
  const [options, setOptions] = useState<Option[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [noOfTimes, setNoOfTimes] = useState(1)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const fetchQuestion = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/questions/${questionId}`)
        const questionData = await response.json()

        if (questionData) {
          setQuestion(questionData)
          setQuestionType(questionData.question_type)
          
          // Set no_of_times, default to 1 if not present
          setNoOfTimes(questionData.no_of_times || 1)
          
          if (questionData.question_type === 'static') {
            setQuestionText(questionData.question_text || '')
            setOptions(questionData.options || [])
          } else {
            setTemplate(questionData.template || '')
            setVariableRanges(JSON.stringify(questionData.variable_ranges || {}, null, 2))
            setOptionGenerationRules(JSON.stringify(questionData.option_generation_rules || {}, null, 2))
          }
        }
      } catch (error) {
        console.error('Error fetching question:', error)
        toast({
          title: "Error",
          description: "Failed to load question",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchQuestion()
  }, [questionId, toast])

  const handleSave = async () => {
    if (questionType === 'static' && !questionText.trim()) {
      toast({
        title: "Error",
        description: "Please enter question text",
        variant: "destructive",
      })
      return
    }

    if (questionType !== 'static' && (!template.trim() || !variableRanges.trim() || !optionGenerationRules.trim())) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSaving(true)

      let variableRangesObj = {}
      let optionRulesObj = {}

      if (questionType !== 'static') {
        try {
          variableRangesObj = JSON.parse(variableRanges)
          optionRulesObj = JSON.parse(optionGenerationRules)
        } catch (e) {
          toast({
            title: "Error",
            description: "Invalid JSON format in variable ranges or option rules",
            variant: "destructive",
          })
          return
        }
      }

      const response = await fetch(`/api/questions/${questionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question_type: questionType,
          no_of_times: noOfTimes,  // Add no_of_times to the payload
          ...(questionType === 'static'
            ? {
                question_text: questionText,
                options: options
              }
            : {
                template,
                variable_ranges: variableRangesObj,
                option_generation_rules: optionRulesObj
              }),
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save question')
      }

      router.refresh()
      toast({
        title: "Success",
        description: "Question saved successfully",
      })
    } catch (error) {
      console.error('Error saving question:', error)
      toast({
        title: "Error",
        description: "Failed to save question",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    router.push(`/admin/questions/${questionBankId}`)
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 mt-3 max-w-4xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Edit Question</h1>
      </div>

      <div>
        <div className="space-y-2">
          <h2 className='text-lg font-semibold flex items-center'><Dot />Question Type</h2>
          <Badge variant={"outline"}>{questionType}</Badge>
        </div>

        {questionType === 'static' ? (
          <>
            <div className="mt-8">
              <Label className='mb-2 text-lg font-semibold flex items-center'><Dot />Question Text</Label>
              <Textarea
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                placeholder="Enter your question text"
                className='h-40 text-sm'
              />
            </div>

            <div className="">
              <div className="mt-8 flex justify-between items-center">
                <Label className='mb-2 text-lg font-semibold flex items-center'><Dot />Options</Label>
                <Button
                  onClick={() => setOptions([...options, { id: `new-${Date.now()}`, option_text: '', is_correct: false, question_id: questionId }])}
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Option
                </Button>
              </div>
              {options.map((option, index) => (
                <div key={option.id} className="flex items-center gap-2">
                  <Input
                    value={option.option_text}
                    onChange={(e) => {
                      const newOptions = [...options]
                      newOptions[index] = { ...option, option_text: e.target.value }
                      setOptions(newOptions)
                    }}
                    placeholder={`Option ${index + 1}`}
                  />
                  <Switch
                    checked={option.is_correct}
                    onCheckedChange={(checked) => {
                      const newOptions = [...options]
                      newOptions[index] = { ...option, is_correct: checked }
                      setOptions(newOptions)
                    }}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setOptions(options.filter((_, i) => i !== index))}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="mt-8">
              <Label className='text-lg font-semibold flex items-center mb-2 '><Dot />Question Template</Label>
              <Textarea
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
                placeholder="Enter template with variables in {brackets}"
                className='h-36 text-sm'
              />
              <p className="text-xs text-gray-500 mt-3">
                Example: {getTemplateExample(questionType)}
              </p>
            </div>

            <div className="mt-8">
              <Label className='text-lg font-semibold flex items-center mb-2'><Dot />Variable Ranges</Label>
              <Textarea
                value={variableRanges}
                onChange={(e) => setVariableRanges(e.target.value)}
                placeholder="Enter variable ranges in JSON format"
                className='h-36 text-sm'
              />
              <p className="text-xs text-gray-500 mt-3">
                Example: {getVariableRangesExample(questionType)}
              </p>
            </div>

            <div className="mt-8">
              <Label className='mb-2 text-lg font-semibold flex items-center'><Dot />Option Generation Rules</Label>
              <Textarea
                value={optionGenerationRules}
                onChange={(e) => setOptionGenerationRules(e.target.value)}
                placeholder="Enter option generation rules in JSON format"
                className='h-36 text-sm'
              />
              <p className="text-xs text-gray-500 mt-3">
                Example: {getOptionRulesExample(questionType)}
              </p>
            </div>

            <div className="mt-8">
              <Label className='mb-2 text-lg font-semibold flex items-center' htmlFor="noOfTimes"><Dot />Number of Questions to Generate</Label>
              <Input
                id="noOfTimes"
                type="number"
                min="1"
                max="100"
                value={noOfTimes}
                onChange={(e) => setNoOfTimes(Number(e.target.value))}
                placeholder="Enter number of questions to generate"
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-3">
                How many variations of this question should be generated?
              </p>
            </div>
          </>
        )}
      </div>

      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={handleCancel}>
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
  )
}

const getTemplateExample = (type: string) => {
  switch (type) {
    case 'dynamic':
      return 'What is {x} + {y}?'
    case 'dynamic conditional':
      return 'Find Track (M)? If Track (T) is {x}° and Variation is {y}°{direction}'
    case 'dynamic text conditional':
      return 'What happens to Magnetic Compass when in the {hemisphere} Hemisphere and Accelerating in {direction} Direction?'
    default:
      return ''
  }
}

const getVariableRangesExample = (type: string) => {
  switch (type) {
    case 'dynamic':
      return '{"x": {"min": 1, "max": 10}, "y": {"min": 1, "max": 10}}'
    case 'dynamic conditional':
      return '{"range_values":{"x":{"min":0,"max":180},"y":{"min":0,"max":10}},"enum_values":{"direction":["W","E"]}}'
    case 'dynamic text conditional':
      return '{"enum_values":{"hemisphere":["Northern","Southern"],"direction":["North East","East"]}}'
    default:
      return ''
  }
}

const getOptionRulesExample = (type: string) => {
  switch (type) {
    case 'dynamic':
      return '{"correct": ["{x}+{y}","units"],"wrong1": ["{x} - {y}", "units"], "wrong2": ["{x} * {y}", "units"], "wrong3": ["{x} + {y} + 1", "units"]}'
    case 'dynamic conditional':
      return '{"direction === W":[{"correct":["x-y","units"],"wrong1":["{x} - {y} - 1","units"],"wrong2":["{x} * {y}","units"],"wrong3":["{x}+{y}","units"]}],"direction === E":[{"correct":["x+y","units"],"wrong1":["{x} + {y} + 1","units"],"wrong2":["{x} / {y}","units"],"wrong3":["{x}-{y}","units"]}]}'
    case 'dynamic text conditional':
      return '{"hemisphere === Northern && direction === North East":{"correct":"Apparent Turn to North Pole, Compass Turns Clockwise, Liquid Swirl increases error","wrong1":"Wrong Option 1","wrong2":"Wrong Option 2","wrong3":"Wrong Option 3"}}'
    default:
      return ''
  }
}
