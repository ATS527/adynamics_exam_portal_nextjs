"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Layout from "@/components/Layout";
import { Plus, Trash2 } from "lucide-react";
import CreateQuestionBankDialog from "@/components/CreateQuestionBankDialog";
import Link from "next/link";

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
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchQuestionBanks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const handleCreateQuestionBank = () => {
    setIsDialogOpen(true);
  };

  const handleDeleteQuestionBank = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this question bank?")) {
      try {
        const { error } = await supabase
          .from("question_banks")
          .delete()
          .eq("id", id);

        if (error) throw error;

        fetchQuestionBanks();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        setError(error.message);
      }
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="text-center">Loading...</div>
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
          <h1 className="text-2xl font-bold">Question Banks</h1>
          <button
            onClick={handleCreateQuestionBank}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded flex items-center"
          >
            <Plus className="mr-2" size={20} />
            Create New
          </button>
        </div>
        {questionBanks.length === 0 ? (
          <div className="text-center text-gray-600">
            No Question Banks available
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {questionBanks.map((bank) => (
              <div key={bank.id} className="bg-white shadow-md rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-2">{bank.title}</h2>
                <p className="text-gray-600 mb-4">{bank.description}</p>
                <p className="text-sm text-gray-500 mb-4">
                  Questions: {bank.question_count}
                </p>
                <div className="flex justify-between">
                  <Link
                    href={`/admin/question-banks/${bank.id}/edit`}
                    className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded inline-block"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDeleteQuestionBank(bank.id)}
                    className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded flex items-center"
                  >
                    <Trash2 className="mr-2" size={16} />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <CreateQuestionBankDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onCreateSuccess={() => {
          setIsDialogOpen(false);
          fetchQuestionBanks();
        }}
      />
    </Layout>
  );
}
