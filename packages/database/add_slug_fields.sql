-- Manual migration to add slug fields to EDS tables
-- This migration is SAFE and will NOT delete any data

-- Step 1: Add slug column to eds_folders (nullable first)
ALTER TABLE eds_folders ADD COLUMN IF NOT EXISTS slug TEXT;

-- Step 2: Generate slugs for existing folders based on their names
-- Using a simple slug generation: lowercase, replace spaces with hyphens
UPDATE eds_folders 
SET slug = LOWER(REGEXP_REPLACE(REGEXP_REPLACE(name, '[^a-zA-Z0-9\s\-]', '', 'g'), '\s+', '-', 'g'))
WHERE slug IS NULL;

-- Step 3: Handle duplicates by appending numbers
WITH duplicates AS (
  SELECT id, slug, 
         ROW_NUMBER() OVER (PARTITION BY "parentId", slug ORDER BY "createdAt") - 1 as dup_num
  FROM eds_folders
)
UPDATE eds_folders f
SET slug = CASE 
  WHEN d.dup_num > 0 THEN f.slug || '-' || d.dup_num::text
  ELSE f.slug
END
FROM duplicates d
WHERE f.id = d.id AND d.dup_num > 0;

-- Step 4: Make slug NOT NULL and add constraints
ALTER TABLE eds_folders ALTER COLUMN slug SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "eds_folders_parentId_slug_key" ON eds_folders("parentId", slug);
CREATE INDEX IF NOT EXISTS eds_folders_slug_idx ON eds_folders(slug);
CREATE INDEX IF NOT EXISTS eds_folders_path_idx ON eds_folders(path);

-- Step 5: Drop old unique constraint on name
ALTER TABLE eds_folders DROP CONSTRAINT IF EXISTS "eds_folders_parentId_name_key";

-- Step 6: Add slug column to eds_files (nullable first)
ALTER TABLE eds_files ADD COLUMN IF NOT EXISTS slug TEXT;

-- Step 7: Generate slugs for existing files based on their names
UPDATE eds_files 
SET slug = LOWER(REGEXP_REPLACE(REGEXP_REPLACE(name, '[^a-zA-Z0-9\s\-\.]', '', 'g'), '\s+', '-', 'g'))
WHERE slug IS NULL;

-- Step 8: Handle duplicates by appending numbers (preserve file extensions)
WITH duplicates AS (
  SELECT id, slug,
         ROW_NUMBER() OVER (PARTITION BY "folderId", slug ORDER BY "uploadedAt") - 1 as dup_num
  FROM eds_files
)
UPDATE eds_files f
SET slug = CASE 
  WHEN d.dup_num > 0 THEN 
    CASE 
      WHEN f.slug LIKE '%.%' THEN 
        SUBSTRING(f.slug FROM 1 FOR POSITION('.' IN REVERSE(f.slug))) || '-' || d.dup_num::text || SUBSTRING(f.slug FROM LENGTH(f.slug) - POSITION('.' IN REVERSE(f.slug)) + 2)
      ELSE 
        f.slug || '-' || d.dup_num::text
    END
  ELSE f.slug
END
FROM duplicates d
WHERE f.id = d.id AND d.dup_num > 0;

-- Step 9: Make slug NOT NULL and add constraints
ALTER TABLE eds_files ALTER COLUMN slug SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "eds_files_folderId_slug_key" ON eds_files("folderId", slug);
CREATE INDEX IF NOT EXISTS eds_files_slug_idx ON eds_files(slug);
CREATE INDEX IF NOT EXISTS "eds_files_nodeId_idx" ON eds_files("nodeId");

-- Migration complete!
-- All existing data preserved with generated slugs
