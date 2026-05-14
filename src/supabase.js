import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  "https://fkzligxuqhgegbxbeklu.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZremxpZ3h1cWhnZWdieGJla2x1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3NjQ4MDYsImV4cCI6MjA5NDM0MDgwNn0.GFyA6plvtS8m7N0IBagUiTPPNEwwBxYbspPRcOOSPmw"
);
