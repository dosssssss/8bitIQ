import type { GameId } from "./shared/game.types";
import * as readline from "node:readline";
import {
  generateCountingChallenge,
  validateCountingAnswer,
} from "./modules/games/counting-circles/counting-circles";
import {
  generateCircleSortingChallenge,
  validateCircleSortingAnswer,
} from "./modules/games/circle-sorting/circle-sorting";
import {
  generateEmojiMatchChallenge,
  createEmojiMatchState,
  revealEmojiTile,
  hideEmojiMismatch,
} from "./modules/games/emoji-match/emoji-match";
import {
  generateQuickMathChallenge,
  validateMathAnswer,
} from "./modules/games/quick-math/quick-math";
import {
  generatePatternChallenge,
  createPatternGameState,
  submitPatternColor,
  type PatternColor,
} from "./modules/games/remember-pattern/remember-pattern";
import {
  startGameSession,
  submitGameResult,
  advanceSessionTime,
} from "./shared/game-session";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

let session = startGameSession();

const ask = (question: string): Promise<string> =>
  new Promise((resolve) => rl.question(question, resolve));

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function clear() {
  console.clear();
}

function header() {
  console.log("\n╔══════════════════════════════════════╗");
  console.log("║             8bitIQ ARCADE            ║");
  console.log("╚══════════════════════════════════════╝");
  console.log(`⏱ Time: ${session.score.remainingTime}s`);
  console.log(`🏆 Completed: ${session.score.completedGames}`);
  console.log(`🔥 Streak: ${session.score.currentStreak}`);
  console.log(`⭐ Best streak: ${session.score.bestStreak}\n`);
}

let lastTimerUpdate = Date.now();

function syncTimer() {
  const now = Date.now();
  const elapsed = Math.floor((now - lastTimerUpdate) / 1000);

  if (elapsed > 0) {
    session = advanceSessionTime(session, elapsed);
    lastTimerUpdate += elapsed * 1000;
  }
}

function result(correct: boolean, gameId: GameId) {
  syncTimer();

  if (!session.isActive) {
    console.log("\\n⏰ TIME'S UP!");
    return;
  }

  session = submitGameResult(session, gameId, correct);

  console.log(correct ? "\\n🎉 CORRECT! +8 seconds" : "\\n❌ WRONG! -8 seconds");
  console.log(`⏱ Remaining time: ${session.score.remainingTime}s`);
  console.log(`🏆 Completed games: ${session.score.completedGames}`);
  console.log(`🔥 Current streak: ${session.score.currentStreak}`);
}

async function countingCircles() {
  const challenge = generateCountingChallenge();

  console.log("\n🔵 COUNTING CIRCLES\n");
  console.log(("🔵 ").repeat(challenge.circleCount));
  console.log("\nHow many circles are there?");
  console.log(challenge.choices.join("   "));

  const answer = Number(await ask("\nYour answer: "));
  result(validateCountingAnswer(challenge, answer), "counting-circles");
}

async function circleSorting() {
  const challenge = generateCircleSortingChallenge();

  console.log("\n⚪ CIRCLE SORTING\n");
  console.log("Arrange these numbers in " + challenge.direction + " order:");
  console.log(challenge.circles.join("   "));

  const answer = (await ask("\nEnter numbers separated by spaces: "))
    .trim()
    .split(/\s+/)
    .map(Number);

  result(validateCircleSortingAnswer(challenge, answer), "circle-sorting");
}

