# Talent Aligned Social Hub - Deployment Guide

## Overview

The Talent Aligned Social Hub (social.talent-aligned.com.au) is a self-hosted instance of Postiz, configured for single sign-on (SSO) via the TA Portal OIDC provider. It enables Talent Aligned users to manage social media publishing across LinkedIn, Facebook, Instagram, X (Twitter), Reddit, YouTube, and more -- all with a single login through the TA Portal.

Key architectural decisions:
- **SSO-only access**: Registration is disabled; all users authenticate through TA Portal
- **External database**: Supabase Postgres (no local PostgreSQL for the app)
- **External cache**: Upstash Redis (no local Redis)
- **Temporal workflows**: Runs with its own dedicated PostgreSQL instance for scheduling and automation
- **Per-user configuration**: Each user has their own connected accounts, voice profile, and publishing preferences
- **Schema management**: Uses `prisma db push` (not `prisma migrate`) for schema changes
- **Dockerfile.dev naming**: The `Dockerfile.dev` name is inherited from upstream Postiz. Despite the name, this is the production build file (pnpm install, pnpm build, nginx + pm2). It is not a development-only Dockerfile.

## Prerequisites

Before deploying, ensure you have:

| Prerequisite | Details |
|---|---|
| Supabase Project | PostgreSQL connection string (pooled recommended) |
| Upstash Redis | Redis URL with TLS enabled |
| Cloudflare DNS | A/CNAME record for `social.talent-aligned.com.au` |
| TA Portal OIDC | Client ID and Client Secret from the portal admin |
| Domain SSL | Managed via Cloudflare (Full Strict recommended) |
| OpenAI API Key | For AI-powered content generation and voice learning |

## Environment Variables

### Required Variables

| Variable | Description | Example |
|---|---|---|
| `MAIN_URL` | Public URL of the Social Hub | `https://social.talent-aligned.com.au` |
| `FRONTEND_URL` | Same as MAIN_URL | `https://social.talent-aligned.com.au` |
| `NEXT_PUBLIC_BACKEND_URL` | Backend API URL (public) | `https://social.talent-aligned.com.au/api` |
| `BACKEND_INTERNAL_URL` | Internal backend URL | `http://localhost:3000` |
| `JWT_SECRET` | Random 64+ character secret for JWT signing | (generate with `openssl rand -hex 32`) |
| `DATABASE_URL` | Supabase Postgres connection string | `postgresql://user:pass@host:5432/db` |
| `REDIS_URL` | Upstash Redis URL | `rediss://default:token@host:6379` |
| `OPENAI_API_KEY` | OpenAI API key for AI features | `sk-...` |

### Authentication (SSO) Variables

| Variable | Value |
|---|---|
| `IS_GENERAL` | `true` |
| `DISABLE_REGISTRATION` | `true` |
| `POSTIZ_GENERIC_OAUTH` | `true` |
| `NEXT_PUBLIC_POSTIZ_OAUTH_DISPLAY_NAME` | `Talent Aligned` |
| `POSTIZ_OAUTH_AUTH_URL` | `https://portal.talent-aligned.com.au/api/oidc/authorize` |
| `POSTIZ_OAUTH_TOKEN_URL` | `https://portal.talent-aligned.com.au/api/oidc/token` |
| `POSTIZ_OAUTH_USERINFO_URL` | `https://portal.talent-aligned.com.au/api/oidc/userinfo` |
| `POSTIZ_OAUTH_SCOPE` | `openid profile email` |
| `POSTIZ_OAUTH_CLIENT_ID` | (from TA Portal admin) |
| `POSTIZ_OAUTH_CLIENT_SECRET` | (from TA Portal admin) |

### Social Media API Keys (Optional - add as needed)

| Variable | Platform |
|---|---|
| `X_API_KEY` / `X_API_SECRET` | X (Twitter) |
| `LINKEDIN_CLIENT_ID` / `LINKEDIN_CLIENT_SECRET` | LinkedIn |
| `FACEBOOK_APP_ID` / `FACEBOOK_APP_SECRET` | Facebook / Instagram |
| `YOUTUBE_CLIENT_ID` / `YOUTUBE_CLIENT_SECRET` | YouTube |
| `REDDIT_CLIENT_ID` / `REDDIT_CLIENT_SECRET` | Reddit |
| `TIKTOK_CLIENT_ID` / `TIKTOK_CLIENT_SECRET` | TikTok |
| `PINTEREST_CLIENT_ID` / `PINTEREST_CLIENT_SECRET` | Pinterest |
| `THREADS_APP_ID` / `THREADS_APP_SECRET` | Threads |

### Deployment Settings

