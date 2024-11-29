"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface QuestionBank {
  id: string;
  title: string;
  questions: Question[];
}

interface Question {
  id: string;
  question_text: string;
}

interface QuestionBankSelectorProps {
  examId: string;
}

export default function QuestionBankSelector({
  examId,
}: QuestionBankSelectorProps) {
  const [questionBanks, setQuestionBanks] = useState<QuestionBank[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchQuestionBanks() {
      try {
        setIsLoading(true);
        const { data, error } = await supabase.from("question_banks").select(`
            id,
            title,
            questions (id, question_text)
          `);

        if (error) throw error;

        setQuestionBanks(data);

        // Fetch already selected questions for this exam
        const { data: examQuestions, error: examQuestionsError } =
          await supabase
            .from("exam_questions")
            .select("question_id")
            .eq("exam_id", examId);

        if (examQuestionsError) throw examQuestionsError;

        setSelectedQuestions(examQuestions.map((eq) => eq.question_id));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    }

    fetchQuestionBanks();
  }, [examId]);

  const handleQuestionSelect = async (
    questionId: string,
    isChecked: boolean
  ) => {
    try {
      if (isChecked) {
        await supabase
          .from("exam_questions")
          .insert({ exam_id: examId, question_id: questionId });
        setSelectedQuestions([...selectedQuestions, questionId]);
      } else {
        await supabase
          .from("exam_questions")
          .delete()
          .eq("exam_id", examId)
          .eq("question_id", questionId);
        setSelectedQuestions(
          selectedQuestions.filter((id) => id !== questionId)
        );
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error("Error updating exam questions:", error.message);
    }
  };

  const handleSelectAll = async (bankId: string, isChecked: boolean) => {
    const bank = questionBanks.find((b) => b.id === bankId);
    if (!bank) return;

    try {
      if (isChecked) {
        const newQuestions = bank.questions.filter(
          (q) => !selectedQuestions.includes(q.id)
        );
        await supabase
          .from("exam_questions")
          .insert(
            newQuestions.map((q) => ({ exam_id: examId, question_id: q.id }))
          );
        setSelectedQuestions([
          ...selectedQuestions,
          ...newQuestions.map((q) => q.id),
        ]);
      } else {
        await supabase
          .from("exam_questions")
          .delete()
          .eq("exam_id", examId)
          .in(
            "question_id",
            bank.questions.map((q) => q.id)
          );
        setSelectedQuestions(
          selectedQuestions.filter(
            (id) => !bank.questions.some((q) => q.id === id)
          )
        );
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error("Error updating exam questions:", error.message);
    }
  };

  if (isLoading) {
    return <Loader2 className="h-8 w-8 animate-spin" />;
  }

  if (error) {
    return <div className="text-red-600">Error: {error}</div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Select Questions</h2>
      {questionBanks.map((bank) => (
        <div key={bank.id} className="border p-4 rounded-md">
          <div className="flex items-center space-x-2 mb-2">
            <Checkbox
              id={`bank-${bank.id}`}
              checked={bank.questions.every((q) =>
                selectedQuestions.includes(q.id)
              )}
              onCheckedChange={(checked) =>
                handleSelectAll(bank.id, checked as boolean)
              }
            />
            <Label htmlFor={`bank-${bank.id}`}>{bank.title}</Label>
          </div>
          <div className="ml-6 space-y-2">
            {bank.questions.map((question) => (
              <div key={question.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`question-${question.id}`}
                  checked={selectedQuestions.includes(question.id)}
                  onCheckedChange={(checked) =>
                    handleQuestionSelect(question.id, checked as boolean)
                  }
                />
                <Label htmlFor={`question-${question.id}`}>
                  {question.question_text}
                </Label>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
