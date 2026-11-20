# 8bitIQ

A mobile puzzle game (React Native / Expo): log in, start a timed run, play random mini-games, and climb the Top 10 leaderboard.

## Team workflow

- `main` is protected. Nobody pushes to it directly.
- Pick a card on the Trello board (8BitIQ v2) and create a branch named after it, for example `8B-10-express-server`:
  ```
  git switch main
  git pull
  git switch -c 8B-10-express-server
  ```
- Commit, push your branch, and open a pull request into `main`.
- When it's approved and merged, move your card into your own Done column.

## Getting started
Requires Node.js 18 or newer.

```
npm install
npm start
```

Then open http://localhost:3000. Set `PORT` to use another port. `npm run dev` restarts the server when files change. `npm test` runs the tests in `tests/`.

## Running the app on your phone
The app lives in `mobile/` and talks to the game server above.

1. Install **Expo Go** on your phone (Play Store / App Store).
2. Start the server in one terminal: `npm start` (from the repo root).
3. In a second terminal:
   ```
   cd mobile
   npm install
   npx expo start
   ```
4. Scan the QR code with Expo Go (Android) or the Camera app (iPhone).
   Your phone and laptop must be on the same Wi-Fi. If Windows asks to allow
   Node.js through the firewall, allow it on private networks.

The app finds the server automatically on your laptop (port 3000). To point it
at a deployed server instead, set `EXPO_PUBLIC_API_URL`, for example
`EXPO_PUBLIC_API_URL=https://8bitiq.onrender.com npx expo start`.

## Database (Supabase)
1. Create a free project on supabase.com.
2. Open the SQL Editor, paste `supabase-schema.sql` and run it once.
3. Copy `.env.example` to `.env` and fill in `SUPABASE_URL` and
   `SUPABASE_SERVICE_ROLE_KEY` (Project Settings > API). `.env` is ignored by
   Git. Never commit the service_role key or put it in the app.

Without `DATA_STORE=supabase` the server keeps everything in memory, which is
fine for trying things out but is wiped on every restart.

## Deploying the server (Render)
1. Sign in to render.com with GitHub and choose **New > Blueprint**.
2. Pick this repo. Render reads `render.yaml` and creates the `8bitiq` web service.
3. When asked, paste `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.
4. After the first deploy, open `https://<your-service>.onrender.com/api/health`.
   It should show `{"success":true,"message":"ok"}`.

The free plan sleeps after 15 minutes without traffic, so the first request
after a break takes up to a minute. Open the health URL before a demo.
If your service URL is not `https://8bitiq.onrender.com`, change
`EXPO_PUBLIC_API_URL` in `mobile/eas.json`.

## Installable build (Android APK)
1. Create a free account on expo.dev.
2. From `mobile/`:
   ```
   npx eas-cli@latest login
   npx eas-cli@latest build:configure   # first time only, links the project
   npx eas-cli@latest build --platform android --profile preview
   ```
3. When the build finishes, EAS gives a link and a QR code. Open it on an
   Android phone to download and install the APK. Share the same link with
   the class.

The `preview` profile points the app at the deployed server. iPhones can't
install an APK; use Expo Go on iPhone (`EXPO_PUBLIC_API_URL=https://8bitiq.onrender.com npx expo start`)
or an Apple developer account for an iOS build.

## Folder structure
```
backend/
  server.js       Express app, serves public/ and mounts /api
  routes/         API routes (index.js mounts the rest)
  controllers/    Request handlers
  services/       Game sessions, scoring, database access
  games/          Mini-game logic and answer checking
  middleware/     Error handling (every error is { success: false, message })
  utils/          Shared helpers: ApiError and request validation
mobile/           React Native / Expo app
  App.js          Screen switcher
  src/api.js      All calls to the game server
  src/screens/    Home, Game, Game over, Leaderboard, Profile, How to Play
  src/theme.js    Colors from the Figma file
  eas.json        Build profiles for installable builds (EAS)
render.yaml       Hosting setup for Render
.env.example      The settings the server needs (copy to .env)
supabase-schema.sql  Database tables, run once in Supabase
public/           Old web pages (placeholder, not used by the app)
  index.html      Home / login
  game.html       Game screen
  css/  js/
```
