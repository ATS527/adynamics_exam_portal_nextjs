import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, X } from "lucide-react";
import { StaticQuestion, QuestionFormProps } from "@/types/questions";

interface StaticQuestionFormProps extends QuestionFormProps {
  question: StaticQuestion;
}

export default function StaticQuestionForm({
  question,
  onUpdate,
  onDelete,
  onCancel,
}: StaticQuestionFormProps) {
  const [editedQuestion, setEditedQuestion] = useState<StaticQuestion>(question);

  const handleOptionChange = (index: number, field: 'option_text' | 'is_correct', value: any) => {
    const newOptions = [...editedQuestion.options];
    newOptions[index] = {
      ...newOptions[index],
      [field]: value
    };
    setEditedQuestion({
      ...editedQuestion,
      options: newOptions
    });
  };

  const addOption = () => {
    if (editedQuestion.options.length < 4) {
      setEditedQuestion({
        ...editedQuestion,
        options: [
          ...editedQuestion.options,
          {
            option_number: editedQuestion.options.length + 1,
            option_text: '',
            is_correct: false
          }
        ]
      });
    }
  };

  const removeOption = (index: number) => {
    const newOptions = editedQuestion.options
      .filter((_, i) => i !== index)
      .map((opt, i) => ({
        ...opt,
        option_number: i + 1
      }));
    
    setEditedQuestion({
      ...editedQuestion,
      options: newOptions
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Question Text</Label>
        <Textarea
          value={editedQuestion.question_text}
          onChange={(e) => setEditedQuestion({
            ...editedQuestion,
            question_text: e.target.value
          })}
          placeholder="Enter your question"
        />
      </div>

      <div>
        <Label>Options</Label>
        {editedQuestion.options.map((option, index) => (
          <div key={index} className="flex items-center space-x-2 mt-2">
            <Input
              value={option.option_text}
              onChange={(e) => handleOptionChange(index, 'option_text', e.target.value)}
              placeholder={`Option ${option.option_number}`}
            />
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                name="correct_option"
                checked={option.is_correct}
                onChange={(e) => {
                  const newOptions = editedQuestion.options.map((opt, i) => ({
                    ...opt,
                    is_correct: i === index
                  }));
                  setEditedQuestion({
                    ...editedQuestion,
                    options: newOptions
                  });
                }}
              />
              <Label>Correct</Label>
            </div>
            <Button
              variant="destructive"
              size="icon"
              onClick={() => removeOption(index)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
        {editedQuestion.options.length < 4 && (
          <Button
            variant="outline"
            size="sm"
            onClick={addOption}
            className="mt-2"
          >
            <Plus className="h-4 w-4 mr-2" /> Add Option
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
