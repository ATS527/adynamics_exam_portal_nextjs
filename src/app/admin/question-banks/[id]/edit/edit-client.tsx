"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Trash2 } from "lucide-react";
import StaticQuestionForm from "@/components/StaticQuestionForm";
import DynamicQuestionForm from "@/components/DynamicQuestionForm";
import { Question, StaticQuestion, DynamicQuestion } from "@/types/questions";

interface QuestionBank {
  id: string;
  title: string;
  description: string;
}

interface EditQuestionBankClientProps {
  id: string;
}

export function EditQuestionBankClient({ id }: EditQuestionBankClientProps) {
  const [questionBank, setQuestionBank] = useState<QuestionBank | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddingStatic, setIsAddingStatic] = useState(false);
  const [isAddingDynamic, setIsAddingDynamic] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        const { data: questionBankData, error: questionBankError } =
          await supabase
            .from("question_banks")
            .select("*")
            .eq("id", id)
            .single();

        if (questionBankError) throw questionBankError;

        setQuestionBank(questionBankData);

        const { data: questionsData, error: questionsError } = await supabase
          .from("questions")
          .select(
            `
            id,
            question_type,
            question_text,
            static_options (id, option_text, is_correct),
            dynamic_question_templates (id, template, variable_ranges, option_generation_rules, correct_answer_equation)
          `
          )
          .eq("question_bank_id", id);

        if (questionsError) throw questionsError;

        setQuestions(
          questionsData.map((q: any) => {
            if (q.question_type === "static") {
              return {
                id: q.id,
                question_type: "static",
                question_text: q.question_text,
                static_options: q.static_options,
              } as StaticQuestion;
            } else {
              return {
                id: q.id,
                question_type: "dynamic",
                dynamic_template: q.dynamic_question_templates[0],
              } as DynamicQuestion;
            }
          })
        );
      } catch (error: any) {
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [id]);

  const handleQuestionBankUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionBank) return;

    try {
      const { error } = await supabase
        .from("question_banks")
        .update({
          title: questionBank.title,
          description: questionBank.description,
        })
        .eq("id", questionBank.id);

      if (error) throw error;

      alert("Question bank updated successfully");
    } catch (error: any) {
      console.error("Error updating question bank:", error.message);
      alert("Failed to update question bank");
    }
  };

  const handleQuestionUpdate = async (updatedQuestion: Question) => {
    try {
      if (updatedQuestion.question_type === "static") {
        const { error: questionError } = await supabase
          .from("questions")
          .update({
            question_text: updatedQuestion.question_text,
            question_type: updatedQuestion.question_type,
          })
          .eq("id", updatedQuestion.id);

        if (questionError) throw questionError;

        for (const option of updatedQuestion.static_options) {
          const { error: optionError } = await supabase
            .from("static_options")
            .update({
              option_text: option.option_text,
              is_correct: option.is_correct,
            })
            .eq("id", option.id);

          if (optionError) throw optionError;
        }
      } else {
        const { error: questionError } = await supabase
          .from("questions")
          .update({ question_type: updatedQuestion.question_type })
          .eq("id", updatedQuestion.id);

        if (questionError) throw questionError;

        const { error: templateError } = await supabase
          .from("dynamic_question_templates")
          .update({
            template: updatedQuestion.dynamic_template.template,
            variable_ranges: updatedQuestion.dynamic_template.variable_ranges,
            option_generation_rules:
              updatedQuestion.dynamic_template.option_generation_rules,
            correct_answer_equation:
              updatedQuestion.dynamic_template.correct_answer_equation,
          })
          .eq("id", updatedQuestion.dynamic_template.id);

        if (templateError) throw templateError;
      }

      setQuestions(
        questions.map((q) =>
          q.id === updatedQuestion.id ? updatedQuestion : q
        )
      );
      alert("Question updated successfully");
    } catch (error: any) {
      console.error("Error updating question:", error.message);
    }
  };

  const handleQuestionDelete = async (questionId: string) => {
    if (!window.confirm("Are you sure you want to delete this question?"))
      return;

    try {
      const { error } = await supabase
        .from("questions")
        .delete()
        .eq("id", questionId);

      if (error) throw error;

      setQuestions(questions.filter((q) => q.id !== questionId));
    } catch (error: any) {
      console.error("Error deleting question:", error.message);
    }
  };

  const handleAddQuestion = async (newQuestion: Omit<Question, "id">) => {
    try {
      const { data: insertedQuestion, error: questionError } = await supabase
        .from("questions")
        .insert({
          question_bank_id: questionBank?.id,
          question_type: newQuestion.question_type,
          ...(newQuestion.question_type === "static"
            ? { question_text: (newQuestion as StaticQuestion).question_text }
            : {}),
        })
        .select()
        .single();

      if (questionError) throw questionError;

      if (newQuestion.question_type === "static") {
        const staticQuestion = newQuestion as StaticQuestion;
        const { data: insertedOptions, error: optionsError } = await supabase
          .from("static_options")
          .insert(
            staticQuestion.static_options.map((option) => ({
              option_text: option.option_text,
              is_correct: option.is_correct,
              question_id: insertedQuestion.id,
            }))
          )
          .select();

        if (optionsError) throw optionsError;

        const fullStaticQuestion: StaticQuestion = {
          ...insertedQuestion,
          static_options: insertedOptions,
        };

        setQuestions([...questions, fullStaticQuestion]);
      } else {
        const dynamicQuestion = newQuestion as DynamicQuestion;
        const { data: insertedTemplate, error: templateError } = await supabase
          .from("dynamic_question_templates")
          .insert({
            ...dynamicQuestion.dynamic_template,
            question_id: insertedQuestion.id,
          })
          .select()
          .single();

        if (templateError) throw templateError;

        const fullDynamicQuestion: DynamicQuestion = {
          ...insertedQuestion,
          dynamic_template: insertedTemplate,
        };

        setQuestions([...questions, fullDynamicQuestion]);
      }

      setIsAddingStatic(false);
      setIsAddingDynamic(false);
      alert("Question added successfully");
    } catch (error: any) {
      console.error("Error adding question:", error.message);
      alert(`Failed to add question: ${error.message}`);
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

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Edit Question Bank</h1>
        {questionBank && (
          <form onSubmit={handleQuestionBankUpdate} className="mb-8">
            <div className="mb-4">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={questionBank.title}
                onChange={(e) =>
                  setQuestionBank({ ...questionBank, title: e.target.value })
                }
                required
              />
            </div>
            <div className="mb-4">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={questionBank.description}
                onChange={(e) =>
                  setQuestionBank({
                    ...questionBank,
                    description: e.target.value,
                  })
                }
                rows={3}
              />
            </div>
            <Button type="submit">Update Question Bank</Button>
          </form>
        )}

        <h2 className="text-xl font-bold mb-4">Questions</h2>
        {questions.map((question) => (
          <div key={question.id} className="mb-6 p-4 border rounded">
            {question.question_type === "static" ? (
              <StaticQuestionForm
                question={question as StaticQuestion}
                onUpdate={handleQuestionUpdate}
                onDelete={() => handleQuestionDelete(question.id)}
              />
            ) : (
              <DynamicQuestionForm
                question={question as DynamicQuestion}
                onUpdate={handleQuestionUpdate}
                onDelete={() => handleQuestionDelete(question.id)}
              />
            )}
          </div>
        ))}

        <div className="mt-8">
          <Button onClick={() => setIsAddingStatic(true)} className="mr-4">
            <Plus className="mr-2 h-4 w-4" /> Add Static Question
          </Button>
          <Button onClick={() => setIsAddingDynamic(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Dynamic Question
          </Button>
        </div>

        {isAddingStatic && (
          <div className="mt-4 p-4 border rounded">
            <h3 className="text-lg font-bold mb-2">New Static Question</h3>
            <StaticQuestionForm
              question={{
                id: "",
                question_type: "static",
                question_text: "",
                static_options: [
                  { id: "", option_text: "", is_correct: false },
                  { id: "", option_text: "", is_correct: false },
                ],
              }}
              onUpdate={handleAddQuestion}
              onCancel={() => setIsAddingStatic(false)}
            />
          </div>
        )}

        {isAddingDynamic && (
          <div className="mt-4 p-4 border rounded">
            <h3 className="text-lg font-bold mb-2">New Dynamic Question</h3>
            <DynamicQuestionForm
              question={{
                id: "",
                question_type: "dynamic",
                dynamic_template: {
                  id: "",
                  template: "",
                  variable_ranges: {},
                  option_generation_rules: {},
                  correct_answer_equation: "",
                },
              }}
              onUpdate={handleAddQuestion}
              onCancel={() => setIsAddingDynamic(false)}
            />
          </div>
        )}
      </div>
    </Layout>
  );
}
