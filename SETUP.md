# pixStory — Setup Guide

A step-by-step walkthrough for getting pixStory running on your computer and then on AWS. Follow each section in order. After every step there's a **"You should see"** checkpoint — if what you see matches, move on. If it doesn't, stop and fix that step before continuing.

The `README.md` is the quick reference. **This file is the slow, hand-holding version.** Use this one the first time.

> **Project vs. repo name** — the display name in the UI is **pixStory** (set in `client/src/lib/site.config.ts`). The repo, S3 bucket, Atlas cluster, and other identifiers stay lowercase **pixstory** because they're technical IDs. Both names refer to the same project.

---

## What you're building

Two things:

- A **backend** (`server/`) that runs on Node.js. Stores accounts and memories in MongoDB. Talks to AWS S3 to give upload URLs to the browser.
- A **frontend** (`client/`) that runs in the browser. A React app (shadcn/ui components, lucide icons, grayscale theme) where people sign up, upload photos, and browse the gallery.

They run as two separate processes during development. In production the backend lives on AWS Elastic Beanstalk and the frontend lives on AWS Amplify Hosting.

---

## Part 1 — Get it running on your laptop

You'll do this part **before** signing up for any cloud services. The goal is to confirm everything compiles and the dev servers start. We'll plug in real cloud credentials in Part 2.

### Step 1.1 — Install the tools

You need three things installed on your computer.

| Tool                | Check with                                        | Get it from         |
| ------------------- | ------------------------------------------------- | ------------------- |
| Node.js 22 or newer | `node --version` → should print `v22.x` or higher | https://nodejs.org  |
| npm 10 or newer     | `npm --version` → should print `10.x` or higher   | comes with Node.js  |
| Git                 | `git --version` → should print `git version 2.x`  | https://git-scm.com |

**You should see:** all three commands print version numbers without errors.

### Step 1.2 — Clone the repo

Open a terminal and run:

```bash
git clone https://github.com/iamanjali1003/pixstory.git
cd pixstory
ls
```

**You should see:** `client/`, `server/`, `README.md`, `SETUP.md`, `LICENSE`.

### Step 1.3 — Install backend dependencies

```bash
cd server
npm install
```

This downloads everything the backend needs. Takes about 20 seconds. Ignore the deprecation warnings — they're not bugs.

**You should see:** `added 173 packages` (the exact number may differ slightly) at the end.

### Step 1.4 — Install frontend dependencies

Open a **second terminal**, go to the project, and run:

```bash
cd pixstory/client
npm install
```

**You should see:** `added 88 packages` or similar.

### Step 1.5 — Try compiling the backend

Back in the **first terminal** (the one in `server/`):

```bash
npm run build
```

This runs the TypeScript compiler. If you see no errors, the code is healthy.

**You should see:** the command finishes with no red error text. The folder `server/dist/` now exists.

### Step 1.6 — Try compiling the frontend

In the **second terminal** (the one in `client/`):

```bash
npm run build
```

**You should see:** at the end, lines like:

```
dist/index.html                   0.66 kB
dist/assets/index-xxxxx.css      18.57 kB
dist/assets/index-xxxxx.js      292.04 kB
✓ built in <1 second>
```

If you get this far, the code is in good shape. Time to plug in real services.

---

## Part 2 — Sign up for the cloud services

You need accounts in two places: **MongoDB Atlas** (for the database) and **AWS** (for everything else). Both have free tiers that are enough for this project.

### Step 2.1 — MongoDB Atlas

1. Go to https://www.mongodb.com/cloud/atlas/register
2. Sign up with email
3. When asked, pick the **M0 Free** cluster tier
4. Cloud provider: AWS. Region: pick the one closest to you (e.g. `Mumbai (ap-south-1)` for India)
5. Cluster name: `pixstory-cluster`. Click **Create**

**You should see:** a green "Cluster ready" banner after 1–3 minutes.

#### Get the connection string

1. Click **Database** in the left menu → next to your cluster, click **Connect**
2. Choose **Drivers** → Driver: **Node.js**, Version: **6.x or later**
3. Copy the connection string. It looks like:
   ```
   mongodb+srv://USERNAME:<password>@pixstory-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
4. Replace `<password>` with the database password you set (you may need to create a database user under **Database Access** in the left menu — Atlas walks you through it)
5. Add the database name `pixstory` right before the `?`. The final string looks like:
   ```
   mongodb+srv://USERNAME:YOUR_PASSWORD@pixstory-cluster.xxxxx.mongodb.net/pixstory?retryWrites=true&w=majority
   ```

#### Allow your laptop to connect

1. Left menu → **Network Access**
2. **Add IP Address** → click **Allow access from anywhere** (`0.0.0.0/0`)

> This is convenient for development. For a real product you'd restrict it. It's fine here.

**You should see:** your network access list now shows `0.0.0.0/0 — Active`.

### Step 2.2 — AWS account

1. Go to https://aws.amazon.com → **Create an AWS Account**
2. Sign up. You'll need a credit card, but everything we use here is in the free tier
3. Choose **Basic Support — Free**

**You should see:** the AWS Management Console homepage at `https://console.aws.amazon.com`.

