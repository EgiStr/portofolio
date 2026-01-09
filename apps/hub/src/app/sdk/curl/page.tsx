import Link from "next/link";
import { Breadcrumb } from "../../components";

export default function CurlSDKPage() {
  return (
    <div className="prose prose-gray dark:prose-invert max-w-none">
      <Breadcrumb
        items={[
          { title: "SDKs", href: "/docs/sdk/python" },
          { title: "cURL / Bash" },
        ]}
      />

      <h1>cURL / Bash</h1>
      <p className="lead">
        Use cURL for quick uploads or integrate with shell scripts for
        automation.
      </p>

      <h2>Requirements</h2>
      <ul>
        <li>cURL (installed by default on most systems)</li>
        <li>
          <code>jq</code> for JSON parsing (optional but recommended)
        </li>
      </ul>

      <div className="not-prose">
        <div className="bg-gray-900 rounded-lg overflow-hidden my-4">
          <div className="flex items-center px-4 py-2 bg-gray-800 text-gray-400 text-xs">
            <span>Install jq</span>
          </div>
          <pre className="p-4 text-sm text-gray-100 overflow-x-auto">
            {`# macOS
brew install jq

# Ubuntu/Debian
sudo apt-get install jq

# Windows (with chocolatey)
choco install jq`}
          </pre>
        </div>
      </div>

      <h2>Quick Upload</h2>
      <p>Two commands to upload any file:</p>

      <div className="not-prose">
        <div className="bg-gray-900 rounded-lg overflow-hidden my-4">
          <div className="flex items-center px-4 py-2 bg-gray-800 text-gray-400 text-xs">
            <span>Terminal</span>
          </div>
          <pre className="p-4 text-sm text-gray-100 overflow-x-auto">
            {`# Step 1: Get upload URL
RESPONSE=$(curl -s -X POST "https://data.eggisatria.dev/api/v1/storage/upload" \\
  -H "x-api-key: exstr_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "filename": "backup.zip",
    "mimeType": "application/zip",
    "size": '$(stat -f%z backup.zip)'
  }')

# Extract upload URL
UPLOAD_URL=$(echo $RESPONSE | jq -r '.data.uploadUrl')

# Step 2: Upload file
curl -X PUT "$UPLOAD_URL" --data-binary @backup.zip`}
          </pre>
        </div>
      </div>

      <h2>Reusable Upload Script</h2>
      <p>
        Save as <code>eds-upload.sh</code> and make executable with{" "}
        <code>chmod +x eds-upload.sh</code>:
      </p>

      <div className="not-prose">
        <div className="bg-gray-900 rounded-lg overflow-hidden my-4">
          <div className="flex items-center px-4 py-2 bg-gray-800 text-gray-400 text-xs">
            <span>eds-upload.sh</span>
          </div>
          <pre className="p-4 text-sm text-gray-100 overflow-x-auto">
            {`#!/bin/bash
#
# EDS Upload Script
# Usage: ./eds-upload.sh <file_path> [folder_path]
#
# Environment:
#   EDS_API_KEY - Your API key (required)
#   EDS_BASE_URL - API base URL (optional)
#

set -e

# Configuration
API_KEY="\${EDS_API_KEY:?Error: EDS_API_KEY environment variable is required}"
BASE_URL="\${EDS_BASE_URL:-https://data.eggisatria.dev/api/v1/storage}"

# Arguments
FILE_PATH="$1"
FOLDER_PATH="\${2:-}"

# Validation
if [ -z "$FILE_PATH" ]; then
  echo "Usage: $0 <file_path> [folder_path]"
  echo ""
  echo "Examples:"
  echo "  $0 backup.zip"
  echo "  $0 backup.zip /backups/daily"
  exit 1
fi

if [ ! -f "$FILE_PATH" ]; then
  echo "❌ Error: File not found: $FILE_PATH"
  exit 1
fi

# Get file info
FILE_NAME=$(basename "$FILE_PATH")
FILE_SIZE=$(stat -f%z "$FILE_PATH" 2>/dev/null || stat -c%s "$FILE_PATH")

# Detect MIME type
case "$FILE_NAME" in
  *.zip) MIME_TYPE="application/zip" ;;
  *.tar.gz|*.tgz) MIME_TYPE="application/gzip" ;;
  *.json) MIME_TYPE="application/json" ;;
  *.csv) MIME_TYPE="text/csv" ;;
  *.txt) MIME_TYPE="text/plain" ;;
  *.pdf) MIME_TYPE="application/pdf" ;;
  *.sql) MIME_TYPE="application/sql" ;;
  *) MIME_TYPE="application/octet-stream" ;;
esac

echo "📁 File: $FILE_NAME"
echo "📏 Size: $FILE_SIZE bytes"
echo "📄 Type: $MIME_TYPE"
[ -n "$FOLDER_PATH" ] && echo "📂 Folder: $FOLDER_PATH"
echo ""

# Build JSON payload
if [ -n "$FOLDER_PATH" ]; then
  PAYLOAD='{
    "filename": "'"$FILE_NAME"'",
    "mimeType": "'"$MIME_TYPE"'",
    "size": '"$FILE_SIZE"',
    "folderPath": "'"$FOLDER_PATH"'"
  }'
else
  PAYLOAD='{
    "filename": "'"$FILE_NAME"'",
    "mimeType": "'"$MIME_TYPE"'",
    "size": '"$FILE_SIZE"'
  }'
fi

# Step 1: Request upload URL
echo "🔄 Requesting upload URL..."
RESPONSE=$(curl -s -w "\\n%{http_code}" -X POST "$BASE_URL/upload" \\
  -H "x-api-key: $API_KEY" \\
  -H "Content-Type: application/json" \\
  -d "$PAYLOAD")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" != "200" ]; then
  ERROR=$(echo "$BODY" | jq -r '.error // "Unknown error"')
  echo "❌ Error ($HTTP_CODE): $ERROR"
  exit 1
fi

SUCCESS=$(echo "$BODY" | jq -r '.success')
if [ "$SUCCESS" != "true" ]; then
  ERROR=$(echo "$BODY" | jq -r '.error // "Unknown error"')
  echo "❌ Error: $ERROR"
  exit 1
fi

UPLOAD_URL=$(echo "$BODY" | jq -r '.data.uploadUrl')

# Step 2: Upload to Google Drive
echo "⬆️  Uploading to storage..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \\
  -X PUT "$UPLOAD_URL" \\
  --data-binary @"$FILE_PATH")

if [ "$HTTP_CODE" = "200" ]; then
  echo ""
  echo "✅ Upload successful!"
  echo "   File: $FILE_NAME"
  [ -n "$FOLDER_PATH" ] && echo "   Folder: $FOLDER_PATH"
else
  echo "❌ Upload failed with HTTP $HTTP_CODE"
  exit 1
fi`}
          </pre>
        </div>
      </div>

      <h2>Usage Examples</h2>

      <h3>Basic Upload</h3>
      <div className="not-prose">
        <div className="bg-gray-900 rounded-lg overflow-hidden my-4">
          <div className="flex items-center px-4 py-2 bg-gray-800 text-gray-400 text-xs">
            <span>Terminal</span>
          </div>
          <pre className="p-4 text-sm text-gray-100 overflow-x-auto">
            {`export EDS_API_KEY="exstr_live_..."

./eds-upload.sh backup.zip`}
          </pre>
        </div>
      </div>

      <h3>Upload to Folder</h3>
      <div className="not-prose">
        <div className="bg-gray-900 rounded-lg overflow-hidden my-4">
          <div className="flex items-center px-4 py-2 bg-gray-800 text-gray-400 text-xs">
            <span>Terminal</span>
          </div>
          <pre className="p-4 text-sm text-gray-100 overflow-x-auto">
            {`./eds-upload.sh database.sql /backups/database/daily`}
          </pre>
        </div>
      </div>

      <h3>Cron Job (Scheduled Backup)</h3>
      <div className="not-prose">
        <div className="bg-gray-900 rounded-lg overflow-hidden my-4">
          <div className="flex items-center px-4 py-2 bg-gray-800 text-gray-400 text-xs">
            <span>crontab -e</span>
          </div>
          <pre className="p-4 text-sm text-gray-100 overflow-x-auto">
            {`# Daily backup at 2 AM
0 2 * * * EDS_API_KEY="exstr_live_..." /path/to/eds-upload.sh /var/backups/db.sql /backups/database >> /var/log/eds-backup.log 2>&1`}
          </pre>
        </div>
      </div>

      <h3>Batch Upload</h3>
      <div className="not-prose">
        <div className="bg-gray-900 rounded-lg overflow-hidden my-4">
          <div className="flex items-center px-4 py-2 bg-gray-800 text-gray-400 text-xs">
            <span>Terminal</span>
          </div>
          <pre className="p-4 text-sm text-gray-100 overflow-x-auto">
            {`# Upload all files in a directory
for file in /backups/*.zip; do
  ./eds-upload.sh "$file" /backups/archive
done`}
          </pre>
        </div>
      </div>

      <h3>With Timestamp</h3>
      <div className="not-prose">
        <div className="bg-gray-900 rounded-lg overflow-hidden my-4">
          <div className="flex items-center px-4 py-2 bg-gray-800 text-gray-400 text-xs">
            <span>Terminal</span>
          </div>
          <pre className="p-4 text-sm text-gray-100 overflow-x-auto">
            {`# Create timestamped backup and upload
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump mydb > "backup_$DATE.sql"
./eds-upload.sh "backup_$DATE.sql" /backups/postgres`}
          </pre>
        </div>
      </div>

      <h2>Troubleshooting</h2>

      <h3>jq not found</h3>
      <p>If you don't have jq installed, you can use grep/sed as a fallback:</p>
      <div className="not-prose">
        <div className="bg-gray-900 rounded-lg overflow-hidden my-4">
          <pre className="p-4 text-sm text-gray-100 overflow-x-auto">
            {`# Extract uploadUrl without jq
UPLOAD_URL=$(echo "$RESPONSE" | grep -o '"uploadUrl":"[^"]*"' | cut -d'"' -f4)`}
          </pre>
        </div>
      </div>

      <h3>stat command differs</h3>
      <p>
        The script handles both macOS (<code>stat -f%z</code>) and Linux (
        <code>stat -c%s</code>) formats automatically.
      </p>

      <div className="not-prose flex gap-4 mt-8">
        <Link
          href="/security/api-keys"
          className="flex-1 p-4 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
        >
          <span className="text-sm text-gray-500">Next</span>
          <p className="font-medium text-gray-900 dark:text-white">
            API Key Security →
          </p>
        </Link>
      </div>
    </div>
  );
}
