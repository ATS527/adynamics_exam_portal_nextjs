"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Layout from "@/components/Layout";
import Navbar from "@/components/Navbar";

interface QuestionBank {
  id: string;
  title: string;
  description: string;
  question_count: number;
}

export default function QuestionBanks() {
  const [questionBanks, setQuestionBanks] = useState<QuestionBank[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchQuestionBanks = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) {
          router.push("/login");
          return;
        }

        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("role")
          .eq("id", session.user.id)
          .single();

        if (userError || userData?.role !== "admin") {
          router.push("/login");
          return;
        }

        const { data, error } = await supabase.from("question_banks").select(`
            id,
            title,
            description,
            questions (count)
          `);

        if (error) throw error;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const formattedData = data.map((bank: any) => ({
          ...bank,
          question_count: bank.questions[0].count,
        }));

        setQuestionBanks(formattedData);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuestionBanks();
  }, [router]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <Layout>
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">Question Banks</h1>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {questionBanks.map((bank) => (
            <div key={bank.id} className="bg-white shadow-md rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-2">{bank.title}</h2>
              <p className="text-gray-600 mb-4">{bank.description}</p>
              <p className="text-sm text-gray-500 mb-4">
                Questions: {bank.question_count}
              </p>
              <Link
                href={`/admin/question-banks/${bank.id}`}
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
              >
                View Details
              </Link>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
