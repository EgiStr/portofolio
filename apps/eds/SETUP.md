# EDS Setup Guide

## Prerequisites

- Node.js >= 18
- pnpm >= 9.1.0
- PostgreSQL database (Neon/Supabase recommended)

---

## 1. Google Cloud Console Setup

### Create Project & Enable APIs

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project: **"EDS Storage"**
3. Navigate to **APIs & Services** → **Library**
4. Enable these APIs:
   - Google Drive API
   - Google OAuth2 API

### Create OAuth Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Configure OAuth consent screen:
   - User Type: **External**
   - App name: **EDS - Decentralized Storage**
   - Scopes: Add these scopes:
     ```
     https://www.googleapis.com/auth/drive.file
     https://www.googleapis.com/auth/drive.metadata.readonly
     https://www.googleapis.com/auth/userinfo.email
     ```

### ⚠️ Add Test Users (Required for Development)

Since the app is in "Testing" mode and not verified:

1. Go to **APIs & Services** → **OAuth consent screen**
2. Scroll down to **Test users** section
3. Click **+ ADD USERS**
4. Add your email: `eggisatria23@gmail.com`
5. Add any other Google accounts you want to use as storage nodes
6. Click **SAVE**

> **Note**: You can add up to 100 test users. Only these users can access the app until you complete Google verification (not required for personal use).

### Create OAuth Client

1. Go to **Credentials** tab
2. Click **Create Credentials** → **OAuth client ID**
3. Application type: **Web application**
4. Authorized redirect URIs:
   - Development: `http://localhost:3003/api/auth/google/callback`
   - Production: `https://data.eggisatria.dev/api/auth/google/callback`
5. Copy **Client ID** and **Client Secret**

---

## 2. Environment Variables

Add to root `.env` file:

```env
# Google OAuth (EDS)
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3003/api/auth/google/callback

# Encryption Key (32 characters for AES-256)
ENCRYPTION_KEY=your_32_character_secret_key_here
```

### Generate Encryption Key

```bash
# Generate random 32-byte hex key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 3. Database Setup

```bash
# Push schema to database
pnpm db:push

# Verify tables created
pnpm db:studio
# Check for: eds_storage_nodes, eds_folders, eds_files, eds_reservations, eds_activity_logs
```

---

## 4. Run Development Server

```bash
# Install dependencies (if not done)
pnpm install

# Run EDS app only
pnpm --filter @ecosystem/eds dev

# Or run all apps
pnpm dev
```

Access at: **http://localhost:3003**

---

## 5. Add Your First Storage Node

1. Open http://localhost:3003/nodes
2. Click **"Add Node"**
3. Login with your Google account
4. Grant permissions
5. You'll be redirected back with the node added

---

## 6. Vercel Deployment

### Environment Variables in Vercel

Add these in Vercel project settings:

| Variable | Value |
|----------|-------|
| `GOOGLE_CLIENT_ID` | Your OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Your OAuth client secret |
| `GOOGLE_REDIRECT_URI` | `https://data.eggisatria.dev/api/auth/google/callback` |
| `ENCRYPTION_KEY` | Your 32-char encryption key |
| `DATABASE_URL` | Your Neon/Supabase pooled URL |
| `DIRECT_URL` | Your direct database URL |

### Deploy

```bash
# Build locally first to verify
pnpm --filter @ecosystem/eds build

# Deploy via Vercel CLI or Git push
vercel --prod
```

---

## Troubleshooting

### OAuth Error: redirect_uri_mismatch

- Ensure redirect URI in Google Console **exactly** matches `GOOGLE_REDIRECT_URI`
- Include trailing slash if needed

### Database Connection Failed

- Verify `DATABASE_URL` format: `postgresql://user:pass@host:port/db?sslmode=require`
- Use connection pooler URL for serverless

### Encryption Error

- Ensure `ENCRYPTION_KEY` is exactly 32 characters
- Key must remain consistent (changing it invalidates stored tokens)
