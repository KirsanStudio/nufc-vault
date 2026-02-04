const el = {
  nextTitle: document.getElementById("nextTitle"),
  nextMeta: document.getElementById("nextMeta"),
  countdown: document.getElementById("countdown"),
  kickoffLocal: document.getElementById("kickoffLocal"),
  competition: document.getElementById("competition"),
  quickView: document.getElementById("quickView"),
  statusLine: document.getElementById("statusLine"),
  refreshBtn: document.getElementById("refreshNext"),
};

let countdownTimer = null;
let targetKickoff = null;

function setText(node, value) {
  if (node) node.textContent = value;
}

function fmtLocal(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch {
    return iso;
  }
}

function pad(n) {
  return String(n).padStart(2, "0");
}

function formatCountdown(ms) {
  if (ms <= 0) return "KICK-OFF!";
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  if (days > 0) return `${days}d ${pad(hours)}h ${pad(mins)}m ${pad(secs)}s`;
  return `${pad(hours)}h ${pad(mins)}m ${pad(secs)}s`;
}

function stopCountdown() {
  if (countdownTimer) clearInterval(countdownTimer);
  countdownTimer = null;
}

function startCountdown(iso) {
  stopCountdown();
  targetKickoff = new Date(iso);

  const tick = () => {
    const ms = targetKickoff - new Date();
    setText(el.countdown, formatCountdown(ms));
  };

  tick();
  countdownTimer = setInterval(tick, 1000);
}

function pickNextMatch(matches) {
  const upcoming = (matches || [])
    .filter(m => ["SCHEDULED", "TIMED"].includes(m.status))
    .sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate));

  if (upcoming.length > 0) return { type: "upcoming", match: upcoming[0] };

  const live = (matches || [])
    .filter(m => ["IN_PLAY", "PAUSED", "LIVE"].includes(m.status))
    .sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate));

  if (live.length > 0) return { type: "live", match: live[0] };

  return { type: "none", match: null };
}

function render(matchType, m) {
  if (matchType === "none" || !m) {
    setText(el.nextTitle, "No match found in the current window");
    setText(el.nextMeta, "Try again later, or widen the server date range.");
    setText(el.countdown, "—");
    setText(el.kickoffLocal, "—");
    setText(el.competition, "—");
    setText(el.quickView, "No fixture returned.");
    setText(el.statusLine, "");
    stopCountdown();
    return;
  }

  const home = m.homeTeam?.name ?? "Home";
  const away = m.awayTeam?.name ?? "Away";
  const comp = m.competition?.name ?? "—";
  const kickoff = m.utcDate ?? null;

  setText(el.nextTitle, `${home} vs ${away}`);
  setText(el.competition, comp);

  if (kickoff) setText(el.kickoffLocal, fmtLocal(kickoff));
  else setText(el.kickoffLocal, "—");

  if (matchType === "upcoming") {
    setText(el.nextMeta, "Next scheduled fixture (auto-selected).");
    setText(el.statusLine, "If a match goes live, the Live Scores page is best for minute-by-minute updates.");
    if (kickoff) startCountdown(kickoff);
  } else {
    setText(el.nextMeta, "Match appears to be live/ongoing in this window.");
    setText(el.statusLine, "Go to Live Scores for the live scoreline and faster refresh.");
    stopCountdown();
    setText(el.countdown, "LIVE NOW");
  }

  const status = m.status ?? "—";
  const stage = m.stage ?? "";
  const venue = m.venue ?? "";

  const quick = [
    `Status: ${status}`,
    stage ? `Stage: ${stage}` : null,
    kickoff ? `Kick-off: ${fmtLocal(kickoff)}` : null,
    venue ? `Venue: ${venue}` : null,
  ].filter(Boolean).join("\n");

  setText(el.quickView, quick);
}

async function loadNextMatch() {
  try {
    setText(el.nextTitle, "Loading…");
    setText(el.nextMeta, "Checking fixtures…");
    setText(el.statusLine, "");
    setText(el.quickView, "Loading…");

    const res = await fetch("/api/nufc/live", { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    const matches = data.matches || [];
    const { type, match } = pickNextMatch(matches);

    render(type, match);
  } catch (err) {
    console.error(err);
    setText(el.nextTitle, "Couldn’t load next match");
    setText(el.nextMeta, "Is the server running and the API key set?");
    setText(el.quickView, "Error loading data.");
    setText(el.statusLine, "");
    stopCountdown();
    setText(el.countdown, "—");
    setText(el.kickoffLocal, "—");
    setText(el.competition, "—");
  }
}

if (el.refreshBtn) el.refreshBtn.addEventListener("click", loadNextMatch);

loadNextMatch();
