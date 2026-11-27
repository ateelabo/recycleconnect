# RecycleConnect API integration

The frontend and Express backend remain in separate repositories. Their API agreement is maintained in the [standalone API contract repository](https://github.com/hanifrico45/RecycleConnect-API-Contract).

## Local setup

The frontend defaults to the deployed Render API at `https://recycleconnect-api-2gmy.onrender.com`. For local development, set `src/js/config/config.js` to `http://localhost:3000`, or override it with `window.RECYCLECONNECT_API_URL`. The browser's `recycleconnect_api_url` local-storage override is honored only on localhost and 127.0.0.1.

```js
window.RECYCLECONNECT_CONFIG = {
  apiBaseUrl: "http://localhost:3000",
  googleClientId: "YOUR_GOOGLE_OAUTH_CLIENT_ID"
};
```

Start the API in the backend repository with `npm install` and `npm start`. Serve this frontend over HTTP(S), not by opening HTML files directly.

The backend uses PostgreSQL via `pg`; Supabase Postgres can be used by setting the backend's private `DATABASE_URL`. The API's email/password flow is backend-managed, not Supabase Auth. Signup also requires applying `migrations/20261125_password_auth.sql` to a database where the `users` table already exists.

Profile settings uploads JPEG, PNG, and WebP images up to 2 MB through the backend to a private Supabase Storage bucket. The backend needs `SUPABASE_URL` and `SUPABASE_SECRET_KEY` in its private environment; the key must never be added to this frontend repository. Apply `migrations/20261126_profile_avatar.sql` before enabling the upload in production; it creates the private `profile-avatars` bucket and adds the user's avatar-path column. The API returns one-hour signed image URLs.

## Connected screens

- Email/password signup and login; Google sign-in remains available when configured.
- Household onboarding, dashboard, pause/resume, one-off pickup, skip, pickup confirmation/dispute, profile, rates, and wallet history.
- Collector OTP, KYC submission, route status, and weighing workspace.
- Admin daily totals, material-rate editor, collector review, and dispute resolution.

`src/js/api.js` is the shared browser client and `src/js/integration.js` connects the pages to the API.

## Remaining service setup and limits

- Set `DATABASE_URL` in the ignored backend `.env`; do not put database credentials in this public frontend or commit them.
- Set `GOOGLE_CLIENT_ID` in the backend and `googleClientId` here if Google sign-in is needed. Email/password does not need it.
- Confirm the full schema and material-rate seed exist in Supabase. Only the `users` columns have been confirmed; the rest cannot be checked until database access is configured.
- OTP is a development-only fixed value (`123456`), not real phone verification.
- KYC and scale evidence still use URL references; the profile-avatar upload endpoint does not upload those files.
- Password reset is not implemented by the backend.
