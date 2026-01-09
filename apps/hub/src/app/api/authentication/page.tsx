import Link from "next/link";
import { Breadcrumb } from "../../components";

export default function AuthenticationPage() {
  return (
    <div className="prose prose-gray dark:prose-invert max-w-none">
      <Breadcrumb
        items={[
          { title: "API", href: "/docs/api/authentication" },
          { title: "Authentication" },
        ]}
      />

      <h1>API Authentication</h1>
      <p className="lead">
        All external API endpoints require authentication via API keys. This
        page explains how to obtain and use API keys securely.
      </p>

      <h2>Obtaining an API Key</h2>
      <p>
        API keys are managed through the Manager Dashboard, not the EDS
        dashboard directly.
      </p>

      <ol>
        <li>
          Access the Manager Dashboard at <code>/dashboard/api-keys</code>
        </li>
        <li>
          Click <strong>"Generate New Key"</strong>
        </li>
        <li>Enter a descriptive name (e.g., "Python Backup Script")</li>
        <li>
          Click <strong>"Generate Key"</strong>
        </li>
        <li>
          <strong>Copy the key immediately</strong> - it will only be displayed
          once!
        </li>
      </ol>

      <div className="not-prose my-6 p-4 rounded-lg border-l-4 border-amber-500 bg-amber-50 dark:bg-amber-900/20">
        <p className="font-medium text-amber-800 dark:text-amber-200">
          ⚠️ Important
        </p>
        <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
          The full API key is only shown <strong>once</strong> at creation time.
          Store it securely. If you lose it, you'll need to generate a new one.
        </p>
      </div>

      <h2>Key Format</h2>
      <p>API keys follow this format:</p>

      <div className="not-prose">
        <div className="bg-gray-900 rounded-lg overflow-hidden my-4">
          <pre className="p-4 text-sm text-gray-100 overflow-x-auto">
            {`exstr_live_[32 random hex characters]

Example:
exstr_live_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`}
          </pre>
        </div>
      </div>

      <h2>Using the API Key</h2>
      <p>
        Include the API key in the <code>x-api-key</code> HTTP header for all
        requests:
      </p>

      <div className="not-prose">
        <div className="bg-gray-900 rounded-lg overflow-hidden my-4">
          <div className="flex items-center px-4 py-2 bg-gray-800 text-gray-400 text-xs">
            <span>HTTP Headers</span>
          </div>
          <pre className="p-4 text-sm text-gray-100 overflow-x-auto">
            {`x-api-key: exstr_live_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
Content-Type: application/json`}
          </pre>
        </div>
      </div>

      <h3>cURL Example</h3>
      <div className="not-prose">
        <div className="bg-gray-900 rounded-lg overflow-hidden my-4">
          <div className="flex items-center px-4 py-2 bg-gray-800 text-gray-400 text-xs">
            <span>Terminal</span>
          </div>
          <pre className="p-4 text-sm text-gray-100 overflow-x-auto">
            {`curl -X POST https://your-domain.com/api/v1/storage/upload \\
  -H "x-api-key: exstr_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{"filename": "test.txt", "mimeType": "text/plain", "size": 1024}'`}
          </pre>
        </div>
      </div>

      <h3>Python Example</h3>
      <div className="not-prose">
        <div className="bg-gray-900 rounded-lg overflow-hidden my-4">
          <div className="flex items-center px-4 py-2 bg-gray-800 text-gray-400 text-xs">
            <span>Python</span>
          </div>
          <pre className="p-4 text-sm text-gray-100 overflow-x-auto">
            {`import requests
import os

# Use environment variable for security
API_KEY = os.environ.get("EDS_API_KEY")

response = requests.post(
    "https://your-domain.com/api/v1/storage/upload",
    headers={
        "x-api-key": API_KEY,
        "Content-Type": "application/json"
    },
    json={
        "filename": "data.csv",
        "mimeType": "text/csv",
        "size": 2048
    }
)`}
          </pre>
        </div>
      </div>

      <h3>JavaScript Example</h3>
      <div className="not-prose">
        <div className="bg-gray-900 rounded-lg overflow-hidden my-4">
          <div className="flex items-center px-4 py-2 bg-gray-800 text-gray-400 text-xs">
            <span>JavaScript</span>
          </div>
          <pre className="p-4 text-sm text-gray-100 overflow-x-auto">
            {`const API_KEY = process.env.EDS_API_KEY;

const response = await fetch('https://your-domain.com/api/v1/storage/upload', {
  method: 'POST',
  headers: {
    'x-api-key': API_KEY,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    filename: 'data.json',
    mimeType: 'application/json',
    size: 4096,
  }),
});

const result = await response.json();`}
          </pre>
        </div>
      </div>

      <h2>Error Responses</h2>
      <table>
        <thead>
          <tr>
            <th>HTTP Status</th>
            <th>Error</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>401</code>
            </td>
            <td>Missing API key</td>
            <td>
              The <code>x-api-key</code> header is not present
            </td>
          </tr>
          <tr>
            <td>
              <code>401</code>
            </td>
            <td>Invalid or inactive API key</td>
            <td>The key doesn't exist or has been deactivated</td>
          </tr>
        </tbody>
      </table>

      <h2>Best Practices</h2>
      <ul>
        <li>
          <strong>Never hardcode API keys</strong> - Use environment variables
        </li>
        <li>
          <strong>Rotate keys regularly</strong> - Generate new keys and revoke
          old ones
        </li>
        <li>
          <strong>Use descriptive names</strong> - Makes it easy to identify
          which key is used where
        </li>
        <li>
          <strong>Monitor usage</strong> - Check <code>lastUsedAt</code> to
          detect unused or compromised keys
        </li>
        <li>
          <strong>Revoke immediately</strong> - If a key is compromised,
          deactivate it in the dashboard
        </li>
      </ul>

      <h2>Next Steps</h2>
      <div className="not-prose flex gap-4 mt-6">
        <Link
          href="/docs/api/upload"
          className="flex-1 p-4 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
        >
          <span className="text-sm text-gray-500">Next</span>
          <p className="font-medium text-gray-900 dark:text-white">
            Upload Endpoint →
          </p>
        </Link>
      </div>
    </div>
  );
}
