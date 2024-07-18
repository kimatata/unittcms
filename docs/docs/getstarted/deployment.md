---
sidebar_position: 4
---

# Deployment

## Deploying to Vercel and Render

Deploy the frontend to Vercel and the backend to Render.

### Vercel Configuration

#### Environment Variables

| key                        | value                        |
| -------------------------- | ---------------------------- |
| NEXT_PUBLIC_BACKEND_ORIGIN | `your backend server origin` |

#### Settings

| Settings         | value      |
| ---------------- | ---------- |
| Root Directory   | `frontend` |
| Framework Preset | `Next.js`  |

### Render Configuration

#### Environment Variables

| key             | value                         |
| --------------- | ----------------------------- |
| FRONTEND_ORIGIN | `your frontend server origin` |

#### Settings

| Settings       | value                            |
| -------------- | -------------------------------- |
| Root Directory | `backend`                        |
| Build Command  | `npm install && npm run migrate` |
| Start Command  | `npm run start`                  |
