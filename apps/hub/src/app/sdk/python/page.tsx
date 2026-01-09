import Link from "next/link";
import { Breadcrumb } from "../../components";

export default function PythonSDKPage() {
  return (
    <div className="prose prose-gray dark:prose-invert max-w-none">
      <Breadcrumb
        items={[
          { title: "SDKs", href: "/docs/sdk/python" },
          { title: "Python" },
        ]}
      />

      <h1>Python SDK</h1>
      <p className="lead">
        A complete Python client implementation for the EDS External API with
        error handling, retry logic, and best practices.
      </p>

      <h2>Requirements</h2>
      <ul>
        <li>Python 3.8+</li>
        <li>
          <code>requests</code> library
        </li>
      </ul>

      <div className="not-prose">
        <div className="bg-gray-900 rounded-lg overflow-hidden my-4">
          <div className="flex items-center px-4 py-2 bg-gray-800 text-gray-400 text-xs">
            <span>Terminal</span>
          </div>
          <pre className="p-4 text-sm text-gray-100 overflow-x-auto">
            {`pip install requests`}
          </pre>
        </div>
      </div>

      <h2>Complete Client Class</h2>
      <p>
        Save this as <code>eds_client.py</code> in your project:
      </p>

      <div className="not-prose">
        <div className="bg-gray-900 rounded-lg overflow-hidden my-4">
          <div className="flex items-center px-4 py-2 bg-gray-800 text-gray-400 text-xs">
            <span>eds_client.py</span>
          </div>
          <pre className="p-4 text-sm text-gray-100 overflow-x-auto">
            {`"""
EDS (Exstra Decentralized Storage) Python Client
================================================

A simple client for uploading files to EDS via the External API.

Usage:
    from eds_client import EDSClient
    
    client = EDSClient(api_key="exstr_live_...")
    client.upload("backup.zip", folder_path="/backups/daily")
"""

import os
import time
import mimetypes
from typing import Optional
import requests


class EDSError(Exception):
    """Base exception for EDS client errors."""
    pass


class EDSAuthError(EDSError):
    """Authentication failed."""
    pass


class EDSStorageError(EDSError):
    """Storage-related error (e.g., insufficient space)."""
    pass


class EDSClient:
    """Client for EDS External API."""
    
    DEFAULT_BASE_URL = "https://data.eggisatria.dev/api/v1/storage"
    
    def __init__(
        self,
        api_key: str,
        base_url: Optional[str] = None,
        max_retries: int = 3,
        timeout: int = 30
    ):
        """
        Initialize EDS client.
        
        Args:
            api_key: Your EDS API key (exstr_live_...)
            base_url: API base URL (optional)
            max_retries: Maximum retry attempts for failed uploads
            timeout: Request timeout in seconds
        """
        if not api_key or not api_key.startswith("exstr_live_"):
            raise ValueError("Invalid API key format. Must start with 'exstr_live_'")
        
        self.api_key = api_key
        self.base_url = base_url or self.DEFAULT_BASE_URL
        self.max_retries = max_retries
        self.timeout = timeout
        self.session = requests.Session()
        self.session.headers.update({
            "x-api-key": api_key,
            "Content-Type": "application/json"
        })
    
    def _get_mime_type(self, file_path: str) -> str:
        """Detect MIME type from file extension."""
        mime_type, _ = mimetypes.guess_type(file_path)
        return mime_type or "application/octet-stream"
    
    def _handle_error(self, response: requests.Response) -> None:
        """Handle error responses."""
        try:
            data = response.json()
            error_msg = data.get("error", "Unknown error")
        except:
            error_msg = response.text or f"HTTP {response.status_code}"
        
        if response.status_code == 401:
            raise EDSAuthError(f"Authentication failed: {error_msg}")
        elif response.status_code == 507:
            raise EDSStorageError(f"Insufficient storage: {error_msg}")
        else:
            raise EDSError(f"API error ({response.status_code}): {error_msg}")
    
    def upload(
        self,
        file_path: str,
        folder_path: Optional[str] = None,
        filename: Optional[str] = None,
        mime_type: Optional[str] = None
    ) -> dict:
        """
        Upload a file to EDS.
        
        Args:
            file_path: Path to the file to upload
            folder_path: Virtual folder path (e.g., "/backups/daily")
            filename: Override filename (defaults to basename)
            mime_type: Override MIME type (auto-detected if not provided)
        
        Returns:
            dict: Upload result with file metadata
        
        Raises:
            EDSAuthError: If authentication fails
            EDSStorageError: If no storage available
            EDSError: For other API errors
            FileNotFoundError: If file doesn't exist
        """
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")
        
        file_size = os.path.getsize(file_path)
        file_name = filename or os.path.basename(file_path)
        file_mime = mime_type or self._get_mime_type(file_path)
        
        # Step 1: Request upload URL
        payload = {
            "filename": file_name,
            "mimeType": file_mime,
            "size": file_size
        }
        if folder_path:
            payload["folderPath"] = folder_path
        
        response = self.session.post(
            f"{self.base_url}/upload",
            json=payload,
            timeout=self.timeout
        )
        
        if not response.ok:
            self._handle_error(response)
        
        result = response.json()
        if not result.get("success"):
            raise EDSError(result.get("error", "Unknown error"))
        
        upload_url = result["data"]["uploadUrl"]
        
        # Step 2: Upload to Google Drive with retry
        last_error = None
        for attempt in range(self.max_retries):
            try:
                with open(file_path, "rb") as f:
                    upload_response = requests.put(
                        upload_url,
                        data=f,
                        timeout=None  # No timeout for large files
                    )
                
                if upload_response.status_code == 200:
                    return {
                        "success": True,
                        "filename": file_name,
                        "size": file_size,
                        "folder": folder_path,
                        "nodeId": result["data"]["_meta"]["nodeId"]
                    }
                else:
                    last_error = f"Google upload failed: {upload_response.status_code}"
                    
            except requests.exceptions.RequestException as e:
                last_error = str(e)
            
            # Exponential backoff
            if attempt < self.max_retries - 1:
                wait_time = 2 ** attempt
                time.sleep(wait_time)
        
        raise EDSError(f"Upload failed after {self.max_retries} attempts: {last_error}")
    
    def upload_bytes(
        self,
        data: bytes,
        filename: str,
        mime_type: str,
        folder_path: Optional[str] = None
    ) -> dict:
        """
        Upload bytes directly (without a file).
        
        Args:
            data: Bytes to upload
            filename: Name for the file
            mime_type: MIME type of the data
            folder_path: Virtual folder path
        
        Returns:
            dict: Upload result
        """
        # Step 1: Request upload URL
        payload = {
            "filename": filename,
            "mimeType": mime_type,
            "size": len(data)
        }
        if folder_path:
            payload["folderPath"] = folder_path
        
        response = self.session.post(
            f"{self.base_url}/upload",
            json=payload,
            timeout=self.timeout
        )
        
        if not response.ok:
            self._handle_error(response)
        
        result = response.json()
        if not result.get("success"):
            raise EDSError(result.get("error", "Unknown error"))
        
        # Step 2: Upload bytes
        upload_response = requests.put(
            result["data"]["uploadUrl"],
            data=data
        )
        
        if upload_response.status_code == 200:
            return {
                "success": True,
                "filename": filename,
                "size": len(data),
                "folder": folder_path
            }
        else:
            raise EDSError(f"Upload failed: {upload_response.status_code}")`}
          </pre>
        </div>
      </div>

      <h2>Usage Examples</h2>

      <h3>Basic Upload</h3>
      <div className="not-prose">
        <div className="bg-gray-900 rounded-lg overflow-hidden my-4">
          <div className="flex items-center px-4 py-2 bg-gray-800 text-gray-400 text-xs">
            <span>Python</span>
          </div>
          <pre className="p-4 text-sm text-gray-100 overflow-x-auto">
            {`from eds_client import EDSClient

# Initialize client
client = EDSClient(api_key="exstr_live_...")

# Upload a file
result = client.upload("backup.zip")
print(f"Uploaded: {result['filename']}")`}
          </pre>
        </div>
      </div>

      <h3>Upload to Folder</h3>
      <div className="not-prose">
        <div className="bg-gray-900 rounded-lg overflow-hidden my-4">
          <div className="flex items-center px-4 py-2 bg-gray-800 text-gray-400 text-xs">
            <span>Python</span>
          </div>
          <pre className="p-4 text-sm text-gray-100 overflow-x-auto">
            {`# Upload to a specific folder (auto-created if not exists)
result = client.upload(
    "database_backup.sql",
    folder_path="/backups/database/daily"
)`}
          </pre>
        </div>
      </div>

      <h3>Upload with Custom Name</h3>
      <div className="not-prose">
        <div className="bg-gray-900 rounded-lg overflow-hidden my-4">
          <div className="flex items-center px-4 py-2 bg-gray-800 text-gray-400 text-xs">
            <span>Python</span>
          </div>
          <pre className="p-4 text-sm text-gray-100 overflow-x-auto">
            {`from datetime import datetime

# Upload with timestamped filename
timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
result = client.upload(
    "backup.zip",
    filename=f"backup_{timestamp}.zip",
    folder_path="/backups"
)`}
          </pre>
        </div>
      </div>

      <h3>Upload Bytes (In-Memory Data)</h3>
      <div className="not-prose">
        <div className="bg-gray-900 rounded-lg overflow-hidden my-4">
          <div className="flex items-center px-4 py-2 bg-gray-800 text-gray-400 text-xs">
            <span>Python</span>
          </div>
          <pre className="p-4 text-sm text-gray-100 overflow-x-auto">
            {`import json

# Upload JSON data directly
data = {"users": [{"id": 1, "name": "Alice"}]}
json_bytes = json.dumps(data, indent=2).encode("utf-8")

result = client.upload_bytes(
    data=json_bytes,
    filename="users.json",
    mime_type="application/json",
    folder_path="/exports"
)`}
          </pre>
        </div>
      </div>

      <h3>Error Handling</h3>
      <div className="not-prose">
        <div className="bg-gray-900 rounded-lg overflow-hidden my-4">
          <div className="flex items-center px-4 py-2 bg-gray-800 text-gray-400 text-xs">
            <span>Python</span>
          </div>
          <pre className="p-4 text-sm text-gray-100 overflow-x-auto">
            {`from eds_client import EDSClient, EDSAuthError, EDSStorageError, EDSError

client = EDSClient(api_key="exstr_live_...")

try:
    result = client.upload("large_file.zip")
    print(f"✅ Upload successful: {result['filename']}")
    
except EDSAuthError as e:
    print(f"🔑 Authentication error: {e}")
    # Refresh API key
    
except EDSStorageError as e:
    print(f"💾 Storage full: {e}")
    # Alert admin, add more nodes
    
except EDSError as e:
    print(f"❌ Upload error: {e}")
    # Log and retry later
    
except FileNotFoundError as e:
    print(f"📁 File not found: {e}")`}
          </pre>
        </div>
      </div>

      <h3>Environment Variables</h3>
      <div className="not-prose">
        <div className="bg-gray-900 rounded-lg overflow-hidden my-4">
          <div className="flex items-center px-4 py-2 bg-gray-800 text-gray-400 text-xs">
            <span>Python</span>
          </div>
          <pre className="p-4 text-sm text-gray-100 overflow-x-auto">
            {`import os
from eds_client import EDSClient

# Best practice: use environment variables
client = EDSClient(
    api_key=os.environ["EDS_API_KEY"],
    base_url=os.environ.get("EDS_BASE_URL")  # Optional override
)`}
          </pre>
        </div>
      </div>

      <h2>Next Steps</h2>
      <div className="not-prose flex gap-4 mt-6">
        <Link
          href="/docs/sdk/javascript"
          className="flex-1 p-4 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
        >
          <span className="text-sm text-gray-500">Next</span>
          <p className="font-medium text-gray-900 dark:text-white">
            JavaScript SDK →
          </p>
        </Link>
      </div>
    </div>
  );
}
