import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, X } from "lucide-react";
import { DynamicQuestion } from "@/types/questions";

interface DynamicQuestionFormProps {
  question: DynamicQuestion;
  onUpdate: (question: DynamicQuestion) => void;
  onDelete?: () => void;
  onCancel?: () => void;
}

export default function DynamicQuestionForm({
  question,
  onUpdate,
  onDelete,
  onCancel,
}: DynamicQuestionFormProps) {
  const [editedQuestion, setEditedQuestion] =
    useState<DynamicQuestion>(question);
  const [variableRanges, setVariableRanges] = useState<
    Array<{ name: string; min: string; max: string }>
  >([]);
  const [optionRules, setOptionRules] = useState<
    Array<{ name: string; rule: string }>
  >([]);

  useEffect(() => {
    const ranges = Object.entries(
      question.dynamic_template.variable_ranges
    ).map(([name, range]) => ({
      name,
      min: range.min.toString(),
      max: range.max.toString(),
    }));
    setVariableRanges(ranges);

    const rules = Object.entries(
      question.dynamic_template.option_generation_rules
    ).map(([name, rule]) => ({
      name,
      rule,
    }));
    setOptionRules(rules);
  }, [question]);

  const handleTemplateChange = (value: string) => {
    setEditedQuestion({
      ...editedQuestion,
      dynamic_template: {
        ...editedQuestion.dynamic_template,
        template: value,
      },
    });
  };

  const handleAddVariableRange = () => {
    setVariableRanges([...variableRanges, { name: "", min: "", max: "" }]);
  };

  const handleRemoveVariableRange = (index: number) => {
    setVariableRanges(variableRanges.filter((_, i) => i !== index));
  };

  const handleVariableRangeChange = (
    index: number,
    field: "name" | "min" | "max",
    value: string
  ) => {
    const newRanges = [...variableRanges];
    newRanges[index] = { ...newRanges[index], [field]: value };
    setVariableRanges(newRanges);
  };

  const handleAddOptionRule = () => {
    setOptionRules([...optionRules, { name: "", rule: "" }]);
  };

  const handleRemoveOptionRule = (index: number) => {
    setOptionRules(optionRules.filter((_, i) => i !== index));
  };

  const handleOptionRuleChange = (
    index: number,
    field: "name" | "rule",
    value: string
  ) => {
    const newRules = [...optionRules];
    newRules[index] = { ...newRules[index], [field]: value };
    setOptionRules(newRules);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedQuestion: DynamicQuestion = {
      ...editedQuestion,
      dynamic_template: {
        ...editedQuestion.dynamic_template,
        variable_ranges: Object.fromEntries(
          variableRanges.map((range) => [
            range.name,
            { min: Number(range.min), max: Number(range.max) },
          ])
        ),
        option_generation_rules: Object.fromEntries(
          optionRules.map((rule) => [rule.name, rule.rule])
        ),
      },
    };
    onUpdate(updatedQuestion);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="template">Question Template</Label>
        <Textarea
          id="template"
          value={editedQuestion.dynamic_template.template}
          onChange={(e) => handleTemplateChange(e.target.value)}
          rows={3}
          required
        />
      </div>

      <div>
        <Label>Variable Ranges</Label>
        {variableRanges.map((range, index) => (
          <div key={index} className="flex items-center space-x-2 mt-2">
            <Input
              placeholder="Variable name"
              value={range.name}
              onChange={(e) =>
                handleVariableRangeChange(index, "name", e.target.value)
              }
              required
            />
            <Input
              type="number"
              placeholder="Min"
              value={range.min}
              onChange={(e) =>
                handleVariableRangeChange(index, "min", e.target.value)
              }
              required
            />
            <Input
              type="number"
              placeholder="Max"
              value={range.max}
              onChange={(e) =>
                handleVariableRangeChange(index, "max", e.target.value)
              }
              required
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => handleRemoveVariableRange(index)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddVariableRange}
          className="mt-2"
        >
          <Plus className="h-4 w-4 mr-2" /> Add Variable Range
        </Button>
      </div>

      <div>
        <Label>Option Generation Rules</Label>
        {optionRules.map((rule, index) => (
          <div key={index} className="flex items-center space-x-2 mt-2">
            <Input
              placeholder="Option name"
              value={rule.name}
              onChange={(e) =>
                handleOptionRuleChange(index, "name", e.target.value)
              }
              required
            />
            <Input
              placeholder="Generation rule"
              value={rule.rule}
              onChange={(e) =>
                handleOptionRuleChange(index, "rule", e.target.value)
              }
              required
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => handleRemoveOptionRule(index)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddOptionRule}
          className="mt-2"
        >
          <Plus className="h-4 w-4 mr-2" /> Add Option Rule
        </Button>
      </div>

      <div>
        <Label htmlFor="correct_answer_equation">Correct Answer Equation</Label>
        <Input
          id="correct_answer_equation"
          value={editedQuestion.dynamic_template.correct_answer_equation}
          onChange={(e) =>
            setEditedQuestion({
              ...editedQuestion,
              dynamic_template: {
                ...editedQuestion.dynamic_template,
                correct_answer_equation: e.target.value,
              },
            })
          }
          required
        />
      </div>

      <div className="flex justify-between">
        <Button type="submit">Save Question</Button>
        {onDelete && (
          <Button type="button" variant="destructive" onClick={onDelete}>
            Delete Question
          </Button>
        )}
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
