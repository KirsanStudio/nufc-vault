// public/assets/js/live.js
(() => {
  // ---- NEWCASTLE DOM ----
  const nufcStatus = document.getElementById("liveStatus");
  const nufcGrid = document.getElementById("liveGrid");
  const nufcBtn = document.getElementById("refreshLive");

  // ---- PREMIER LEAGUE DOM ----
  const plStatus = document.getElementById("plLiveStatus");
  const plGrid = document.getElementById("plLiveGrid");
  const plBtn = document.getElementById("refreshPLLive");

  let timer = null;
  const intervalMs = 30000; // 30s

  function setText(el, msg) {
    if (el) el.textContent = msg;
  }

  function safeTeamName(t) {
    return t?.shortName || t?.name || "—";
  }

  function safeCrest(t) {
    return t?.crest || "";
  }

  function scoreText(match) {
    const ft = match?.score?.fullTime || {};
    const ht = match?.score?.halfTime || {};
    const h = ft.home ?? ht.home ?? "—";
    const a = ft.away ?? ht.away ?? "—";
    return `${h}–${a}`;
  }

  function badgeHTML(status) {
    const st = status || "—";
    const cls = (st === "LIVE" || st === "IN_PLAY") ? "live" : (st === "PAUSED" ? "soon" : "");
    const label = (st === "PAUSED") ? "HT" : st;
    return `<span class="badge ${cls}">${label}</span>`;
  }

  function fmtWhen(match) {
    try {
      if (!match?.utcDate) return "—";
      return new Date(match.utcDate).toLocaleString(undefined, {
        weekday: "short",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return "—";
    }
  }

function tile(match, showCompetition = true) {
  const home = match.homeTeam || {};
  const away = match.awayTeam || {};
  const status = match.status || "—";
  const comp = match.competition?.name || match.competition?.code || "Match";

  // ✅ Detect NUFC (team id = 67)
  const isNUFC = home?.id === 67 || away?.id === 67;

  return `
    <article class="match-tile ${isNUFC ? "nufc-live" : ""}">
      <div class="row">
        <div>
          ${badgeHTML(status)}
          <p class="muted small" style="margin-top:8px">
            ${showCompetition ? `${comp} • ` : ""}${fmtWhen(match)}
          </p>
        </div>
      </div>

      <!-- ✅ BIG centred score -->
      <div class="${isNUFC ? "score-hero" : "scoreline"}">${scoreText(match)}</div>

      <!-- ✅ Teams underneath, centered -->
      <div class="${isNUFC ? "teams-row" : "row"}" style="${isNUFC ? "" : "gap:18px; margin-top:10px;"}">
        <div class="${isNUFC ? "team" : ""}" style="${isNUFC ? "" : "display:flex;align-items:center;gap:10px;"}">
          <img src="${safeCrest(home)}" alt="" width="${isNUFC ? "30" : "26"}" height="${isNUFC ? "30" : "26"}"
            style="border-radius:6px;background:rgba(255,255,255,.08);padding:2px" />
          <strong>${safeTeamName(home)}</strong>
        </div>

        <div class="${isNUFC ? "vs" : ""}" style="${isNUFC ? "" : "opacity:.75;font-weight:900;"}">vs</div>

        <div class="${isNUFC ? "team" : ""}" style="${isNUFC ? "" : "display:flex;align-items:center;gap:10px;"}">
          <img src="${safeCrest(away)}" alt="" width="${isNUFC ? "30" : "26"}" height="${isNUFC ? "30" : "26"}"
            style="border-radius:6px;background:rgba(255,255,255,.08);padding:2px" />
          <strong>${safeTeamName(away)}</strong>
        </div>
      </div>

      ${isNUFC ? `<div class="live-pill">TOON LIVE</div>` : ""}
    </article>
  `;
}

  function emptyTile(message) {
    return `
      <article class="match-tile">
        <div class="row">
          <div>
            <span class="badge">No live matches</span>
            <p class="muted small" style="margin-top:10px">${message}</p>
          </div>
        </div>
      </article>
    `;
  }

  async function fetchJSON(url) {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`${res.status} ${text}`);
    }
    return res.json();
  }

  async function loadNUFC() {
    if (!nufcGrid || !nufcStatus) return;

    setText(nufcStatus, "Checking for live Newcastle matches…");
    nufcGrid.innerHTML = "";

    try {
      const matches = await fetchJSON("/api/live");

      if (!Array.isArray(matches) || matches.length === 0) {
        setText(nufcStatus, "No Newcastle match live right now.");
        nufcGrid.innerHTML = emptyTile(
          "Newcastle aren’t currently playing (or the API hasn’t marked the match as LIVE yet)."
        );
        return;
      }

      setText(nufcStatus, `Live now: ${matches.length} match${matches.length === 1 ? "" : "es"}`);
      nufcGrid.innerHTML = matches.map(m => tile(m, true)).join("");
    } catch (err) {
      console.error(err);
      setText(nufcStatus, "Couldn’t load Newcastle live scores. Try refresh in 30 seconds.");
      nufcGrid.innerHTML = emptyTile("There was an error loading NUFC live data.");
    }
  }

  async function loadPL() {
    if (!plGrid || !plStatus) return;

    setText(plStatus, "Checking Premier League live matches…");
    plGrid.innerHTML = "";

    try {
      const matches = await fetchJSON("/api/pl-live");

      if (!Array.isArray(matches) || matches.length === 0) {
        setText(plStatus, "No Premier League matches live right now.");
        plGrid.innerHTML = emptyTile("When matches are live, they’ll appear here automatically.");
        return;
      }

      setText(plStatus, `Live now: ${matches.length} match${matches.length === 1 ? "" : "es"}`);
      plGrid.innerHTML = matches.map(m => tile(m, true)).join("");
    } catch (err) {
      console.error(err);
      setText(plStatus, "Couldn’t load Premier League live scores. Try refresh in 30 seconds.");
      plGrid.innerHTML = emptyTile("There was an error loading PL live data.");
    }
  }

  async function loadAll() {
    await Promise.allSettled([loadNUFC(), loadPL()]);
  }

  // Buttons
  nufcBtn?.addEventListener("click", loadNUFC);
  plBtn?.addEventListener("click", loadPL);

  // Start + polling
  loadAll();
  timer = setInterval(loadAll, intervalMs);
})();