#### Pick a region and stick with it

In the top-right corner of the AWS console, pick a region (e.g. `Mumbai (ap-south-1)`) and **don't change it for the rest of this guide**. Every AWS resource we create has to live in the same region.

### Step 2.3 — Create the S3 bucket (image storage)

1. In the AWS console search bar, type **S3** → open it
2. Click **Create bucket**
3. **Bucket name**: `pixstory-uploads-<your-initials>` (bucket names must be globally unique, so add something to make it yours)
4. **Region**: same one you picked above
5. **Block all public access**: leave it **ON** (we'll use CloudFront instead of direct public access)
6. Everything else: defaults. Click **Create bucket**

**You should see:** your new bucket in the S3 buckets list.

#### Add the CORS rule (so the browser can upload directly)

1. Click your bucket → **Permissions** tab → scroll to **Cross-origin resource sharing (CORS)** → **Edit**
2. Paste this and **Save**:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["PUT"],
    "AllowedOrigins": ["http://localhost:5173"],
    "ExposeHeaders": []
  }
]
```

> We'll add the Amplify URL to `AllowedOrigins` after we deploy the frontend.

### Step 2.4 — Create an IAM user (so the backend can talk to S3)

1. AWS console search → **IAM** → **Users** → **Create user**
2. **User name**: `pixstory-backend`
3. **Permissions** → **Attach policies directly** → search and check **AmazonS3FullAccess**
4. **Create user**

#### Create access keys

1. Click the new user → **Security credentials** tab → **Create access key**
2. Use case: **Application running outside AWS**
3. **Create access key** → **download the .csv** and keep it safe
4. You'll have an **Access key ID** (starts with `AKIA…`) and a **Secret access key** (long random string)

### Step 2.5 — Create the CloudFront distribution (image delivery)

CloudFront serves the images to the browser while the S3 bucket stays private. The
backend requires this — image URLs point at the CloudFront domain.

1. AWS console search → **CloudFront** → **Create distribution**
2. **Distribution name**: `pixstory-cdn`. **Distribution type**: Single website or app. Skip the optional domain. **Next**.
3. **Origin type**: Amazon S3. **Origin**: Browse S3 and pick your bucket.
4. **Allow private S3 bucket access to CloudFront**: choose the **Recommended** option — this updates the bucket policy for you automatically, so there is nothing to copy and paste.
5. **Origin settings** and **Cache settings**: use the recommended options for S3.
6. **WAF / security**: do not enable (keeps it free).
7. Click **Create distribution**.

Wait 5–15 minutes for CloudFront to deploy.

**You should see:** on the distribution page, the **Last modified** field change from
**Deploying** to a timestamp. Note the **Distribution domain name** — it looks like
`dXXXXXXXX.cloudfront.net`. That value goes into `CLOUDFRONT_DOMAIN` in the backend `.env`.

---

## Part 3 — Connect the local app to the real services

Now we plug the credentials from Part 2 into the project.

### Step 3.1 — Backend `.env`

In the `server/` folder:

```bash
cp .env.example .env
```

Open `server/.env` in your editor and fill in:

```
PORT=4000
NODE_ENV=development

MONGODB_URI=<the connection string from Step 2.1>

JWT_SECRET=<run "openssl rand -hex 32" in a terminal and paste the result>
JWT_EXPIRES_IN=7d

AWS_REGION=ap-south-1                      # whatever region you picked
AWS_ACCESS_KEY_ID=<from Step 2.4>
AWS_SECRET_ACCESS_KEY=<from Step 2.4>
S3_BUCKET=pixstory-uploads-<your-initials>
CLOUDFRONT_DOMAIN=dXXXXXXXX.cloudfront.net  # no https:// in front

CORS_ORIGINS=http://localhost:5173
```

### Step 3.2 — Frontend `.env.local`

In the `client/` folder:

```bash
cp .env.example .env.local
```

The default value already points at `http://localhost:4000`, so no edits needed.

### Step 3.3 — Start both servers

**Terminal 1 (backend):**

```bash
cd server
npm run dev
```

**You should see:**

```
[db] connected to MongoDB
[pixstory] server listening on http://localhost:4000
```

If you see `Missing required environment variable: ...`, the `.env` file is incomplete — go back to Step 3.1.

If you see `MongoServerError: bad auth` or similar, the MongoDB URI or password is wrong.

**Terminal 2 (frontend):**

