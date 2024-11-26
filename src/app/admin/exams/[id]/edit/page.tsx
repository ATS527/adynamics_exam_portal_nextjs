import { Suspense } from "react";
import { EditExamClient } from "./edit-client";
import { Loader2 } from "lucide-react";

export default function EditExamPage({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<Loader2 className="h-8 w-8 animate-spin" />}>
      <EditExamClient id={params.id} />
    </Suspense>
  );
}
