import { Suspense } from "react";
import { ExamListingClient } from "./exam-listing-client";
import { BookOpenCheck, Loader2 } from "lucide-react";

export default function ExamListingPage() {
  return (
    <div className="space-y-6">
      <h1 className="flex items-center text-2xl font-bold mt-5 mb-8"><BookOpenCheck className="mr-2"/> Manage Exams</h1>
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
