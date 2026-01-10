/**
 * Slug utility functions for generating URL-safe names
 * and handling duplicate file/folder names
 */

/**
 * Generate a URL-safe slug from a string
 * @param text - Input text to convert to slug
 * @returns URL-safe slug (lowercase, hyphens, no special chars)
 */
export function generateSlug(text: string): string {
  return (
    text
      .toString()
      .toLowerCase()
      .trim()
      // Replace spaces with hyphens
      .replace(/\s+/g, "-")
      // Remove all non-word chars (except hyphens and dots for file extensions)
      .replace(/[^\w\-\.]/g, "")
      // Replace multiple hyphens with single hyphen
      .replace(/\-\-+/g, "-")
      // Remove leading/trailing hyphens
      .replace(/^-+/, "")
      .replace(/-+$/, "")
  );
}

/**
 * Sanitize a file name while preserving the extension
 * @param fileName - Original file name
 * @returns Sanitized file name with extension preserved
 */
export function sanitizeFileName(fileName: string): string {
  // Extract extension
  const lastDotIndex = fileName.lastIndexOf(".");

  if (lastDotIndex === -1 || lastDotIndex === 0) {
    // No extension or hidden file
    return generateSlug(fileName);
  }

  const baseName = fileName.substring(0, lastDotIndex);
  const extension = fileName.substring(lastDotIndex + 1);

  // Generate slug for base name, keep extension as-is (but lowercase)
  const sluggedBase = generateSlug(baseName);
  const sluggedExtension = extension.toLowerCase().replace(/[^\w]/g, "");

  return sluggedExtension ? `${sluggedBase}.${sluggedExtension}` : sluggedBase;
}

/**
 * Generate a unique slug by appending a number if the slug already exists
 * @param baseSlug - The base slug to make unique
 * @param existingSlugs - Array of existing slugs to check against
 * @returns Unique slug with numeric suffix if needed
 */
export function generateUniqueSlug(
  baseSlug: string,
  existingSlugs: string[],
): string {
  if (!existingSlugs.includes(baseSlug)) {
    return baseSlug;
  }

  // For files, preserve extension
  const lastDotIndex = baseSlug.lastIndexOf(".");
  const hasExtension = lastDotIndex > 0;

  let basePart: string;
  let extension: string;

  if (hasExtension) {
    basePart = baseSlug.substring(0, lastDotIndex);
    extension = baseSlug.substring(lastDotIndex); // includes the dot
  } else {
    basePart = baseSlug;
    extension = "";
  }

  // Try appending numbers until we find a unique slug
  let counter = 1;
  let uniqueSlug: string;

  do {
    uniqueSlug = `${basePart}-${counter}${extension}`;
    counter++;
  } while (existingSlugs.includes(uniqueSlug));

  return uniqueSlug;
}

/**
 * Generate a unique file slug by checking existing files in a folder
 * @param fileName - Original file name
 * @param existingFiles - Array of existing file objects with slug property
 * @returns Unique slug for the file
 */
export function generateUniqueFileSlug(
  fileName: string,
  existingFiles: Array<{ slug: string }>,
): string {
  const baseSlug = sanitizeFileName(fileName);
  const existingSlugs = existingFiles.map((f) => f.slug);
  return generateUniqueSlug(baseSlug, existingSlugs);
}

/**
 * Generate a unique folder slug by checking existing folders
 * @param folderName - Original folder name
 * @param existingFolders - Array of existing folder objects with slug property
 * @returns Unique slug for the folder
 */
export function generateUniqueFolderSlug(
  folderName: string,
  existingFolders: Array<{ slug: string }>,
): string {
  const baseSlug = generateSlug(folderName);
  const existingSlugs = existingFolders.map((f) => f.slug);
  return generateUniqueSlug(baseSlug, existingSlugs);
}
