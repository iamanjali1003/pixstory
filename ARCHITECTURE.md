# pixStory — Architecture & AWS Services

A short explanation of how pixStory is built and which AWS services it uses.

---

## Overview

pixStory is a shared photo gallery. People sign up, upload photos tagged with a
caption, location, and activity, and browse a public feed where they can search,
like, and comment. It is a two-part application:

- **Frontend** — a React single-page app (Vite + TypeScript), hosted on **AWS Amplify Hosting**.
- **Backend** — an Express REST API (Node.js + TypeScript), hosted on **AWS Elastic Beanstalk**.

Photos live in **Amazon S3** and are delivered through **Amazon CloudFront**.
Everything else — accounts, photo metadata, likes, comments — lives in **MongoDB Atlas**.

---

## Diagram

```
                       ┌─────────────────────────┐
                       │  React SPA (Vite)        │
                       │  AWS Amplify Hosting     │
                       └───────────┬─────────────┘
                                   │  HTTPS, JWT in Authorization header
                                   ▼
                       ┌─────────────────────────┐
                       │  Express API             │
                       │  AWS Elastic Beanstalk   │
                       └──┬───────────────────┬───┘
       presigned PUT URL  │                   │  Mongoose driver
       (upload) + key      │                   │
                          ▼                   ▼
                 ┌──────────────────┐  ┌──────────────────────┐
                 │  Amazon S3       │  │  MongoDB Atlas        │
                 │  (private bucket)│  │  users · memories     │
                 └────────┬─────────┘  └──────────────────────┘
                          │  Origin Access Control (private read)
                          ▼
                 ┌──────────────────┐
                 │  Amazon CloudFront│ ◄── browser loads images from the CDN
                 └──────────────────┘
```

---

## Key design decision — images never pass through the server

The Express server never receives or proxies image bytes. Instead:

**Upload**
1. Browser asks the API for an upload slot: `POST /api/memories/upload-url`.
2. The API returns a **short-lived presigned S3 PUT URL** (valid 5 minutes) scoped to a
   key under the user's own prefix (`memories/<userId>/<uuid>.<ext>`).
3. The browser uploads the file **directly to S3** using that URL.
4. The browser then saves the metadata: `POST /api/memories` with the `s3Key`, caption,
   location, and activity. The API verifies the key belongs to that user before storing it.

**View**
- The S3 bucket is **private** (all public access blocked). CloudFront reads it through
  an **Origin Access Control**, and the browser loads every image from the CloudFront CDN
  URL (`https://<distribution>.cloudfront.net/<s3Key>`).

This keeps the backend small and cheap (no large uploads through it), keeps the bucket
locked down, and serves images fast from edge caches.

---

## AWS services used

| Service | Role in pixStory | Why this service |
|---|---|---|
| **Amazon S3** | Stores the uploaded image files | Durable, cheap object storage built for binary blobs; supports presigned URLs for direct browser uploads |
| **Amazon CloudFront** | Serves images to the browser via a global CDN | Caches images at edge locations for fast loads, and lets the S3 bucket stay fully private via Origin Access Control |
| **AWS Elastic Beanstalk** | Hosts the Express API | One-command deploy of a Node.js app; manages the EC2 instance, load balancer, and logs |
| **AWS Amplify Hosting** | Hosts the React SPA | Connects to GitHub and auto-builds/deploys on every push; serves the static bundle over HTTPS |
| **MongoDB Atlas** | Database for users and memories | Managed MongoDB (runs on AWS infrastructure); free tier, flexible document model that fits memories with embedded comments |

> IAM ties it together: a dedicated IAM user grants the backend only the S3 permissions it
> needs to sign upload URLs.

---

## Data model (MongoDB)

```
User
  _id, email (unique), passwordHash (bcrypt), name, timestamps

Memory
  _id, userId, userName, s3Key,
  caption, location, activity,
  likes: [userId],                       // a set, so a like toggles idempotently
  comments: [{ userId, userName, text, createdAt }],
  timestamps
```

A MongoDB **text index** across `caption`, `location`, and `activity` powers the search box.
Only the `s3Key` (a path string) is stored in MongoDB — never the image bytes.

---

## Authentication

Email + password. Passwords are hashed with **bcrypt**; the server never stores plaintext.
On signup/login the API returns a **JWT**, which the SPA stores in `localStorage` and sends
as `Authorization: Bearer <token>` on later requests. The public feed works without a token;
uploading, liking, and commenting require one.

---

## Scalability notes

- **Stateless API** — no session state on the server, so Elastic Beanstalk can run multiple
  instances behind its load balancer and scale horizontally.
- **Direct-to-S3 uploads** — image traffic never touches the API, so upload volume doesn't
  bottleneck the server.
- **CDN delivery** — CloudFront absorbs image read traffic at the edge, keeping load off S3
  and the API.
- **Managed database** — Atlas handles replication and backups; it can scale up tiers without
  app changes.

### Production hardening (next steps, out of scope for this build)
- Move the JWT from `localStorage` to an httpOnly cookie.
- Generate thumbnails with a Lambda + Sharp pipeline for even lighter image loads.
- Restrict MongoDB network access to the backend's VPC instead of allow-all.

---

## Repository

- `client/` — React SPA
- `server/` — Express API
- `README.md` — full setup and run instructions
- `SETUP.md` — step-by-step first-time walkthrough (local + AWS)
