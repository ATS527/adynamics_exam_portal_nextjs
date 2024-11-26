import { Suspense } from "react";
import { ExamListingClient } from "./exam-listing-client";
import { Loader2 } from "lucide-react";

export default function ExamListingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      }
    >
      <ExamListingClient />
    </Suspense>
  );
}
