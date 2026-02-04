// public/assets/js/ticker.js
(function () {
  const ticker = document.getElementById("matchdayTicker");
  const textEl = document.getElementById("tickerText");
  const timeEl = document.getElementById("tickerTime");

  // If a page doesn't have the ticker, just do nothing.
  if (!ticker || !textEl || !timeEl) return;

  let interval = null;

  function setText(t, time) {
    textEl.textContent = t;
    timeEl.textContent = time ?? "—";
  }

  function pad(n) {
    return String(n).padStart(2, "0");
  }

  function formatShortCountdown(ms) {
    if (ms <= 0) return "LIVE";
    const total = Math.floor(ms / 1000);
    const days = Math.floor(total / 86400);
    const hrs = Math.floor((total % 86400) / 3600);
    const mins = Math.floor((total % 3600) / 60);
    const secs = total % 60;

    // Match your style: show "3d 01:05:36" OR "01:05:36"
    if (days > 0) return `${days}d ${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  }

  function stop() {
    if (interval) clearInterval(interval);
    interval = null;
  }

  async function loadTicker() {
    stop();
    setText("Loading next match…", "—");

    try {
      const res = await fetch("/api/next-match", { cache: "no-store" });
      if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);

      const match = await res.json();

      if (!match) {
        setText("No upcoming match found", "—");
        return;
      }

      const home = match.homeTeam?.shortName || match.homeTeam?.name || "Newcastle";
      const away = match.awayTeam?.shortName || match.awayTeam?.name || "Opponent";
      const utc = match.utcDate;

      setText(`${home} vs ${away}`, "—");

      if (!utc) {
        setText(`${home} vs ${away}`, "TBC");
        return;
      }

      const kickoff = new Date(utc).getTime();

      interval = setInterval(() => {
        const diff = kickoff - Date.now();
        timeEl.textContent = formatShortCountdown(diff);
      }, 1000);

      // Also set immediately so it doesn't wait 1s
      timeEl.textContent = formatShortCountdown(kickoff - Date.now());
    } catch (err) {
      console.error("Ticker error:", err);
      setText("Ticker unavailable", "—");
    }
  }

  // Load once on page load
  loadTicker();

  // Refresh the ticker data every 10 minutes (prevents rate limits)
  setInterval(loadTicker, 10 * 60 * 1000);
})();
