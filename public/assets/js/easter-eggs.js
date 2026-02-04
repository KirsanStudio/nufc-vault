// public/assets/js/easter-eggs.js
(function () {
  const KEY = {
    konami: ["ArrowUp","ArrowUp","ArrowDown","ArrowDown","ArrowLeft","ArrowRight","ArrowLeft","ArrowRight","b","a"],
  };

  // ---------- Helpers ----------
  const $ = (sel) => document.querySelector(sel);
  const on = (el, ev, fn) => el && el.addEventListener(ev, fn);

  function toast(msg) {
    let t = document.getElementById("eggToast");
    if (!t) {
      t = document.createElement("div");
      t.id = "eggToast";
      t.style.cssText = `
        position: fixed; left: 50%; bottom: 18px; transform: translateX(-50%);
        background: rgba(0,0,0,.75); color: rgba(245,247,251,.92);
        border: 1px solid rgba(255,255,255,.12);
        padding: 10px 14px; border-radius: 999px;
        box-shadow: 0 16px 60px rgba(0,0,0,.55);
        font-weight: 900; letter-spacing: .2px; z-index: 9999;
        opacity: 0; transition: opacity .18s ease;
      `;
      document.body.appendChild(t);
    }
    t.textContent = msg;
    requestAnimationFrame(() => (t.style.opacity = "1"));
    clearTimeout(window.__egg_toast);
    window.__egg_toast = setTimeout(() => (t.style.opacity = "0"), 1600);
  }

  function toggleToonMode() {
    document.documentElement.classList.toggle("toon-mode");
    const on = document.documentElement.classList.contains("toon-mode");
    toast(on ? "TOON MODE: ON ⚫⚪" : "TOON MODE: OFF");
    try { localStorage.setItem("toonMode", on ? "1" : "0"); } catch {}
  }

  // ---------- Persisted mode ----------
  try {
    if (localStorage.getItem("toonMode") === "1") {
      document.documentElement.classList.add("toon-mode");
    }
  } catch {}

  // ---------- 1) Konami Code ----------
  let buffer = [];
  window.addEventListener("keydown", (e) => {
    buffer.push(e.key);
    if (buffer.length > KEY.konami.length) buffer.shift();

    const ok = KEY.konami.every((k, i) => buffer[i]?.toLowerCase() === k.toLowerCase());
    if (ok) toggleToonMode();
  });

  // ---------- 2) Double-click NUFC badge ----------
  const badge = $(".brand-badge");
  on(badge, "dblclick", () => {
    let banner = document.getElementById("howayBanner");
    if (!banner) {
      banner = document.createElement("div");
      banner.id = "howayBanner";
      banner.style.cssText = `
        position: fixed; top: 12px; left: 50%; transform: translateX(-50%);
        background: #fff; color:#000;
        padding: 10px 14px; border-radius: 999px;
        font-weight: 1000; letter-spacing: .6px;
        box-shadow: 0 18px 60px rgba(0,0,0,.55);
        border: 1px solid rgba(255,255,255,.25);
        z-index: 9999;
      `;
      banner.textContent = "HOWAY THE LADS ⚫⚪";
      document.body.appendChild(banner);
      setTimeout(() => banner.remove(), 2000);
    } else {
      banner.remove();
    }
  });

  // ---------- 3) Type “SHEARER” anywhere ----------
  let typed = "";
  const target = "SHEARER";
  window.addEventListener("keydown", (e) => {
    // ignore when typing in inputs
    const tag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : "";
    if (tag === "input" || tag === "textarea") return;

    if (e.key.length === 1) typed += e.key.toUpperCase();
    else return;

    if (typed.length > target.length) typed = typed.slice(-target.length);

    if (typed === target) {
      typed = "";
      toast("SHEARER! ⚽");

      // pop a little ball
      const ball = document.createElement("div");
      ball.textContent = "⚽";
      ball.style.cssText = `
        position: fixed; left: 50%; top: 55%;
        transform: translate(-50%, -50%);
        font-size: 34px; z-index: 9999;
        animation: ballpop .9s ease forwards;
      `;
      document.body.appendChild(ball);
      setTimeout(() => ball.remove(), 950);

      // flash ticker if present
      const ticker = document.getElementById("matchdayTicker");
      if (ticker) {
        ticker.style.outline = "2px solid rgba(255,255,255,.45)";
        ticker.style.boxShadow = "0 0 26px rgba(255,255,255,.25)";
        setTimeout(() => {
          ticker.style.outline = "";
          ticker.style.boxShadow = "";
        }, 800);
      }
    }
  });

  // ---------- 4) Hidden dev panel: Ctrl + Shift + K ----------
  window.addEventListener("keydown", async (e) => {
    if (!(e.ctrlKey && e.shiftKey && (e.key === "K" || e.key === "k"))) return;

    let panel = document.getElementById("devPanel");
    if (panel) {
      panel.remove();
      return;
    }

    panel = document.createElement("div");
    panel.id = "devPanel";
    panel.style.cssText = `
      position: fixed; right: 14px; bottom: 14px;
      width: min(360px, calc(100vw - 28px));
      background: rgba(0,0,0,.78);
      border:1px solid rgba(255,255,255,.14);
      border-radius: 16px;
      padding: 14px;
      box-shadow: 0 18px 70px rgba(0,0,0,.65);
      z-index: 9999;
      font-size: 14px;
    `;

    panel.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;gap:10px">
        <strong>NUFC Vault • Dev Panel</strong>
        <button id="dpClose" class="button button-small button-ghost" type="button">Close</button>
      </div>
      <div style="margin-top:10px" class="muted">
        <div>Version: <strong id="dpVer">1.0</strong></div>
        <div>API: <strong id="dpApi">checking…</strong></div>
        <div>Next match: <strong id="dpNext">checking…</strong></div>
      </div>
    `;

    document.body.appendChild(panel);
    panel.querySelector("#dpClose")?.addEventListener("click", () => panel.remove());

    try {
      // quick API probe
      const res = await fetch("/api/next-match", { cache: "no-store" });
      const ok = res.ok;
      const data = ok ? await res.json() : null;

      panel.querySelector("#dpApi").textContent = ok ? "OK" : `Error ${res.status}`;
      if (data?.homeTeam?.shortName && data?.awayTeam?.shortName) {
        panel.querySelector("#dpNext").textContent =
          `${data.homeTeam.shortName} vs ${data.awayTeam.shortName}`;
      } else {
        panel.querySelector("#dpNext").textContent = "—";
      }
    } catch {
      panel.querySelector("#dpApi").textContent = "offline";
      panel.querySelector("#dpNext").textContent = "—";
    }
  });

  // keyframe for the ball
  const style = document.createElement("style");
  style.textContent = `
    @keyframes ballpop {
      0% { transform: translate(-50%,-50%) scale(.7); opacity: 0; }
      20% { opacity: 1; }
      60% { transform: translate(-50%,-80%) scale(1.15); opacity: 1; }
      100% { transform: translate(-50%,-110%) scale(.95); opacity: 0; }
    }
    .toon-mode body {
      filter: contrast(1.05) saturate(1.1);
    }
    .toon-mode .hero, .toon-mode .card, .toon-mode .match-card, .toon-mode .match-tile {
      box-shadow: 0 0 0 1px rgba(255,255,255,.10), 0 18px 70px rgba(0,0,0,.65);
    }
  `;
  document.head.appendChild(style);
})();
