import Link from "next/link";
import { Breadcrumb } from "../../components";

export default function ResponseFormatPage() {
  return (
    <div className="prose prose-gray dark:prose-invert max-w-none">
      <Breadcrumb
        items={[
          { title: "API", href: "/docs/api/authentication" },
          { title: "Response Format" },
        ]}
      />

      <h1>Response Format</h1>
      <p className="lead">
        All EDS API responses follow a consistent structure to make error
        handling and data parsing predictable for client developers.
      </p>

      <h2>Success Response</h2>
      <p>
        When a request is successful, the response will have{" "}
        <code>success: true</code> and the requested data in the{" "}
        <code>data</code> field.
      </p>
      <div className="not-prose">
        <div className="bg-gray-900 rounded-lg overflow-hidden my-4">
          <div className="flex items-center px-4 py-2 bg-gray-800 text-gray-400 text-xs">
            <span>JSON</span>
          </div>
          <pre className="p-4 text-sm text-gray-100 overflow-x-auto">
            {`{
  "success": true,
  "data": {
    "id": "clx123abc",
    "name": "project-files"
  },
  "error": null
}`}
          </pre>
        </div>
      </div>

      <h2>Error Response</h2>
      <p>
        When a request fails, the response will have <code>success: false</code>
        , the <code>data</code> field will be <code>null</code>, and the{" "}
        <code>error</code> field will contain a descriptive message.
      </p>
      <div className="not-prose">
        <div className="bg-gray-900 rounded-lg overflow-hidden my-4">
          <div className="flex items-center px-4 py-2 bg-gray-800 text-gray-400 text-xs">
            <span>JSON</span>
          </div>
          <pre className="p-4 text-sm text-gray-100 overflow-x-auto">
            {`{
  "success": false,
  "data": null,
  "error": "Missing or invalid 'filename'"
}`}
          </pre>
        </div>
      </div>

      <h2>Schema Definition</h2>
      <div className="not-prose">
        <div className="bg-gray-900 rounded-lg overflow-hidden my-4">
          <div className="flex items-center px-4 py-2 bg-gray-800 text-gray-400 text-xs">
            <span>TypeScript</span>
          </div>
          <pre className="p-4 text-sm text-gray-100 overflow-x-auto">
            {`interface APIResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
}`}
          </pre>
        </div>
      </div>

      <h2>HTTP Status Codes</h2>
      <p>
        EDS uses standard HTTP status codes in addition to the{" "}
        <code>success</code> boolean in the body.
      </p>
      <table>
        <thead>
          <tr>
            <th>Status Code</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>200 OK</code>
            </td>
            <td>Request succeeded.</td>
          </tr>
          <tr>
            <td>
              <code>201 Created</code>
            </td>
            <td>Resource created successfully.</td>
          </tr>
          <tr>
            <td>
              <code>400 Bad Request</code>
            </td>
            <td>Invalid parameters or missing fields.</td>
          </tr>
          <tr>
            <td>
              <code>401 Unauthorized</code>
            </td>
            <td>Invalid or missing API key.</td>
          </tr>
          <tr>
            <td>
              <code>404 Not Found</code>
            </td>
            <td>The requested resource does not exist.</td>
          </tr>
          <tr>
            <td>
              <code>500 Internal Server Error</code>
            </td>
            <td>Unexpected server-side error.</td>
          </tr>
          <tr>
            <td>
              <code>507 Insufficient Storage</code>
            </td>
            <td>No nodes have enough available space for the upload.</td>
          </tr>
        </tbody>
      </table>

      <h2>Next Steps</h2>
      <div className="not-prose flex gap-4 mt-6">
        <Link
          href="/docs/sdk/python"
          className="flex-1 p-4 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
        >
          <span className="text-sm text-gray-500">Next</span>
          <p className="font-medium text-gray-900 dark:text-white">
            Python SDK →
          </p>
        </Link>
      </div>
    </div>
  );
}
