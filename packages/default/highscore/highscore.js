const fs = require('fs');

const DATA_FILE = '/tmp/highscores.json';
const MAX_ENTRIES = 50;
const MAX_USERNAME_LEN = 20;
const MAX_SCORE = 999999;

function loadScores() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch (e) {
    return [];
  }
}

function saveScores(scores) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(scores), 'utf8');
}

function sanitize(str) {
  return String(str).replace(/[<>&"']/g, '').trim().slice(0, MAX_USERNAME_LEN);
}

function main(args) {
  // Submit score if username & score params are present
  if (args.username && args.score !== undefined) {
    const username = sanitize(args.username);
    const score = parseInt(args.score, 10);

    if (!username || isNaN(score) || score < 0 || score > MAX_SCORE) {
      return { body: { error: 'Invalid username or score' } };
    }

    // const scores = loadScores();
    const scores = [];

    const existing = scores.find(e => e.username === username);
    if (existing) {
      if (score > existing.score) {
        existing.score = score;
      }
    } else {
      scores.push({ username, score });
    }

    scores.sort((a, b) => b.score - a.score || a.username.localeCompare(b.username));
    scores.length = Math.min(scores.length, MAX_ENTRIES);
    //saveScores(scores);

    return { body: { ok: true } };
  }

  // No params — return all scores
  const scores = loadScores();
  return { body: { scores } };
}

exports.main = main;
