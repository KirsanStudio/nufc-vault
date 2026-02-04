// public/assets/js/table.js
(async function () {
  const statusEl = document.getElementById("statusText");
  const updatedEl = document.getElementById("lastUpdated");
  const tbody = document.getElementById("tableBody");
  const refreshBtn = document.getElementById("refreshBtn");

  function setStatus(msg) {
    if (statusEl) statusEl.textContent = msg;
  }

  function fmtUpdated(d) {
    try {
      return new Date(d).toLocaleString();
    } catch {
      return "—";
    }
  }

  function formDots(formStr) {
    // football-data often returns null on free tier
    if (!formStr) return "—";
    // format like "W,W,D,L,W"
    return formStr
      .split(",")
      .slice(-5)
      .map(r => r.trim().toUpperCase())
      .join(" ");
  }

  function render(rows) {
    tbody.innerHTML = "";

    if (!Array.isArray(rows) || rows.length === 0) {
      tbody.innerHTML = `<tr><td colspan="10">No table data returned.</td></tr>`;
      return;
    }

    for (const r of rows) {
      const isNUFC = r.team?.id === 67; // Newcastle ID
      const tr = document.createElement("tr");
      if (isNUFC) tr.classList.add("nufc-row");

      tr.innerHTML = `
        <td class="col-pos">${r.position ?? ""}</td>
        <td>
          <div style="display:flex;align-items:center;gap:10px;">
            <img src="${r.team?.crest ?? ""}" alt="" width="22" height="22" style="border-radius:6px;background:rgba(255,255,255,.08);padding:2px" />
            <span class="club">${r.team?.name ?? ""}</span>
          </div>
        </td>
        <td class="col-num">${r.playedGames ?? ""}</td>
        <td class="col-num">${r.won ?? ""}</td>
        <td class="col-num">${r.draw ?? ""}</td>
        <td class="col-num">${r.lost ?? ""}</td>
        <td class="col-num">${r.goalsFor ?? ""}</td>
        <td class="col-num">${r.goalsAgainst ?? ""}</td>
        <td class="col-num">${r.goalDifference ?? ""}</td>
        <td class="col-num pts">${r.points ?? ""}</td>
      `;

      tbody.appendChild(tr);
    }
  }

  async function load() {
    setStatus("Loading table…");

    try {
      const res = await fetch("/api/table", { cache: "no-store" });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(`${res.status} ${t}`);
      }

      const rows = await res.json();
      render(rows);
      setStatus("Standings loaded.");
      if (updatedEl) updatedEl.textContent = fmtUpdated(new Date());
    } catch (err) {
      console.error(err);
      setStatus("Couldn't load table. If you hit a rate limit, wait ~30 seconds then refresh.");
      tbody.innerHTML = `<tr><td colspan="10">No table data returned.</td></tr>`;
      if (updatedEl) updatedEl.textContent = "—";
    }
  }

  if (refreshBtn) refreshBtn.addEventListener("click", load);

  load();
})();
