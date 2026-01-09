import Link from "next/link";
import { Breadcrumb } from "../components";

export default function UploadFlowPage() {
  return (
    <div className="prose prose-gray dark:prose-invert max-w-none">
      <Breadcrumb items={[{ title: "Upload Flow" }]} />

      <h1>Upload Flow</h1>
      <p className="lead">
        Learn how EDS handles large file uploads through its 2-step resumable
        process.
      </p>

      <h2>The Challenge</h2>
      <p>
        Platform like Vercel have a <strong>4.5MB request body limit</strong>{" "}
        for serverless functions. To support uploading files of several
        gigabytes, EDS bypasses the server by streaming data directly from the
        client to Google Drive.
      </p>

      <h2>High-Level Overview</h2>
      <div className="not-prose my-8">
        <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 font-mono text-sm overflow-x-auto">
          <pre className="text-gray-700 dark:text-gray-300">{`1. Client Requests Upload URL
   (Client -> EDS API)

2. EDS Selects Node & Gets Google Upload URL
   (EDS API -> Google API -> EDS API)

3. Client Uploads Binary Data Directly
   (Client -> Google Drive)

4. EDS Records File metadata
   (EDS Internal Check)`}</pre>
        </div>
      </div>

      <h2>Step 1: Initialization</h2>
      <p>
        The client sends the file name, size, and MIME type to EDS. EDS then:
      </p>
      <ul>
        <li>Finds an available storage node with enough space.</li>
        <li>
          Creates a <strong>Reservation</strong> to guarantee the space isn't
          taken by another upload.
        </li>
        <li>Requests a "Resumable Upload Session" from Google Drive.</li>
        <li>
          Returns a unique <code>uploadUrl</code> to the client.
        </li>
      </ul>

      <h2>Step 2: Binary Transfer</h2>
      <p>
        The client performs an HTTP <code>PUT</code> request to the{" "}
        <code>uploadUrl</code>.
      </p>
      <ul>
        <li>
          Data goes <strong>directly</strong> to Google's servers.
        </li>
        <li>It does not pass through Vercel or your backend.</li>
        <li>Supports pausing and resuming (handled by Google).</li>
      </ul>

      <h2>Step 3: Finalization</h2>
      <p>Once Google confirms the transfer is complete:</p>
      <ul>
        <li>The file is recorded in the EDS database.</li>
        <li>The internal reservation is released.</li>
        <li>The file becomes visible in the dashboard.</li>
      </ul>

      <h2>External API Flow</h2>
      <p>
        When using the External Developer API, the flow is identical. Your
        script or application acts as the client. See the{" "}
        <Link href="/api/upload">API Upload documentation</Link> for
        implementation details.
      </p>

      <h2>Next Steps</h2>
      <div className="not-prose flex gap-4 mt-6">
        <Link
          href="/api/authentication"
          className="flex-1 p-4 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
        >
          <span className="text-sm text-gray-500">Next</span>
          <p className="font-medium text-gray-900 dark:text-white">
            API Authentication →
          </p>
        </Link>
      </div>
    </div>
  );
}
