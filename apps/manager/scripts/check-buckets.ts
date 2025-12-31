import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";

// Load env from root or local
dotenv.config({ path: path.resolve(__dirname, "../../../../.env") });
// Try loading from packages/database/.env if root fails or just in case
dotenv.config({
  path: path.resolve(__dirname, "../../../packages/database/.env"),
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log("Checking Supabase connection...");
console.log("URL:", supabaseUrl ? "Found" : "Missing");
console.log("Key:", supabaseServiceKey ? "Found" : "Missing");

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function listBuckets() {
  const { data, error } = await supabase.storage.listBuckets();

  if (error) {
    console.error("Error listing buckets:", error.message);
    return;
  }

  console.log("Buckets found:");
  if (data.length === 0) {
    console.log("No buckets found.");
  } else {
    data.forEach((b) => console.log(`- ${b.name} (public: ${b.public})`));
  }
}

listBuckets();
