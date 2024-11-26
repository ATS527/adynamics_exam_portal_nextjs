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
import { Loader2, Calendar, Clock, DollarSign, HelpCircle } from "lucide-react";

interface Exam {
  id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  is_premium: boolean;
  cost: number | null;
  question_count: number;
}

export function UserDashboardClient() {
  const [publicExams, setPublicExams] = useState<Exam[]>([]);
  const [premiumExams, setPremiumExams] = useState<Exam[]>([]);
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
            *,
            exam_questions (count)
          `
          )
          .order("start_time", { ascending: true });

        if (error) throw error;

        const examsWithQuestionCount = data.map((exam) => ({
          ...exam,
          question_count: exam.exam_questions[0].count,
        }));

        setPublicExams(
          examsWithQuestionCount.filter((exam) => !exam.is_premium)
        );
        setPremiumExams(
          examsWithQuestionCount.filter((exam) => exam.is_premium)
        );
      } catch (error: any) {
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    }

    fetchExams();
  }, []);

  const handleExamClick = (examId: string) => {
    router.push(`/user/exams/${examId}`);
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
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">User Dashboard</h1>

      <h2 className="text-2xl font-semibold mb-4">Public Exams</h2>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        {publicExams.map((exam) => (
          <ExamCard
            key={exam.id}
            exam={exam}
            onClick={() => handleExamClick(exam.id)}
          />
        ))}
      </div>

      <h2 className="text-2xl font-semibold mb-4">Premium Exams</h2>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {premiumExams.map((exam) => (
          <ExamCard
            key={exam.id}
            exam={exam}
            onClick={() => handleExamClick(exam.id)}
          />
        ))}
      </div>
    </div>
  );
}

interface ExamCardProps {
  exam: Exam;
  onClick: () => void;
}

function ExamCard({ exam, onClick }: ExamCardProps) {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>{exam.title}</CardTitle>
        <CardDescription>{exam.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="space-y-2">
          <div className="flex items-center">
            <Calendar className="mr-2 h-4 w-4" />
            <span>Start: {new Date(exam.start_time).toLocaleString()}</span>
          </div>
          <div className="flex items-center">
            <Calendar className="mr-2 h-4 w-4" />
            <span>End: {new Date(exam.end_time).toLocaleString()}</span>
          </div>
          <div className="flex items-center">
            <Clock className="mr-2 h-4 w-4" />
            <span>Duration: {exam.duration_minutes} minutes</span>
          </div>
          <div className="flex items-center">
            <HelpCircle className="mr-2 h-4 w-4" />
            <span>Questions: {exam.question_count}</span>
          </div>
          {exam.is_premium && (
            <div className="flex items-center">
              <DollarSign className="mr-2 h-4 w-4" />
              <span>Cost: ${exam.cost}</span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={onClick} className="w-full">
          {exam.is_premium ? "Purchase & View Exam" : "View Exam"}
        </Button>
      </CardFooter>
    </Card>
  );
}
