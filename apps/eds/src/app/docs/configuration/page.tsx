import Link from "next/link";
import { Breadcrumb } from "../components";

export default function ConfigurationPage() {
  return (
    <div className="prose prose-gray dark:prose-invert max-w-none">
      <Breadcrumb items={[{ title: "Configuration" }]} />

      <h1>Configuration</h1>
      <p className="lead">
        Learn how to configure Google Cloud Console, environment variables, and
        encryption for your EDS instance.
      </p>

      <h2>Google Cloud Console</h2>
      <p>
        EDS uses Google Drive for storage. You must create a Google Cloud
        Project and enable the Drive API.
      </p>

      <h3>1. Enable APIs</h3>
      <ol>
        <li>
          Go to the{" "}
          <a
            href="https://console.cloud.google.com/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Google Cloud Console
          </a>
          .
        </li>
        <li>
          Create a new project named <strong>"EDS Storage"</strong>.
        </li>
        <li>
          Navigate to <strong>APIs & Services {">"} Library</strong>.
        </li>
        <li>
          Enable the <strong>Google Drive API</strong>.
        </li>
        <li>
          Enable the <strong>Google OAuth2 API</strong>.
        </li>
      </ol>

      <h3>2. OAuth Credentials</h3>
      <ol>
        <li>
          Navigate to <strong>APIs & Services {">"} Credentials</strong>.
        </li>
        <li>
          Click <strong>Create Credentials {">"} OAuth client ID</strong>.
        </li>
        <li>
          Select <strong>Web application</strong> as the application type.
        </li>
        <li>
          Add the following <strong>Authorized redirect URIs</strong>:
          <ul>
            <li>
              <code>http://localhost:3003/api/auth/google/callback</code>{" "}
              (Development)
            </li>
            <li>
              <code>https://your-domain.com/api/auth/google/callback</code>{" "}
              (Production)
            </li>
          </ul>
        </li>
        <li>
          Copy your <strong>Client ID</strong> and{" "}
          <strong>Client Secret</strong>.
        </li>
      </ol>

      <div className="not-prose my-6 p-4 rounded-lg border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/20">
        <p className="font-medium text-blue-800 dark:text-blue-200">
          OAuth Scopes
        </p>
        <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
          EDS requires the{" "}
          <code>https://www.googleapis.com/auth/drive.file</code> scope. This
          allows the app to only access files it has created, ensuring user
          privacy.
        </p>
      </div>

      <h2>Environment Variables</h2>
      <p>
        EDS requires several environment variables to function. These should be
        placed in your <code>.env</code> file.
      </p>

      <table>
        <thead>
          <tr>
            <th>Variable</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>GOOGLE_CLIENT_ID</code>
            </td>
            <td>Your Google OAuth client ID</td>
          </tr>
          <tr>
            <td>
              <code>GOOGLE_CLIENT_SECRET</code>
            </td>
            <td>Your Google OAuth client secret</td>
          </tr>
          <tr>
            <td>
              <code>GOOGLE_REDIRECT_URI</code>
            </td>
            <td>Must match the URI configured in Google Console</td>
          </tr>
          <tr>
            <td>
              <code>ENCRYPTION_KEY</code>
            </td>
            <td>32-character key for encrypting OAuth tokens</td>
          </tr>
        </tbody>
      </table>

      <h2>Encryption Key</h2>
      <p>
        EDS encrypts all Google OAuth tokens (access and refresh tokens) before
        storing them in the database using AES-256-GCM.
      </p>
      <p>You can generate a secure 32-character key using Node.js:</p>
      <div className="not-prose">
        <div className="bg-gray-900 rounded-lg overflow-hidden my-4">
          <pre className="p-4 text-sm text-gray-100">
            {`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`}
          </pre>
        </div>
      </div>

      <div className="not-prose my-6 p-4 rounded-lg border-l-4 border-red-500 bg-red-50 dark:bg-red-900/20">
        <p className="font-medium text-red-800 dark:text-red-200">
          ⚠️ Critical
        </p>
        <p className="text-sm text-red-700 dark:text-red-300 mt-1">
          Never change your <code>ENCRYPTION_KEY</code> after you've started
          adding storage nodes. If you change it, EDS will be unable to decrypt
          existing tokens, and you will lose access to those nodes.
        </p>
      </div>

      <h2>Next Steps</h2>
      <div className="not-prose flex gap-4 mt-6">
        <Link
          href="/storage-nodes"
          className="flex-1 p-4 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
        >
          <span className="text-sm text-gray-500">Next</span>
          <p className="font-medium text-gray-900 dark:text-white">
            Storage Nodes →
          </p>
        </Link>
      </div>
    </div>
  );
}
