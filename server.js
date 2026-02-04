import "dotenv/config";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---- Config ----
const TOKEN = process.env.FOOTBALL_DATA_TOKEN;
const BASE = "https://api.football-data.org/v4";

// Cache team id
let cachedTeamId = null;

// ---- Simple in-memory cache ----
const cache = { store: new Map() };

// Cache TTL (prevents rate-limit)
const TTL_MS = 30_000;

function cacheGet(key) {
  const hit = cache.store.get(key);
  if (!hit) return null;
  if (Date.now() - hit.ts > TTL_MS) return null;
  return hit.data;
}
function cacheSet(key, data) {
  cache.store.set(key, { ts: Date.now(), data });
  return data;
}

// ---- Helper: football-data fetch ----
async function fdFetch(endpoint) {
  if (!TOKEN) {
    const err = new Error("Missing FOOTBALL_DATA_TOKEN");
    err.status = 401;
    throw err;
  }

  const res = await fetch(`${BASE}${endpoint}`, {
    headers: { "X-Auth-Token": TOKEN },
  });

  if (res.status === 429) {
    const body = await res.text().catch(() => "");
    const err = new Error(`Rate limited by football-data.org (429). ${body}`);
    err.status = 429;
    throw err;
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    const err = new Error(`football-data error ${res.status}: ${body}`);
    err.status = res.status;
    throw err;
  }

  return res.json();
}

// ---- Find Newcastle team id once, then cache ----
async function getNewcastleTeamId() {
  if (cachedTeamId) return cachedTeamId;

  const key = "teamId:nufc";
  const cached = cacheGet(key);
  if (cached) {
    cachedTeamId = cached;
    return cachedTeamId;
  }

  const data = await fdFetch(`/competitions/PL/teams`);
  const found = (data.teams || []).find((t) =>
    (t.name || "").toLowerCase().includes("newcastle")
  );

  if (!found?.id) {
    const err = new Error("Could not find Newcastle United team id");
    err.status = 500;
    throw err;
  }

  cachedTeamId = found.id;
  cacheSet(key, cachedTeamId);
  return cachedTeamId;
}

// ---- API: NUFC matches (used by Next / Live / Ticker) ----
app.get("/api/nufc/live", async (req, res) => {
  try {
    const cached = cacheGet("nufc:matches");
    if (cached) return res.json(cached);

    const teamId = await getNewcastleTeamId();

    const now = new Date();
    const dateFrom = new Date(now);
    dateFrom.setDate(now.getDate() - 7);

    const dateTo = new Date(now);
    dateTo.setDate(now.getDate() + 60);

    const fromStr = dateFrom.toISOString().slice(0, 10);
    const toStr = dateTo.toISOString().slice(0, 10);

    const data = await fdFetch(
      `/teams/${teamId}/matches?dateFrom=${fromStr}&dateTo=${toStr}`
    );

    const payload = {
      fetchedAt: new Date().toISOString(),
      matches: data.matches || [],
    };

    return res.json(cacheSet("nufc:matches", payload));
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({
      error: true,
      status,
      message:
        status === 429
          ? "Rate limit hit. Please wait ~30 seconds and refresh."
          : err.message || "Unknown server error",
    });
  }
});

// ---- API: Premier League table ----
app.get("/api/pl/table", async (req, res) => {
  try {
    const cached = cacheGet("pl:standings");
    if (cached) return res.json(cached);

    // standings for Premier League (PL)
    const data = await fdFetch(`/competitions/PL/standings`);

    // Most of the time the "TOTAL" table is what people expect
    const total = (data.standings || []).find((s) => s.type === "TOTAL") || data.standings?.[0];

    const payload = {
      fetchedAt: new Date().toISOString(),
      competition: data.competition?.name || "Premier League",
      season: data.season || null,
      table: total?.table || [],
    };

    return res.json(cacheSet("pl:standings", payload));
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({
      error: true,
      status,
      message:
        status === 429
          ? "Rate limit hit. Please wait ~30 seconds and refresh."
          : err.message || "Unknown server error",
    });
  }
});

// ---- Static files ----
app.use(express.static(path.join(__dirname, "public")));

app.listen(PORT, "0.0.0.0", () => {
  console.log(`NUFC Vault running:
- http://localhost:${PORT}
- http://0.0.0.0:${PORT}`);
});
