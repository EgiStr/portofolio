# EDS (Exstra Decentralized Storage) - Business Logic Documentation

Dokumen ini menjelaskan alur logika bisnis dan proses teknis di balik fitur-fitur EDS.

## 1. Storage Node Management (Desentralisasi Storage)

EDS menggunakan konsep **Aggregated Storage**, di mana multiple akun Google Drive (Nodes) digabungkan menjadi satu pool penyimpanan virtual yang besar.

### 1.1 Registrasi Node
1. **Inisiasi**: Admin memilih "Add New Node".
2. **OAuth Flow**: Redirect ke Google OAuth Consent Screen dengan scope `https://www.googleapis.com/auth/drive.file`.
3. **Token Exchange**: 
   - Callback menerima `authorization_code`.
   - Server menukar code dengan `access_token` dan `refresh_token`.
4. **Security**:
   - Tokens dienkripsi menggunakan **AES-256-GCM** sebelum disimpan ke database (`StorageNode` table).
   - Encryption key disimpan di environment server, tidak di database.
5. **Sync**: Server mengambil data quota (Total/Used) dari Google Drive untuk inisialisasi status node.

---

## 2. File Upload System

Sistem upload menggunakan strategi **Smart Allocation** dan **Server-Side Proxy** untuk menghindari limitasi browser (CORS).

### 2.1 Algoritma Alokasi Storage
Saat user akan mengupload file, sistem menentukan node mana yang akan digunakan:
1. **Filter**: Cari node yang `isActive` dan memiliki `free_space > file_size`.
2. **Strategy**: **Most Space Available First** (Prioritas node dengan ruang kosong terbesar).
3. **Reservation**: Membuat record `EDSReservation` untuk "booking" ketersediaan space agar tidak terjadi race condition saat multiple upload berjalan.

### 2.2 Alur Upload (Direct-to-Drive Resumable)
Sistem upload telah diupgrade menggunakan protokol **Resumable Upload** Google Drive untuk mendukung file besar (>1GB) dan bypass limitasi serverless (Vercel Timeout/Body Size).

#### Fitur Utama:
- **Chunked Upload**: File dipecah menjadi bagian-bagian kecil (10MB) di sisi client.
- **Direct Transfer**: Chunk dikirim langsung dari Browser ke Google Drive (`googleusercontent.com`), tidak membebani bandwidth server EDS.
- **Auto-Retry**: Jika koneksi putus saat upload chunk, sistem otomatis melakukan retry tanpa mengulang dari awal.
- **Support Besar**: Mendukung file hingga 5TB.

#### Technical Note: CORS Bypass Strategy
Browser secara default memblokir request PUT ke domain berbeda (`googleusercontent.com`) jika tidak ada header CORS yang sesuai. EDS mengatasi ini dengan metode **Origin Forwarding**:

1. **Server-Side Init**: Saat client request `/api/drive/upload/init`, server Next.js menangkap header `Origin` dari browser (e.g., `http://localhost:3000`).
2. **Forwarding**: Server meneruskan header `Origin` tersebut saat request Session ID ke Google Drive API.
3. **Whitelisting**: Google merespons dengan URL session yang secara spesifik mengizinkan origin tersebut (Access-Control-Allow-Origin: http://localhost:3000).
4. **Client-Side Header**: Client menggunakan `credentials: 'omit'` dan menghindari header terlarang (seperti `Content-Length` manual) untuk mencegah preflight failure.

```mermaid
sequenceDiagram
    participant User
    participant EDS_API
    participant Database
    participant Google_Drive

    Note over User, EDS_API: Phase 1: Initialization
    User->>EDS_API: POST /api/drive/upload/init (Metadata)
    EDS_API->>EDS_API: Select Best Node
    EDS_API->>Database: Create Reservation
    EDS_API->>Google_Drive: Init Resumable Session (Server-to-Server)
    Google_Drive-->>EDS_API: Return Upload URL
    EDS_API-->>User: Return Upload URL + NodeID

    Note over User, Google_Drive: Phase 2: Direct Upload
    loop Every 10MB Chunk
        User->>Google_Drive: PUT Chunk (Direct)
        Google_Drive-->>User: 308 Resume Incomplete
    end
    User->>Google_Drive: PUT Last Chunk
    Google_Drive-->>User: 200 OK + File Metadata

    Note over User, EDS_API: Phase 3: Finalization
    User->>EDS_API: POST /api/drive/upload/finalize
    EDS_API->>Database: Save EDSFile Record
    EDS_API->>Database: Commit Reservation
    EDS_API-->>User: Success
```

### 2.3 Recursive Folder Upload (Drag-and-Drop)
Fitur unggulan untuk upload struktur folder kompleks:

1. **Detection**: Menggunakan `webkitGetAsEntry()` API di browser untuk mendeteksi apakah item yang didrop adalah folder.
2. **Traversal**: Browser membaca struktur direktori secara recursive (Tree Traversal).
3. **Structure Replication**:
   - Client memetakan path lokal ke database.
   - Untuk setiap folder, Client memastikan folder tersebut ada di database EDS (`POST /api/drive/folders` path-by-path).
   - Client menyimpan mapping `Local Path` -> `EDS Folder ID`.
4. **Sequential Upload**: File diupload satu per satu dengan melampirkan `folderId` yang sesuai dari mapping structure.

---

## 3. File & Folder Management

### 3.1 Folder Navigation
- Menggunakan **Dynamic Routing** (`[[...path]]`) untuk mendukung kedalaman folder tak terbatas.
- **Breadcrumbs**: Dibangun dengan menelusuri parent secara recursive dari database.

### 3.2 Drag & Drop Move
Memindahkan file/folder antar direktori:
1. **Action**: User drag file ke folder row atau breadcrumb.
2. **API**: `PATCH /api/drive/files/[id]/move` dengan body `{ folderId: target }`.
3. **Validation**: Mencegah circular move (memindahkan folder ke dalam dirinya sendiri).

### 3.3 Deletion
Menggunakan **Soft Delete**:
- File tidak langsung dihapus dari Google Drive.
- Record database ditandai dengan `deletedAt`.
- Space belum dikembalikan sebelum permanent deletion (Trash cleaning).

---

## 4. Download System

Download menggunakan metode **Secure Streaming** agar token Google Drive tidak terekspos ke client.

1. **Request**: Client akses `/api/drive/files/[id]`.
2. **Lookup**: Server mencari metadata file untuk mendapatkan `nodeId` dan `googleFileId`.
3. **Auth Refresh**: Server mendekripsi refresh token node dan meminta access token baru ke Google (jika expired).
4. **Streaming**: 
   - Server membuka stream dari Google Drive API.
   - Stream dipipe langsung ke Response object Next.js.
   - Headers yang sesuai (`Content-Type`, `Content-Disposition`) diset agar browser mengenali sebagai file download.

---

## 5. Security & Privacy

1. **Token Protection**: Access & Refresh token selalu terenkripsi di database (AES-256).
2. **Isolated Access**: EDS hanya memiliki akses ke file yang dibuat oleh EDS sendiri (Scope: `drive.file`). Tidak bisa membaca file pribadi user di luar EDS.
3. **Middleware Upload**: File tidak pernah menyentuh disk server EDS, melainkan di-stream via memori (Buffer) langsung ke Google.
