const ui = {
  body: document.getElementById("plBody"),
  status: document.getElementById("tableStatus"),
  updatedAt: document.getElementById("updatedAt"),
  refresh: document.getElementById("refreshTable"),
};

function setStatus(text) {
  if (ui.status) ui.status.textContent = text;
}

function fmtUpdated(iso) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function formDots(form) {
  // football-data gives form like "W,W,D,L,W" sometimes
  if (!form || typeof form !== "string") return "—";
  const parts = form.split(",").slice(0, 5);
  return parts.map(x => x.trim()).filter(Boolean).join(" ");
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, m => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[m]));
}

function render(table) {
  if (!ui.body) return;

  if (!table || table.length === 0) {
    ui.body.innerHTML = `<tr><td colspan="11" class="muted">No table data returned.</td></tr>`;
    return;
  }

  ui.body.innerHTML = table.map(row => {
    const pos = row.position ?? "";
    const name = row.team?.name ?? "—";
    const played = row.playedGames ?? "—";
    const won = row.won ?? "—";
    const draw = row.draw ?? "—";
    const lost = row.lost ?? "—";
    const gf = row.goalsFor ?? "—";
    const ga = row.goalsAgainst ?? "—";
    const gd = row.goalDifference ?? "—";
    const pts = row.points ?? "—";
    const form = formDots(row.form);

    // highlight Newcastle row subtly
    const isNUFC = (name.toLowerCase().includes("newcastle"));
    const cls = isNUFC ? " class=\"nufc-row\"" : "";

    return `
      <tr${cls}>
        <td class="col-pos">${esc(pos)}</td>
        <td class="club">${esc(name)}</td>
        <td class="col-num">${esc(played)}</td>
        <td class="col-num">${esc(won)}</td>
        <td class="col-num">${esc(draw)}</td>
        <td class="col-num">${esc(lost)}</td>
        <td class="col-num">${esc(gf)}</td>
        <td class="col-num">${esc(ga)}</td>
        <td class="col-num">${esc(gd)}</td>
        <td class="col-num pts">${esc(pts)}</td>
        <td class="col-form">${esc(form)}</td>
      </tr>
    `;
  }).join("");
}

async function loadTable() {
  try {
    setStatus("Loading Premier League table…");

    const res = await fetch("/api/pl/table", { cache: "no-store" });
    const data = await res.json();

    if (!res.ok || data.error) {
      throw new Error(data.message || `HTTP ${res.status}`);
    }

    if (ui.updatedAt) ui.updatedAt.textContent = fmtUpdated(data.fetchedAt);
    setStatus("Standings updated.");
    render(data.table);
  } catch (e) {
    console.error(e);
    setStatus("Couldn’t load table. If you hit a rate limit, wait ~30 seconds then refresh.");
    render([]);
  }
}

if (ui.refresh) ui.refresh.addEventListener("click", loadTable);

loadTable();
