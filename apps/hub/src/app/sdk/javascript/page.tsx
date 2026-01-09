import Link from "next/link";
import { Breadcrumb } from "../../components";

export default function JavaScriptSDKPage() {
  return (
    <div className="prose prose-gray dark:prose-invert max-w-none">
      <Breadcrumb
        items={[
          { title: "SDKs", href: "/docs/sdk/python" },
          { title: "JavaScript" },
        ]}
      />

      <h1>JavaScript SDK</h1>
      <p className="lead">
        A TypeScript/JavaScript client for Node.js and browser environments.
      </p>

      <h2>Requirements</h2>
      <ul>
        <li>Node.js 18+ (for native fetch) or any modern browser</li>
        <li>
          For older Node.js: <code>node-fetch</code> package
        </li>
      </ul>

      <h2>Complete Client Class</h2>
      <p>
        Save this as <code>eds-client.ts</code> (or <code>.js</code>):
      </p>

      <div className="not-prose">
        <div className="bg-gray-900 rounded-lg overflow-hidden my-4">
          <div className="flex items-center px-4 py-2 bg-gray-800 text-gray-400 text-xs">
            <span>eds-client.ts</span>
          </div>
          <pre className="p-4 text-sm text-gray-100 overflow-x-auto">
            {`/**
 * EDS (Exstra Decentralized Storage) JavaScript Client
 * =====================================================
 * 
 * Usage:
 *   import { EDSClient } from './eds-client';
 *   const client = new EDSClient('exstr_live_...');
 *   await client.upload(file);
 */

export interface UploadResult {
  success: boolean;
  filename: string;
  size: number;
  folder?: string;
  nodeId?: string;
}

export interface UploadOptions {
  filename?: string;
  mimeType?: string;
  folderPath?: string;
  onProgress?: (progress: number) => void;
}

export class EDSError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = 'EDSError';
  }
}

export class EDSClient {
  private static DEFAULT_BASE_URL = 'https://data.eggisatria.dev/api/v1/storage';
  
  private apiKey: string;
  private baseUrl: string;
  private maxRetries: number;
  
  constructor(
    apiKey: string,
    options: {
      baseUrl?: string;
      maxRetries?: number;
    } = {}
  ) {
    if (!apiKey?.startsWith('exstr_live_')) {
      throw new Error("Invalid API key format. Must start with 'exstr_live_'");
    }
    
    this.apiKey = apiKey;
    this.baseUrl = options.baseUrl || EDSClient.DEFAULT_BASE_URL;
    this.maxRetries = options.maxRetries ?? 3;
  }
  
  /**
   * Upload a file to EDS
   */
  async upload(
    file: File | Blob | Buffer,
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    const filename = options.filename || (file instanceof File ? file.name : 'file');
    const mimeType = options.mimeType || (file instanceof File ? file.type : 'application/octet-stream');
    const size = file instanceof Buffer ? file.length : file.size;
    
    // Step 1: Request upload URL
    const response = await fetch(\`\${this.baseUrl}/upload\`, {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filename,
        mimeType,
        size,
        ...(options.folderPath && { folderPath: options.folderPath }),
      }),
    });
    
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new EDSError(
        data.error || \`API error: \${response.status}\`,
        response.status
      );
    }
    
    const result = await response.json();
    if (!result.success) {
      throw new EDSError(result.error || 'Unknown error');
    }
    
    const uploadUrl = result.data.uploadUrl;
    
    // Step 2: Upload to Google Drive with retry
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        const uploadResponse = await fetch(uploadUrl, {
          method: 'PUT',
          body: file,
        });
        
        if (uploadResponse.ok) {
          return {
            success: true,
            filename,
            size,
            folder: options.folderPath,
            nodeId: result.data._meta?.nodeId,
          };
        }
        
        lastError = new Error(\`Google upload failed: \${uploadResponse.status}\`);
      } catch (e) {
        lastError = e as Error;
      }
      
      // Exponential backoff
      if (attempt < this.maxRetries - 1) {
        await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 1000));
      }
    }
    
    throw new EDSError(
      \`Upload failed after \${this.maxRetries} attempts: \${lastError?.message}\`
    );
  }
  
  /**
   * Upload a string as a file
   */
  async uploadString(
    content: string,
    filename: string,
    options: Omit<UploadOptions, 'filename'> = {}
  ): Promise<UploadResult> {
    const blob = new Blob([content], {
      type: options.mimeType || 'text/plain',
    });
    return this.upload(blob, { ...options, filename });
  }
  
  /**
   * Upload JSON data
   */
  async uploadJSON(
    data: unknown,
    filename: string,
    options: Omit<UploadOptions, 'filename' | 'mimeType'> = {}
  ): Promise<UploadResult> {
    const json = JSON.stringify(data, null, 2);
    return this.uploadString(json, filename, {
      ...options,
      mimeType: 'application/json',
    });
  }
}`}
          </pre>
        </div>
      </div>

      <h2>Usage Examples</h2>

      <h3>Browser: File Input Upload</h3>
      <div className="not-prose">
        <div className="bg-gray-900 rounded-lg overflow-hidden my-4">
          <div className="flex items-center px-4 py-2 bg-gray-800 text-gray-400 text-xs">
            <span>React Component</span>
          </div>
          <pre className="p-4 text-sm text-gray-100 overflow-x-auto">
            {`import { EDSClient } from './eds-client';

function FileUploader() {
  const [uploading, setUploading] = useState(false);
  
  const client = new EDSClient(process.env.NEXT_PUBLIC_EDS_API_KEY!);
  
  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    try {
      const result = await client.upload(file, {
        folderPath: '/uploads'
      });
      console.log('Uploaded:', result);
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
    }
  }
  
  return (
    <input
      type="file"
      onChange={handleUpload}
      disabled={uploading}
    />
  );
}`}
          </pre>
        </div>
      </div>

      <h3>Node.js: Upload Local File</h3>
      <div className="not-prose">
        <div className="bg-gray-900 rounded-lg overflow-hidden my-4">
          <div className="flex items-center px-4 py-2 bg-gray-800 text-gray-400 text-xs">
            <span>Node.js</span>
          </div>
          <pre className="p-4 text-sm text-gray-100 overflow-x-auto">
            {`import { readFile } from 'fs/promises';
import { basename } from 'path';
import { EDSClient } from './eds-client';

const client = new EDSClient(process.env.EDS_API_KEY!);

async function uploadFile(filePath: string) {
  const buffer = await readFile(filePath);
  const filename = basename(filePath);
  
  // Create a Blob-like object for Node.js
  const blob = new Blob([buffer]);
  
  const result = await client.upload(blob, {
    filename,
    folderPath: '/backups'
  });
  
  console.log('✅ Uploaded:', result);
}

uploadFile('./backup.zip');`}
          </pre>
        </div>
      </div>

      <h3>Upload JSON Data</h3>
      <div className="not-prose">
        <div className="bg-gray-900 rounded-lg overflow-hidden my-4">
          <div className="flex items-center px-4 py-2 bg-gray-800 text-gray-400 text-xs">
            <span>TypeScript</span>
          </div>
          <pre className="p-4 text-sm text-gray-100 overflow-x-auto">
            {`const client = new EDSClient(process.env.EDS_API_KEY!);

// Upload JSON directly
const result = await client.uploadJSON(
  { users: [{ id: 1, name: 'Alice' }] },
  'users-export.json',
  { folderPath: '/exports' }
);`}
          </pre>
        </div>
      </div>

      <h3>Error Handling</h3>
      <div className="not-prose">
        <div className="bg-gray-900 rounded-lg overflow-hidden my-4">
          <div className="flex items-center px-4 py-2 bg-gray-800 text-gray-400 text-xs">
            <span>TypeScript</span>
          </div>
          <pre className="p-4 text-sm text-gray-100 overflow-x-auto">
            {`import { EDSClient, EDSError } from './eds-client';

const client = new EDSClient(process.env.EDS_API_KEY!);

try {
  await client.upload(file);
} catch (err) {
  if (err instanceof EDSError) {
    if (err.statusCode === 401) {
      console.error('🔑 Invalid API key');
    } else if (err.statusCode === 507) {
      console.error('💾 Storage full');
    } else {
      console.error('❌ Upload error:', err.message);
    }
  } else {
    throw err;
  }
}`}
          </pre>
        </div>
      </div>

      <h2>Next Steps</h2>
      <div className="not-prose flex gap-4 mt-6">
        <Link
          href="/sdk/curl"
          className="flex-1 p-4 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
        >
          <span className="text-sm text-gray-500">Next</span>
          <p className="font-medium text-gray-900 dark:text-white">
            cURL / Bash →
          </p>
        </Link>
      </div>
    </div>
  );
}
