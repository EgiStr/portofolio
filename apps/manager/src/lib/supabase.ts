import { createClient } from "@supabase/supabase-js";

// Create Supabase client for storage operations
// Note: Using service role key for server-side operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Storage bucket names
export const BUCKETS = {
  PROJECTS: "projects",
  BLOG: "blog",
  AVATARS: "avatars",
} as const;

// Helper function to get public URL for an image
export function getPublicUrl(bucket: string, path: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

// Helper function to upload file
export async function uploadFile(
  bucket: string,
  path: string,
  file: File | Blob,
): Promise<{ url: string; error: string | null }> {
  try {
    const { error } = await supabase.storage.from(bucket).upload(path, file, {
      cacheControl: "3600",
      upsert: true,
    });

    if (error) {
      return { url: "", error: error.message };
    }

    const publicUrl = getPublicUrl(bucket, path);
    return { url: publicUrl, error: null };
  } catch (err) {
    return { url: "", error: "Failed to upload file" };
  }
}

// Helper function to delete file
export async function deleteFile(
  bucket: string,
  path: string,
): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase.storage.from(bucket).remove([path]);

    if (error) {
      return { error: error.message };
    }

    return { error: null };
  } catch (err) {
    return { error: "Failed to delete file" };
  }
}

// Generate unique filename
export function generateFilename(originalName: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split(".").pop();
  return `${timestamp}-${random}.${extension}`;
}
