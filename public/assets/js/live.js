const els = {
  statusText: document.getElementById("statusText"),
  matches: document.getElementById("matches"),
  refreshBtn: document.getElementById("refreshBtn"),
  pollRate: document.getElementById("pollRate"),
};

let timer = null;
let currentIntervalMs = 30000;

function setStatus(text) {
  if (els.statusText) els.statusText.textContent = text;
}

function fmtKickoff(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      weekday: "short",
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function badgeFor(status) {
  if (status === "IN_PLAY" || status === "PAUSED" || status === "LIVE") {
    return `<span class="badge live">● LIVE</span>`;
  }
  if (status === "SCHEDULED" || status === "TIMED") {
    return `<span class="badge soon">⏱ Upcoming</span>`;
  }
  if (status === "FINISHED") {
    return `<span class="badge">✓ FT</span>`;
  }
  return `<span class="badge">${status}</span>`;
}

function safeScore(scoreObj) {
  const ft = scoreObj?.fullTime;
  const rt = scoreObj?.regularTime;
  const ht = scoreObj?.halfTime;

  const home = (ft?.home ?? rt?.home ?? ht?.home);
  const away = (ft?.away ?? rt?.away ?? ht?.away);

  if (home === null || home === undefined || away === null || away === undefined) return null;
  return { home, away };
}

function renderMatches(matches) {
  if (!els.matches) return;

  if (!matches || matches.length === 0) {
    els.matches.innerHTML = `<div class="card"><p class="muted">No Newcastle match found in the selected window.</p></div>`;
    return;
  }

  els.matches.innerHTML = matches.map(m => {
    const home = m.homeTeam?.name ?? "Home";
    const away = m.awayTeam?.name ?? "Away";
    const comp = m.competition?.name ?? "";
    const kickoff = m.utcDate ? fmtKickoff(m.utcDate) : "";
    const status = m.status ?? "";

    const s = safeScore(m.score);
    const scoreText = s ? `${s.home} — ${s.away}` : "—";

    return `
      <article class="match-tile">
        <div class="row">
          <div>
            ${badgeFor(status)}
            ${comp ? `<span class="badge">${comp}</span>` : ``}
          </div>
          <div class="muted small">${kickoff}</div>
        </div>

        <div class="scoreline">
          ${home} <strong>${scoreText}</strong> ${away}
        </div>

        <div class="muted small">Status: ${status}</div>
      </article>
    `;
  }).join("");
}

function computeInterval(matches) {
  const live = (matches || []).some(m => ["IN_PLAY", "PAUSED", "LIVE"].includes(m.status));
  return live ? 10000 : 30000;
}

async function fetchLive() {
  try {
    setStatus("Checking Newcastle matches…");

    const res = await fetch("/api/nufc/live", { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    const matches = data.matches || [];

    renderMatches(matches);

    const anyLive = matches.some(m => ["IN_PLAY", "PAUSED", "LIVE"].includes(m.status));
    setStatus(anyLive
      ? "Newcastle are playing — live updates enabled."
      : "No live Newcastle match right now. (Will still refresh.)"
    );

    const nextMs = computeInterval(matches);
    if (nextMs !== currentIntervalMs) {
      currentIntervalMs = nextMs;
      if (els.pollRate) els.pollRate.textContent = `${Math.round(currentIntervalMs / 1000)}s`;
      restartTimer();
    }
  } catch (e) {
    console.error(e);
    setStatus("Couldn’t load live scores. Is the server running and API key set?");
  }
}

function restartTimer() {
  if (timer) clearInterval(timer);
  timer = setInterval(fetchLive, currentIntervalMs);
}

if (els.refreshBtn) els.refreshBtn.addEventListener("click", fetchLive);

if (els.pollRate) els.pollRate.textContent = `${Math.round(currentIntervalMs / 1000)}s`;
fetchLive();
restartTimer();
