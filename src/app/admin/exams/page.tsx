import { Suspense } from "react";
import { ExamListingClient } from "./exam-listing-client";
import { Loader2 } from "lucide-react";

export default function ExamListingPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Manage Exams</h1>
      <Suspense
        fallback={
          <div className="flex justify-center items-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        }
      >
        <ExamListingClient />
      </Suspense>
    </div>
  );
}
