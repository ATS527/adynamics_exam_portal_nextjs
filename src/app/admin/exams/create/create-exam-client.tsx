"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Plus, X } from "lucide-react";

interface QuestionBank {
  id: string;
  title: string;
  questions: Question[];
}

interface Question {
  id: string;
  question_text: string;
  question_type: string;
  template?: string;
}

interface ExamFormData {
  title: string;
  description: string;
  instructions: string[];
  message: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  force_time: number;
  is_premium: boolean;
  cost: number | null;
}

export function CreateExamClient() {
  const [formData, setFormData] = useState<ExamFormData>({
    title: "",
    description: "",
    instructions: [""],
    message: "",
    start_time: "",
    end_time: "",
    duration_minutes: 0,
    force_time: 0,
    is_premium: false,
    cost: null,
  });
  const [questionBanks, setQuestionBanks] = useState<QuestionBank[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchQuestionBanks() {
      try {
        setIsLoading(true);
        const { data, error } = await supabase.from("question_banks").select(`
            id,
            title,
            questions (
              id,
              question_text,
              question_type,
              template
            )
          `);

        if (error) throw error;

        setQuestionBanks(data);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    }

    fetchQuestionBanks();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNumberInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: parseInt(value) || 0 }));
  };

  const handleSwitchChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, is_premium: checked }));
  };

  const handleInstructionChange = (index: number, value: string) => {
    const newInstructions = [...formData.instructions];
    newInstructions[index] = value;
    setFormData((prev) => ({ ...prev, instructions: newInstructions }));
  };

  const addInstruction = () => {
    setFormData((prev) => ({
      ...prev,
      instructions: [...prev.instructions, ""],
    }));
  };

  const removeInstruction = (index: number) => {
    const newInstructions = formData.instructions.filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, instructions: newInstructions }));
  };

  const handleSelectAllQuestions = (checked: boolean) => {
    if (checked) {
      const allQuestionIds = questionBanks.flatMap((bank) =>
        bank.questions.map((q) => q.id)
      );
      setSelectedQuestions(allQuestionIds);
    } else {
      setSelectedQuestions([]);
    }
  };

  const handleSelectAllQuestionsFromBank = (
    bankId: string,
    checked: boolean
  ) => {
    const bank = questionBanks.find((b) => b.id === bankId);
    if (!bank) return;

    if (checked) {
      const bankQuestionIds = bank.questions.map((q) => q.id);
      setSelectedQuestions((prev) => [
        ...new Set([...prev, ...bankQuestionIds]),
      ]);
    } else {
      setSelectedQuestions((prev) =>
        prev.filter((id) => !bank.questions.some((q) => q.id === id))
      );
    }
  };

  const handleSelectQuestion = (questionId: string, checked: boolean) => {
    if (checked) {
      setSelectedQuestions((prev) => [...prev, questionId]);
    } else {
      setSelectedQuestions((prev) => prev.filter((id) => id !== questionId));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Insert the exam
      const { data: examData, error: examError } = await supabase
        .from("exams")
        .insert([formData])
        .select();

      if (examError) throw examError;

      const examId = examData[0].id;

      // Insert the selected questions
      const { error: questionsError } = await supabase
        .from("exam_questions")
        .insert(
          selectedQuestions.map((questionId) => ({
            exam_id: examId,
            question_id: questionId,
          }))
        );

      if (questionsError) throw questionsError;

      alert("Exam created successfully!");
      router.push("/admin/exams");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error("Error creating exam:", error.message);
      alert(`Failed to create exam: ${error.message}`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600">Error: {error}</div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Create New Exam</h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Label htmlFor="title">Exam Title</Label>
          <Input
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            required
          />
        </div>
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={3}
          />
        </div>
        <div>
          <Label>Instructions</Label>
          {formData.instructions.map((instruction, index) => (
            <div key={index} className="flex items-center space-x-2 mt-2">
              <Input
                value={instruction}
                onChange={(e) =>
                  handleInstructionChange(index, e.target.value)
                }
                placeholder={`Instruction ${index + 1}`}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => removeInstruction(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={addInstruction}
            className="mt-2"
          >
            <Plus className="h-4 w-4 mr-2" /> Add Instruction
          </Button>
        </div>
        <div>
          <Label htmlFor="message">Message</Label>
          <Textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleInputChange}
            rows={3}
            placeholder="Enter a message for the exam takers"
          />
        </div>
        <div>
          <Label htmlFor="start_time">Start Time</Label>
          <Input
            id="start_time"
            name="start_time"
            type="datetime-local"
            value={formData.start_time}
            onChange={handleInputChange}
            required
          />
        </div>
        <div>
          <Label htmlFor="end_time">End Time</Label>
          <Input
            id="end_time"
            name="end_time"
            type="datetime-local"
            value={formData.end_time}
            onChange={handleInputChange}
            required
          />
        </div>
        <div>
          <Label htmlFor="duration_minutes">Duration (minutes)</Label>
          <Input
            id="duration_minutes"
            name="duration_minutes"
            type="number"
            value={formData.duration_minutes}
            onChange={handleNumberInputChange}
            required
          />
        </div>
        <div>
          <Label htmlFor="force_time">Force Time (seconds)</Label>
          <Input
            id="force_time"
            name="force_time"
            type="number"
            value={formData.force_time}
            onChange={handleNumberInputChange}
            required
          />
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            id="is_premium"
            checked={formData.is_premium}
            onCheckedChange={handleSwitchChange}
          />
          <Label htmlFor="is_premium">Premium Exam</Label>
        </div>
        {formData.is_premium && (
          <div>
            <Label htmlFor="cost">Cost</Label>
            <Input
              id="cost"
              name="cost"
              type="number"
              value={formData.cost || ""}
              onChange={handleNumberInputChange}
              required
            />
          </div>
        )}
        <div>
          <h2 className="text-xl font-bold mb-4">Select Questions</h2>
          <div className="mb-4">
            <Checkbox
              id="select-all"
              checked={
                selectedQuestions.length ===
                questionBanks.flatMap((bank) => bank.questions).length
              }
              onCheckedChange={handleSelectAllQuestions}
            />
            <Label htmlFor="select-all" className="ml-2">
              Select All Questions
            </Label>
          </div>
          {questionBanks.map((bank) => (
            <Card key={bank.id} className="mb-4">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Checkbox
                    id={`bank-${bank.id}`}
                    checked={bank.questions.every((q) =>
                      selectedQuestions.includes(q.id)
                    )}
                    onCheckedChange={(checked) =>
                      handleSelectAllQuestionsFromBank(
                        bank.id,
                        checked as boolean
                      )
                    }
                  />
                  <Label htmlFor={`bank-${bank.id}`} className="ml-2">
                    {bank.title}
                  </Label>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {bank.questions.map((question) => (
                  <div
                    key={question.id}
                    className="flex items-center space-x-2 mt-2"
                  >
                    <Checkbox
                      id={`question-${question.id}`}
                      checked={selectedQuestions.includes(question.id)}
                      onCheckedChange={(checked) =>
                        handleSelectQuestion(question.id, checked as boolean)
                      }
                    />
                    <Label htmlFor={`question-${question.id}`}>
                      {question.question_type === 'static' 
                        ? question.question_text 
                        : question.template || 'Dynamic Question'}
                      <span className="ml-2 text-sm text-gray-500">
                        ({question.question_type})
                      </span>
                    </Label>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
        <Button type="submit">Create Exam</Button>
      </form>
    </div>
  );
}
