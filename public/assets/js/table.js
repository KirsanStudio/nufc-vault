// public/assets/js/table.js
(async function () {
  const statusEl = document.getElementById("tableStatus");
  const updatedEl = document.getElementById("updatedAt");
  const tbody = document.getElementById("plBody");
  const refreshBtn = document.getElementById("refreshTable");

  function setStatus(msg) {
    if (statusEl) statusEl.textContent = msg;
  }

  function formText(formStr) {
    if (!formStr) return "—";
    return formStr.split(",").slice(-5).map(x => x.trim().toUpperCase()).join(" ");
  }

  function render(rows) {
    tbody.innerHTML = "";

    if (!Array.isArray(rows) || rows.length === 0) {
      tbody.innerHTML = `<tr><td colspan="11">No table data returned.</td></tr>`;
      return;
    }

    for (const r of rows) {
      const isNUFC = r.team?.id === 67;
      const tr = document.createElement("tr");
      if (isNUFC) tr.classList.add("nufc-row");

      tr.innerHTML = `
        <td class="col-pos">${r.position ?? ""}</td>
        <td>
          <div style="display:flex;align-items:center;gap:10px;">
            <img src="${r.team?.crest ?? ""}" alt="" width="22" height="22"
              style="border-radius:6px;background:rgba(255,255,255,.08);padding:2px" />
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
        <td class="col-form">${formText(r.form)}</td>
      `;

      tbody.appendChild(tr);
    }
  }

  async function load() {
    setStatus("Loading table…");

    try {
      const res = await fetch("/api/table", { cache: "no-store" });
      if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);

      const rows = await res.json();
      render(rows);

      setStatus("Standings loaded.");
      if (updatedEl) updatedEl.textContent = new Date().toLocaleString();
    } catch (err) {
      console.error(err);
      setStatus("Couldn't load table. If you hit a rate limit, wait ~30 seconds then refresh.");
      tbody.innerHTML = `<tr><td colspan="11">No table data returned.</td></tr>`;
      if (updatedEl) updatedEl.textContent = "—";
    }
  }

  if (refreshBtn) refreshBtn.addEventListener("click", load);

  load();
})();
