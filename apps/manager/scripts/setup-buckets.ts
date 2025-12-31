import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";

// Load env
dotenv.config({
  path: path.resolve(__dirname, "../../../packages/database/.env"),
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const BUCKETS = ["projects", "blog", "avatars"];

async function setupBuckets() {
  console.log("Setting up storage buckets...");

  for (const bucket of BUCKETS) {
    // Check if bucket exists
    const { data: existingBucket, error: checkError } =
      await supabase.storage.getBucket(bucket);

    if (existingBucket) {
      console.log(`Bucket '${bucket}' already exists.`);
      continue;
    }

    // Create bucket
    console.log(`Creating bucket '${bucket}'...`);
    const { data, error } = await supabase.storage.createBucket(bucket, {
      public: true,
      fileSizeLimit: 5242880, // 5MB
      allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
    });

    if (error) {
      console.error(`Error creating bucket '${bucket}':`, error.message);
    } else {
      console.log(`Bucket '${bucket}' created successfully.`);
    }
  }
}

setupBuckets();
