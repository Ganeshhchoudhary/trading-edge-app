// ─── PORTFOLIO PAGE ────────────────────────────────────────────────────────────

const FULL_POSITIONS = [
  { sym:'RELIANCE', qty:50,  avg:2840,   ltp:2941.50, sector:'Energy',  dir:'up'   },
  { sym:'TCS',      qty:20,  avg:3750,   ltp:3821.00, sector:'IT',      dir:'up'   },
  { sym:'NIFTY FUT',qty:1,   avg:24100,  ltp:24461,   sector:'Index',   dir:'up'   },
  { sym:'ONGC',     qty:200, avg:272,    ltp:265.40,  sector:'Energy',  dir:'down' },
];

const TRADE_HISTORY_DATA = [
  { date:'06 May 25', sym:'RELIANCE', type:'BUY',  qty:50,  price:'₹2,938', value:'₹1,46,900', pnl:'+₹1,750',  src:'Edge AI'  },
  { date:'06 May 25', sym:'INFY',     type:'BUY',  qty:100, price:'₹1,534', value:'₹1,53,400', pnl:'+₹850',    src:'Gemini'   },
  { date:'06 May 25', sym:'ONGC',     type:'SELL', qty:200, price:'₹268',   value:'₹53,600',   pnl:'+₹1,400',  src:'Gemini'   },
  { date:'05 May 25', sym:'TCS',      type:'BUY',  qty:25,  price:'₹3,798', value:'₹94,950',   pnl:'+₹575',    src:'Edge AI'  },
  { date:'05 May 25', sym:'WIPRO',    type:'SELL', qty:150, price:'₹483',   value:'₹72,450',   pnl:'-₹210',    src:'Manual'   },
  { date:'04 May 25', sym:'BPCL',     type:'SELL', qty:100, price:'₹325',   value:'₹32,500',   pnl:'+₹630',    src:'Gemini'   },
  { date:'03 May 25', sym:'HDFCBANK', type:'BUY',  qty:40,  price:'₹1,612', value:'₹64,480',   pnl:'+₹680',    src:'Edge AI'  },
  { date:'02 May 25', sym:'RELIANCE', type:'SELL', qty:30,  price:'₹2,920', value:'₹87,600',   pnl:'+₹2,100',  src:'Edge AI'  },
];

let tradeFilter = 'all';
let pnlChart = null;

function renderPositionsTable() {
  const el = document.getElementById('positions-table');
  el.innerHTML = FULL_POSITIONS.map(p => {
    const invested = (p.qty * p.avg).toLocaleString('en-IN');
    const current  = (p.qty * p.ltp).toLocaleString('en-IN');
    const pnl      = ((p.ltp - p.avg) * p.qty);
    const pct      = ((p.ltp - p.avg) / p.avg * 100).toFixed(2);
    const c        = p.dir==='up' ? '#4edea3' : '#ffb4ab';
    const sign     = p.dir==='up' ? '+' : '';
    return `<tr>
      <td class="pr-4 font-semibold text-on-background">${p.sym}</td>
      <td class="pr-4 text-on-surface-variant">${p.qty}</td>
      <td class="pr-4 text-on-surface-variant">₹${p.avg.toLocaleString('en-IN')}</td>
      <td class="pr-4 font-semibold text-on-background">₹${p.ltp.toLocaleString('en-IN')}</td>
      <td class="pr-4 text-on-surface-variant">₹${invested}</td>
      <td class="pr-4 text-on-background">₹${current}</td>
      <td class="pr-4 font-bold" style="color:${c}">${sign}₹${Math.abs(pnl).toLocaleString('en-IN',{maximumFractionDigits:0})}</td>
      <td class="pr-4 font-bold" style="color:${c}">${sign}${pct}%</td>
      <td>
        <div class="flex gap-2">
          <button class="text-[11px] px-3 py-1 rounded-full font-bold" style="background:rgba(78,222,163,0.15);color:#4edea3;border:1px solid rgba(78,222,163,0.3)" onclick="showOrderModal('BUY')">Buy</button>
          <button class="text-[11px] px-3 py-1 rounded-full font-bold" style="background:rgba(255,180,171,0.15);color:#ffb4ab;border:1px solid rgba(255,180,171,0.3)" onclick="showOrderModal('SELL')">Sell</button>
        </div>
      </td>
    </tr>`;
  }).join('');
}

