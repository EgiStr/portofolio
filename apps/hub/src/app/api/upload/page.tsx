import Link from "next/link";
import { Breadcrumb } from "../../components";

export default function UploadEndpointPage() {
  return (
    <div className="prose prose-gray dark:prose-invert max-w-none">
      <Breadcrumb
        items={[
          { title: "API", href: "/docs/api/authentication" },
          { title: "Upload Endpoint" },
        ]}
      />

      <h1>Upload Endpoint</h1>
      <p className="lead">
        The upload endpoint implements a 2-step flow to bypass Vercel's 4.5MB
        body size limit while supporting files up to 5TB.
      </p>

      <h2>Endpoint</h2>
      <div className="not-prose">
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 my-4 flex items-center gap-3">
          <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded text-xs font-bold">
            POST
          </span>
          <code className="text-sm">/api/v1/storage/upload</code>
        </div>
      </div>

      <h2>Headers</h2>
      <table>
        <thead>
          <tr>
            <th>Header</th>
            <th>Required</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>x-api-key</code>
            </td>
            <td>✅ Yes</td>
            <td>Your API key</td>
          </tr>
          <tr>
            <td>
              <code>Content-Type</code>
            </td>
            <td>✅ Yes</td>
            <td>
              Must be <code>application/json</code>
            </td>
          </tr>
        </tbody>
      </table>

      <h2>Request Body</h2>
      <div className="not-prose">
        <div className="bg-gray-900 rounded-lg overflow-hidden my-4">
          <div className="flex items-center px-4 py-2 bg-gray-800 text-gray-400 text-xs">
            <span>JSON</span>
          </div>
          <pre className="p-4 text-sm text-gray-100 overflow-x-auto">
            {`{
  "filename": "backup_2024.zip",
  "mimeType": "application/zip",
  "size": 104857600,
  "folderPath": "/backups/server-a"
}`}
          </pre>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Field</th>
            <th>Type</th>
            <th>Required</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>filename</code>
            </td>
            <td>string</td>
            <td>✅ Yes</td>
            <td>Name of the file to upload</td>
          </tr>
          <tr>
            <td>
              <code>mimeType</code>
            </td>
            <td>string</td>
            <td>✅ Yes</td>
            <td>
              MIME type (e.g., <code>application/pdf</code>)
            </td>
          </tr>
          <tr>
            <td>
              <code>size</code>
            </td>
            <td>number</td>
            <td>✅ Yes</td>
            <td>File size in bytes</td>
          </tr>
          <tr>
            <td>
              <code>folderPath</code>
            </td>
            <td>string</td>
            <td>❌ No</td>
            <td>Virtual folder path (auto-created)</td>
          </tr>
        </tbody>
      </table>

      <h2>Response</h2>
      <h3>Success (200)</h3>
      <div className="not-prose">
        <div className="bg-gray-900 rounded-lg overflow-hidden my-4">
          <div className="flex items-center px-4 py-2 bg-gray-800 text-gray-400 text-xs">
            <span>JSON</span>
          </div>
          <pre className="p-4 text-sm text-gray-100 overflow-x-auto">
            {`{
  "success": true,
  "data": {
    "uploadUrl": "https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&upload_id=...",
    "expiresIn": 3600,
    "method": "PUT",
    "_meta": {
      "nodeId": "clx1234abcd",
      "reservationId": "clx5678efgh",
      "folderId": "clx9012ijkl"
    }
  },
  "error": null
}`}
          </pre>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Field</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>uploadUrl</code>
            </td>
            <td>Google Drive resumable upload URL</td>
          </tr>
          <tr>
            <td>
              <code>expiresIn</code>
            </td>
            <td>URL expiration time in seconds (1 hour)</td>
          </tr>
          <tr>
            <td>
              <code>method</code>
            </td>
            <td>
              HTTP method to use (<code>PUT</code>)
            </td>
          </tr>
          <tr>
            <td>
              <code>_meta</code>
            </td>
            <td>Internal metadata (optional for debugging)</td>
          </tr>
        </tbody>
      </table>

      <h3>Error Responses</h3>
      <table>
        <thead>
          <tr>
            <th>HTTP Code</th>
            <th>Error</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>400</code>
            </td>
            <td>Missing or invalid field</td>
            <td>Required field validation failed</td>
          </tr>
          <tr>
            <td>
              <code>401</code>
            </td>
            <td>Invalid or inactive API key</td>
            <td>Authentication failed</td>
          </tr>
          <tr>
            <td>
              <code>500</code>
            </td>
            <td>Upload failed</td>
            <td>Internal error during initialization</td>
          </tr>
          <tr>
            <td>
              <code>507</code>
            </td>
            <td>Insufficient storage</td>
            <td>No nodes with available space</td>
          </tr>
        </tbody>
      </table>

      <h2>2-Step Upload Flow</h2>
      <div className="not-prose my-8">
        <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 font-mono text-sm overflow-x-auto">
          <pre className="text-gray-700 dark:text-gray-300">{`┌─────────┐                    ┌─────────┐                  ┌──────────────┐
│ Client  │                    │ EDS API │                  │ Google Drive │
└────┬────┘                    └────┬────┘                  └──────┬───────┘
     │                              │                              │
     │ 1. POST /api/v1/storage/upload                              │
     │────────────────────────────>│                               │
     │                              │ Init resumable session       │
     │                              │─────────────────────────────>│
     │                              │                              │
     │                              │<─────────────────────────────│
     │ 2. { success, uploadUrl }   │     Upload URL                │
     │<────────────────────────────│                               │
     │                              │                              │
     │ 3. PUT [uploadUrl] + Binary Data                            │
     │────────────────────────────────────────────────────────────>│
     │                              │                              │
     │ 4. 200 OK                   │                              │
     │<────────────────────────────────────────────────────────────│`}</pre>
        </div>
      </div>

      <h3>Step 1: Request Upload URL</h3>
      <div className="not-prose">
        <div className="bg-gray-900 rounded-lg overflow-hidden my-4">
          <div className="flex items-center px-4 py-2 bg-gray-800 text-gray-400 text-xs">
            <span>cURL</span>
          </div>
          <pre className="p-4 text-sm text-gray-100 overflow-x-auto">
            {`curl -X POST https://your-domain.com/api/v1/storage/upload \\
  -H "x-api-key: exstr_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "filename": "data.csv",
    "mimeType": "text/csv",
    "size": 1048576,
    "folderPath": "/datasets"
  }'`}
          </pre>
        </div>
      </div>

      <h3>Step 2: Upload to Google Drive</h3>
      <p>
        Use the <code>uploadUrl</code> from the response to upload the actual
        file:
      </p>
      <div className="not-prose">
        <div className="bg-gray-900 rounded-lg overflow-hidden my-4">
          <div className="flex items-center px-4 py-2 bg-gray-800 text-gray-400 text-xs">
            <span>cURL</span>
          </div>
          <pre className="p-4 text-sm text-gray-100 overflow-x-auto">
            {`curl -X PUT "https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&upload_id=..." \\
  --data-binary @data.csv`}
          </pre>
        </div>
      </div>

      <div className="not-prose my-6 p-4 rounded-lg border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/20">
        <p className="font-medium text-blue-800 dark:text-blue-200">
          💡 Pro Tip
        </p>
        <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
          The <code>uploadUrl</code> expires after 1 hour. For large files,
          ensure your upload completes within this window or implement chunked
          upload retry logic.
        </p>
      </div>

      <h2>Complete Example</h2>
      <div className="not-prose">
        <div className="bg-gray-900 rounded-lg overflow-hidden my-4">
          <div className="flex items-center px-4 py-2 bg-gray-800 text-gray-400 text-xs">
            <span>Python</span>
          </div>
          <pre className="p-4 text-sm text-gray-100 overflow-x-auto">
            {`import requests
import os

API_KEY = os.environ["EDS_API_KEY"]
BASE_URL = "https://your-domain.com/api/v1/storage"
FILE_PATH = "backup.zip"

# Step 1: Get upload URL
file_size = os.path.getsize(FILE_PATH)
response = requests.post(
    f"{BASE_URL}/upload",
    headers={"x-api-key": API_KEY},
    json={
        "filename": os.path.basename(FILE_PATH),
        "mimeType": "application/zip",
        "size": file_size,
        "folderPath": "/backups"
    }
)
result = response.json()

if not result["success"]:
    raise Exception(result["error"])

# Step 2: Upload directly to Google Drive
with open(FILE_PATH, "rb") as f:
    upload_response = requests.put(
        result["data"]["uploadUrl"],
        data=f
    )

if upload_response.status_code == 200:
    print("✅ Upload successful!")
else:
    print(f"❌ Upload failed: {upload_response.text}")`}
          </pre>
        </div>
      </div>

      <h2>Next Steps</h2>
      <div className="not-prose flex gap-4 mt-6">
        <Link
          href="/docs/api/responses"
          className="flex-1 p-4 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
        >
          <span className="text-sm text-gray-500">Next</span>
          <p className="font-medium text-gray-900 dark:text-white">
            Response Format →
          </p>
        </Link>
      </div>
    </div>
  );
}
