import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Supabase URL or Key is missing");
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fetchTableInfo() {
  const { data, error } = await supabase
    .from("exam_questions")
    .select("*")
    .limit(1);

  if (error) {
    console.error("Error fetching data:", error);
    return;
  }

  if (data && data.length > 0) {
    console.log("Columns in exam_questions table:");
    console.log(Object.keys(data[0]));
  } else {
    console.log("No data found in exam_questions table");
  }
}

fetchTableInfo();

// Log the result
console.log(
  "Please check the console output for the column names of the exam_questions table."
);