function renderPnlChart(period='1W') {
  const pts = period==='1W' ? 7 : period==='1M' ? 30 : 90;
  const base = 550000;
  const data = sparkData(base, pts, 0.008, 1);
  const labels = Array.from({length:pts},(_,i)=>`D-${pts-1-i}`);
  if (pnlChart) { pnlChart.destroy(); }
  pnlChart = mkAreaChart('pnl-chart', labels, data, '#c1c1ff', 220);
}

function setPnlPeriod(p, btn) {
  document.querySelectorAll('#pnl-chart').forEach(()=>{});
  document.querySelectorAll('.tab-pill').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderPnlChart(p);
}

function renderAllocChart() {
  mkDonut('alloc-chart',
    ['IT', 'Energy', 'Index', 'Finance', 'FMCG'],
    [28, 35, 18, 12, 7],
    ['#c1c1ff','#4edea3','#ffb95f','#ff8fa3','#90caf9']
  );
}

function filterTrades(f, btn) {
  tradeFilter = f;
  document.querySelectorAll('#trade-filter .tab-pill').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  renderTradeHistory();
}

function renderTradeHistory() {
  const items = tradeFilter==='all' ? TRADE_HISTORY_DATA
    : TRADE_HISTORY_DATA.filter(t => t.type.toLowerCase()===tradeFilter);
  const el = document.getElementById('trade-history');
  el.innerHTML = items.map(t => {
    const tc = t.type==='BUY' ? '#4edea3' : '#ffb4ab';
    const pc = t.pnl.startsWith('+') ? '#4edea3' : '#ffb4ab';
    return `<tr>
      <td class="pr-4" style="color:#908fa0;font-size:12px">${t.date}</td>
      <td class="pr-4 font-semibold text-on-background">${t.sym}</td>
      <td class="pr-4"><span style="font-size:11px;font-weight:700;color:${tc};background:${tc}22;padding:2px 8px;border-radius:50px;border:1px solid ${tc}44">${t.type}</span></td>
      <td class="pr-4 text-on-surface-variant">${t.qty}</td>
      <td class="pr-4" style="font-family:monospace;font-size:12px;color:#e2e2e8">${t.price}</td>
      <td class="pr-4 text-on-surface-variant">${t.value}</td>
      <td class="pr-4 font-bold" style="color:${pc}">${t.pnl}</td>
      <td><span style="font-size:11px;background:#282a2e;padding:2px 8px;border-radius:50px;color:#c7c4d7">${t.src}</span></td>
    </tr>`;
  }).join('');
}

function showOrderModal(type) {
  document.getElementById('order-modal').classList.remove('hidden');
  document.getElementById('order-title').textContent = type === 'BUY' ? '▲ Place Buy Order' : '▼ Place Sell Order';
  updateOrderEst();
}

function updateOrderEst() {
  const qty   = parseFloat(document.getElementById('order-qty')?.value  || 50);
  const price = parseFloat(document.getElementById('order-price')?.value || 2941.5);
  const est   = document.getElementById('order-est');
  if (est) est.textContent = '₹' + (qty * price).toLocaleString('en-IN', {maximumFractionDigits:0});
}

