
// openskyClient.js
const axios = require('axios');

/**
 * OpenSky Flights Client
 * - Handles 429 with Retry-After
 * - Enforces cadence (10s anon, ~5s auth)
 * - Splits large time ranges for flights endpoints
 * - Tracks a simple daily credit budget (heuristic)
 *
 * Docs: /states & /flights endpoints + limits. 
 * See OpenSky REST docs. 
 */

const BASE = 'https://opensky-network.org/api';

// ---- Utility: sleep, backoff, date helpers ----
const sleep = ms => new Promise(r => setTimeout(r, ms));
function parseRetryAfter(h) {
  const ra = h['retry-after'] || h['Retry-After'];
  if (!ra) return null;
  if (/^\d+$/.test(ra)) return Number(ra) * 1000;
  const t = Date.parse(ra);
  return Number.isNaN(t) ? null : Math.max(0, t - Date.now());
}

/**
 * Axios instance with optional bearer token (OAuth2).
 * For legacy basic auth (older accounts only), pass { auth: { username, password } }
 * NOTE: Basic auth is being deprecated for new accounts. 
 */
function createHttp({ accessToken, auth } = {}) {
  const headers = {};
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  const instance = axios.create({
    baseURL: BASE,
    timeout: 30_000,
    headers,
    auth: accessToken ? undefined : auth,
    // If you’re in a cloud with blocked IP ranges, you may need a custom proxy/egress.
  });

  return instance;
}

/**
 * Generic GET with 429-aware retries.
 */
async function getWithBackoff(http, url, params = {}, { retries = 6, baseDelayMs = 500 } = {}) {
  let attempt = 0;
  while (true) {
    const res = await http.get(url, { params, validateStatus: () => true });
    if (res.status !== 429) {
      if (res.status >= 200 && res.status < 300) return res;
      // Bubble up non-429 errors
      const err = new Error(`HTTP ${res.status} ${res.statusText} @ ${url}`);
      err.response = res;
      throw err;
    }
    // 429 handling
    attempt++;
    if (attempt > retries) throw new Error(`Rate limited after ${retries} retries @ ${url}`);
    const raMs = parseRetryAfter(res.headers);
    const backoffMs = raMs ?? Math.min(30_000, baseDelayMs * 2 ** (attempt - 1)) + Math.random() * 250;
    await sleep(backoffMs);
  }
}

// ---- Budget & cadence helpers ----

// Very rough credit budgeting for flights endpoints:
// OpenSky documents daily credits varying by user type (400 anon, 4000 authenticated; contributing users higher).
// We treat each flights request as 1 "unit" and enforce cadence separately.
// (States queries scale by geographic area; flights cost roughly by time partitions.)
// See REST docs for details. 
// You can tighten this if you know your exact usage profile.
function makeBudget({ daily = 400 }) {
  let spent = 0;
  return {
    check(cost = 1) {
      if (spent + cost > daily) {
        throw new Error(`Daily budget exceeded (spent ${spent} / limit ${daily}, need ${cost})`);
      }
    },
    spend(cost = 1) { spent += cost; },
    get spent() { return spent; }
  };
}

// Ensure we don’t poll faster than data updates.
// Anonymous -> 10s; Authenticated -> ~5s (per docs).
function makeCadence({ authenticated = false }) {
  const minGapMs = authenticated ? 5000 : 10000;
  let last = 0;
  return {
    async wait() {
      const now = Date.now();
      const due = last + minGapMs;
      if (now < due) await sleep(due - now);
      last = Date.now();
    }
  };
}

// ---- Time window chunking for /flights endpoints ----

/**
 * Split large time ranges into smaller chunks to avoid heavy ranges that can trigger throttling.
 * Default chunk: 1 hour.
 */
function chunkWindows(beginEpochSec, endEpochSec, chunkSeconds = 3600) {
  const out = [];
  for (let b = beginEpochSec; b < endEpochSec; b += chunkSeconds) {
    const e = Math.min(endEpochSec, b + chunkSeconds);
    out.push([b, e]);
  }
  return out;
}

// ---- Client factory ----

function createOpenSkyClient(config = {}) {
  const {
    accessToken,                // OAuth2 bearer token (preferred for new accounts)
    auth,                       // { username, password } for legacy accounts only
    dailyBudget = 400,          // 400 anon, 4000 authenticated (per docs)
    authenticated = false,      // set true if you pass a valid accessToken
    flightsChunkSec = 3600      // 1h chunks for /flights queries
  } = config;

  const http = createHttp({ accessToken, auth });
  const budget = makeBudget({ daily: dailyBudget });
  const cadence = makeCadence({ authenticated });

  /**
   * Get flights arriving at an airport within [begin, end] (epoch seconds).
   * We chunk the window and fetch sequentially to stay friendly.
   * API: GET /flights/arrival?airport=XXXX&begin=...&end=...
   */
  async function getFlightsArrival(airport, beginSec, endSec) {
    const chunks = chunkWindows(beginSec, endSec, flightsChunkSec);
    const all = [];
    for (const [b, e] of chunks) {
      budget.check(1);
      await cadence.wait();
      const res = await getWithBackoff(http, '/flights/arrival', { airport, begin: b, end: e });
      budget.spend(1);
      if (Array.isArray(res.data)) all.push(...res.data);
    }
    return all;
  }

  /**
   * Get flights departing an airport within [begin, end] (epoch seconds).
   * API: GET /flights/departure?airport=XXXX&begin=...&end=...
   */
  async function getFlightsDeparture(airport, beginSec, endSec) {
    const chunks = chunkWindows(beginSec, endSec, flightsChunkSec);
    const all = [];
    for (const [b, e] of chunks) {
      budget.check(1);
      await cadence.wait();
      const res = await getWithBackoff(http, '/flights/departure', { airport, begin: b, end: e });
      budget.spend(1);
      if (Array.isArray(res.data)) all.push(...res.data);
    }
    return all;
  }

  /**
   * Optional: states/all for a bounded area (cheaper than global).
   * We include bbox params so you don’t pay the higher "global" credit tier.
   * API: GET /states/all?lamin=..&lomin=..&lamax=..&lomax=..
   */
  async function getStatesAll(bounds, extra = {}) {
    const params = { ...bounds, ...extra }; // { lamin, lomin, lamax, lomax, extended, time? }
    // Budgeting here is coarser; true credit cost scales with area (global is pricier).
    budget.check(1);
    await cadence.wait();
    const res = await getWithBackoff(http, '/states/all', params);
    budget.spend(1);
    return res.data;
  }

  return {
    getFlightsArrival,
    getFlightsDeparture,
    getStatesAll,
    // useful for telemetry
    getBudgetSpent: () => budget.spent
  };
}

module.exports = { createOpenSkyClient };
