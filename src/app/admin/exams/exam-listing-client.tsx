"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react";

interface Exam {
  id: string;
  title: string;
  description: string;
  question_count: number;
}

export function ExamListingClient() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchExams() {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from("exams")
          .select(
            `
            id,
            title,
            description,
            exam_questions (count)
          `
          )
          .order("created_at", { ascending: false });

        if (error) throw error;

        const examsWithQuestionCount = data.map((exam) => ({
          ...exam,
          question_count: exam.exam_questions[0].count,
        }));

        setExams(examsWithQuestionCount);
      } catch (error: any) {
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    }

    fetchExams();
  }, []);

  const handleCreateExam = () => {
    router.push("/admin/exams/create");
  };

  const handleEditExam = (id: string) => {
    router.push(`/admin/exams/${id}/edit`);
  };

  const handleDeleteExam = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this exam?")) {
      try {
        const { error } = await supabase.from("exams").delete().eq("id", id);

        if (error) throw error;

        setExams(exams.filter((exam) => exam.id !== id));
      } catch (error: any) {
        console.error("Error deleting exam:", error.message);
        alert("Failed to delete exam");
      }
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
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Exams</h1>
          <Button onClick={handleCreateExam}>
            <Plus className="mr-2 h-4 w-4" /> Create Exam
          </Button>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {exams.map((exam) => (
            <Card key={exam.id}>
              <CardHeader>
                <CardTitle>{exam.title}</CardTitle>
                <CardDescription>{exam.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <p>Number of questions: {exam.question_count}</p>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => handleEditExam(exam.id)}
                >
                  <Pencil className="mr-2 h-4 w-4" /> Edit
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleDeleteExam(exam.id)}
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
}
