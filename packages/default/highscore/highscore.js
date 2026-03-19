const fs = require('fs');
const path = require('path');

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

exports.main = async function main(args) {
  const method = args.__ow_method || 'get';

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  // Handle CORS preflight
  if (method === 'options') {
    return { statusCode: 204, headers, body: '' };
  }

  // GET — return scores
  if (method === 'get') {
    const scores = loadScores();
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ scores })
    };
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
        const body = JSON.parse(
          Buffer.from(args.__ow_body, 'base64').toString('utf8')
        );
        username = body.username;
        score = body.score;
      } catch {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON' }) };
      }
    } else {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing body' }) };
    }

    username = sanitize(username);
    score = parseInt(score, 10);

    if (!username || isNaN(score) || score < 0 || score > MAX_SCORE) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid username or score' }) };
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

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ ok: true })
    };
  }

  return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
};
