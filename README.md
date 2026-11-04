# 8bitIQ

A web-based puzzle game: log in, start a timed run, play random mini-games, and climb the Top 10 leaderboard.

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

Then open http://localhost:3000. Set `PORT` to use another port. `npm run dev` restarts the server when files change.

## Folder structure
```
backend/
  server.js       Express app, serves public/ and mounts /api
  routes/         API routes (index.js mounts the rest)
  controllers/    Request handlers
  services/       Game sessions, scoring, database access
  games/          Mini-game logic and answer checking
public/
  index.html      Home / login
  game.html       Game screen
  css/  js/
```
