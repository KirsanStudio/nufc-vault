import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const app = express();

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// =============================
// CONFIG
// =============================
const PORT = process.env.PORT || 3000;
const FOOTBALL_API = "https://api.football-data.org/v4";
const API_TOKEN = process.env.FOOTBALL_DATA_TOKEN;

// Newcastle team id on football-data
const NUFC_TEAM_ID = 67;

// Simple in-memory cache to reduce API calls (rate limit friendly)
const cache = new Map();
function cacheGet(key) {
  const hit = cache.get(key);
  if (!hit) return null;
  if (Date.now() > hit.expires) {
    cache.delete(key);
    return null;
  }
  return hit.value;
}
function cacheSet(key, value, ttlMs = 60 * 1000) {
  cache.set(key, { value, expires: Date.now() + ttlMs });
}

// =============================
// STATIC FILES
// =============================
app.use(express.static(path.join(__dirname, "public")));

// Optional: explicit root
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// =============================
// API HELPERS
// =============================
async function fdFetch(endpoint) {
  if (!API_TOKEN) {
    throw new Error("Missing FOOTBALL_DATA_TOKEN env var");
  }

  const res = await fetch(`${FOOTBALL_API}${endpoint}`, {
    headers: { "X-Auth-Token": API_TOKEN },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`football-data error ${res.status}: ${text}`);
  }

  return res.json();
}

async function cached(endpoint, key, ttlMs) {
  const cachedValue = cacheGet(key);
  if (cachedValue) return cachedValue;

  const data = await fdFetch(endpoint);
  cacheSet(key, data, ttlMs);
  return data;
}

// =============================
// API ROUTES
// =============================

// Next Newcastle match
app.get("/api/next-match", async (req, res) => {
  try {
    // Cache scheduled match briefly
    const data = await cached(
      `/teams/${NUFC_TEAM_ID}/matches?status=SCHEDULED&limit=1`,
      "nufc_next_match",
      60 * 1000
    );
    res.json(data.matches?.[0] || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Newcastle live matches
app.get("/api/live", async (req, res) => {
  try {
    // Cache very short while live (so you can refresh often)
    const data = await cached(
      `/teams/${NUFC_TEAM_ID}/matches?status=LIVE`,
      "nufc_live",
      15 * 1000
    );
    res.json(data.matches || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ NEW: All Premier League live matches (IN_PLAY + PAUSED + LIVE)
app.get("/api/pl-live", async (req, res) => {
  try {
    const data = await cached(
      `/competitions/PL/matches?status=IN_PLAY,PAUSED,LIVE`,
      "pl_live",
      15 * 1000
    );
    res.json(data.matches || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Premier League table
app.get("/api/table", async (req, res) => {
  try {
    // Table can be cached longer
    const data = await cached(
      `/competitions/PL/standings`,
      "pl_table",
      5 * 60 * 1000
    );
    res.json(data.standings?.[0]?.table || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fixtures page: next 5 + previous 2 (auto)
// Returns: { next: [...], previous: [...] }
app.get("/api/fixtures", async (req, res) => {
  try {
    // Pull a chunk of scheduled and finished matches and slice them
    const [scheduledData, finishedData] = await Promise.all([
      cached(
        `/teams/${NUFC_TEAM_ID}/matches?status=SCHEDULED&limit=10`,
        "nufc_sched_10",
        60 * 1000
      ),
      cached(
        `/teams/${NUFC_TEAM_ID}/matches?status=FINISHED&limit=10`,
        "nufc_finished_10",
        5 * 60 * 1000
      ),
    ]);

    const next = (scheduledData.matches || []).slice(0, 5);
    const previous = (finishedData.matches || []).slice(0, 2);

    res.json({ next, previous });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =============================
// 404 FALLBACK
// =============================
app.use((req, res) => {
  res.status(404).send("Not Found");
});

// =============================
// START SERVER
// =============================
app.listen(PORT, "0.0.0.0", () => {
  console.log(`NUFC Vault running on port ${PORT}`);
});
