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
  src/screens/    Home, Game, Game over, Leaderboard
public/           Old web pages (placeholder, not used by the app)
  index.html      Home / login
  game.html       Game screen
  css/  js/
```
