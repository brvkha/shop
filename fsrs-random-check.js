const crypto = require('crypto');

const secret = 'change-me-dev-secret-change-me-dev-secret';
const adminId = '80e04408-d114-4676-9892-2dbe0b81b627';
const endpoint = 'http://localhost:8080/api/v1/admin/fsrs-test';

function makeToken() {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + 7200;
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ sub: adminId, role: 'ROLE_ADMIN', iat, exp })).toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(`${header}.${payload}`).digest('base64url');
  return `${header}.${payload}.${sig}`;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function run() {
  const token = makeToken();
  const ratings = ['AGAIN', 'HARD', 'GOOD', 'EASY'];

  let state = {
    stability: 0.3,
    difficulty: 5.8,
    reps: 0,
    lapses: 0,
    elapsedDays: 0,
    state: 'NEW',
    learningStepGoodCount: 0,
  };

  const issues = [];
  const trace = [];

  for (let i = 1; i <= 120; i++) {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(state),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} at step ${i}`);
    }

    const data = await response.json();
    const chosen = pick(ratings);
    const result =
      chosen === 'AGAIN' ? data.againResult :
      chosen === 'HARD' ? data.hardResult :
      chosen === 'GOOD' ? data.goodResult :
      data.easyResult;

    const nextElapsedDays = Math.max(0, (new Date(result.nextReviewAt) - new Date()) / 86400000);

    if ((state.state === 'LEARNING' || state.state === 'RELEARNING') && chosen === 'GOOD' && nextElapsedDays > 7) {
      issues.push(`step ${i}: ${state.state}+GOOD -> ${nextElapsedDays.toFixed(2)}d (too large for learning step)`);
    }

    if (state.state === 'RELEARNING' && state.learningStepGoodCount >= 1 && chosen === 'GOOD' && result.nextState !== 'REVIEW') {
      issues.push(`step ${i}: RELEARNING GOOD with count=${state.learningStepGoodCount} did not graduate (nextState=${result.nextState})`);
    }

    trace.push(
      `${i}. ${state.state} --${chosen}--> ${result.nextState}` +
      ` | elapsed=${state.elapsedDays.toFixed(2)}d` +
      ` | next=${nextElapsedDays.toFixed(2)}d` +
      ` | S=${Number(result.stability).toFixed(2)} D=${Number(result.difficulty).toFixed(2)}` +
      ` | lsgc=${result.learningStepGoodCount}`
    );

    state = {
      stability: Number(result.stability),
      difficulty: Number(result.difficulty),
      reps: Number(result.reps),
      lapses: Number(result.lapses),
      elapsedDays: Number(nextElapsedDays),
      state: String(result.nextState),
      learningStepGoodCount: Number(result.learningStepGoodCount),
    };
  }

  console.log('--- RANDOM CHECK SUMMARY ---');
  console.log('Final state:', state);
  console.log('Issue count:', issues.length);
  if (issues.length > 0) {
    console.log('Issues (first 20):');
    issues.slice(0, 20).forEach((x) => console.log('- ' + x));
  } else {
    console.log('No rule violations detected.');
  }

  console.log('--- TRACE (first 20) ---');
  trace.slice(0, 20).forEach((x) => console.log(x));
}

run().catch((err) => {
  console.error('CHECK FAILED:', err.message);
  process.exit(1);
});
