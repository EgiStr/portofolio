# EDS - Exstra Decentralized Storage

**Aggregated Cloud Storage** - Combine multiple Google Drive accounts into a unified storage pool with programmatic API access.

## Features

- 🔗 **Aggregated Storage**: Pool multiple Google Drive accounts (15GB each free)
- 📁 **Virtual File System**: Organize files with folders independently of Google Drive structure
- 📤 **Resumable Upload**: Support for large files (>1GB) with chunked upload
- 🔑 **External API**: Programmatic access via API keys for automation
- 🔒 **Secure**: AES-256 encrypted tokens, SHA-256 hashed API keys

## Quick Start

```bash
# Install dependencies
pnpm install

# Setup database
pnpm db:push

# Run development server
pnpm --filter @ecosystem/eds dev
```

Access at: **http://localhost:3003**

## Documentation

| Document | Description |
|----------|-------------|
| [SETUP.md](./SETUP.md) | Installation & Google Cloud configuration |
| [docs/business_logic.md](./docs/business_logic.md) | System architecture & upload flows |
| [docs/external-api.md](./docs/external-api.md) | External API reference & examples |

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      EDS Dashboard                           │
│    (File Browser, Upload UI, Node Management)                │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                      EDS API Layer                           │
│  /api/drive/*  (Internal)   │   /api/v1/*  (External)       │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                   Storage Node Pool                          │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐                      │
│  │ Node A  │  │ Node B  │  │ Node C  │  (Google Drives)     │
│  │  15GB   │  │  15GB   │  │  15GB   │                      │
│  └─────────┘  └─────────┘  └─────────┘                      │
└─────────────────────────────────────────────────────────────┘
```

## API Endpoints

### Internal API (Dashboard)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/drive/files` | List files in folder |
| POST | `/api/drive/upload/init` | Initialize upload |
| POST | `/api/drive/upload/finalize` | Complete upload |
| GET | `/api/drive/folders` | List folders |
| POST | `/api/drive/folders` | Create folder |

### External API (Programmatic Access)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/v1/storage/upload` | API Key | Request upload URL |

See [docs/external-api.md](./docs/external-api.md) for full external API documentation.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `GOOGLE_CLIENT_ID` | ✅ | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | ✅ | Google OAuth client secret |
| `GOOGLE_REDIRECT_URI` | ✅ | OAuth callback URL |
| `ENCRYPTION_KEY` | ✅ | 32-char AES encryption key |

## License

Private - Eggi Satria
