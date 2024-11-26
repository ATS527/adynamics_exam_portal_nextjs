import { Suspense } from "react";
import { CreateExamClient } from "./create-exam-client";
import { Loader2 } from "lucide-react";

export default function CreateExamPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      }
    >
      <CreateExamClient />
    </Suspense>
  );
}
