# External API Reference

EDS provides a RESTful API for programmatic access to storage operations. All external endpoints require API key authentication.

## Authentication

All requests to `/api/v1/*` endpoints must include an API key in the header:

```http
x-api-key: exstr_live_a1b2c3d4e5f6g7h8i9j0...
```

### Obtaining an API Key

1. Access the Manager Dashboard at `/dashboard/api-keys`
2. Click **"Generate New Key"**
3. Enter a descriptive name (e.g., "Python Backup Script")
4. **Copy the key immediately** - it will only be displayed once

### Key Format

```
exstr_live_[32 random hex characters]

Example: exstr_live_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

---

## Response Format

All responses follow a standardized JSON structure:

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "error": null
}
```

### Error Response
```json
{
  "success": false,
  "data": null,
  "error": "Error message describing the issue"
}
```

---

## Endpoints

### POST /api/v1/storage/upload

Request a resumable upload URL for file upload. This is Step 1 of the 2-step upload flow.

#### Headers

| Header | Required | Description |
|--------|----------|-------------|
| `x-api-key` | ✅ | Your API key |
| `Content-Type` | ✅ | `application/json` |

#### Request Body

```json
{
  "filename": "backup_2024.zip",
  "mimeType": "application/zip",
  "size": 104857600,
  "folderPath": "/backups/server-a"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `filename` | string | ✅ | Name of the file to upload |
| `mimeType` | string | ✅ | MIME type of the file |
| `size` | number | ✅ | File size in bytes |
| `folderPath` | string | ❌ | Virtual folder path (auto-created if not exists) |

#### Response

```json
{
  "success": true,
  "data": {
    "uploadUrl": "https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&upload_id=...",
    "expiresIn": 3600,
    "method": "PUT",
    "_meta": {
      "nodeId": "clx1234...",
      "reservationId": "clx5678...",
      "folderId": "clx9012..."
    }
  },
  "error": null
}
```

#### Error Codes

| HTTP Code | Error | Description |
|-----------|-------|-------------|
| 400 | Missing or invalid field | Required field validation failed |
| 401 | Invalid or inactive API key | Authentication failed |
| 500 | Upload failed | Internal error during upload initialization |
| 507 | Insufficient storage | No storage nodes with available space |

---

## Upload Flow (2-Step)

Due to Vercel's 4.5MB request body limit, EDS uses a 2-step upload process:

```
┌─────────┐                    ┌─────────┐                  ┌──────────────┐
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
     │<────────────────────────────────────────────────────────────│
     │                              │                              │
```

### Step 1: Request Upload URL

Send file metadata to EDS API:

```bash
curl -X POST https://your-domain.com/api/v1/storage/upload \
  -H "x-api-key: exstr_live_..." \
  -H "Content-Type: application/json" \
  -d '{
    "filename": "data.csv",
    "mimeType": "text/csv",
    "size": 1048576
  }'
```

### Step 2: Upload to Google Drive

Upload binary data directly to the returned URL:

```bash
curl -X PUT "[uploadUrl from step 1]" \
  --data-binary @data.csv
```

---

## Code Examples

### Python

```python
import requests
import os

API_KEY = "exstr_live_..."
BASE_URL = "https://your-domain.com/api/v1/storage"
FILE_PATH = "backup.zip"

def upload_file(file_path: str, folder_path: str = None) -> bool:
    """Upload a file to EDS via external API."""
    
    # Get file info
    file_size = os.path.getsize(file_path)
    file_name = os.path.basename(file_path)
    
    # Determine MIME type (simplified)
    mime_types = {
        '.zip': 'application/zip',
        '.csv': 'text/csv',
        '.json': 'application/json',
        '.pdf': 'application/pdf',
        '.txt': 'text/plain',
    }
    ext = os.path.splitext(file_name)[1].lower()
    mime_type = mime_types.get(ext, 'application/octet-stream')
    
    # Step 1: Request upload URL
    payload = {
        "filename": file_name,
        "mimeType": mime_type,
        "size": file_size,
    }
    if folder_path:
        payload["folderPath"] = folder_path
    
    response = requests.post(
        f"{BASE_URL}/upload",
        headers={
            "x-api-key": API_KEY,
            "Content-Type": "application/json"
        },
        json=payload
    )
    
    result = response.json()
    if not result.get("success"):
        print(f"Error: {result.get('error')}")
        return False
    
    upload_url = result["data"]["uploadUrl"]
    
    # Step 2: Upload directly to Google Drive
    with open(file_path, 'rb') as f:
        upload_response = requests.put(upload_url, data=f)
    
    if upload_response.status_code == 200:
        print(f"✅ Upload successful: {file_name}")
        return True
    else:
        print(f"❌ Upload failed: {upload_response.text}")
        return False


# Usage
if __name__ == "__main__":
    upload_file("backup.zip", folder_path="/backups/daily")
```

### JavaScript/Node.js

```javascript
const fs = require('fs');
const fetch = require('node-fetch');
const path = require('path');

const API_KEY = 'exstr_live_...';
const BASE_URL = 'https://your-domain.com/api/v1/storage';

