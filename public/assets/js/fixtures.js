// public/assets/js/fixtures.js
(async function () {
  const statusEl = document.getElementById("fxStatus");
  const refreshBtn = document.getElementById("fxRefresh");
  const upcomingEl = document.getElementById("upcomingList");
  const recentEl = document.getElementById("recentList");

  function setStatus(msg) {
    if (statusEl) statusEl.textContent = msg;
  }

  function safeName(t) {
    return t?.shortName || t?.name || "—";
  }

  function safeCrest(t) {
    return t?.crest || "";
  }

  function scoreLine(m) {
    const ft = m?.score?.fullTime || {};
    const h = ft.home ?? "—";
    const a = ft.away ?? "—";
    return `${h}–${a}`;
  }

  function fmtDate(utc) {
    if (!utc) return "—";
    return new Date(utc).toLocaleString();
  }

  function tile(match, mode) {
    const home = match.homeTeam || {};
    const away = match.awayTeam || {};
    const comp = match.competition?.name || "Match";
    const date = fmtDate(match.utcDate);

    const score = mode === "recent" ? scoreLine(match) : "vs";

    const el = document.createElement("article");
    el.className = "match-tile";
    el.innerHTML = `
      <div class="badge">${mode === "recent" ? "FT" : "Scheduled"}</div>
      <p class="muted small" style="margin-top:8px">${comp} • ${date}</p>

      <div class="scoreline">${score}</div>

      <div class="row" style="gap:18px; margin-top:10px;">
        <div style="display:flex;align-items:center;gap:10px;">
          <img src="${safeCrest(home)}" alt="" width="26" height="26"
            style="border-radius:6px;background:rgba(255,255,255,.08);padding:2px" />
          <strong>${safeName(home)}</strong>
        </div>

        <div style="opacity:.75;font-weight:900;">${mode === "recent" ? "" : ""}</div>

        <div style="display:flex;align-items:center;gap:10px;">
          <img src="${safeCrest(away)}" alt="" width="26" height="26"
            style="border-radius:6px;background:rgba(255,255,255,.08);padding:2px" />
          <strong>${safeName(away)}</strong>
        </div>
      </div>
    `;
    return el;
  }

  function renderList(target, matches, mode, emptyMsg) {
    target.innerHTML = "";

    if (!Array.isArray(matches) || matches.length === 0) {
      const box = document.createElement("div");
      box.className = "match-tile";
      box.innerHTML = `<div class="badge">${emptyMsg}</div>`;
      target.appendChild(box);
      return;
    }

    matches.forEach(m => target.appendChild(tile(m, mode)));
  }

  async function load() {
    setStatus("Loading fixtures…");

    try {
      const [upRes, reRes] = await Promise.all([
        fetch("/api/upcoming?limit=5", { cache: "no-store" }),
        fetch("/api/recent?limit=2", { cache: "no-store" })
      ]);

      if (!upRes.ok) throw new Error(`Upcoming: ${upRes.status} ${await upRes.text()}`);
      if (!reRes.ok) throw new Error(`Recent: ${reRes.status} ${await reRes.text()}`);

      const upcoming = await upRes.json();
      const recent = await reRes.json();

      renderList(upcomingEl, upcoming, "upcoming", "No upcoming matches found");
      renderList(recentEl, recent, "recent", "No recent results found");

      setStatus("Updated.");
    } catch (err) {
      console.error(err);
      setStatus("Couldn’t load fixtures/results. If you hit a 429 limit, wait ~30s then refresh.");
      renderList(upcomingEl, [], "upcoming", "Unavailable");
      renderList(recentEl, [], "recent", "Unavailable");
    }
  }

  if (refreshBtn) refreshBtn.addEventListener("click", load);
  load();
})();
