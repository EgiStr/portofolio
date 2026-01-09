import Link from "next/link";
import { Breadcrumb } from "../components";

export default function FileSystemPage() {
  return (
    <div className="prose prose-gray dark:prose-invert max-w-none">
      <Breadcrumb items={[{ title: "File System" }]} />

      <h1>File System</h1>
      <p className="lead">
        EDS implements a virtual file system that sits on top of your physical
        storage nodes.
      </p>

      <h2>Virtual vs Physical</h2>
      <p>
        In a traditional storage system, a folder in your UI corresponds to a
        folder on your disk. In EDS, the hierarchy is <strong>virtual</strong>.
      </p>
      <ul>
        <li>
          <strong>Virtual Path</strong>: The path you see in the EDS dashboard
          (e.g., <code>/projects/photos/beach.jpg</code>).
        </li>
        <li>
          <strong>Physical Location</strong>: The file's actual ID and location
          on a specific Google Drive node.
        </li>
      </ul>
      <p>
        This abstraction allows EDS to move files between nodes or rename
        folders instantly without actually moving large amounts of data across
        accounts.
      </p>

      <h2>Folders</h2>
      <p>
        Folders in EDS are database records that store a <code>name</code>, a{" "}
        <code>parentId</code>, and a <code>path</code>. They are used to
        organize files in the dashboard and via the API.
      </p>
      <div className="not-prose my-6 p-4 rounded-lg border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/20">
        <p className="font-medium text-blue-800 dark:text-blue-200">
          Auto-Creation
        </p>
        <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
          When using the External API, if you specify a <code>folderPath</code>{" "}
          that doesn't exist, EDS will automatically create the entire folder
          hierarchy for you.
        </p>
      </div>

      <h2>Files</h2>
      <p>
        Files are associated with a specific storage node and a virtual folder.
        Each file record contains:
      </p>
      <ul>
        <li>
          <strong>Name</strong>: The display name in EDS.
        </li>
        <li>
          <strong>Size</strong>: The actual size in bytes.
        </li>
        <li>
          <strong>MIME Type</strong>: The file format (e.g.,{" "}
          <code>image/jpeg</code>).
        </li>
        <li>
          <strong>Google Drive ID</strong>: The unique identifier on the storage
          node.
        </li>
        <li>
          <strong>Node ID</strong>: Reference to the storage node where the file
          resides.
        </li>
      </ul>

      <h2>Activity Logs</h2>
      <p>Every operation in the file system is logged for auditability:</p>
      <ul>
        <li>
          <code>CREATE_FOLDER</code>
        </li>
        <li>
          <code>DELETE_FOLDER</code>
        </li>
        <li>
          <code>UPLOAD_INIT</code> (When an upload starts)
        </li>
        <li>
          <code>UPLOAD_COMPLETE</code> (When a file is successfully stored)
        </li>
        <li>
          <code>DELETE_FILE</code>
        </li>
      </ul>

      <h2>Next Steps</h2>
      <div className="not-prose flex gap-4 mt-6">
        <Link
          href="/docs/upload-flow"
          className="flex-1 p-4 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
        >
          <span className="text-sm text-gray-500">Next</span>
          <p className="font-medium text-gray-900 dark:text-white">
            Upload Flow →
          </p>
        </Link>
      </div>
    </div>
  );
}
