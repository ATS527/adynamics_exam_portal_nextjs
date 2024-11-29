'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Plus, X } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'

interface Question {
  id: string
  question_text: string
  question_type: string
  template?: string
  variable_ranges?: Record<string, { min: number; max: number }>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  option_generation_rules?: Record<string, any>
  correct_answer_equation?: string
}

interface Option {
  id: string
  option_text: string
  is_correct: boolean
  question_id: string
}

interface Variable {
  name: string
  min: number
  max: number
}

interface OptionRule {
  type: 'correct' | 'incorrect'
  equation: string
}

export default function EditQuestionClient({
  questionBankId,
  questionId,
}: {
  questionBankId: string
  questionId: string
}) {
  const [question, setQuestion] = useState<Question | null>(null)
  const [options, setOptions] = useState<Option[]>([])
  const [questionText, setQuestionText] = useState('')
  const [template, setTemplate] = useState('')
  const [variables, setVariables] = useState<Variable[]>([])
  const [optionRules, setOptionRules] = useState<OptionRule[]>([])
  const [correctAnswerEquation, setCorrectAnswerEquation] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const fetchQuestion = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/questions/${questionId}`)
        const questionData = await response.json()

        console.log('Fetched question data:', questionData)

        if (questionData) {
          setQuestion(questionData)
          
          if (questionData.question_type === 'static') {
            setQuestionText(questionData.question_text || '')
          } else if (questionData.question_type === 'dynamic') {
            setTemplate(questionData.template || '')
            setCorrectAnswerEquation(questionData.correct_answer_equation || '')
            
            // Convert variable ranges object to array
            if (questionData.variable_ranges) {
              try {
                const vars: Variable[] = Object.entries(questionData.variable_ranges).map(
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  ([name, range]: [string, any]) => ({
                    name,
                    min: parseFloat(range.min),
                    max: parseFloat(range.max),
                  })
                )
                setVariables(vars)
                console.log('Parsed variables:', vars)
              } catch (e) {
                console.error('Error parsing variable ranges:', e)
                setVariables([])
              }
            }

            // Set option generation rules
            if (questionData.option_generation_rules) {
              try {
                const rules = questionData.option_generation_rules
                
                // Convert the object format to array format
                if (!Array.isArray(rules)) {
                  const formattedRules = []
                  if (rules.correct) {
                    formattedRules.push({
                      type: 'correct',
                      equation: rules.correct
                    })
                  }
                  if (rules.wrong1) {
                    formattedRules.push({
                      type: 'incorrect',
                      equation: rules.wrong1
                    })
                  }
                  if (rules.wrong2) {
                    formattedRules.push({
                      type: 'incorrect',
                      equation: rules.wrong2
                    })
                  }
                  if (rules.wrong3) {
                    formattedRules.push({
                      type: 'incorrect',
                      equation: rules.wrong3
                    })
                  }
                  console.log('Formatted rules:', formattedRules)
                  setOptionRules(formattedRules)
                } else {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  setOptionRules(rules.map((rule: any) => ({
                    type: rule.type || 'incorrect',
                    equation: rule.equation || ''
                  })))
                }
              } catch (e) {
                console.error('Error parsing option generation rules:', e)
                setOptionRules([])
              }
            } else {
              console.log('No option generation rules found, initializing empty array')
              setOptionRules([])
            }
          }

          // Fetch options for static questions
          if (questionData.question_type === 'static' && questionData.options) {
            setOptions(questionData.options)
          }
        }
      } catch (error) {
        console.error('Error fetching question:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchQuestion()
  }, [questionId])

  const handleAddVariable = () => {
    setVariables([...variables, { name: '', min: 1, max: 10 }])
  }

  const handleRemoveVariable = (index: number) => {
    setVariables(variables.filter((_, i) => i !== index))
  }

  const handleVariableChange = (index: number, field: keyof Variable, value: string | number) => {
    const newVariables = [...variables]
    newVariables[index] = {
      ...newVariables[index],
      [field]: field === 'name' ? value : Number(value)
    }
    setVariables(newVariables)
  }

  const handleAddOption = () => {
    setOptions([
      ...options,
      {
        id: 'new-' + Date.now(),
        option_text: '',
        is_correct: false,
        question_id: questionId,
      },
    ])
  }

  const handleRemoveOption = (optionId: string) => {
    setOptions(options.filter((opt) => opt.id !== optionId))
  }

  const handleOptionTextChange = (optionId: string, text: string) => {
    setOptions(
      options.map((opt) =>
        opt.id === optionId ? { ...opt, option_text: text } : opt
      )
    )
  }

  const handleOptionCorrectChange = (optionId: string, isCorrect: boolean) => {
    setOptions(
      options.map((opt) =>
        opt.id === optionId ? { ...opt, is_correct: isCorrect } : opt
      )
    )
  }

  const handleAddOptionRule = () => {
    setOptionRules([...optionRules, { type: 'incorrect', equation: '' }])
  }

  const handleRemoveOptionRule = (index: number) => {
    setOptionRules(optionRules.filter((_, i) => i !== index))
  }

  const handleOptionRuleChange = (index: number, field: keyof OptionRule, value: string) => {
    const newRules = [...optionRules]
    newRules[index] = {
      ...newRules[index],
      [field]: value
    }
    setOptionRules(newRules)
  }

  const handleSave = async () => {
    if (question?.question_type === 'static' && !questionText.trim()) return
    if (question?.question_type === 'dynamic' && (!template.trim() || variables.length === 0 || !correctAnswerEquation.trim())) return

    try {
      setIsSaving(true)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let updateData: any = {}
      if (question?.question_type === 'static') {
        updateData = { 
          question_type: 'static',
          question_text: questionText,
          options 
        }
      } else {
        // Convert variables array to object format
        const variableRanges = variables.reduce((acc, { name, min, max }) => {
          if (name.trim()) {
            acc[name.trim()] = { min: parseFloat(min.toString()), max: parseFloat(max.toString()) }
          }
          return acc
        }, {} as Record<string, { min: number; max: number }>)

        // Convert option rules array to object format
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const validOptionRules = optionRules.reduce((acc: any, rule, index) => {
          if (rule.equation.trim()) {
            if (rule.type === 'correct') {
              acc.correct = rule.equation.trim()
            } else {
              acc[`wrong${index + 1}`] = rule.equation.trim()
            }
          }
          return acc
        }, {})

        console.log('Saving with option rules:', validOptionRules)

        updateData = {
          question_type: 'dynamic',
          template: template.trim(),
          variable_ranges: variableRanges,
          option_generation_rules: validOptionRules,
          correct_answer_equation: correctAnswerEquation.trim(),
          question_text: ''
        }
      }

      console.log('Update data:', updateData)

      const response = await fetch(`/api/questions/${questionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        throw new Error('Failed to update question')
      }

      const result = await response.json()
      console.log('Save result:', result)

      router.refresh()
      router.push(`/admin/questions/${questionBankId}`)
    } catch (error) {
      console.error('Error saving question:', error)
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

  if (!question) {
    return <div>Question not found</div>
  }

  return (
    <div className="container mx-auto py-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Edit Question</h1>
        <div className="space-y-6">
          {question.question_type === 'static' ? (
            <>
              <div>
                <Label htmlFor="question-text">Question Text</Label>
                <Input
                  id="question-text"
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  placeholder="Enter question text"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">Options</h2>
                  <Button onClick={handleAddOption} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Option
                  </Button>
                </div>

                <div className="space-y-4">
                  {options.map((option) => (
                    <Card key={option.id} className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="flex-grow">
                          <Input
                            value={option.option_text}
                            onChange={(e) =>
                              handleOptionTextChange(option.id, e.target.value)
                            }
                            placeholder="Enter option text"
                          />
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={option.is_correct}
                              onCheckedChange={(checked) =>
                                handleOptionCorrectChange(option.id, checked)
                              }
                            />
                            <Label>Correct</Label>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveOption(option.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <Label htmlFor="template">Question Template</Label>
                <Input
                  id="template"
                  value={template}
                  onChange={(e) => setTemplate(e.target.value)}
                  placeholder="Enter template (e.g., 'What is {x} + {y}?')"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Use {"{variable}"} syntax for dynamic values
                </p>
              </div>

              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">Variables</h2>
                  <Button onClick={handleAddVariable} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Variable
                  </Button>
                </div>

                <div className="space-y-4">
                  {variables.map((variable, index) => (
                    <Card key={index} className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="flex-grow space-y-4">
                          <div>
                            <Label>Variable Name</Label>
                            <Input
                              value={variable.name}
                              onChange={(e) => handleVariableChange(index, 'name', e.target.value)}
                              placeholder="e.g., x"
                            />
                          </div>
                          <div className="flex gap-4">
                            <div className="flex-1">
                              <Label>Min Value</Label>
                              <Input
                                type="number"
                                value={variable.min}
                                onChange={(e) => handleVariableChange(index, 'min', e.target.value)}
                              />
                            </div>
                            <div className="flex-1">
                              <Label>Max Value</Label>
                              <Input
                                type="number"
                                value={variable.max}
                                onChange={(e) => handleVariableChange(index, 'max', e.target.value)}
                              />
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveVariable(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="correctAnswerEquation">Correct Answer Equation</Label>
                <Input
                  id="correctAnswerEquation"
                  value={correctAnswerEquation}
                  onChange={(e) => setCorrectAnswerEquation(e.target.value)}
                  placeholder="e.g., x + y"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Use the variable names in your equation
                </p>
              </div>

              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">Option Generation Rules</h2>
                  <Button onClick={handleAddOptionRule} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Rule
                  </Button>
                </div>

                <div className="space-y-4">
                  {optionRules.map((rule, index) => (
                    <Card key={index} className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="flex-grow space-y-4">
                          <div className="flex gap-4">
                            <div className="w-1/3">
                              <Label>Type</Label>
                              <select
                                value={rule.type}
                                onChange={(e) => handleOptionRuleChange(index, 'type', e.target.value as 'correct' | 'incorrect')}
                                className="w-full border rounded-md p-2"
                              >
                                <option value="correct">Correct</option>
                                <option value="incorrect">Incorrect</option>
                              </select>
                            </div>
                            <div className="flex-1">
                              <Label>Equation</Label>
                              <Input
                                value={rule.equation}
                                onChange={(e) => handleOptionRuleChange(index, 'equation', e.target.value)}
                                placeholder="e.g., x + y + 1"
                              />
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveOptionRule(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Add rules to generate options. Use variable names in equations. The correct answer will be automatically included.
                </p>
              </div>
            </>
          )}

          <div className="flex justify-end space-x-4">
            <Button
              variant="outline"
              onClick={() => router.push(`/admin/questions/${questionBankId}`)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
