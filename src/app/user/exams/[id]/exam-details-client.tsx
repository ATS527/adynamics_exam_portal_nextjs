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
import { Loader2, AlertCircle, Clock, HelpCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface Exam {
  id: string;
  title: string;
  description: string;
  message: string;
  instructions: string[];
  start_time: string;
  end_time: string;
  duration_minutes: number;
  question_count: number;
}

export function ExamDetailsClient({ examId }: { examId: string }) {
  const [exam, setExam] = useState<Exam | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchExamDetails() {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from("exams")
          .select(
            `
            *,
            exam_questions (count)
          `
          )
          .eq("id", examId)
          .single();

        if (error) throw error;

        setExam({
          ...data,
          question_count: data.exam_questions[0].count,
          instructions: data.instructions || [],
        });
      } catch (error: any) {
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    }

    fetchExamDetails();
  }, [examId]);

  const handleStartExam = () => {
    // Navigate to the actual exam page
    router.push(`/user/exams/${examId}/take`);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !exam) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error || "Failed to load exam details. Please try again."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>{exam.title}</CardTitle>
          <CardDescription>{exam.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Exam Message</h3>
            <p>{exam.message}</p>
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Instructions</h3>
            <ul className="list-disc pl-5 space-y-1">
              {exam.instructions.map((instruction, index) => (
                <li key={index}>{instruction}</li>
              ))}
            </ul>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center">
              <Clock className="mr-2 h-4 w-4" />
              <span>Duration: {exam.duration_minutes} minutes</span>
            </div>
            <div className="flex items-center">
              <HelpCircle className="mr-2 h-4 w-4" />
              <span>Questions: {exam.question_count}</span>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleStartExam} className="w-full">
            Start Exam
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