```bash
cd client
npm run dev
```

**You should see:**

```
  VITE v6.x.x  ready in xxx ms
  ➜  Local:   http://localhost:5173/
```

### Step 3.4 — Test the full flow in your browser

1. Open http://localhost:5173 — you should see the **Gallery** page with the "No memories yet" empty state
2. Click **Sign up**, create an account with any email/password
3. After signing up you land back on the gallery, now logged in
4. Click **Upload**, pick an image, add a caption like "test", click **Share memory**
5. The image uploads, you land on the gallery, the image appears

**You should see:** your uploaded photo in the gallery, with your name and the caption.

**Verify the image is being served from CloudFront** (this proves the CDN bonus works):

1. Right-click the image in the gallery → **Inspect**
2. Look at the `<img src="…">` attribute
3. It should be `https://dXXXXXXXX.cloudfront.net/memories/…` — **not** `s3.amazonaws.com`

If you see this, **everything works locally**. Time to deploy.

---

## Part 4 — Deploy to AWS

We'll deploy the backend first (Elastic Beanstalk), then the frontend (Amplify Hosting).

### Step 4.1 — Install the AWS CLI and EB CLI

```bash
# AWS CLI (one-time install)
brew install awscli            # on Mac
# or follow https://aws.amazon.com/cli/ for Windows/Linux

# EB CLI (one-time install)
brew install aws-elasticbeanstalk-cli   # on Mac
# or: pipx install awsebcli
```

Configure the AWS CLI with the same credentials from Step 2.4:

```bash
aws configure
```

It asks for:

- AWS Access Key ID — paste it
- AWS Secret Access Key — paste it
- Default region — type the region you picked
- Default output format — press Enter

### Step 4.2 — Deploy the backend to Elastic Beanstalk

From inside the `server/` folder:

```bash
npm run build
eb init pixstory --platform "Node.js 22" --region ap-south-1
```

When `eb init` asks "Do you want to set up SSH?" — answer **n** (you don't need it).

```bash
eb create pixstory-prod
```

This takes 5–10 minutes — EB creates an EC2 instance, a load balancer, security groups, and deploys your code.

**You should see** at the end: `Application available at <some-url>.elasticbeanstalk.com`.

#### Set the environment variables on EB

```bash
eb setenv \
  MONGODB_URI="<same as local>" \
  JWT_SECRET="<same as local>" \
  AWS_REGION="ap-south-1" \
  AWS_ACCESS_KEY_ID="<same as local>" \
  AWS_SECRET_ACCESS_KEY="<same as local>" \
  S3_BUCKET="<same as local>" \
  CLOUDFRONT_DOMAIN="<same as local>" \
  CORS_ORIGINS="http://localhost:5173"
```

(We'll add the Amplify URL to `CORS_ORIGINS` once we have it.)

**Confirm it's alive:**

```bash
curl https://<your-eb-url>.elasticbeanstalk.com/health
```

**You should see:** `{"ok":true,"env":"production"}`.

### Step 4.3 — Deploy the frontend to AWS Amplify Hosting

1. AWS console → search **Amplify** → **Host web app**
2. Choose **GitHub** → authorize Amplify
3. Pick the **iamanjali1003/pixstory** repo, branch **main**
4. **Monorepo settings**: turn ON, set **App root** to `client`
5. Amplify auto-detects Vite. Build settings will be:
   ```yaml
   frontend:
     phases:
       preBuild:
         commands:
           - npm ci
       build:
         commands:
           - npm run build
     artifacts:
       baseDirectory: dist
       files:
         - "**/*"
   ```
6. **Environment variables**: add one:
   - Key: `VITE_API_URL`
   - Value: `https://<your-eb-url>.elasticbeanstalk.com` (from Step 4.2)
7. **Save and deploy**

Takes 3–5 minutes for the first build.

**You should see:** the Amplify console showing **Provision → Build → Deploy → Verify** all green, plus a URL like `https://main.dXXXXXXX.amplifyapp.com`.

### Step 4.4 — Wire up CORS so the deployed frontend can talk to everything

Two things to update with the Amplify URL:

**A. Backend `CORS_ORIGINS` on Elastic Beanstalk:**

```bash
eb setenv CORS_ORIGINS="http://localhost:5173,https://main.dXXXXXXX.amplifyapp.com"
```

**B. S3 bucket CORS rule:**

Go to S3 → your bucket → **Permissions** → **CORS** → **Edit**. Add the Amplify URL to `AllowedOrigins`:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["PUT"],
    "AllowedOrigins": [
      "http://localhost:5173",
      "https://main.dXXXXXXX.amplifyapp.com"
    ],
    "ExposeHeaders": []
  }
]
```

### Step 4.5 — Final test on the live site

1. Open `https://main.dXXXXXXX.amplifyapp.com` (the Amplify URL)
2. Sign up, upload a photo, like it, comment on it
3. Same checkpoint as Step 3.4 — image src should be `cloudfront.net`

