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

Setup instructions will be added with the `[8B-10]` setup tasks.
