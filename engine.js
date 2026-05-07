// ─── ENGINE PAGE ──────────────────────────────────────────────────────────────

const MODELS = [
  { name:'Trend Following',    status:'active',  acc:91, signals:62, src:'Edge AI (ONNX)',  desc:'EMA crossover + momentum filter on 15-min bars' },
  { name:'Mean Reversion',     status:'active',  acc:78, signals:41, src:'Edge AI (ONNX)',  desc:'Bollinger Band squeeze + RSI oversold/overbought' },
  { name:'Sector Rotation',    status:'active',  acc:83, signals:28, src:'Gemini API',      desc:'Macro & earnings momentum across NSE sector indices' },
  { name:'K-Means Clustering', status:'paused',  acc:74, signals:16, src:'Edge AI (ONNX)',  desc:'Unsupervised stock selection via technical factor clustering' },
  { name:'GARCH Volatility',   status:'active',  acc:88, signals:0,  src:'Edge AI (ONNX)',  desc:'Intraday VIX forecasting for position sizing overlay' },
  { name:'Twitter Sentiment',  status:'offline', acc:0,  signals:0,  src:'Cloud API',       desc:'Real-time social velocity & NLP sentiment scoring' },
];

const WATCHLIST_DEFAULT = ['RELIANCE','TCS','HDFCBANK','INFY','NIFTY50','BNKFTY','BTCUSDT'];

const EXEC_LOG = [
  { time:'15:28:04', sym:'RELIANCE', type:'BUY',  qty:50,  price:'₹2,938', pnl:'+₹1,750', model:'Trend Following' },
  { time:'15:15:22', sym:'INFY',     type:'BUY',  qty:100, price:'₹1,534', pnl:'+₹850',   model:'Mean Reversion'  },
  { time:'14:52:11', sym:'ONGC',     type:'SELL', qty:200, price:'₹268',   pnl:'+₹1,400', model:'Sector Rotation' },
  { time:'14:31:08', sym:'TCS',      type:'BUY',  qty:25,  price:'₹3,798', pnl:'+₹575',   model:'Trend Following' },
  { time:'13:47:55', sym:'WIPRO',    type:'BUY',  qty:150, price:'₹476',   pnl:'-₹210',   model:'Mean Reversion'  },
  { time:'13:22:40', sym:'BPCL',     type:'SELL', qty:100, price:'₹325',   pnl:'+₹630',   model:'Sector Rotation' },
  { time:'12:55:33', sym:'HDFCBANK', type:'BUY',  qty:40,  price:'₹1,612', pnl:'+₹680',   model:'Trend Following' },
];

function renderModels() {
  const el = document.getElementById('model-list');
  el.innerHTML = MODELS.map((m,i) => {
    const stColor = m.status==='active' ? '#4edea3' : m.status==='paused' ? '#ffb95f' : '#ffb4ab';
    const stDot   = m.status==='active' ? 'online'  : m.status==='paused' ? 'warning'  : 'offline';
    return `
    <div class="flex items-center gap-4 p-4 rounded-xl hover:bg-surface-container transition-colors cursor-pointer" style="border:1px solid ${stColor}30">
      <div class="shrink-0 w-10 h-10 rounded-lg flex items-center justify-center" style="background:${stColor}15;border:1px solid ${stColor}40">
        <span class="material-symbols-outlined text-[20px]" style="color:${stColor}">model_training</span>
      </div>
      <div class="flex-grow min-w-0">
        <div class="flex items-center gap-2 mb-0.5">
          <span class="text-h3 font-semibold text-on-background">${m.name}</span>
          <span class="status-dot ${stDot}"></span>
          <span class="text-label-caps" style="color:${stColor}">${m.status.toUpperCase()}</span>
        </div>
        <p class="text-body-sm text-on-surface-variant truncate">${m.desc}</p>
        <div class="flex gap-4 mt-1 text-label-caps text-on-surface-variant">
          <span>Acc: <span style="color:${stColor}">${m.acc || '-'}%</span></span>
          <span>Signals: <span class="text-on-background">${m.signals}</span></span>
          <span>Source: <span class="text-on-background">${m.src}</span></span>
        </div>
      </div>
      <label class="toggle shrink-0">
        <input type="checkbox" ${m.status==='active' ? 'checked' : ''} onchange="toggleModel(${i}, this.checked)">
        <span class="toggle-slider"></span>
      </label>
    </div>`;
  }).join('');
}

