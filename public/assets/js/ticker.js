const t = {
  text: document.getElementById("tickerText"),
  time: document.getElementById("tickerTime"),
};

let kickoff = null;
let tickTimer = null;

function pad(n){ return String(n).padStart(2,"0"); }

function fmt(ms){
  if (ms <= 0) return "LIVE";

  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  // Show days if we have them
  if (days > 0) return `${days}d ${pad(hours)}:${pad(mins)}:${pad(secs)}`;
  return `${pad(hours)}:${pad(mins)}:${pad(secs)}`;
}

async function loadTicker(){
  // If ticker isn't on this page, do nothing
  if (!t.text || !t.time) return;

  try{
    const res = await fetch("/api/nufc/live", { cache:"no-store" });
    if(!res.ok) throw new Error(res.status);
    const data = await res.json();
    const matches = data.matches || [];

    const upcoming = matches
      .filter(m => ["SCHEDULED","TIMED"].includes(m.status))
      .sort((a,b) => new Date(a.utcDate) - new Date(b.utcDate));

    if(upcoming.length === 0){
      t.text.textContent = "No upcoming fixture in window";
      t.time.textContent = "—";
      return;
    }

    const m = upcoming[0];
    const home = m.homeTeam?.name ?? "Home";
    const away = m.awayTeam?.name ?? "Away";
    kickoff = new Date(m.utcDate);

    t.text.textContent = `${home} vs ${away}`;

    if(tickTimer) clearInterval(tickTimer);

    const tick = () => {
      const ms = kickoff - new Date();
      t.time.textContent = fmt(ms);
    };

    tick();
    tickTimer = setInterval(tick, 1000);
  }catch(e){
    t.text.textContent = "Ticker unavailable";
    t.time.textContent = "—";
  }
}

loadTicker();
