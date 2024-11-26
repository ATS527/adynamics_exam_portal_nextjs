"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Plus, X } from "lucide-react";

interface Exam {
  id: string;
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

interface QuestionBank {
  id: string;
  title: string;
  questions: Question[];
}

interface Question {
  id: string;
  question_text: string;
}

interface EditExamClientProps {
  id: string;
}

export function EditExamClient({ id }: EditExamClientProps) {
  const [exam, setExam] = useState<Exam | null>(null);
  const [questionBanks, setQuestionBanks] = useState<QuestionBank[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchExamAndQuestions() {
      try {
        setIsLoading(true);
        // Fetch exam data
        const { data: examData, error: examError } = await supabase
          .from("exams")
          .select("*")
          .eq("id", id)
          .single();

        if (examError) throw examError;

        // Ensure that message is not null
        examData.message = examData.message || "";
        examData.description = examData.description || "";
        examData.instructions = examData.instructions || [];

        if (examError) throw examError;

        // Fetch selected questions for the exam
        const { data: examQuestions, error: questionsError } = await supabase
          .from("exam_questions")
          .select("question_id")
          .eq("exam_id", id);

        if (questionsError) throw questionsError;

        // Fetch all question banks and their questions
        const { data: questionBanksData, error: banksError } =
          await supabase.from("question_banks").select(`
            id,
            title,
            questions (id, question_text)
          `);

        if (banksError) throw banksError;

        setExam(examData);
        setSelectedQuestions(examQuestions.map((eq) => eq.question_id));
        setQuestionBanks(questionBanksData);
      } catch (error: any) {
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    }

    fetchExamAndQuestions();
  }, [id]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setExam((prev) => (prev ? { ...prev, [name]: value } : null));
  };
  const handleNumberInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setExam((prev) =>
      prev ? { ...prev, [name]: parseInt(value) || 0 } : null
    );
  };

  const handleSwitchChange = (checked: boolean) => {
    setExam((prev) => (prev ? { ...prev, is_premium: checked } : null));
  };

  const handleInstructionChange = (index: number, value: string) => {
    if (!exam) return;
    const newInstructions = [...exam.instructions];
    newInstructions[index] = value;
    setExam({ ...exam, instructions: newInstructions });
  };

  const addInstruction = () => {
    if (!exam) return;
    setExam({ ...exam, instructions: [...exam.instructions, ""] });
  };

  const removeInstruction = (index: number) => {
    if (!exam) return;
    const newInstructions = exam.instructions.filter((_, i) => i !== index);
    setExam({ ...exam, instructions: newInstructions });
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
    if (!exam) return;

    try {
      // Update the exam
      const { error: examError } = await supabase
        .from("exams")
        .update(exam)
        .eq("id", exam.id);

      if (examError) throw examError;

      // Delete existing exam questions
      const { error: deleteError } = await supabase
        .from("exam_questions")
        .delete()
        .eq("exam_id", exam.id);

      if (deleteError) throw deleteError;

      // Insert the selected questions
      const { error: questionsError } = await supabase
        .from("exam_questions")
        .insert(
          selectedQuestions.map((questionId) => ({
            exam_id: exam.id,
            question_id: questionId,
          }))
        );

      if (questionsError) throw questionsError;

      alert("Exam updated successfully!");
      router.push("/admin/exams");
    } catch (error: any) {
      console.error("Error updating exam:", error.message);
      alert(`Failed to update exam: ${error.message}`);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="text-center text-red-600">Error: {error}</div>
      </Layout>
    );
  }

  if (!exam) {
    return (
      <Layout>
        <div className="text-center text-red-600">Error: Exam not found</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Edit Exam</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="title">Exam Title</Label>
            <Input
              id="title"
              name="title"
              value={exam.title}
              onChange={handleInputChange}
              required
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={exam.description}
              onChange={handleInputChange}
              rows={3}
            />
          </div>
          <div>
            <Label>Instructions</Label>
            {exam.instructions.map((instruction, index) => (
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
              value={exam.message}
              onChange={handleInputChange}
              rows={3}
            />
          </div>
          <div>
            <Label htmlFor="start_time">Start Time</Label>
            <Input
              id="start_time"
              name="start_time"
              type="datetime-local"
              value={exam.start_time.slice(0, 16)} // Format for datetime-local input
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
              value={exam.end_time.slice(0, 16)} // Format for datetime-local input
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
              value={exam.duration_minutes}
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
              value={exam.force_time}
              onChange={handleNumberInputChange}
              required
            />
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="is_premium"
              checked={exam.is_premium}
              onCheckedChange={handleSwitchChange}
            />
            <Label htmlFor="is_premium">Premium Exam</Label>
          </div>
          {exam.is_premium && (
            <div>
              <Label htmlFor="cost">Cost</Label>
              <Input
                id="cost"
                name="cost"
                type="number"
                value={exam.cost || ""}
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
                        {question.question_text}
                      </Label>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
          <Button type="submit">Update Exam</Button>
        </form>
      </div>
    </Layout>
  );
}
