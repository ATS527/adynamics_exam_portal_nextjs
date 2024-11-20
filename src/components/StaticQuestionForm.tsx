"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { StaticQuestion } from "@/types/questions";
import { Plus, Trash } from "lucide-react";

interface StaticQuestionFormProps {
  question: StaticQuestion;
  onUpdate: (question: StaticQuestion) => void;
  onDelete?: () => void;
  onCancel?: () => void;
}

export default function StaticQuestionForm({
  question,
  onUpdate,
  onDelete,
  onCancel,
}: StaticQuestionFormProps) {
  const [editedQuestion, setEditedQuestion] =
    useState<StaticQuestion>(question);

  const handleOptionChange = (
    index: number,
    field: "option_text" | "is_correct",
    value: string | boolean
  ) => {
    const newOptions = [...editedQuestion.static_options];
    newOptions[index] = { ...newOptions[index], [field]: value };
    setEditedQuestion({ ...editedQuestion, static_options: newOptions });
  };

  const handleAddOption = () => {
    setEditedQuestion({
      ...editedQuestion,
      static_options: [
        ...editedQuestion.static_options,
        { id: "", option_text: "", is_correct: false },
      ],
    });
  };

  const handleRemoveOption = (index: number) => {
    const newOptions = [...editedQuestion.static_options];
    newOptions.splice(index, 1);
    setEditedQuestion({ ...editedQuestion, static_options: newOptions });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(editedQuestion);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-4">
        <Label htmlFor="question_text">Question Text</Label>
        <Input
          id="question_text"
          value={editedQuestion.question_text}
          onChange={(e) =>
            setEditedQuestion({
              ...editedQuestion,
              question_text: e.target.value,
            })
          }
          required
        />
      </div>
      {editedQuestion.static_options.map((option, index) => (
        <div
          key={option.id || index}
          className="mb-4 flex items-center space-x-2"
        >
          <Input
            value={option.option_text}
            onChange={(e) =>
              handleOptionChange(index, "option_text", e.target.value)
            }
            placeholder={`Option ${index + 1}`}
            required
          />
          <div className="flex items-center space-x-2">
            <Checkbox
              id={`correct-${index}`}
              checked={option.is_correct}
              onCheckedChange={(checked) =>
                handleOptionChange(index, "is_correct", checked as boolean)
              }
            />
            <Label htmlFor={`correct-${index}`}>Correct</Label>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => handleRemoveOption(index)}
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleAddOption}
        className="mb-4"
      >
        <Plus className="h-4 w-4 mr-2" /> Add Option
      </Button>
      <div className="flex justify-between mt-4">
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
