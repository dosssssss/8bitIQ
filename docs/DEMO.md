# 8bitIQ final demo (card 8B-15)

About 8 minutes. One person drives the phone (screen mirrored), one person talks.

## Before the demo
- [ ] Server is deployed and awake: open `https://8bitiq.onrender.com/api/health` 2 minutes before (the free plan sleeps).
- [ ] The APK from the `preview` build is installed on the demo phone, or Expo Go is ready with `EXPO_PUBLIC_API_URL` set.
- [ ] A demo account exists (for example `demo_player`) with 2 or 3 finished runs, so Profile and Leaderboard aren't empty.
- [ ] Phone mirroring works (scrcpy for Android, or a camera on the phone).
- [ ] Backup: a screen recording of one full run, in case the Wi-Fi fails.

## Script
| Time | Who | What to show | What to say |
|---|---|---|---|
| 0:00 | Speaker | Home screen | "8bitIQ: solve as many mini-games as you can before the 120-second timer runs out." Name the 5 members and their parts. |
| 0:45 | Driver | Help tab (How to Play) | The rules: +100 points and +5s for a win, -50 and -5s for a miss, streaks, Top 10. |
| 1:30 | Driver | Account tab: log in | Accounts are stored in Supabase; passwords are hashed, never saved as plain text. |
| 2:00 | Driver | PLAY: 2 or 3 mini-games | Point at the top bar: score, time, streak and the time bar. Get one answer wrong on purpose to show the penalty. |
| 4:00 | Driver | Wait for TIME IS UP! | The server owns the timer and saves the run; the app only shows the countdown. |
| 4:30 | Driver | Leaderboards | Global Top 10, ranked by games completed, then score, then date. Your rows show as "You". |
| 5:00 | Driver | Account tab | The player's own Top 10 and best numbers. |
| 5:30 | Speaker | Slides or GitHub | How we worked: Trello board, one branch per card, pull requests into `main`, tests run with `npm test`. |
| 6:30 | Speaker | Architecture | Expo app → Express API on Render → Supabase database. |
| 7:00 | All | Q&A | |

## Likely questions
- **Can players cheat by sending "success: true"?** Today the app reports the result. Moving answer checking to the server is in progress (PR #16, card 8B-11).
- **What happens if the server restarts mid-run?** Active runs are kept in memory, so that run is lost. Finished runs are already in the database.
- **Why Expo?** One codebase for Android and iPhone, and Expo Go lets everyone test on their own phone without building.
