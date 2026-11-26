# RecycleConnect API integration

The frontend and Express backend remain in separate repositories. Their API agreement is maintained in the [standalone API contract repository](https://github.com/hanifrico45/RecycleConnect-API-Contract).

## Local setup

Set `src/js/config/config.js` to the backend URL and (if using Google sign-in) the OAuth client ID. The app can also read `window.RECYCLECONNECT_API_URL` or the browser's `recycleconnect_api_url` local-storage value before falling back to `http://localhost:3000`:

```js
window.RECYCLECONNECT_CONFIG = {
  apiBaseUrl: "http://localhost:3000",
  googleClientId: "YOUR_GOOGLE_OAUTH_CLIENT_ID"
};
```

Start the API in the backend repository with `npm install` and `npm start`. Serve this frontend over HTTP(S), not by opening HTML files directly.

The backend uses PostgreSQL via `pg`; Supabase Postgres can be used by setting the backend's private `DATABASE_URL`. The API's email/password flow is backend-managed, not Supabase Auth. Signup also requires applying `migrations/20261125_password_auth.sql` to a database where the `users` table already exists.

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
- KYC and scale evidence use URLs; the backend has no file-upload/storage endpoint.
- Password reset is not implemented by the backend.
