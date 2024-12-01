'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Plus, X } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'

interface Question {
  id: string
  question_text: string
  question_type: string
  template?: string
  variable_ranges?: Record<string, { min: number; max: number } | { enum_values: string[] } | { enums: string[] }>
  option_generation_rules?: Record<string, any>
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
  enumValues?: string[]
}

interface OptionRule {
  type: 'correct' | 'incorrect'
  equation: string
  condition?: string
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
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

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
          } else if (questionData.question_type === 'dynamic' || questionData.question_type === 'dynamic conditional' || questionData.question_type === 'dynamic text conditional') {
            setTemplate(questionData.template || '')
            console.log('Setting template:', questionData.template)
            
            // Convert variable ranges object to array
            if (questionData.variable_ranges) {
              try {
                const vars: Variable[] = []
                const ranges = questionData.variable_ranges

                console.log('Processing variable ranges:', ranges)

                // Handle range_values
                if (ranges.range_values) {
                  Object.entries(ranges.range_values).forEach(([name, range]: [string, any]) => {
                    vars.push({
                      name,
                      min: parseFloat(range.min),
                      max: parseFloat(range.max),
                    })
                  })
                }

                // Handle enum_values
                if (ranges.enum_values) {
                  Object.entries(ranges.enum_values).forEach(([name, values]: [string, any]) => {
                    if (Array.isArray(values)) {
                      vars.push({
                        name,
                        min: 0, // Using 0 as placeholder for enum
                        max: 0, // Using 0 as placeholder for enum
                        enumValues: values
                      })
                    }
                  })
                }

                // Handle new enums format
                if (ranges.enums) {
                  Object.entries(ranges.enums).forEach(([name, values]: [string, any]) => {
                    if (Array.isArray(values)) {
                      console.log('Adding enum variable:', { name, values })
                      vars.push({
                        name,
                        min: 0, // Using 0 as placeholder for enum
                        max: 0, // Using 0 as placeholder for enum
                        enumValues: values
                      })
                    }
                  })
                }

                // If no variables were found but we have a template, extract variables from template
                if (vars.length === 0 && questionData.template) {
                  const templateVars = questionData.template.match(/\{([^}]+)\}/g)?.map(v => v.slice(1, -1)) || []
                  console.log('Extracted template variables:', templateVars)
                  
                  templateVars.forEach(name => {
                    vars.push({
                      name,
                      min: 0,
                      max: 10
                    })
                  })
                }

                console.log('Setting variables:', vars)
                setVariables(vars)
              } catch (e) {
                console.error('Error parsing variable ranges:', e)
                setVariables([])
              }
            } else if (questionData.template) {
              // If no variable ranges but template exists, extract variables from template
              const templateVars = questionData.template.match(/\{([^}]+)\}/g)?.map(v => v.slice(1, -1)) || []
              console.log('No ranges, extracted template variables:', templateVars)
              
              const vars = templateVars.map(name => ({
                name,
                min: 0,
                max: 10
              }))
              
              console.log('Setting template-extracted variables:', vars)
              setVariables(vars)
            }

            // Set option generation rules based on question type
            if (questionData.option_generation_rules) {
              try {
                const rules = questionData.option_generation_rules
                console.log('Raw option rules:', rules)
                let formattedRules: OptionRule[] = []

                if (questionData.question_type === 'dynamic text conditional') {
                  // Parse text conditional rules with conditions
                  Object.entries(rules).forEach(([condition, ruleSet]: [string, any]) => {
                    console.log('Processing condition:', condition, 'ruleSet:', ruleSet)
                    
                    // Add correct answer
                    if (ruleSet.correct) {
                      formattedRules.push({
                        type: 'correct',
                        equation: ruleSet.correct,
                        condition
                      })
                    }
                    
                    // Add wrong answers
                    ['wrong1', 'wrong2', 'wrong3'].forEach(key => {
                      if (ruleSet[key]) {
                        formattedRules.push({
                          type: 'incorrect',
                          equation: ruleSet[key],
                          condition
                        })
                      }
                    })
                  })
                } else if (questionData.question_type === 'dynamic') {
                  // Handle dynamic question rules
                  if (rules.correct) {
                    formattedRules.push({
                      type: 'correct',
                      equation: rules.correct
                    })
                  }
                  ['wrong1', 'wrong2', 'wrong3'].forEach(key => {
                    if (rules[key]) {
                      formattedRules.push({
                        type: 'incorrect',
                        equation: rules[key]
                      })
                    }
                  })
                } else if (questionData.question_type === 'dynamic conditional') {
                  // Handle conditional rules
                  Object.entries(rules).forEach(([condition, ruleSet]: [string, any]) => {
                    console.log('Processing condition:', condition, 'ruleSet:', ruleSet)
                    
                    // The ruleSet is an array with one object containing correct/wrong answers
                    if (Array.isArray(ruleSet) && ruleSet.length > 0) {
                      const answerSet = ruleSet[0]
                      console.log('Processing answerSet:', answerSet)
                      
                      // Handle correct answer
                      if (answerSet.correct) {
                        const equation = Array.isArray(answerSet.correct) ? answerSet.correct[0] : answerSet.correct
                        console.log('Adding correct rule:', { equation, condition })
                        formattedRules.push({
                          type: 'correct',
                          equation,
                          condition
                        })
                      }

                      // Handle wrong answers
                      ['wrong1', 'wrong2', 'wrong3'].forEach(key => {
                        if (answerSet[key]) {
                          const equation = Array.isArray(answerSet[key]) ? answerSet[key][0] : answerSet[key]
                          console.log('Adding wrong rule:', { equation, condition, key })
                          formattedRules.push({
                            type: 'incorrect',
                            equation,
                            condition
                          })
                        }
                      })
                    } else if (typeof ruleSet === 'object' && ruleSet !== null) {
                      // Handle direct object format
                      if (ruleSet.correct) {
                        const equation = Array.isArray(ruleSet.correct) ? ruleSet.correct[0] : ruleSet.correct
                        console.log('Adding correct rule (direct):', { equation, condition })
                        formattedRules.push({
                          type: 'correct',
                          equation,
                          condition
                        })
                      }

                      ['wrong1', 'wrong2', 'wrong3'].forEach(key => {
                        if (ruleSet[key]) {
                          const equation = Array.isArray(ruleSet[key]) ? ruleSet[key][0] : ruleSet[key]
                          console.log('Adding wrong rule (direct):', { equation, condition, key })
                          formattedRules.push({
                            type: 'incorrect',
                            equation,
                            condition
                          })
                        }
                      })
                    }
                  })
                }
                
                console.log('Setting option rules:', formattedRules)
                setOptionRules(formattedRules)
              } catch (e) {
                console.error('Error parsing option generation rules:', e)
                console.error('Error details:', e)
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
    console.log('Adding new variable')
    const newVariable: Variable = {
      name: '',
      min: 0,
      max: 10
    }
    setVariables([...variables, newVariable])
  }

  const handleRemoveVariable = (index: number) => {
    console.log('Removing variable at index:', index)
    const newVariables = variables.filter((_, i) => i !== index)
    console.log('Updated variables after removal:', newVariables)
    setVariables(newVariables)
  }

  const handleVariableChange = (index: number, field: string, value: any) => {
    console.log('Variable change:', { index, field, value })
    const newVariables = [...variables]
    if (field === 'enumValues') {
      newVariables[index] = {
        ...newVariables[index],
        [field]: Array.isArray(value) ? value : value.split(',').map((v: string) => v.trim())
      }
    } else {
      newVariables[index] = {
        ...newVariables[index],
        [field]: value
      }
    }
    console.log('Updated variables:', newVariables)
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
    console.log('handleSave called')
    console.log('Current state:', {
      questionType: question?.question_type,
      template: template,
      templateLength: template?.length,
      variables: variables,
      variablesLength: variables?.length
    })

    if (question?.question_type === 'static' && !questionText.trim()) {
      alert('Please enter question text')
      return
    }
    if (question?.question_type !== 'static' && (!template?.trim() || !variables?.length)) {
      console.log('Validation failed:', {
        templateEmpty: !template?.trim(),
        noVariables: !variables?.length
      })
      alert('Please enter template and add variables')
      return
    }

    try {
      setIsSaving(true)
      console.log('Starting save with question type:', question?.question_type)

      // Format variable ranges based on question type
      let variable_ranges: any = {}
      
      if (question?.question_type === 'dynamic text conditional') {
        // Use enums format for text conditional
        const enumsObj: { [key: string]: string[] } = {}
        variables.forEach(v => {
          if (v.enumValues) {
            enumsObj[v.name] = v.enumValues
          }
        })
        if (Object.keys(enumsObj).length > 0) {
          variable_ranges = { enums: enumsObj }
        }
        console.log('Formatted enum ranges:', variable_ranges)
      } else {
        // Use range_values and enum_values for other types
        const rangeValues: { [key: string]: { min: number; max: number } } = {}
        const enumValues: { [key: string]: string[] } = {}
        
        variables.forEach(v => {
          if (v.enumValues) {
            enumValues[v.name] = v.enumValues
          } else {
            rangeValues[v.name] = {
              min: v.min,
              max: v.max
            }
          }
        })
        
        if (Object.keys(rangeValues).length > 0) {
          variable_ranges.range_values = rangeValues
        }
        if (Object.keys(enumValues).length > 0) {
          variable_ranges.enum_values = enumValues
        }
      }

      console.log('Final variable ranges:', variable_ranges)

      // Format option generation rules
      const formattedRules = formatOptionRules(optionRules)
      console.log('Formatted option rules:', formattedRules)

      const response = await fetch(`/api/questions/${questionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question_text: questionText,
          question_type: question?.question_type,
          template: template,
          variable_ranges,
          option_generation_rules: formattedRules
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

  const formatOptionRules = (rules: OptionRule[]) => {
    console.log('Formatting option rules:', rules)
    const formattedRules: Record<string, any> = {}
    
    if (question?.question_type === 'dynamic text conditional') {
      // Group rules by condition
      const rulesByCondition = new Map<string, { correct?: string, wrong: string[] }>()
      
      // First, collect all rules by condition
      rules.forEach(rule => {
        if (!rule.condition || !rule.equation) return
        
        if (!rulesByCondition.has(rule.condition)) {
          rulesByCondition.set(rule.condition, { wrong: [] })
        }
        
        const conditionRules = rulesByCondition.get(rule.condition)!
        if (rule.type === 'correct') {
          conditionRules.correct = rule.equation
        } else {
          conditionRules.wrong.push(rule.equation)
        }
      })
      
      // Then, format them into the required structure
      rulesByCondition.forEach((rules, condition) => {
        formattedRules[condition] = {
          correct: rules.correct || null,
          wrong1: rules.wrong[0] || null,
          wrong2: rules.wrong[1] || null,
          wrong3: rules.wrong[2] || null
        }
      })
      
      console.log('Rules by condition:', Object.fromEntries(rulesByCondition))
    } else if (question?.question_type === 'dynamic') {
      // For dynamic questions, use simple format
      const correctRule = rules.find(rule => rule.type === 'correct')
      if (correctRule?.equation) {
        formattedRules.correct = correctRule.equation
      }
      
      rules.forEach((rule, index) => {
        if (rule.type === 'incorrect' && rule.equation) {
          formattedRules[`wrong${index + 1}`] = rule.equation
        }
      })
    }
    
    console.log('Formatted option rules result:', formattedRules)
    return formattedRules
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
                          {variable.enumValues ? (
                            <div>
                              <Label>Enum Values</Label>
                              <Input
                                value={variable.enumValues.join(', ')}
                                onChange={(e) => handleVariableChange(index, 'enumValues', e.target.value)}
                                placeholder="e.g., a, b, c"
                              />
                            </div>
                          ) : (
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
                          )}
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

              {(question?.question_type === 'dynamic' || question?.question_type === 'dynamic conditional' || question?.question_type === 'dynamic text conditional') && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Option Generation Rules</h3>
                    <Button type="button" onClick={handleAddOptionRule} variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Rule
                    </Button>
                  </div>
                  
                  {optionRules.map((rule, index) => (
                    <Card key={index} className="p-4">
                      <div className="space-y-4">
                        {/* Condition Input (for conditional types) */}
                        {(question?.question_type === 'dynamic conditional' || question?.question_type === 'dynamic text conditional') && (
                          <div>
                            <Label>Condition</Label>
                            <Input
                              value={rule.condition || ''}
                              onChange={(e) => handleOptionRuleChange(index, 'condition', e.target.value)}
                              placeholder="e.g., x > 90"
                            />
                          </div>
                        )}
                        
                        {/* Answer Type Selection */}
                        <div>
                          <Label>Answer Type</Label>
                          <select
                            value={rule.type}
                            onChange={(e) => handleOptionRuleChange(index, 'type', e.target.value)}
                            className="w-full rounded-md border border-input bg-background px-3 py-2"
                          >
                            <option value="correct">Correct Answer</option>
                            <option value="incorrect">Incorrect Answer</option>
                          </select>
                        </div>
                        
                        {/* Equation/Text Input */}
                        <div>
                          <Label>{question?.question_type === 'dynamic text conditional' ? 'Text' : 'Equation'}</Label>
                          <Input
                            value={rule.equation || ''}
                            onChange={(e) => handleOptionRuleChange(index, 'equation', e.target.value)}
                            placeholder={question?.question_type === 'dynamic text conditional' ? 'Answer text' : 'e.g., x + y'}
                          />
                        </div>
                        
                        {/* Remove Button */}
                        <Button
                          type="button"
                          onClick={() => handleRemoveOptionRule(index)}
                          variant="destructive"
                          size="sm"
                          className="mt-2"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Remove Rule
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
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
            <Button 
              onClick={() => {
                console.log('Save button clicked')
                handleSave()
              }} 
              disabled={isSaving}
              type="button"
            >
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