**You should see:** the entire flow works end-to-end on the deployed site.

---

## Submission checklist

Before sharing the project:

- [ ] **GitHub repo** at `github.com/iamanjali1003/pixstory` is public and pushed up to date
- [ ] **README.md** at the repo root reads well
- [ ] **Amplify URL** loads the gallery in under 3 seconds
- [ ] On Amplify, you can **sign up → upload → see image on gallery**
- [ ] In DevTools → Network, image `<img>` requests go to **cloudfront.net** (not s3.amazonaws.com)
- [ ] **Search** filters the gallery (type a caption fragment in the search box)
- [ ] **Like** button toggles on/off after login
- [ ] **Comment** form posts a comment that appears immediately
- [ ] **Backend health check** at `https://<eb-url>/health` returns `{"ok":true}`
- [ ] Upload at least one demo photo so reviewers see something on first load

---

## Common problems and fixes

| Problem                                                                | Likely cause                                                             | Fix                                                                      |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------ |
| Backend won't start, says `Missing required environment variable: ...` | The `.env` file isn't complete                                           | Re-check Step 3.1                                                        |
| `MongoServerError: bad auth`                                           | Wrong password in `MONGODB_URI`, or you forgot to create a database user | Atlas → **Database Access** → create user, paste password into the URI   |
| Backend starts but can't connect: `serverSelectionTimeout`             | Your IP isn't allowlisted in Atlas                                       | Atlas → **Network Access** → Add `0.0.0.0/0`                             |
| Image upload fails with `SignatureDoesNotMatch`                        | The browser sent a different `Content-Type` than the one we signed       | The code already handles this — if it happens, hard-refresh the browser  |
| Image upload fails with `CORS error` in browser console                | S3 bucket CORS rule doesn't include your origin                          | Step 2.3 (for local) or Step 4.4 (for Amplify)                           |
| Gallery loads but images are broken                                    | CloudFront isn't done deploying, or bucket policy wasn't pasted          | Wait 5 more minutes; re-paste the CloudFront-generated bucket policy     |
| `eb deploy` fails with `Procfile is missing`                           | Building from the wrong folder                                           | Run `eb deploy` from inside `server/`, not the repo root                 |
| Amplify build fails on `npm ci`                                        | Monorepo app root not set to `client`                                    | Amplify → App settings → Build settings → set base directory to `client` |
| Live site shows "Network error" on signup                              | Backend CORS doesn't include the Amplify URL                             | Step 4.4-A                                                               |

---

## Customizing the brand later

If you ever want to rename the project, change the tagline, swap the logo icon, or recolor the app — **don't grep the whole codebase**. All brand and theme values live in two files:

| To change…                                                 | Edit this file                                                                                      |
| ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Project name (navbar, footer, browser tab, link previews)  | `client/src/lib/site.config.ts` → `SITE.name`                                                       |
| Tagline / description                                      | `client/src/lib/site.config.ts` → `SITE.tagline`, `SITE.description`                                |
| Logo icon (pick any from [lucide.dev](https://lucide.dev)) | `client/src/lib/site.config.ts` → `SITE.logoIcon` (also import the new icon at the top of the file) |
| OG share image URL                                         | `client/src/lib/site.config.ts` → `SITE.ogImage`                                                    |
| GitHub repo URL                                            | `client/src/lib/site.config.ts` → `SITE.github`                                                     |
| Color palette (everything)                                 | `client/src/index.css` → the `:root { --background: ...; ... }` block (uses oklch values)           |
| Favicon                                                    | `client/public/favicon.svg`                                                                         |
| Static `<title>` shown before React mounts                 | `client/index.html`                                                                                 |

The repo name, S3 bucket name, MongoDB cluster name, and Elastic Beanstalk environment name are **identifiers** — they stay as-is even if you rename the display name. No need to rename your AWS resources just because the UI label changed.

---

## Where things live (so you can find them again)

| What                 | Where                                                   |
| -------------------- | ------------------------------------------------------- |
| Source code          | this Git repo                                           |
| Database             | MongoDB Atlas → cluster `pixstory-cluster`              |
| Uploaded images      | AWS S3 → bucket `pixstory-uploads-...`                  |
| Image delivery (CDN) | AWS CloudFront → distribution `dXXXXXXX.cloudfront.net` |
| Backend server       | AWS Elastic Beanstalk → environment `pixstory-prod`     |
| Frontend website     | AWS Amplify Hosting → app `pixstory`                    |
| Backend logs         | EB console → Logs → Request Logs → Last 100 Lines       |
| Frontend build logs  | Amplify console → your app → the build that just ran    |

That's the whole map.
