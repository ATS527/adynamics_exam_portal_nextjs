import { use } from "react";
import { EditQuestionBankClient } from "./edit-client";

export default function EditQuestionBank({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  return <EditQuestionBankClient id={resolvedParams.id} />;
}
