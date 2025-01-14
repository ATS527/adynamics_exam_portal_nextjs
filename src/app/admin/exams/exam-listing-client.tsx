"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Loader2, Plus, Pencil, Trash2, CircleHelp, ClipboardPenLine } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

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
    try {
      const { error } = await supabase.from("exams").delete().eq("id", id);

      if (error) {
        console.error("Error deleting exam:", error.message);
        throw error;
      }

      // Update the local state to remove the deleted exam
      setExams(exams.filter((exam) => exam.id !== id));
      
      // Refresh the router to ensure the UI is in sync
      router.refresh();
    } catch (error: any) {
      console.error("Error deleting exam:", error);
      // Show the error in the UI instead of using alert
      setError(`Failed to delete exam: ${error.message}`);
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
    return <div className="text-center text-red-600">Error: {error}</div>;
  }

  return (
    <div className="container mx-auto px-4 pb-16" style={{ marginTop: "20px" }}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger className="fixed right-6 bottom-6 lg:right-10 lg:bottom-10">
            <Button
              className="rounded-full px-5 py-7"
              onClick={handleCreateExam}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent className="lg:mt-8">Create Exam</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {error && (
          <div className="col-span-full p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">
            {error}
          </div>
        )}
        {exams.map((exam) => (
          <Card key={exam.id} className="flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center capitalize">
                <ClipboardPenLine className="mr-1 h-4 w-4" /> {exam.title}
              </CardTitle>
              <CardDescription className="text-primary">{exam.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-sm text-gray-600 flex items-center">
                <CircleHelp className="mr-2 h-4 w-4" />
                Number of questions &nbsp;
                <Badge variant={"secondary"}>{exam.question_count}</Badge>
              </p>
            </CardContent>
            <CardFooter className="mt-auto">
              <div className="flex justify-between w-full">
                <Button
                  variant="outline"
                  onClick={() => handleEditExam(exam.id)}
                >
                  <Pencil className="mr-2 h-4 w-4" /> Edit
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Are you sure ?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete the exam &quot;{exam.title}
                        &quot; and all associated data. This action cannot be
                        undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDeleteExam(exam.id)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
