// ─── DASHBOARD PAGE ────────────────────────────────────────────────────────────
let mainChart = null;
let moversMode = 'gainers';
let _ltpData = {};

function init() {
  // Sparklines
  mkSparkline('nifty-spark',  sparkData(24100, 20, 0.008, 1));
  mkSparkline('sensex-spark', sparkData(79400, 20, 0.008, 1));
  mkSparkline('bnifty-spark', sparkData(52300, 20, 0.01, -0.2));
  mkSparkline('vix-spark',    sparkData(14.5,  20, 0.02, 0.5));

  // Main chart
  buildMainChart();

  // Movers
  renderMovers('gainers');

  // Positions
  renderPositions();

  // Signal feed table
  renderSignalTable();

  // Poll live LTP from backend every 2s
  pollLiveLTP();
  setInterval(pollLiveLTP, 2000);

  // Simulate live updates for non-backend elements
  setInterval(liveUpdate, 2000);
}

async function pollLiveLTP() {
  try {
    const data = await apiFetchAllLTP();
    if (!data || !data.data) return;
    _ltpData = data.data;

    // Update NIFTY 50 card if available
    const nifty = _ltpData['NIFTY 50'];
    if (nifty) {
      const el = document.getElementById('nifty-val');
      if (el) el.textContent = nifty.ltp.toLocaleString('en-IN', {maximumFractionDigits: 2});
    }
    // Update NIFTY BANK card if available
    const bnifty = _ltpData['NIFTY BANK'];
    if (bnifty) {
      const el = document.querySelector('#bnifty-spark')?.closest('.glass-panel')?.querySelector('.text-h1');
      if (el) el.textContent = bnifty.ltp.toLocaleString('en-IN', {maximumFractionDigits: 2});
    }
  } catch (e) { /* backend offline, use mock */ }
}

function buildMainChart() {
  if (mainChart) { mainChart.destroy(); mainChart = null; }
  const pts  = intradayData(24100, 78, 0.006);
  const labels = [];
  for (let i=0; i<78; i++) {
    const h = Math.floor(i*5/60) + 9;
    const m = (i*5) % 60;
    labels.push(`${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}`);
  }
  mainChart = mkAreaChart('main-chart', labels, pts, '#c1c1ff', 260);
}

function setTimeframe(tf, btn) {
  document.querySelectorAll('.timeframe-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  buildMainChart();
  document.getElementById('chart-title').textContent = `NIFTY 50 — ${tf.toUpperCase()}`;
}

function showIndexChart(idx) {
  document.getElementById('chart-title').textContent = `${idx} — Intraday`;
  buildMainChart();
}

function renderMovers(mode) {
  const list  = mode === 'gainers' ? GAINERS : LOSERS;
  const color = mode === 'gainers' ? '#4edea3' : '#ffb4ab';
  const sign  = mode === 'gainers' ? '▲' : '▼';
  const el    = document.getElementById('movers-list');
  el.innerHTML = list.map(m => `
    <div class="mover-row">
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-lg flex items-center justify-center" style="background:${mode==='gainers'?'rgba(78,222,163,0.1)':'rgba(255,180,171,0.1)'};border:1px solid ${color}44">
          <span style="font-size:11px;font-weight:700;color:${color}">${m.sym.slice(0,3)}</span>
        </div>
        <div>
          <div style="font-size:13px;font-weight:600;color:#e2e2e8">${m.sym}</div>
          <div style="font-size:11px;color:#908fa0">${m.name}</div>
        </div>
      </div>
      <div style="text-align:right">
        <div style="font-size:13px;font-weight:600;color:#e2e2e8">₹${m.price}</div>
        <div style="font-size:12px;font-weight:700;color:${color}">${sign} ${m.chg}</div>
      </div>
    </div>
  `).join('');
}

function switchMovers(mode, btn) {
  moversMode = mode;
  document.querySelectorAll('.tab-pill').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderMovers(mode);
}

function renderPositions() {
  const el = document.getElementById('positions-list');
  el.innerHTML = POSITIONS.map(p => `
    <div class="mover-row">
      <div>
        <div style="font-size:13px;font-weight:600;color:#e2e2e8">${p.sym} <span style="font-size:11px;color:#908fa0;font-weight:400">x${p.qty}</span></div>
        <div style="font-size:11px;color:#908fa0">Avg ₹${p.avg}</div>
      </div>
      <div style="text-align:right">
        <div style="font-size:13px;font-weight:600;color:${p.dir==='up'?'#4edea3':'#ffb4ab'}">${p.pnl}</div>
        <div style="font-size:11px;color:${p.dir==='up'?'#4edea3':'#ffb4ab'}">${p.pct}</div>
      </div>
    </div>
  `).join('');
}

function renderSignalTable() {
  const el = document.getElementById('signal-table');
  el.innerHTML = SIGNALS_FEED.map(s => {
    const sc = s.signal==='BUY' ? '#4edea3' : s.signal==='SELL' ? '#ffb4ab' : '#ffb95f';
    const st = s.status==='Executed' ? '#4edea3' : '#ffb95f';
    return `<tr>
      <td style="color:#908fa0;font-size:12px">${s.time}</td>
      <td style="font-weight:600;color:#e2e2e8">${s.sym}</td>
      <td><span style="font-size:11px;font-weight:700;color:${sc};background:${sc}22;padding:2px 8px;border-radius:50px;border:1px solid ${sc}44">${s.signal}</span></td>
      <td style="font-family:monospace;font-size:12px;color:#e2e2e8">${s.price}</td>
      <td>
        <div style="display:flex;align-items:center;gap:6px">
          <div style="width:48px;height:4px;background:#282a2e;border-radius:2px;overflow:hidden">
            <div style="width:${s.conf}%;height:100%;background:${sc};border-radius:2px"></div>
          </div>
          <span style="font-size:11px;color:${sc}">${s.conf}%</span>
        </div>
      </td>
      <td><span style="font-size:11px;color:#c7c4d7;background:#282a2e;padding:2px 8px;border-radius:50px">${s.src}</span></td>
      <td><span style="font-size:11px;font-weight:600;color:${st}">${s.status}</span></td>
    </tr>`;
  }).join('');
}

let latencyDir = 1;
function liveUpdate() {
  // Jitter latency
  const latEl = document.getElementById('latency-val');
  if (latEl) {
    let v = parseInt(latEl.textContent) + latencyDir * (Math.random()*6|0);
    if (v > 65) latencyDir = -1;
    if (v < 28) latencyDir = 1;
    latEl.textContent = Math.max(28, Math.min(68, v));
  }

  // Jitter NIFTY
  const niftyEl = document.getElementById('nifty-val');
  if (niftyEl) {
    let v = parseFloat(niftyEl.textContent.replace(/,/g,'')) + (Math.random()-0.48)*8;
    niftyEl.textContent = v.toLocaleString('en-IN', {minimumFractionDigits:0, maximumFractionDigits:0});
  }
}

document.addEventListener('DOMContentLoaded', init);
