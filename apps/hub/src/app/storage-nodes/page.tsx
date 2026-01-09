import Link from "next/link";
import { Breadcrumb } from "../components";

export default function StorageNodesPage() {
  return (
    <div className="prose prose-gray dark:prose-invert max-w-none">
      <Breadcrumb items={[{ title: "Storage Nodes" }]} />

      <h1>Storage Nodes</h1>
      <p className="lead">
        Storage nodes are the backbone of EDS. Each node represents a Google
        Drive account connected to the system.
      </p>

      <h2>What is a Node?</h2>
      <p>
        A storage node is essentially a Google OAuth session. When you add a
        node, you grant EDS permission to store files in a specific Google Drive
        account. EDS then aggregates the available space from all connected
        nodes into a unified storage pool.
      </p>

      <h2>Adding a Node</h2>
      <ol>
        <li>
          Navigate to the <strong>Nodes</strong> section in the EDS Dashboard (
          <code>/nodes</code>).
        </li>
        <li>
          Click the <strong>Add Node</strong> button.
        </li>
        <li>You will be redirected to Google's OAuth consent screen.</li>
        <li>Select the Google account you want to use for storage.</li>
        <li>
          Grant the requested permissions (access to Drive files created by
          EDS).
        </li>
        <li>
          After consenting, you will be redirected back to EDS, and the node
          will appear in your list.
        </li>
      </ol>

      <div className="not-prose my-6 p-4 rounded-lg border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/20">
        <p className="font-medium text-blue-800 dark:text-blue-200">
          Smart Selection
        </p>
        <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
          When a file is uploaded, EDS automatically selects the best node based
          on available space and current activity. You don't need to manually
          manage which file goes to which account.
        </p>
      </div>

      <h2>Node Management</h2>
      <p>
        From the Nodes dashboard, you can monitor the health and usage of each
        node:
      </p>
      <ul>
        <li>
          <strong>Status</strong>: Active or Disconnected (requires
          re-authentication).
        </li>
        <li>
          <strong>Usage</strong>: Real-time storage consumption (e.g., "5.4 GB
          of 15 GB used").
        </li>
        <li>
          <strong>Email</strong>: The Google account associated with the node.
        </li>
        <li>
          <strong>Last Seen</strong>: The last time EDS successfully
          communicated with the node's API.
        </li>
      </ul>

      <h2>Quotas & Limits</h2>
      <p>Each node is subject to Google Drive's standard quotas:</p>
      <ul>
        <li>
          <strong>Free Tier</strong>: 15 GB total storage per account.
        </li>
        <li>
          <strong>Upload Limit</strong>: 750 GB per day (standard Google limit).
        </li>
        <li>
          <strong>File Size</strong>: Supports files up to 5 TB.
        </li>
      </ul>

      <h2>Next Steps</h2>
      <div className="not-prose flex gap-4 mt-6">
        <Link
          href="/docs/file-system"
          className="flex-1 p-4 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
        >
          <span className="text-sm text-gray-500">Next</span>
          <p className="font-medium text-gray-900 dark:text-white">
            File System →
          </p>
        </Link>
      </div>
    </div>
  );
}
