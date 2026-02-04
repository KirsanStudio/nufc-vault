// public/assets/js/next.js
(async function () {
  const titleEl = document.getElementById("nextTitle");
  const metaEl = document.getElementById("nextMeta");
  const countdownEl = document.getElementById("countdown");
  const kickoffEl = document.getElementById("kickoffLocal");
  const compEl = document.getElementById("competition");
  const statusEl = document.getElementById("statusLine");
  const quickEl = document.getElementById("quickView");
  const refreshBtn = document.getElementById("refreshNext");

  let timer = null;

  function set(el, txt) {
    if (el) el.textContent = txt;
  }

  function stopTimer() {
    if (timer) clearInterval(timer);
    timer = null;
  }

  function pad(n) {
    return String(n).padStart(2, "0");
  }

  function formatCountdown(ms) {
    if (ms <= 0) return "Kick-off time!";
    const total = Math.floor(ms / 1000);

    const days = Math.floor(total / 86400);
    const hours = Math.floor((total % 86400) / 3600);
    const mins = Math.floor((total % 3600) / 60);
    const secs = total % 60;

    return `${days}d ${pad(hours)}h ${pad(mins)}m ${pad(secs)}s`;
  }

  function startCountdown(utcDate) {
    stopTimer();
    if (!utcDate) return;

    const kickoff = new Date(utcDate).getTime();

    timer = setInterval(() => {
      const diff = kickoff - Date.now();
      set(countdownEl, formatCountdown(diff));
    }, 1000);
  }

  function renderQuick(match) {
    if (!quickEl) return;

    if (!match) {
      quickEl.textContent = "No match returned.";
      return;
    }

    const lines = [
      `Status: ${match.status || "—"}`,
      `Stage: ${match.stage || "—"}`,
      `Kick-off: ${match.utcDate ? new Date(match.utcDate).toLocaleString() : "—"}`
    ];

    quickEl.textContent = lines.join("\n");
  }

  async function load() {
    set(titleEl, "Loading…");
    set(metaEl, "Checking fixtures…");
    set(statusEl, "");
    set(compEl, "—");
    set(kickoffEl, "—");
    set(countdownEl, "—");
    if (quickEl) quickEl.textContent = "Loading…";

    try {
      const res = await fetch("/api/next-match", { cache: "no-store" });
      if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);

      const match = await res.json();

      if (!match) {
        set(titleEl, "No scheduled match found");
        set(metaEl, "football-data.org returned no upcoming fixture.");
        set(statusEl, "Try again later.");
        renderQuick(null);
        stopTimer();
        return;
      }

      const home = match.homeTeam?.name || "Home";
      const away = match.awayTeam?.name || "Away";
      const comp = match.competition?.name || "Competition";
      const utc = match.utcDate;

      set(titleEl, `${home} vs ${away}`);
      set(metaEl, `Next scheduled fixture (auto-selected).`);
      set(compEl, comp);

      const local = utc ? new Date(utc).toLocaleString() : "—";
      set(kickoffEl, local);

      renderQuick(match);
      startCountdown(utc);

      set(statusEl, "Loaded successfully.");
    } catch (err) {
      console.error(err);
      set(titleEl, "Couldn’t load next match");
      set(metaEl, "Check your API token / rate limit, then refresh.");
      set(statusEl, "If you hit a 429 rate limit, wait ~30 seconds then try again.");
      if (quickEl) quickEl.textContent = String(err.message || err);
      stopTimer();
    }
  }

  if (refreshBtn) refreshBtn.addEventListener("click", load);

  load();
})();
