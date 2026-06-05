# pixStory — Architecture & AWS Services

A short, plain explanation of how pixStory is built, how it is deployed, and
which AWS services it uses.

**Live app:** http://Pixstory-env-1.eba-55bqi3ks.ap-south-1.elasticbeanstalk.com

---

## What pixStory is

A shared photo gallery. People sign up, upload photos tagged with a caption,
location, and activity, and browse a public feed where they can search, like,
and comment.

It is built as **one application with two halves**:

- A **React frontend** (the website you see in the browser).
- A **Node.js + Express backend** (the API that handles accounts, photos, likes,
  and comments).

Both halves are served from a **single server** on AWS — the Express backend
serves the built React files *and* answers the API calls. Photos are stored in
Amazon S3 and delivered through Amazon CloudFront. Accounts and photo details
live in MongoDB Atlas.

---

## Diagram

```
                         Browser
                            |
                            |  http (one address)
                            v
        ┌─────────────────────────────────────────┐
        │   AWS Elastic Beanstalk (one EC2 server) │
        │                                          │
        │   Express app:                           │
        │     • serves the React website (/)       │
        │     • answers the API   (/api/...)       │
        └───────────────┬───────────────┬─────────┘
        presigned upload │               │ Mongoose driver
                         v               v
                ┌──────────────┐  ┌──────────────────┐
                │  Amazon S3   │  │  MongoDB Atlas    │
                │ (private)    │  │  users · memories │
                └──────┬───────┘  └──────────────────┘
                       │ read via Origin Access Control
                       v
                ┌──────────────┐
                │  CloudFront  │  ── browser loads images from the CDN
                └──────────────┘
```

Because the website and the API come from the **same address**, there are no
cross-origin (CORS) problems and nothing to wire between two separate hosts.

---

## How a request flows

### Loading the site
1. Browser opens the Elastic Beanstalk URL.
2. Express returns the built React `index.html` and its JS/CSS files.
3. React starts up and asks the API for the feed: `GET /api/memories`.

### Uploading a photo (the photo never passes through the server)
1. Browser asks the API for an upload slot: `POST /api/memories/upload-url`.
2. The API returns a **short-lived presigned S3 URL** (valid 5 minutes), scoped
   to a path under that user only: `memories/<userId>/<random>.<ext>`.
3. The browser uploads the file **straight to S3** with that URL.
4. The browser saves the details: `POST /api/memories` with the S3 key, caption,
   location, and activity. The API checks the key belongs to that user, then
   stores the record in MongoDB.

### Showing a photo
- The S3 bucket is **private** (no public access). CloudFront reads it through an
  **Origin Access Control**, and the browser loads each image from the
  CloudFront address. Fast, cached at the edge, and the bucket stays locked down.

---

## AWS services used

| Service | What it does in pixStory | Why this service |
|---|---|---|
| **AWS Elastic Beanstalk** | Hosts the whole app (Express serves the React site + the API) on a single EC2 instance | Uploads a zip and handles the server, networking, and health checks for you — no manual server setup |
| **Amazon EC2** | The virtual machine that Elastic Beanstalk runs the app on | Managed automatically by Elastic Beanstalk (single `t3.micro`, free-tier) |
| **Amazon S3** | Stores the uploaded image files | Durable, cheap object storage; supports presigned URLs so the browser uploads directly |
| **Amazon CloudFront** | Delivers the images over a global CDN | Caches images near the user for fast loads, and lets the S3 bucket stay fully private |
| **AWS IAM** | A dedicated user gives the backend only the S3 permissions it needs | Least-privilege: the app can sign uploads but nothing more |
| **MongoDB Atlas** | Database for users and memories (managed MongoDB, runs on AWS) | Free tier, simple document model that fits memories with embedded comments |

---

## Data stored (MongoDB)

```
User
  email (unique), passwordHash (bcrypt), name, timestamps

Memory
  userId, userName, s3Key,
  caption, location, activity,
  likes:    [userId],                       a set, so a like toggles cleanly
  comments: [{ userId, userName, text, createdAt }],
  timestamps
```

A MongoDB **text index** across `caption`, `location`, and `activity` powers the
search box. Only the `s3Key` (a short path string) is stored — never the image
bytes themselves.

---

## Accounts and security

- Passwords are hashed with **bcrypt**; the server never stores plain passwords.
- Sign-in returns a **JWT** that the browser keeps and sends on later requests.
- Browsing the feed needs no account; uploading, liking, and commenting do.
- The S3 bucket is private; images are reachable only through CloudFront.
- AWS keys and the database connection string live in Elastic Beanstalk
  environment variables, never in the code or the Git repository.

---

## How it is deployed

1. The React app is built with Vite, configured to call the API on the **same
   address** it is served from.
2. The built files are copied into the backend (`server/public`).
3. The `server/` folder is zipped and uploaded to Elastic Beanstalk.
4. Elastic Beanstalk installs dependencies, compiles the TypeScript, and starts
   the server, which then serves both the website and the API.

Environment variables (database URL, JWT secret, AWS keys, S3 bucket, CloudFront
domain) are set in the Elastic Beanstalk console, so no secrets are ever in the
codebase.

---

## Scaling thoughts

- **Stateless backend** — no session is kept on the server, so Elastic Beanstalk
  could run several instances behind a load balancer if traffic grew.
- **Direct-to-S3 uploads** — image traffic never touches the server, so uploads
  don't slow it down.
- **CDN delivery** — CloudFront serves images from the edge, keeping load off the
  server and S3.
- **Managed database** — Atlas handles backups and replication and can scale up
  without code changes.

Possible next steps (not built here): HTTPS via a load balancer or CloudFront in
front of the app, image thumbnails via a Lambda + Sharp pipeline, and restricting
the database to the backend's network only.
