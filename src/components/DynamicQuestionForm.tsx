import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, X } from "lucide-react";
import {
  DynamicQuestion,
  DynamicConditionalQuestion,
  DynamicTextConditionalQuestion,
  QuestionFormProps,
} from "@/types/questions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface DynamicQuestionFormProps extends QuestionFormProps {
  question: DynamicQuestion | DynamicConditionalQuestion | DynamicTextConditionalQuestion;
}

export default function DynamicQuestionForm({
  question,
  onUpdate,
  onDelete,
  onCancel,
}: DynamicQuestionFormProps) {
  const [editedQuestion, setEditedQuestion] = useState(question);
  const [variableRanges, setVariableRanges] = useState<Array<{ name: string; min?: string; max?: string; values?: string[] }>>([]);
  const [optionRules, setOptionRules] = useState<Array<{ condition?: string; rules: any }>>([]);

  useEffect(() => {
    // Parse variable ranges
    const ranges = Object.entries(question.variable_ranges).map(([name, range]) => ({
      name,
      min: range.min?.toString(),
      max: range.max?.toString(),
      values: range.values
    }));
    setVariableRanges(ranges);

    // Parse option rules based on question type
    if (question.question_type === 'dynamic') {
      setOptionRules([{ rules: question.option_generation_rules }]);
    } else if (question.question_type === 'dynamic conditional') {
      const rules = Object.entries(question.option_generation_rules).map(([condition, ruleSet]) => ({
        condition,
        rules: ruleSet
      }));
      setOptionRules(rules);
    } else {
      const rules = Object.entries(question.option_generation_rules).map(([condition, options]) => ({
        condition,
        rules: options
      }));
      setOptionRules(rules);
    }
  }, [question]);

  const handleTemplateChange = (value: string) => {
    setEditedQuestion({
      ...editedQuestion,
      template: value
    });
  };

  const handleVariableRangeChange = (index: number, field: string, value: string) => {
    const newRanges = [...variableRanges];
    if (field === 'name') {
      newRanges[index].name = value;
    } else if (field === 'min' || field === 'max') {
      newRanges[index][field] = value;
    } else if (field === 'values') {
      newRanges[index].values = value.split(',').map(v => v.trim());
    }
    setVariableRanges(newRanges);
    updateQuestion(newRanges, optionRules);
  };

  const handleOptionRuleChange = (index: number, field: string, value: string) => {
    const newRules = [...optionRules];
    if (field === 'condition') {
      newRules[index].condition = value;
    } else {
      try {
        newRules[index].rules = JSON.parse(value);
      } catch (e) {
        console.error('Invalid JSON format for rules');
        return;
      }
    }
    setOptionRules(newRules);
    updateQuestion(variableRanges, newRules);
  };

  const updateQuestion = (
    ranges: Array<{ name: string; min?: string; max?: string; values?: string[] }>,
    rules: Array<{ condition?: string; rules: any }>
  ) => {
    const variableRangesObj: any = {};
    ranges.forEach(range => {
      variableRangesObj[range.name] = {
        min: range.min ? parseInt(range.min) : undefined,
        max: range.max ? parseInt(range.max) : undefined,
        values: range.values
      };
    });

    let optionRulesObj: any = {};
    if (editedQuestion.question_type === 'dynamic') {
      optionRulesObj = rules[0].rules;
    } else {
      rules.forEach(rule => {
        if (rule.condition) {
          optionRulesObj[rule.condition] = rule.rules;
        }
      });
    }

    const updatedQuestion = {
      ...editedQuestion,
      variable_ranges: variableRangesObj,
      option_generation_rules: optionRulesObj
    };

    onUpdate(updatedQuestion);
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Question Type</Label>
        <Select
          value={editedQuestion.question_type}
          onValueChange={(value: any) => 
            setEditedQuestion({ ...editedQuestion, question_type: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select question type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="dynamic">Dynamic</SelectItem>
            <SelectItem value="dynamic conditional">Dynamic Conditional</SelectItem>
            <SelectItem value="dynamic text conditional">Dynamic Text Conditional</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Template</Label>
        <Textarea
          value={editedQuestion.template}
          onChange={(e) => handleTemplateChange(e.target.value)}
          placeholder="Enter question template with variables in {brackets}"
        />
      </div>

      <div>
        <Label>Variable Ranges</Label>
        {variableRanges.map((range, index) => (
          <div key={index} className="flex gap-2 mt-2">
            <Input
              placeholder="Variable name"
              value={range.name}
              onChange={(e) => handleVariableRangeChange(index, 'name', e.target.value)}
            />
            {range.values ? (
              <Input
                placeholder="Values (comma-separated)"
                value={range.values.join(', ')}
                onChange={(e) => handleVariableRangeChange(index, 'values', e.target.value)}
              />
            ) : (
              <>
                <Input
                  placeholder="Min"
                  type="number"
                  value={range.min}
                  onChange={(e) => handleVariableRangeChange(index, 'min', e.target.value)}
                />
                <Input
                  placeholder="Max"
                  type="number"
                  value={range.max}
                  onChange={(e) => handleVariableRangeChange(index, 'max', e.target.value)}
                />
              </>
            )}
            <Button
              variant="destructive"
              size="icon"
              onClick={() => {
                const newRanges = variableRanges.filter((_, i) => i !== index);
                setVariableRanges(newRanges);
                updateQuestion(newRanges, optionRules);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setVariableRanges([...variableRanges, { name: '', min: '', max: '' }]);
          }}
          className="mt-2"
        >
          <Plus className="h-4 w-4 mr-2" /> Add Variable
        </Button>
      </div>

      <div>
        <Label>Option Generation Rules</Label>
        {optionRules.map((rule, index) => (
          <div key={index} className="space-y-2 mt-2">
            {editedQuestion.question_type !== 'dynamic' && (
              <Input
                placeholder="Condition"
                value={rule.condition}
                onChange={(e) => handleOptionRuleChange(index, 'condition', e.target.value)}
              />
            )}
            <Textarea
              placeholder="Rules (JSON format)"
              value={JSON.stringify(rule.rules, null, 2)}
              onChange={(e) => handleOptionRuleChange(index, 'rules', e.target.value)}
            />
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                const newRules = optionRules.filter((_, i) => i !== index);
                setOptionRules(newRules);
                updateQuestion(variableRanges, newRules);
              }}
            >
              Remove Rule
            </Button>
          </div>
        ))}
        {editedQuestion.question_type !== 'dynamic' && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setOptionRules([...optionRules, { condition: '', rules: {} }]);
            }}
            className="mt-2"
          >
            <Plus className="h-4 w-4 mr-2" /> Add Rule
          </Button>
        )}
      </div>

      <div>
        <Label>Number of Times to Generate</Label>
        <Input
          type="number"
          value={editedQuestion.no_of_times}
          onChange={(e) => setEditedQuestion({
            ...editedQuestion,
            no_of_times: parseInt(e.target.value)
          })}
          min={1}
        />
      </div>

      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        {onDelete && (
          <Button variant="destructive" onClick={onDelete}>
            Delete
          </Button>
        )}
        <Button onClick={() => onUpdate(editedQuestion)}>Save</Button>
      </div>
    </div>
  );
}
