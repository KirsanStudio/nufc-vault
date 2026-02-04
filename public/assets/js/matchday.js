// public/assets/js/matchday.js
(async function () {
  try {
    const res = await fetch("/api/next-match", { cache: "no-store" });
    if (!res.ok) return;

    const match = await res.json();
    if (!match || !match.utcDate) return;

    const kickoff = new Date(match.utcDate).getTime();
    const now = Date.now();
    const diffHours = (kickoff - now) / (1000 * 60 * 60);

    const isMatchday =
      diffHours <= 6 ||            // within 6 hours
      diffHours >= 0 && diffHours < 24 || // same day
      match.status === "LIVE";

    if (!isMatchday) return;

    // Activate matchday mode
    document.documentElement.classList.add("matchday");

    // Add MATCHDAY pill to header
    const header = document.querySelector(".header-inner");
    if (header && !document.querySelector(".matchday-pill")) {
      const pill = document.createElement("div");
      pill.className = "matchday-pill";
      pill.textContent = "MATCHDAY";
      header.appendChild(pill);
    }

  } catch (err) {
    console.warn("Matchday mode unavailable", err);
  }
})();