function toggleModel(idx, on) {
  MODELS[idx].status = on ? 'active' : 'paused';
  renderModels();
  showToast(`${MODELS[idx].name} ${on ? 'activated' : 'paused'}`, on ? 'success' : 'warning');
}

function renderPerfChart() {
  const labels = Array.from({length:30},(_,i)=>`D-${29-i}`);
  const wins   = labels.map(()=> Math.random()*4+0.5);
  const losses = labels.map(()=>-(Math.random()*2+0.1));
  mkBarChart('perf-chart', labels, wins.map((w,i)=> Math.random()>0.28 ? w : losses[i]));
}

function renderWatchlist() {
  const el = document.getElementById('watchlist');
  el.innerHTML = WATCHLIST_DEFAULT.map(sym => {
    const up   = Math.random() > 0.4;
    const chg  = ((Math.random()*3+0.1)*(up?1:-1)).toFixed(2);
    const c    = up ? '#4edea3' : '#ffb4ab';
    return `
    <div class="mover-row">
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-lg flex items-center justify-center" style="background:rgba(193,193,255,0.08);border:1px solid #464555">
          <span style="font-size:10px;font-weight:700;color:#c1c1ff">${sym.slice(0,3)}</span>
        </div>
        <span class="text-body-sm font-semibold text-on-background">${sym}</span>
      </div>
      <div class="flex items-center gap-3">
        <span class="text-data-mono" style="color:${c}">${up?'▲':'▼'} ${Math.abs(chg)}%</span>
        <button class="text-on-surface-variant hover:text-error transition-colors" onclick="removeWatchItem('${sym}')">
          <span class="material-symbols-outlined text-[16px]">close</span>
        </button>
      </div>
    </div>`;
  }).join('');
}

function addWatchlistItem() {
  const sym = prompt('Enter stock symbol (e.g. HDFC, SBIN):');
  if (sym) { WATCHLIST_DEFAULT.push(sym.toUpperCase().trim()); renderWatchlist(); showToast(`${sym.toUpperCase()} added to watchlist`, 'success'); }
}

function removeWatchItem(sym) {
  const i = WATCHLIST_DEFAULT.indexOf(sym);
  if (i > -1) { WATCHLIST_DEFAULT.splice(i, 1); renderWatchlist(); }
}

function renderExecLog() {
  const el = document.getElementById('exec-log');
  el.innerHTML = EXEC_LOG.map(e => {
    const tc = e.type==='BUY' ? '#4edea3' : '#ffb4ab';
    const pc = e.pnl.startsWith('+') ? '#4edea3' : '#ffb4ab';
    return `<tr>
      <td class="pr-4" style="color:#908fa0;font-size:12px">${e.time}</td>
      <td class="pr-4 font-semibold">${e.sym}</td>
      <td class="pr-4"><span style="font-size:11px;font-weight:700;color:${tc};background:${tc}22;padding:2px 8px;border-radius:50px;border:1px solid ${tc}44">${e.type}</span></td>
      <td class="pr-4 text-on-surface-variant">${e.qty}</td>
      <td class="pr-4" style="font-family:monospace;font-size:12px">${e.price}</td>
      <td class="pr-4 font-bold" style="color:${pc}">${e.pnl}</td>
      <td style="font-size:12px;color:#908fa0">${e.model}</td>
    </tr>`;
  }).join('');
}

function stopEngine() {
  if (confirm('Stop the trading engine? All automation will pause.')) {
    showToast('Engine stopped. No new signals will be executed.', 'warning');
  }
}

function saveConfig() {
  showToast('Configuration saved successfully', 'success');
}

// Live latency jitter
let latDir = 1;
setInterval(() => {
  const el = document.getElementById('eng-lat');
  if (!el) return;
  let v = parseInt(el.textContent);
  v += latDir * (Math.floor(Math.random()*5));
  if (v>65) latDir=-1; if(v<28) latDir=1;
  el.textContent = Math.max(28, Math.min(68, v)) + 'ms';
}, 1800);

document.addEventListener('DOMContentLoaded', () => {
  renderModels();
  renderPerfChart();
  renderWatchlist();
  renderExecLog();
});
