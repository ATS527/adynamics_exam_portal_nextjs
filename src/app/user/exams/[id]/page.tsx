import { Suspense } from "react";
import { ExamDetailsClient } from "./exam-details-client";
import { Loader2 } from "lucide-react";

export default function ExamDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      }
    >
      <ExamDetailsClient examId={params.id} />
    </Suspense>
  );
}
