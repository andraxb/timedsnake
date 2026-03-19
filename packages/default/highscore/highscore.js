const fs = require('fs');
const os = require('os');
const path = require('path');

const DATA_FILE = path.join(os.tmpdir(), 'highscores.json');
const MAX_ENTRIES = 50;
const MAX_USERNAME_LEN = 20;
const MAX_SCORE = 999999;

function loadScores() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function saveScores(scores) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(scores), 'utf8');
}

function sanitize(str) {
  return String(str).replace(/[<>&"']/g, '').trim().slice(0, MAX_USERNAME_LEN);
}

function respond(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    },
    body
  };
}

exports.main = async function main(args) {
  const method = (args.__ow_method || 'get').toLowerCase();

  // Handle CORS preflight
  if (method === 'options') {
    return respond(204, undefined);
  }

  // GET — return scores, or submit a score if username & score params are present
  if (method === 'get') {
    if (args.username && args.score !== undefined) {
      // Submit score via query params: ?username=X&score=Y
      const username = sanitize(args.username);
      const score = parseInt(args.score, 10);

      if (!username || isNaN(score) || score < 0 || score > MAX_SCORE) {
        return respond(400, { error: 'Invalid username or score' });
      }

      const scores = loadScores();

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
      saveScores(scores);

      return respond(200, { ok: true });
    }

    // No params — return all scores
    const scores = loadScores();
    return respond(200, { scores });
  }

  return respond(405, { error: 'Method not allowed' });
};
