# Qlue Web

React + TypeScript + Vite web client for Qlue v2 (ported from the Flutter app).
Talks to the existing Qlue backend (AWS API Gateway + WebSocket) and uses
Firebase Authentication for email/password and Google sign-in.

## Local development

```bash
npm install
cp .env.example .env   # then fill in real values
npm run dev            # http://localhost:5173
```

> Open the app at **http://localhost:5173**, not a LAN IP. Firebase Google
> sign-in only works on authorized, secure origins (`localhost` is allowed by
> default; a raw `http://<lan-ip>` is not).

## Scripts

- `npm run dev` — start the Vite dev server
- `npm run build` — type-check and build to `dist/`
- `npm run preview` — preview the production build locally
- `npm run lint` — type-check only (`tsc --noEmit`)

## Environment variables

All keys are prefixed `VITE_` and are **inlined into the public browser bundle**
at build time — do not put server secrets here. See [`.env.example`](.env.example).

| Variable | Description |
| --- | --- |
| `VITE_API_BASE_URL` | REST API base URL (API Gateway `.../prod`) |
| `VITE_WEBSOCKET_URL` | WebSocket URL (`wss://.../prod`) |
| `VITE_FIREBASE_API_KEY` | Firebase Web API key |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID |
| `VITE_FIREBASE_APP_ID` | Firebase app ID |
| `VITE_MESSAGING_SENDER_ID` | Firebase Cloud Messaging sender ID |
| `VITE_MEASUREMENT_ID` | Analytics measurement ID |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth client ID |

## Deploying to Vercel

1. Import this repository in Vercel. The framework preset is **Vite** and the
   defaults are correct (build `npm run build`, output `dist`).
2. Add every `VITE_*` variable above under **Settings → Environment Variables**.
3. Deploy, then add the resulting Vercel domain in **Firebase Console →
   Authentication → Settings → Authorized domains** so Google sign-in works.

`vercel.json` rewrites all routes to `index.html` so client-side routing
(`react-router`) survives page refreshes and deep links.