async function uploadFile(filePath, folderPath = null) {
  const fileName = path.basename(filePath);
  const fileSize = fs.statSync(filePath).size;
  
  // Step 1: Get upload URL
  const payload = {
    filename: fileName,
    mimeType: 'application/octet-stream',
    size: fileSize,
  };
  if (folderPath) payload.folderPath = folderPath;
  
  const initResponse = await fetch(`${BASE_URL}/upload`, {
    method: 'POST',
    headers: {
      'x-api-key': API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  
  const result = await initResponse.json();
  if (!result.success) {
    throw new Error(result.error);
  }
  
  // Step 2: Upload to Google Drive
  const fileStream = fs.createReadStream(filePath);
  const uploadResponse = await fetch(result.data.uploadUrl, {
    method: 'PUT',
    body: fileStream,
  });
  
  if (uploadResponse.ok) {
    console.log(`✅ Uploaded: ${fileName}`);
    return true;
  } else {
    throw new Error(`Upload failed: ${await uploadResponse.text()}`);
  }
}

// Usage
uploadFile('./backup.zip', '/backups/daily')
  .then(() => console.log('Done!'))
  .catch(console.error);
```

### cURL (Bash Script)

```bash
#!/bin/bash

API_KEY="exstr_live_..."
BASE_URL="https://your-domain.com/api/v1/storage"
FILE_PATH="$1"
FOLDER_PATH="${2:-}"

if [ -z "$FILE_PATH" ]; then
  echo "Usage: ./upload.sh <file_path> [folder_path]"
  exit 1
fi

FILE_NAME=$(basename "$FILE_PATH")
FILE_SIZE=$(stat -f%z "$FILE_PATH" 2>/dev/null || stat -c%s "$FILE_PATH")

# Step 1: Get upload URL
RESPONSE=$(curl -s -X POST "$BASE_URL/upload" \
  -H "x-api-key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"filename\": \"$FILE_NAME\",
    \"mimeType\": \"application/octet-stream\",
    \"size\": $FILE_SIZE,
    \"folderPath\": \"$FOLDER_PATH\"
  }")

SUCCESS=$(echo "$RESPONSE" | jq -r '.success')
if [ "$SUCCESS" != "true" ]; then
  echo "Error: $(echo "$RESPONSE" | jq -r '.error')"
  exit 1
fi

UPLOAD_URL=$(echo "$RESPONSE" | jq -r '.data.uploadUrl')

# Step 2: Upload to Google Drive
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  -X PUT "$UPLOAD_URL" \
  --data-binary @"$FILE_PATH")

if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ Upload successful: $FILE_NAME"
else
  echo "❌ Upload failed with HTTP $HTTP_CODE"
  exit 1
fi
```

---

## Best Practices

### 1. Store API Keys Securely

```python
# ❌ Don't hardcode keys
API_KEY = "exstr_live_12345..."

# ✅ Use environment variables
import os
API_KEY = os.environ.get("EDS_API_KEY")
```

### 2. Handle Errors Gracefully

```python
response = requests.post(url, ...)
result = response.json()

if not result.get("success"):
    error = result.get("error", "Unknown error")
    
    if response.status_code == 401:
        # Invalid/expired API key
        refresh_api_key()
    elif response.status_code == 507:
        # No storage available
        notify_admin("Storage full!")
    else:
        log_error(error)
```

### 3. Implement Retry Logic

```python
import time

def upload_with_retry(file_path, max_retries=3):
    for attempt in range(max_retries):
        try:
            return upload_file(file_path)
        except Exception as e:
            if attempt < max_retries - 1:
                wait_time = 2 ** attempt  # Exponential backoff
                time.sleep(wait_time)
            else:
                raise e
```

### 4. Use Appropriate Folder Paths

```python
# ✅ Organized structure
upload_file("db.sql", folder_path="/backups/database/daily")
upload_file("logs.tar", folder_path="/backups/logs/2024/01")

# ❌ Flat structure with no organization
upload_file("db.sql")  # Goes to root
```

### 5. Monitor API Key Usage

Check `lastUsedAt` in the dashboard to identify:
- Unused keys (can be revoked)
- Suspicious activity patterns
- Script failures (key stops being used)

---

## Rate Limits

Currently, there are no hard rate limits on the external API. However, keep in mind:

- Google Drive API has its own quotas (~750GB upload per day)
- Each storage node has limited capacity
- Concurrent uploads to the same node may compete for resources

For high-volume use cases, consider:
- Implementing client-side throttling
- Distributing uploads over time
- Contacting for enterprise support

---

## Troubleshooting

### "Invalid or inactive API key"

1. Verify the key is copied correctly (no extra spaces)
2. Check if the key is active in the dashboard
3. Ensure the `x-api-key` header is properly set

### "Insufficient storage. No available nodes."

1. Check storage node status in EDS dashboard
2. Add more storage nodes if all are full
3. Clean up old files to free space

### Upload URL expired

The `uploadUrl` expires after 1 hour. If Step 2 fails:
1. Request a new upload URL (Step 1)
2. Complete upload within 1 hour

### File appears in EDS but not visible

After uploading directly to Google Drive, the file record is created based on the finalization. If using chunked uploads for very large files, ensure all chunks complete successfully.
