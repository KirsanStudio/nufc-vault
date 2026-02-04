// public/assets/js/live.js
(async function () {
  const statusEl = document.getElementById("statusText");
  const listEl = document.getElementById("matchesList");
  const refreshBtn = document.getElementById("refreshBtn");
  const autoEl = document.getElementById("autoRefreshPill");

  let timer = null;
  let intervalMs = 30000; // 30s default

  function setStatus(msg) {
    if (statusEl) statusEl.textContent = msg;
  }

  function safeTeamName(t) {
    return t?.shortName || t?.name || "—";
  }

  function safeCrest(t) {
    return t?.crest || "";
  }

  function fmtMinute(match) {
    // football-data doesn't always include minute on free tier
    // We'll show status only
    return match?.status || "—";
  }

  function scoreText(match) {
    const ft = match?.score?.fullTime || {};
    const ht = match?.score?.halfTime || {};
    const h = ft.home ?? ht.home ?? "—";
    const a = ft.away ?? ht.away ?? "—";
    return `${h}–${a}`;
  }

  function badgeClass(status) {
    if (status === "LIVE" || status === "IN_PLAY") return "live";
    if (status === "PAUSED") return "soon";
    return "";
  }

  function render(matches) {
    listEl.innerHTML = "";

    if (!Array.isArray(matches) || matches.length === 0) {
      listEl.innerHTML = `
        <div class="match-tile">
          <div class="row">
            <div>
              <div class="badge">No live match right now</div>
              <p class="muted small" style="margin-top:10px">
                Newcastle aren’t currently playing (or the API hasn’t marked the match as LIVE yet).
              </p>
            </div>
          </div>
        </div>
      `;
      return;
    }

    for (const m of matches) {
      const home = m.homeTeam || {};
      const away = m.awayTeam || {};
      const status = m.status || "—";

      const comp = m.competition?.name || "Match";
      const date = m.utcDate ? new Date(m.utcDate).toLocaleString() : "—";

      const tile = document.createElement("article");
      tile.className = "match-tile";

      tile.innerHTML = `
        <div class="row">
          <div>
            <div class="badge ${badgeClass(status)}">${status}</div>
            <p class="muted small" style="margin-top:8px">${comp} • ${date}</p>
          </div>
          <div class="right">
            <button class="button button-small button-ghost" type="button" data-refresh>Refresh</button>
          </div>
        </div>

        <div class="scoreline">${scoreText(m)}</div>

        <div class="row" style="gap:18px; margin-top:10px;">
          <div style="display:flex;align-items:center;gap:10px;">
            <img src="${safeCrest(home)}" alt="" width="26" height="26"
              style="border-radius:6px;background:rgba(255,255,255,.08);padding:2px" />
            <strong>${safeTeamName(home)}</strong>
          </div>

          <div style="opacity:.75;font-weight:900;">vs</div>

          <div style="display:flex;align-items:center;gap:10px;">
            <img src="${safeCrest(away)}" alt="" width="26" height="26"
              style="border-radius:6px;background:rgba(255,255,255,.08);padding:2px" />
            <strong>${safeTeamName(away)}</strong>
          </div>
        </div>

        <p class="muted small" style="margin-top:10px">Status: ${fmtMinute(m)}</p>
      `;

      // Wire tile refresh button
      tile.querySelector("[data-refresh]")?.addEventListener("click", load);

      listEl.appendChild(tile);
    }
  }

  async function load() {
    setStatus("Checking for live Newcastle matches…");

    try {
      const res = await fetch("/api/live", { cache: "no-store" });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(`${res.status} ${t}`);
      }

      const matches = await res.json();
      render(matches);

      // If match is live, poll more often
      const hasLive = Array.isArray(matches) && matches.length > 0;
      setStatus(hasLive ? "Live match detected." : "No live match right now.");

      setAutoRefresh(hasLive ? 10000 : 30000);
    } catch (err) {
      console.error(err);
      setStatus("Couldn't load live scores. If you hit a rate limit, wait ~30 seconds then refresh.");
      render([]);
      setAutoRefresh(30000);
    }
  }

  function setAutoRefresh(ms) {
    intervalMs = ms;
    if (autoEl) autoEl.textContent = `Auto refresh: ${Math.round(intervalMs / 1000)}s`;

    if (timer) clearInterval(timer);
    timer = setInterval(load, intervalMs);
  }

  if (refreshBtn) refreshBtn.addEventListener("click", load);

  // start
  load();
  setAutoRefresh(30000);
})();