| Variable | Value |
|---|---|
| `TEMPORAL_ADDRESS` | `temporal:7233` (Docker) or Railway internal URL |
| `STORAGE_PROVIDER` | `local` |
| `UPLOAD_DIRECTORY` | `/uploads` |
| `NEXT_PUBLIC_UPLOAD_DIRECTORY` | `/uploads` |
| `NX_ADD_PLUGINS` | `false` |

## Railway Deployment

### Steps

1. **Fork the repository** to the TalentAligned GitHub organization

2. **Create a new Railway project** at [railway.app](https://railway.app)

3. **Connect the repository** - select the forked repo and the correct branch

4. **Railway will detect** the `railway.toml` and use `Dockerfile.dev` for the build

5. **Set environment variables** in the Railway dashboard:
   - Add all required variables from the tables above
   - Generate a secure `JWT_SECRET`: `openssl rand -hex 32`
   - Add the Supabase `DATABASE_URL` from your Supabase project settings
   - Add the Upstash `REDIS_URL` from the Upstash console
   - Add `POSTIZ_OAUTH_CLIENT_ID` and `POSTIZ_OAUTH_CLIENT_SECRET` from TA Portal

6. **Add Temporal service** (optional for Railway):
   - Add a PostgreSQL plugin for Temporal data
   - Deploy `temporalio/auto-setup:1.28.1` as a separate service
   - Set `TEMPORAL_ADDRESS` to the internal Railway networking URL

7. **Configure custom domain**:
   - Add `social.talent-aligned.com.au` as a custom domain in Railway
   - Update Cloudflare DNS to point to Railway's provided CNAME

8. **Deploy** - Railway will build and deploy automatically

### Railway Configuration

The `railway.toml` configures:
- **Build**: Uses `Dockerfile.dev` for consistent builds
- **Health checks**: Monitors `/api` endpoint with 300s timeout
- **Restart policy**: Automatically restarts on failure
- **Single replica**: One instance (scale up as needed)

## Docker Compose Deployment (VPS / Oracle Free Tier)

For deploying on a VPS or Oracle Cloud Free Tier:

### Steps

1. **Clone the repository**:
   ```bash
   git clone https://github.com/TalentAligned/postiz-app.git
   cd postiz-app
   ```

2. **Create a `.env` file** with all required variables:
   ```bash
   cp .env.example .env
   # Edit .env with your values
   ```

   Example `.env`:
   ```env
   JWT_SECRET=your-generated-secret-here
   DATABASE_URL=postgresql://user:pass@db.supabase.co:5432/postgres
   REDIS_URL=rediss://default:token@your-redis.upstash.io:6379
   OPENAI_API_KEY=sk-your-key-here
   POSTIZ_OAUTH_CLIENT_ID=your-client-id
   POSTIZ_OAUTH_CLIENT_SECRET=your-client-secret
   X_API_KEY=
   X_API_SECRET=
   LINKEDIN_CLIENT_ID=
   LINKEDIN_CLIENT_SECRET=
   FACEBOOK_APP_ID=
   FACEBOOK_APP_SECRET=
   ```

3. **Start the services**:
   ```bash
   docker compose -f docker-compose.ta.yaml up -d
   ```

4. **Set up reverse proxy** (nginx or Caddy) to forward HTTPS traffic on port 443 to port 5000:

   Example Caddy config:
   ```
   social.talent-aligned.com.au {
       reverse_proxy localhost:5000
   }
   ```

5. **Verify the deployment**:
   ```bash
   curl -f https://social.talent-aligned.com.au/api
   ```

### Updating

```bash
git pull origin main
docker compose -f docker-compose.ta.yaml up -d --build
```

## OIDC SSO Bridge Configuration

### TA Portal Side (Provider)

In the TA Portal admin settings, register Postiz as an OIDC client:

1. **Client ID**: Generate a unique client identifier (e.g., `postiz-social-hub`)
2. **Client Secret**: Generate a secure random secret
3. **Redirect URI**: `https://social.talent-aligned.com.au/api/auth/oauth/callback`
4. **Allowed Scopes**: `openid`, `profile`, `email`
5. **Token Endpoint Auth Method**: `client_secret_post`
6. **Grant Types**: `authorization_code`

The TA Portal OIDC endpoints:
- Authorization: `https://portal.talent-aligned.com.au/api/oidc/authorize`
- Token: `https://portal.talent-aligned.com.au/api/oidc/token`
- UserInfo: `https://portal.talent-aligned.com.au/api/oidc/userinfo`

### Postiz Side (Consumer)

Set these environment variables on the Postiz deployment:

```env
POSTIZ_GENERIC_OAUTH=true
DISABLE_REGISTRATION=true
NEXT_PUBLIC_POSTIZ_OAUTH_DISPLAY_NAME=Talent Aligned
POSTIZ_OAUTH_AUTH_URL=https://portal.talent-aligned.com.au/api/oidc/authorize
POSTIZ_OAUTH_TOKEN_URL=https://portal.talent-aligned.com.au/api/oidc/token
POSTIZ_OAUTH_USERINFO_URL=https://portal.talent-aligned.com.au/api/oidc/userinfo
POSTIZ_OAUTH_SCOPE=openid profile email
POSTIZ_OAUTH_CLIENT_ID=postiz-social-hub
POSTIZ_OAUTH_CLIENT_SECRET=your-secret-here
```

### How SSO Works

1. User clicks "Sign in with Talent Aligned" on the Social Hub login page
2. Postiz redirects to `portal.talent-aligned.com.au/api/oidc/authorize`
3. If the user is already logged into TA Portal, they are redirected back immediately (seamless SSO)
4. If not logged in, the TA Portal login page is shown
5. After authentication, the portal redirects back to Postiz with an authorization code
6. Postiz exchanges the code for tokens via the token endpoint
7. Postiz fetches user info (email, name) and creates/updates the local user record
8. The user is logged in with their own workspace, connected accounts, and AI voice profile

### User Isolation

Each user authenticated via SSO gets:
- Their own connected social media accounts
- Their own AI voice profile (learns their writing style)
- Their own scheduled posts and content calendar
- Access to organization-wide channels (if configured)

## Verification Steps

After deployment, verify everything is working:

1. **Health check**:
   ```bash
   curl -f https://social.talent-aligned.com.au/api
   # Should return 200 OK
   ```

2. **SSO login flow**:
   - Navigate to `https://social.talent-aligned.com.au`
   - Click "Sign in with Talent Aligned"
   - Verify redirect to TA Portal login
   - After login, verify redirect back to Social Hub dashboard

3. **Registration disabled**:
   - Verify no email/password signup option is shown
   - Only the "Sign in with Talent Aligned" button should appear

4. **Database connectivity**:
   - After first SSO login, verify user record is created in Supabase

5. **Temporal workflows**:
   - Schedule a test post for 1 minute in the future
   - Verify it publishes at the scheduled time

6. **Social media connections**:
   - Connect a test LinkedIn/X account
   - Create and publish a test post

## Database Schema Management

This project uses `prisma db push` rather than `prisma migrate` to synchronize the database schema. After deploying a new version that includes schema changes (e.g., the VoiceProfile model):

```bash
# Run from the postiz-app root in the deployment environment
npx prisma db push
```

Or via the npm script:
```bash
pnpm run prisma-db-push
```

**Important**: Run `prisma db push` after every deploy that changes `schema.prisma`. This is idempotent and safe to run repeatedly. It will apply any pending schema changes without dropping data (unless a destructive change is required, in which case it will prompt).

For Railway deployments, add this as a deploy command or run it manually via the Railway CLI after deploy.

## Iframe Embedding and X-Frame-Options

The TA Portal embeds the Social Hub at `social.talent-aligned.com.au` in an iframe on the `/dashboard/social` page. For this to work, the Postiz deployment must allow framing from the portal origin.

### Required Configuration on the Postiz (Social Hub) side

Configure the web server (nginx in the Dockerfile.dev build) or the Next.js app to send these headers:

```
X-Frame-Options: ALLOW-FROM https://portal.talent-aligned.com.au
Content-Security-Policy: frame-ancestors 'self' https://portal.talent-aligned.com.au https://admin.talent-aligned.com.au
```

Since both services are on `*.talent-aligned.com.au` subdomains, this is a same-site (but cross-origin) configuration. Modern browsers rely on the `frame-ancestors` CSP directive rather than `X-Frame-Options`, so the CSP header is the primary mechanism.

### Cloudflare Configuration

If using Cloudflare in front of both services, you can set these headers via a Cloudflare Transform Rule on the `social.talent-aligned.com.au` zone.

### Known Limitation

Third-party cookie restrictions in Safari and Chrome incognito may affect the SSO session within the iframe. If users experience repeated login prompts inside the iframe, consider:
1. Opening the Social Hub in a new tab instead of an iframe
2. Using a popup-based SSO flow
3. Token passing via `postMessage` between parent and iframe

## Troubleshooting

| Issue | Solution |
|---|---|
| SSO redirect fails | Verify `POSTIZ_OAUTH_CLIENT_ID` matches TA Portal config |
| "Registration disabled" error | Ensure `POSTIZ_GENERIC_OAUTH=true` is set |
| Database connection timeout | Check Supabase connection pooling settings |
| Redis connection refused | Verify Upstash URL includes `rediss://` (TLS) |
| Temporal not connecting | Check `TEMPORAL_ADDRESS` and that temporal service is running |
| Build fails on Railway | Check Railway build logs; ensure Dockerfile.dev is present |
| Health check fails | Wait for full startup (60s+); check `/api` endpoint manually |