async function placeOrder(type) {
  const sym       = document.getElementById('order-sym').value;
  const qty       = parseInt(document.getElementById('order-qty').value);
  const price     = parseFloat(document.getElementById('order-price').value);
  const orderType = document.getElementById('order-type-sel')?.value || 'MARKET';
  const product   = document.getElementById('order-product-sel')?.value || 'MIS';

  // Show loading state
  const btn = document.getElementById(type === 'BUY' ? 'buy-btn' : 'sell-btn');
  const origText = btn.innerHTML;
  btn.innerHTML = `<span class="material-symbols-outlined text-[16px] animate-spin">refresh</span>Placing…`;
  btn.disabled = true;

  try {
    const result = await apiPlaceOrder({
      symbol:           sym,
      transaction_type: type,
      quantity:         qty,
      order_type:       orderType,
      price:            orderType === 'LIMIT' ? price : 0,
      product:          product,
      exchange:         'NSE',
      tag:              'web_ui',
    });
    document.getElementById('order-modal').classList.add('hidden');
    showToast(`✅ ${result.message || type + ' ' + qty + ' ' + sym + ' placed!'}`, 'success');
    // Refresh positions after 1s
    setTimeout(async () => {
      try {
        const pos = await apiFetchPositions();
        renderLivePositions(pos.day || []);
      } catch(e) { /* ignore if backend offline */ }
    }, 1200);
  } catch (err) {
    showToast(`❌ Order failed: ${err.message}`, 'error');
  } finally {
    btn.innerHTML = origText;
    btn.disabled = false;
  }
}

/** Render live positions fetched from backend */
function renderLivePositions(dayPositions) {
  if (!dayPositions || dayPositions.length === 0) return;
  const el = document.getElementById('positions-table');
  if (!el) return;
  el.innerHTML = dayPositions.map(p => {
    const pnl = p.unrealised || 0;
    const c   = pnl >= 0 ? '#4edea3' : '#ffb4ab';
    const sign = pnl >= 0 ? '+' : '';
    return `<tr>
      <td class="pr-4 font-semibold text-on-background">${p.tradingsymbol}</td>
      <td class="pr-4 text-on-surface-variant">${Math.abs(p.quantity)}</td>
      <td class="pr-4 text-on-surface-variant">₹${(p.average_price||0).toLocaleString('en-IN',{maximumFractionDigits:2})}</td>
      <td class="pr-4 font-semibold text-on-background">₹${(p.last_price||0).toLocaleString('en-IN',{maximumFractionDigits:2})}</td>
      <td class="pr-4 text-on-surface-variant">₹${Math.abs((p.average_price||0)*Math.abs(p.quantity)).toLocaleString('en-IN',{maximumFractionDigits:0})}</td>
      <td class="pr-4 text-on-background">₹${Math.abs((p.last_price||0)*Math.abs(p.quantity)).toLocaleString('en-IN',{maximumFractionDigits:0})}</td>
      <td class="pr-4 font-bold" style="color:${c}">${sign}₹${Math.abs(pnl).toLocaleString('en-IN',{maximumFractionDigits:0})}</td>
      <td class="pr-4 font-bold" style="color:${c}">${sign}${p.pnl ? (p.pnl/Math.max((p.average_price||1)*Math.abs(p.quantity),1)*100).toFixed(2) : '—'}%</td>
      <td>
        <div class="flex gap-2">
          <button class="text-[11px] px-3 py-1 rounded-full font-bold" style="background:rgba(78,222,163,0.15);color:#4edea3;border:1px solid rgba(78,222,163,0.3)" onclick="showOrderModal('BUY')">Buy</button>
          <button class="text-[11px] px-3 py-1 rounded-full font-bold" style="background:rgba(255,180,171,0.15);color:#ffb4ab;border:1px solid rgba(255,180,171,0.3)" onclick="showOrderModal('SELL')">Sell</button>
        </div>
      </td>
    </tr>`;
  }).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  renderPositionsTable();
  renderPnlChart('1W');
  renderAllocChart();
  renderTradeHistory();
  // Live update estimates
  ['order-qty','order-price'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', updateOrderEst);
  });
});
