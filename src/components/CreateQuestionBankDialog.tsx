import { useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Upload } from "lucide-react";
import * as XLSX from "xlsx";

interface CreateQuestionBankDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateSuccess: () => void;
}

export default function CreateQuestionBankDialog({
  isOpen,
  onClose,
  onCreateSuccess,
}: CreateQuestionBankDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const parseXLSX = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        const parsedQuestions = jsonData
            .map((row: any) => {
            const baseQuestion = {
              question_text:
                row.question_text ||
                (row.question_type === "dynamic"
                  ? row.template
                  : "No question text provided"),
              question_type: row.question_type,
            };

            if (row.question_type === "static") {
              return {
                ...baseQuestion,
                static_options: [
                  {
                    option_text: row.option_1,
                    is_correct: row.correct_option === 1,
                  },
                  {
                    option_text: row.option_2,
                    is_correct: row.correct_option === 2,
                  },
                  {
                    option_text: row.option_3,
                    is_correct: row.correct_option === 3,
                  },
                  {
                    option_text: row.option_4,
                    is_correct: row.correct_option === 4,
                  },
                ].filter((option) => option.option_text), // Remove empty options
              };
            } else if (row.question_type === "dynamic") {
              return {
                ...baseQuestion,
                dynamic_template: {
                  template: row.template,
                  variable_ranges: JSON.parse(row.variable_ranges),
                  option_generation_rules: JSON.parse(
                    row.option_generation_rules
                  ),
                  correct_answer_equation: row.correct_answer_equation,
                },
              };
            }
            return null;
          })
          .filter(Boolean); // Remove any null entries

        resolve(parsedQuestions);
      };
      reader.onerror = (error) => reject(error);
      reader.readAsArrayBuffer(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Create question bank
      const { data: questionBank, error: questionBankError } = await supabase
        .from("question_banks")
        .insert({ title, description })
        .select()
        .single();

      if (questionBankError) throw questionBankError;

      // Import questions from XLSX if file is provided
      if (file) {
        const questions = await parseXLSX(file);

        for (const question of questions) {
          // Insert the base question
          const { data: insertedQuestion, error: questionError } =
            await supabase
              .from("questions")
              .insert({
                question_bank_id: questionBank.id,
                question_text: question.question_text,
                question_type: question.question_type,
              })
              .select()
              .single();

          if (questionError) throw questionError;

          // Insert static options or dynamic template based on question type
          if (question.question_type === "static") {
            const { error: optionsError } = await supabase
              .from("static_options")
              .insert(
                        question.static_options.map((option: any) => ({
                  ...option,
                  question_id: insertedQuestion.id,
                }))
              );

            if (optionsError) throw optionsError;
          } else if (question.question_type === "dynamic") {
            const { error: templateError } = await supabase
              .from("dynamic_question_templates")
              .insert({
                ...question.dynamic_template,
                question_id: insertedQuestion.id,
              });

            if (templateError) throw templateError;
          }
        }
      }

      onCreateSuccess();
      } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Question Bank</DialogTitle>
          <DialogDescription>
            Enter the details for the new question bank and optionally import
            questions from an XLSX file.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="file">Import Questions (XLSX)</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="file"
                  type="file"
                  accept=".xlsx"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById("file")?.click()}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {file ? file.name : "Choose File"}
                </Button>
              </div>
            </div>
          </div>
          {error && <p className="text-red-600 mt-2">{error}</p>}
          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Question Bank"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
