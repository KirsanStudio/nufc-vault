import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

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

// =============================
// STATIC FILES
// =============================
// This allows:
// /            -> index.html
// /live.html   -> public/live.html
// /next.html   -> public/next.html
// /table.html  -> public/table.html
app.use(express.static(path.join(__dirname, "public")));

// =============================
// BASIC PAGE ROUTES (OPTIONAL)
// =============================
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// =============================
// API HELPERS
// =============================
async function fdFetch(endpoint) {
  const res = await fetch(`${FOOTBALL_API}${endpoint}`, {
    headers: {
      "X-Auth-Token": API_TOKEN
    }
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`football-data error ${res.status}: ${text}`);
  }

  return res.json();
}
function readManualFixtures() {
  try {
    const p = path.join(__dirname, "public", "data", "manual-fixtures.json");
    const raw = fs.readFileSync(p, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed.matches) ? parsed.matches : [];
  } catch {
    return [];
  }
}

function isUpcoming(m) {
  const t = new Date(m.utcDate).getTime();
  return Number.isFinite(t) && t > Date.now() && (m.status === "SCHEDULED" || m.status === "TIMED");
}


// =============================
// API ROUTES
// =============================

// Get Newcastle United team ID
app.get("/api/team", async (req, res) => {
  try {
    const data = await fdFetch("/teams?name=Newcastle");
    const team = data.teams?.[0];
    res.json(team);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get("/api/manual-fixtures", (req, res) => {
  res.json(readManualFixtures());
});

// Next Newcastle match
app.get("/api/next-match", async (req, res) => {
  try {
    const data = await fdFetch("/teams/67/matches?status=SCHEDULED&limit=1");
    res.json(data.matches?.[0] || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Live Newcastle matches
app.get("/api/next-match", async (req, res) => {
  try {
    // 1) API next scheduled match
    let apiMatch = null;
    try {
      const api = await fdFetch("/teams/67/matches?status=SCHEDULED&limit=1");
      apiMatch = api.matches?.[0] || null;
    } catch {
      apiMatch = null;
    }

    // 2) Manual upcoming match (earliest)
    const manualMatches = readManualFixtures().filter(isUpcoming);
    manualMatches.sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate));
    const manualNext = manualMatches[0] || null;

    // 3) Pick whichever is sooner
    if (!apiMatch && !manualNext) return res.json(null);
    if (!apiMatch) return res.json(manualNext);
    if (!manualNext) return res.json(apiMatch);

    const apiTime = new Date(apiMatch.utcDate).getTime();
    const manTime = new Date(manualNext.utcDate).getTime();

    return res.json(manTime < apiTime ? manualNext : apiMatch);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Premier League table
app.get("/api/table", async (req, res) => {
  try {
    const data = await fdFetch("/competitions/PL/standings");
    res.json(data.standings?.[0]?.table || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get("/health", (req, res) => {
  res.json({
    ok: true,
    port: PORT,
    hasToken: Boolean(API_TOKEN),
  });
});
// Next 5 scheduled matches
app.get("/api/upcoming", async (req, res) => {
  try {
    const limit = Number(req.query.limit || 5);
    const data = await fdFetch(`/teams/67/matches?status=SCHEDULED&limit=${limit}`);
    res.json(data.matches || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Previous 2 finished matches
app.get("/api/recent", async (req, res) => {
  try {
    const limit = Number(req.query.limit || 2);
    const data = await fdFetch(`/teams/67/matches?status=FINISHED&limit=${limit}`);
    res.json(data.matches || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// =============================
// FALLBACK (404)
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
