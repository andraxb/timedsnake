const fs = require('fs');

const DATA_FILE = '/tmp/highscores.json';
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

  // GET — return scores
  if (method === 'get') {
    const scores = loadScores();
    return respond(200, { scores });
  }

  // POST — submit a score
  if (method === 'post') {
    let username, score;

    // DigitalOcean Functions may parse the body into args directly
    if (args.username !== undefined) {
      username = args.username;
      score = args.score;
    } else if (args.__ow_body) {
      try {
        const parsed = Buffer.from(args.__ow_body, 'base64').toString('utf8');
        const body = JSON.parse(parsed);
        username = body.username;
        score = body.score;
      } catch {
        return respond(400, { error: 'Invalid JSON' });
      }
    } else {
      return respond(400, { error: 'Missing body' });
    }

    username = sanitize(username);
    score = parseInt(score, 10);

    if (!username || isNaN(score) || score < 0 || score > MAX_SCORE) {
      return respond(400, { error: 'Invalid username or score' });
    }

    const scores = loadScores();

    // Keep only the best score per username
    const existing = scores.find(e => e.username === username);
    if (existing) {
      if (score > existing.score) {
        existing.score = score;
      }
    } else {
      scores.push({ username, score });
    }

    // Sort descending by score, then alphabetically by username
    scores.sort((a, b) => b.score - a.score || a.username.localeCompare(b.username));

    // Trim to max entries
    scores.length = Math.min(scores.length, MAX_ENTRIES);

    saveScores(scores);

    return respond(200, { ok: true });
  }

  return respond(405, { error: 'Method not allowed' });
};
