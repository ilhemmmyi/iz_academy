# Security & Secret Management

## Local Development Setup

```bash
# Backend
cp backend/.env.example backend/.env
# Fill in all values in backend/.env

# Frontend
cp frontend/.env.example frontend/.env
# Fill in all values in frontend/.env
```

Never commit `.env` files. They are gitignored at every level.

---

## Generating Strong JWT Secrets

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Run this twice — once for `JWT_ACCESS_SECRET`, once for `JWT_REFRESH_SECRET`.
Minimum 32 characters required. 64-character hex strings recommended.

---

## Required Secrets Reference

| Variable | Where to get it | Rotation frequency |
|---|---|---|
| `DATABASE_URL` / `DIRECT_URL` | Supabase → Settings → Database | On breach |
| `SUPABASE_SERVICE_KEY` | Supabase → Settings → API | Every 90 days |
| `JWT_ACCESS_SECRET` | Generate locally (see above) | On breach |
| `JWT_REFRESH_SECRET` | Generate locally (see above) | On breach |
| `FIREBASE_PRIVATE_KEY` | Firebase Console → Service Accounts | On breach |
| `SMTP_PASS` | Brevo → SMTP & API | Every 90 days |
| `RESEND_API_KEY` | Resend Dashboard | Every 90 days |
| `HUGGINGFACE_API_KEY` | HuggingFace → Settings → Tokens | Every 90 days |

---

## Production Secret Management

Do **not** use `.env` files on production servers. Use a dedicated secrets manager:

| Option | Best for |
|---|---|
| **Doppler** | Simple teams, syncs to Railway/Render/Vercel |
| **AWS Secrets Manager** | AWS-hosted deployments |
| **HashiCorp Vault** | Self-hosted, enterprise |
| **Railway / Render / Vercel** | Built-in secret managers for those platforms |

### Example: Doppler setup
```bash
npm install -g doppler
doppler setup          # connect repo to Doppler project
doppler run -- npm start   # injects secrets at runtime
```

---

## Firebase Client Keys (Frontend)

The `VITE_FIREBASE_*` variables in `frontend/.env` are **client-side identifiers**,
not secrets. They are embedded in the browser bundle and visible to anyone who
opens DevTools. This is by design — Firebase Security Rules and server-side
token verification (`firebase-admin`) provide the actual security layer.

However, they should still be rotated if the Firebase project is compromised.

---

## Detecting Accidental Secret Leaks

### Install gitleaks
```bash
# macOS
brew install gitleaks

# Windows (via scoop)
scoop install gitleaks

# Direct download
# https://github.com/gitleaks/gitleaks/releases
```

### Scan the repository
```bash
gitleaks detect --source . --verbose
```

### Add as a pre-commit hook
```bash
# Install pre-commit
pip install pre-commit

# Create .pre-commit-config.yaml
cat > .pre-commit-config.yaml << 'EOF'
repos:
  - repo: https://github.com/gitleaks/gitleaks
    rev: v8.18.0
    hooks:
      - id: gitleaks
EOF

pre-commit install
```

---

## Git History

The `.env` files in this repository were **never committed** to git history.
This was verified with:
```bash
git log --all --oneline --diff-filter=A -- backend/.env frontend/.env
# (no output = never tracked)
```

The `frontend/dist/` build output was previously tracked and has been removed.
If you need to completely purge any sensitive file from git history, use:

```bash
# Install git-filter-repo (safer than git filter-branch)
pip install git-filter-repo

# Remove a file from all history
git filter-repo --path path/to/secret/file --invert-paths

# Force-push all branches (coordinate with team first)
git push origin --force --all
git push origin --force --tags
```

> ⚠️ History rewriting is destructive and requires all collaborators to re-clone.
> Treat the old credentials as compromised regardless and rotate them.

---

## Incident Response: If a Secret Is Leaked

1. **Rotate immediately** — don't wait to assess impact
2. Revoke/regenerate each affected credential:
   - Supabase: Settings → Database → Reset database password
   - Supabase service key: Settings → API → Regenerate
   - Firebase: Console → Service Accounts → Delete key, generate new
   - Brevo: SMTP & API → Regenerate SMTP key
   - HuggingFace: Settings → Tokens → Revoke + create new
   - JWT secrets: Change values + restart server (invalidates all active sessions)
3. Review access logs for unauthorized use
4. Remove the file from git history (see above)
5. Notify affected users if data was accessed