async function emojiMatch() {
  const challenge = generateEmojiMatchChallenge();
  let state = createEmojiMatchState(challenge);

  console.log("\n🧠 EMOJI MATCH — FIND ALL 8 PAIRS!");

  while (state.status !== "completed") {
    console.log(`\nPairs found: ${state.matchedPairs}/8 | Attempts: ${state.attempts}\n`);

    for (let row = 0; row < 4; row++) {
      const cells = state.tiles.slice(row * 4, row * 4 + 4);
      console.log(cells.map(tile =>
        `${String(tile.id + 1).padStart(2, "0")}:${
          tile.isFaceUp || tile.isMatched ? tile.emoji : "⬛"
        }`
      ).join("   "));
    }

    let firstId = -1;

    while (firstId < 0) {
      const choice = Number(await ask("\nChoose your first tile (1-16): "));
      const tile = state.tiles.find(item => item.id === choice - 1);

      if (tile && !tile.isMatched && !tile.isFaceUp) {
        firstId = tile.id;
      } else {
        console.log("Invalid tile. Choose a hidden tile.");
      }
    }

    state = revealEmojiTile(state, firstId);

    let secondId = -1;

    while (secondId < 0) {
      const choice = Number(await ask("Choose your second tile (1-16): "));
      const tile = state.tiles.find(item => item.id === choice - 1);

      if (tile && !tile.isMatched && !tile.isFaceUp) {
        secondId = tile.id;
      } else {
        console.log("Invalid tile. Choose a different hidden tile.");
      }
    }

    state = revealEmojiTile(state, secondId);

    const first = state.tiles.find(tile => tile.id === firstId)!;
    const second = state.tiles.find(tile => tile.id === secondId)!;

    console.log("\nYour selections:");
    console.log(`${firstId + 1}: ${first.emoji}`);
    console.log(`${secondId + 1}: ${second.emoji}`);

    if (first.emoji === second.emoji) {
      console.log("🎉 MATCH! Pair found!");
    } else {
      console.log("❌ No match!");
      await ask("Press ENTER to flip the tiles back...");
      state = hideEmojiMismatch(state);
    }

    if (state.status !== "completed") {
      await ask("\nPress ENTER for the next turn...");
      clear();
    }
  }

  console.log("\n🏆 YOU FOUND ALL 8 PAIRS!");
  console.log(`Total attempts: ${state.attempts}`);
  result(true, "emoji-match");
}

async function quickMath() {
  const challenge = generateQuickMathChallenge();

  console.log("\n➗ QUICK MATH\n");
  console.log(
    `${challenge.firstNumber} ${challenge.operator} ${challenge.secondNumber} = ?`,
  );
  console.log("\nChoices: " + challenge.choices.join("   "));

  const answer = Number(await ask("\nYour answer: "));
  result(validateMathAnswer(challenge, answer), "quick-math");
}

async function rememberPattern() {
  const challenge = generatePatternChallenge();
  let state = createPatternGameState();

  console.log("\n🌈 REMEMBER THE PATTERN");
  console.log("Memorize the colors!\n");

  for (const color of challenge.sequence) {
    console.log(`      ${color.toUpperCase()}`);
    await sleep(800);
    clear();
  }

  console.log("Now repeat the sequence one color at a time!");
  console.log("Available colors: red, blue, green, yellow\n");

  while (state.status === "playing") {
    const answer = (await ask(
      `Color ${state.currentIndex + 1}/${challenge.sequence.length}: `
    )).trim().toLowerCase() as PatternColor;

    if (!["red", "blue", "green", "yellow"].includes(answer)) {
      console.log("Invalid color. Try red, blue, green, or yellow.");
      continue;
    }

    state = submitPatternColor(challenge, state, answer);

    if (state.status === "failed") {
      console.log("\n❌ Incorrect! The pattern was broken.");
    } else if (state.status === "playing") {
      console.log("✅ Correct! Keep going.");
    }
  }

  if (state.status === "completed") {
    console.log("\n🎉 PERFECT MEMORY! You repeated the whole sequence!");
  }

  result(state.status === "completed", "remember-pattern");
}

async function main() {
  while (session.isActive) {
    syncTimer();
    if (!session.isActive) break;
    clear();
    header();

    console.log("SELECT A GAME:\n");
    console.log("1. 🔵 Counting Circles");
    console.log("2. ⚪ Circle Sorting");
    console.log("3. 🧠 Emoji Match");
    console.log("4. ➗ Quick Math");
    console.log("5. 🌈 Remember the Pattern");
    console.log("0. Exit Arcade");

    const choice = await ask("\nChoose a game: ");

    if (choice === "0") break;

    clear();
    header();

    switch (choice) {
      case "1": await countingCircles(); break;
      case "2": await circleSorting(); break;
      case "3": await emojiMatch(); break;
      case "4": await quickMath(); break;
      case "5": await rememberPattern(); break;
      default:
        console.log("Invalid choice!");
        continue;
    }

    if (session.isActive) {
      await ask("\nPress ENTER to return to the arcade...");
    }
  }

  clear();
  console.log("\n╔══════════════════════════════════════╗");
  console.log("║             GAME OVER!               ║");
  console.log("╚══════════════════════════════════════╝");
  console.log(`🏆 Completed games: ${session.score.completedGames}`);
  console.log(`⭐ Best streak: ${session.score.bestStreak}`);
  console.log(`⏱ Remaining time: ${session.score.remainingTime}s\n`);

  rl.close();
}

main().catch((error) => {
  console.error(error);
  rl.close();
});
