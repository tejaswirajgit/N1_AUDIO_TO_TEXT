# Deployment Checklist (Netlify + Render)

## 1) Backend on Render

- Connect repository to Render.
- Use `render.yaml` from repo root.
- Confirm service name: `amenity-booking-api`.
- Set secrets in Render dashboard:
  - `ADMIN_API_KEY`
  - `VOICE_BOOKING_API_KEY`
  - `SARVAM_API_KEY`
  - `DATABASE_URL`
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
- Optional override:
  - `CORS_ALLOW_ORIGINS=https://admin-amenity.netlify.app,https://user-amenity.netlify.app`
- Verify health:
  - `GET https://<render-domain>/health/live` returns 200.

## 2) Admin Frontend on Netlify

- Create Netlify site from this repo.
- Base directory: `frontend/admin`
- Build command: `npm run build`
- Publish directory: leave default for Next.js plugin
- Required env vars:
  - `ADMIN_API_BASE_URL=https://<render-domain>`
  - `ADMIN_API_KEY=<same as backend>`
  - `NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>`
- Custom site name target: `admin-amenity`

## 3) User Frontend on Netlify

- Create second Netlify site from same repo.
- Base directory: `frontend/user`
- Build command: `npm run build`
- Publish directory: leave default for Next.js plugin
- Required env vars:
  - `NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>`
  - `NEXT_PUBLIC_ADMIN_APP_URL=https://admin-amenity.netlify.app`
- Custom site name target: `user-amenity`

## 4) Post-deploy smoke tests

- Admin login works and redirects to dashboard.
- Admin settings save updates profile (`PUT /v1/admin/users/{id}`).
- User login works.
- Amenity listing and booking APIs respond from frontend.
- No CORS errors in browser console.

## 5) Monitoring (Sentry)

- Create Sentry projects for admin, user, and backend.
- Add DSN values as env vars in Netlify and Render.
- Verify one test error is captured.
