# 🎬 CineStream — Full-Stack Movies App

Full-stack movie streaming platform with React frontend, Python FastAPI backend, and fully automated AWS deployment via GitHub Actions.

## Architecture

```
GitHub push to main
        │
        ▼
┌─────────────────────────────────────────────────────────┐
│                   GitHub Actions CI/CD                   │
│                                                         │
│  Job 1: Provision AWS (idempotent)                      │
│    ├─ S3 upload bucket (private, encrypted, versioned)  │
│    ├─ S3 static bucket (private, encrypted)             │
│    ├─ IAM Role → EC2 (S3 + SSM access, no static keys) │
│    ├─ CloudFront distribution (OAC → S3)                │
│    ├─ Security group (ports 22, 80, 8000, 443)          │
│    └─ EC2 t2.medium (Amazon Linux 2023)                 │
│                                                         │
│  Job 2: Deploy Backend (SSM, no SSH keys)               │
│    ├─ Stage files to S3                                 │
│    ├─ Pull & install on EC2 via SSM RunShellScript      │
│    └─ Restart systemd service                           │
│                                                         │
│  Job 3: Build & Deploy Frontend                         │
│    ├─ npm ci + npm run build (env vars injected)        │
│    ├─ aws s3 sync (hashed assets: 1yr cache)            │
│    └─ CloudFront cache invalidation                     │
│                                                         │
│  Job 4: Smoke Test                                      │
│    ├─ GET /          → HTTP 200                         │
│    └─ GET /movies    → valid JSON                       │
│                                                         │
│  Job 5: Summary (always runs)                           │
└─────────────────────────────────────────────────────────┘
```

## 📁 Repository Structure

```
cinestream/
├── .github/
│   └── workflows/
│       └── deploy.yml          ← Full CI/CD pipeline
├── backend/
│   ├── main.py                 ← FastAPI app
│   ├── requirements.txt
│   └── movies-backend.service  ← systemd unit file
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── App.js
│   │   ├── index.js
│   │   ├── index.css
│   │   ├── components/
│   │   │   ├── Navbar.js
│   │   │   └── MovieCard.js
│   │   ├── pages/
│   │   │   ├── Home.js
│   │   │   ├── MovieDetail.js
│   │   │   └── Upload.js
│   │   └── utils/
│   │       └── api.js
│   └── package.json
└── README.md
```

## 🚀 One-Time Setup

### 1 — GitHub Secrets

Go to **Settings → Secrets → Actions** in your repo and add:

| Secret | Value |
|--------|-------|
| `AWS_ACCESS_KEY_ID` | Your IAM user access key |
| `AWS_SECRET_ACCESS_KEY` | Your IAM user secret key |

### 2 — IAM Permissions for the GitHub Actions user

Attach this inline policy to the IAM user whose keys you added above:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:*",
        "ec2:*",
        "cloudfront:*",
        "iam:CreateRole",
        "iam:GetRole",
        "iam:AttachRolePolicy",
        "iam:CreateInstanceProfile",
        "iam:GetInstanceProfile",
        "iam:AddRoleToInstanceProfile",
        "ssm:GetParameter",
        "ssm:SendCommand",
        "ssm:GetCommandInvocation",
        "ssm:DescribeInstanceInformation",
        "sts:GetCallerIdentity"
      ],
      "Resource": "*"
    }
  ]
}
```

### 3 — Push & go

```bash
git add .
git commit -m "feat: initial deploy"
git push origin main
```

GitHub Actions picks it up automatically. The full deploy takes ~5–8 minutes on first run (EC2 launch + user-data + SSM) and ~2–3 minutes on subsequent pushes.

---

## 🔄 How Each Job Works

### Job 1 — Provision Infrastructure (idempotent)

Every step checks whether the resource already exists before creating it, so re-runs never fail or duplicate resources.

| Resource | Details |
|----------|---------|
| S3 upload bucket | Private, AES-256, versioned, CORS for pre-signed PUTs |
| S3 static bucket | Private, AES-256, versioned |
| IAM EC2 role | `AmazonS3FullAccess` + `AmazonSSMManagedInstanceCore` |
| CloudFront | OAC (v4 sig), HTTPS-only, PriceClass_100, S3 bucket policy auto-applied |
| Security group | TCP 22, 80, 443, 8000 open to 0.0.0.0/0 |
| EC2 | `t2.medium`, AL2023, IMDSv2, 20 GB gp3 encrypted, SSM agent installed |

### Job 2 — Deploy Backend (no SSH required)

1. Backend files (`main.py`, `requirements.txt`, `movies-backend.service`) are uploaded to `s3://<upload-bucket>/deploy/`
2. Polls until SSM agent is online (up to 6 min, 15s intervals)
3. SSM `AWS-RunShellScript` pulls files from S3, installs deps, writes `/etc/movies-backend.env`, patches the systemd unit, and restarts the service
4. Polls the SSM command until `Success` or fails with logs

### Job 3 — Deploy Frontend

1. `npm ci` + `npm run build` with `REACT_APP_API_URL` and `REACT_APP_CDN_URL` injected from infra outputs
2. Hashed static assets → `max-age=31536000,immutable`
3. `index.html` → `no-cache` (SPA routing)
4. CloudFront `/*` invalidation

### Job 4 — Smoke Test

Hits `GET /` and `GET /movies` on the backend. Advisory — won't fail the pipeline but logs HTTP status.

### Job 5 — Summary

Always runs, prints a Markdown table of endpoints and job results to the GitHub Actions job summary page.

---

## 🌐 Live Endpoints (after deploy)

| Service | URL |
|---------|-----|
| Backend API | `http://<EC2-IP>:8000` |
| Interactive API docs | `http://<EC2-IP>:8000/docs` |
| Video CDN | `https://<cf-domain>/videos/<key>` |
| Frontend (static) | Upload bucket serves via CloudFront |

---

## 📡 API Reference

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | Health check |
| `GET` | `/categories` | List movie categories |
| `GET` | `/movies` | List movies — supports `?search=`, `?category=`, `?page=`, `?limit=` |
| `GET` | `/movies/{id}` | Get single movie |
| `POST` | `/movies/upload` | Upload video + optional thumbnail |
| `POST` | `/movies/{id}/rate` | Submit rating (1–5) |
| `POST` | `/movies/{id}/view` | Increment view count |
| `DELETE` | `/movies/{id}` | Delete movie + S3 objects |
| `GET` | `/presigned-upload` | Get pre-signed S3 PUT URL |

---

## 🔑 Required GitHub Secrets

| Secret | Description |
|--------|-------------|
| `AWS_ACCESS_KEY_ID` | IAM access key for GitHub Actions |
| `AWS_SECRET_ACCESS_KEY` | IAM secret key for GitHub Actions |

No SSH keys, no EC2 key-pairs, no `.pem` files — backend deploys run entirely over AWS SSM.
