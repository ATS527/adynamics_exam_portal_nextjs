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
  question_type: string;
  template?: string;
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

        // Format datetime values for input fields
        const formattedExamData = {
          ...examData,
          message: examData.message || "",
          description: examData.description || "",
          instructions: examData.instructions || [],
          start_time: examData.start_time ? new Date(examData.start_time).toISOString().slice(0, 16) : "",
          end_time: examData.end_time ? new Date(examData.end_time).toISOString().slice(0, 16) : ""
        };

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
            questions (
              id,
              question_text,
              question_type,
              template
            )
          `);

        if (banksError) throw banksError;

        setExam(formattedExamData);
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

  const handleSubmit = async (e: React.FormEvent) => {
    setIsLoading(true)
    e.preventDefault();
    if (!exam) return;

    try {
      // Format dates back to ISO strings for Supabase
      const formattedExam = {
        ...exam,
        start_time: new Date(exam.start_time).toISOString(),
        end_time: new Date(exam.end_time).toISOString()
      };

      // Update exam data
      const { error: updateError } = await supabase
        .from("exams")
        .update({
          title: formattedExam.title,
          description: formattedExam.description,
          instructions: formattedExam.instructions,
          message: formattedExam.message,
          start_time: formattedExam.start_time,
          end_time: formattedExam.end_time,
          duration_minutes: formattedExam.duration_minutes,
          force_time: formattedExam.force_time,
          is_premium: formattedExam.is_premium,
          cost: formattedExam.is_premium ? formattedExam.cost : null,
        })
        .eq("id", id);

      if (updateError) throw updateError;

      // Delete existing exam questions
      const { error: deleteError } = await supabase
        .from("exam_questions")
        .delete()
        .eq("exam_id", id);

      if (deleteError) throw deleteError;

      // Insert new exam questions
      if (selectedQuestions.length > 0) {
        const { error: insertError } = await supabase
          .from("exam_questions")
          .insert(
            selectedQuestions.map((questionId) => ({
              exam_id: id,
              question_id: questionId,
            }))
          );

        if (insertError) throw insertError;
      }

      router.push("/admin/exams");
      router.refresh();
    } catch (error: any) {
      setError(error.message);
    }finally{
      setIsLoading(false)
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    if (!exam) return;
    const { name, value } = e.target;
    setExam((prev) => (prev ? { ...prev, [name]: value } : null));
  };

  const handleNumberInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!exam) return;
    const { name, value } = e.target;
    setExam((prev) =>
      prev ? { ...prev, [name]: parseInt(value) || 0 } : null
    );
  };

  const handleSwitchChange = (checked: boolean) => {
    if (!exam) return;
    setExam((prev) => (prev ? { ...prev, is_premium: checked } : null));
  };

  const handleInstructionChange = (index: number, value: string) => {
    if (!exam) return;
    const newInstructions = [...exam.instructions];
    newInstructions[index] = value;
    setExam((prev) =>
      prev ? { ...prev, instructions: newInstructions } : null
    );
  };

  const addInstruction = () => {
    if (!exam) return;
    setExam((prev) =>
      prev ? { ...prev, instructions: [...prev.instructions, ""] } : null
    );
  };

  const removeInstruction = (index: number) => {
    if (!exam) return;
    const newInstructions = exam.instructions.filter((_, i) => i !== index);
    setExam((prev) =>
      prev ? { ...prev, instructions: newInstructions } : null
    );
  };

  const handleSelectQuestion = (questionId: string, checked: boolean) => {
    setSelectedQuestions((prev) =>
      checked
        ? [...prev, questionId]
        : prev.filter((id) => id !== questionId)
    );
  };

  const handleSelectAllQuestionsFromBank = (
    bankId: string,
    checked: boolean
  ) => {
    const bank = questionBanks.find((b) => b.id === bankId);
    if (!bank) return;

    const questionIds = bank.questions.map((q) => q.id);
    setSelectedQuestions((prev) =>
      checked
        ? Array.from(new Set([...prev, ...questionIds]))
        : prev.filter((id) => !questionIds.includes(id))
    );
  };

  const handleSelectAllQuestions = (checked: boolean) => {
    const allQuestionIds = questionBanks
      .flatMap((bank) => bank.questions)
      .map((q) => q.id);
    setSelectedQuestions(checked ? allQuestionIds : []);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="text-center text-red-600">
        Exam not found
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6 max-w-4xl">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Edit Exam</h1>
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
            <div key={index} className="flex items-center space-x-2 mt-2 border shadow-sm rounded-lg">
              <Input
                value={instruction}
                onChange={(e) => handleInstructionChange(index, e.target.value)}
                placeholder={`Instruction ${index + 1}`}
                className="border-none shadow-none rounded-r-none"
              />
              <Button
                type="button"
                variant="default"
                onClick={() => removeInstruction(index)}
                className="rounded-l-none hover:bg-destructive"
                style={{marginLeft:"0"}}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}

          <div className="flex justify-end">
            <Button
              type="button"
              variant="default"
              onClick={addInstruction}
              className="mt-3 hover:bg-main"
            >
              <Plus className="h-4 w-4 mr-2" /> Add Instruction
            </Button>
          </div>
        </div>

        <div>
          <Label htmlFor="message">Message</Label>
          <Textarea
            id="message"
            name="message"
            value={exam.message}
            onChange={handleInputChange}
            rows={3}
            placeholder="Enter a message for the exam takers"
          />
        </div>

        <div className="sm:flex w-full gap-6">
          <div className="sm:flex items-center flex-col w-full gap-6">
            <div className="w-full">
              <Label htmlFor="start_time">Start Time</Label>
              <Input
                id="start_time"
                name="start_time"
                type="datetime-local"
                value={exam.start_time}
                onChange={handleInputChange}
                required
                className="w-full"
              />
            </div>

            <div className="w-full mt-6 sm:mt-0">
              <Label htmlFor="end_time">End Time</Label>
              <Input
                id="end_time"
                name="end_time"
                type="datetime-local"
                value={exam.end_time}
                onChange={handleInputChange}
                required
                className="w-full"
              />
            </div>
          </div>

          <div className="sm:flex items-center flex-col w-full gap-6">
            <div className="w-full mt-6 sm:mt-0">
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

            <div className="w-full mt-6 sm:mt-0">
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
          </div>
        </div>

        <div className="flex items-center justify-between space-x-2">
          <div className="flex items-center space-x-2 mt-6">
            <Switch
              id="is_premium"
              checked={exam.is_premium}
              onCheckedChange={handleSwitchChange}
            />
            <Label htmlFor="is_premium">Premium Exam</Label>
          </div>
            <div className="w-2/3">
              <Label htmlFor="cost" className={`${!exam.is_premium && "text-muted"}`}>Cost</Label>
              <Input
                id="cost"
                name="cost"
                type="number"
                value={exam.cost || ""}
                onChange={handleNumberInputChange}
                required = { exam.is_premium && true }
                readOnly = { exam.is_premium && true }
                disabled = { !exam.is_premium && true }
              />
            </div>
        </div>


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
                      handleSelectAllQuestionsFromBank(bank.id, checked as boolean)
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
                    className="flex items-start space-x-2 mt-5"
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
          <div className="flex justify-end">
            <Button type="submit">Save Changes</Button>
          </div>
      </form>
    </div>
  );
}
