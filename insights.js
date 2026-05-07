// ─── INSIGHTS PAGE ─────────────────────────────────────────────────────────────

const SIGNAL_CARDS = [
  {
    dir:'up', icon:'trending_up', color:'#4edea3', bg:'#1a2f26', borderColor:'secondary',
    title:'Alpha Signal: QQQ Breakout', badge:'HIGH CONFIDENCE', badgeClass:'badge-high',
    asset:'NASDAQ-100 Trust', pct:'+1.45%', pctColor:'#4edea3',
    quote:'"Gemini predicts long-term bullish trend due to earnings beats in mega-cap tech. Minimal macroeconomic headwinds in current quarter."',
    borderQuote:'#c1c1ff',
    meta:[ {icon:'article', label:'News Vol: High'}, {icon:'forum', label:'Social Sent: +42'} ]
  },
  {
    dir:'down', icon:'trending_down', color:'#ffb4ab', bg:'#2a1b1a', borderColor:'error',
    title:'Risk Alert: Energy Sector', badge:'MODERATE', badgeClass:'badge-medium',
    asset:'XLE / ONGC / BPCL', pct:'-0.82%', pctColor:'#ffb4ab',
    quote:'"Edge AI detects short-term downside pressure from anomalous inventory build-up reports flagged in pre-market data streams."',
    borderQuote:'#ffb4ab',
    meta:[ {icon:'article', label:'News Vol: Med'}, {icon:'forum', label:'Social Sent: -15'} ]
  },
  {
    dir:'neutral', icon:'swap_horiz', color:'#ffb95f', bg:'#2a2318', borderColor:'tertiary',
    title:'Neutral Pattern: Gold / GLD', badge:'MONITOR', badgeClass:'badge-neutral',
    asset:'GLD / GOLDBEES', pct:'0.00%', pctColor:'#ffb95f',
    quote:'"Consolidation phase detected. Gemini suggests wait-and-see pending upcoming RBI &amp; Fed policy announcements next week."',
    borderQuote:'#ffb95f',
    meta:[ {icon:'article', label:'News Vol: Low'}, {icon:'forum', label:'Social Sent: +2'} ]
  },
  {
    dir:'up', icon:'show_chart', color:'#c1c1ff', bg:'#1a1a2f', borderColor:'primary',
    title:'Breakout Watch: RELIANCE', badge:'WATCH', badgeClass:'badge-high',
    asset:'RELIANCE / NSE', pct:'+3.21%', pctColor:'#c1c1ff',
    quote:'"Strong institutional accumulation signal detected. EMA 9 crossed 21 on 15-min chart with above-average volume. ATH retest likely."',
    borderQuote:'#c1c1ff',
    meta:[ {icon:'article', label:'News Vol: High'}, {icon:'forum', label:'Social Sent: +67'} ]
  },
];

const GEMINI_BULLETS = [
  { icon:'trending_up',   color:'#4edea3', text:'IT sector showing strong momentum; INFY and TCS both above 52-week MA.' },
  { icon:'warning',       color:'#ffb95f', text:'Energy stocks face headwinds — global crude inventory surplus widening.' },
  { icon:'account_balance',color:'#c1c1ff',text:'FII inflows resumed: ₹4,200 Cr net buy in cash segment over 3 days.' },
  { icon:'psychology',    color:'#4edea3', text:'Retail sentiment index at 68 — approaching greed zone, monitor for reversal.' },
  { icon:'bolt',          color:'#ffb95f', text:'India VIX elevated at 14.8; options premium inflated — prefer spreads.' },
];

const NEWS_ITEMS = [
  { sentiment:'bullish', time:'2m ago',  src:'Economic Times', title:'RBI holds rates; signals accommodative stance through Q3', score:'+82' },
  { sentiment:'bullish', time:'8m ago',  src:'Moneycontrol',   title:'RELIANCE Q4 results beat estimates; Jio subscriber growth 12% YoY', score:'+91' },
  { sentiment:'bearish', time:'15m ago', src:'Bloomberg',      title:'Crude oil futures drop 2.3% on surprise US inventory build', score:'-74' },
  { sentiment:'neutral', time:'22m ago', src:'Reuters',        title:'SEBI proposes new F&O margin norms — industry awaits final circular', score:'+5' },
  { sentiment:'bullish', time:'34m ago', src:'NSE',            title:'Nifty IT index outperforms; TCS upgrades guidance for FY26', score:'+78' },
  { sentiment:'bearish', time:'51m ago', src:'Mint',           title:'ONGC production misses target amid field maintenance shutdown', score:'-62' },
  { sentiment:'neutral', time:'1h ago',  src:'Business Line',  title:'India Q4 GDP growth at 6.7% — in line with consensus expectations', score:'+12' },
  { sentiment:'bullish', time:'1.2h ago',src:'CNBC-TV18',      title:'FIIs turn net buyers after 3 weeks of selling; DII also positive', score:'+88' },
];

let activeTab = 'short';
let newsFilter = 'all';
let sentimentInterval;

function switchTab(tab) {
  activeTab = tab;
  document.getElementById('tab-short').classList.toggle('active', tab==='short');
  document.getElementById('tab-long').classList.toggle('active', tab==='long');
  renderSignals();
}

function renderSignals() {
  const c = document.getElementById('signals-container');
  const cards = activeTab === 'short' ? SIGNAL_CARDS.slice(0,3) : SIGNAL_CARDS;
  c.innerHTML = cards.map(s => `
    <div class="glass-panel rounded-xl p-4 hover-lift glow-on-hover transition-all cursor-pointer">
      <div class="flex justify-between items-start mb-3">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style="background:${s.bg};border:1px solid ${s.color}55">
            <span class="material-symbols-outlined" style="color:${s.color}">${s.icon}</span>
          </div>
          <div>
            <h3 class="text-h3 font-semibold text-on-background flex flex-wrap items-center gap-2">
              ${s.title}
              <span class="${s.badgeClass}">${s.badge}</span>
            </h3>
            <span class="text-data-mono text-on-surface-variant">Asset: ${s.asset}</span>
          </div>
        </div>
        <span class="text-data-mono font-bold shrink-0" style="color:${s.pctColor}">${s.pct}</span>
      </div>
      <div class="pl-[52px]">
        <p class="text-body-sm text-on-surface-variant border-l-2 pl-3 italic mb-3" style="border-color:${s.borderQuote}">${s.quote}</p>
        <div class="flex gap-4 text-label-caps text-on-surface-variant flex-wrap">
          ${s.meta.map(m=>`<span class="flex items-center gap-1"><span class="material-symbols-outlined" style="font-size:14px">${m.icon}</span>${m.label}</span>`).join('')}
        </div>
      </div>
    </div>
  `).join('');
}

function renderSentimentChart() {
  const days = ['Mon','Tue','Wed','Thu','Fri','Mon','Tue'];
  const data  = [42, 55, 48, 63, 71, 67, 68];
  const c = document.getElementById('sentiment-chart');
  if (!c) return;
  new Chart(c, {
    type: 'line',
    data: {
      labels: days,
      datasets: [{
        label: 'Sentiment',
        data, borderColor: '#4edea3', borderWidth: 2.5,
        pointRadius: 5, pointBackgroundColor: '#4edea3', pointBorderColor: '#111317',
        fill: true, tension: 0.4,
        backgroundColor: (ctx) => {
          const g = ctx.chart.ctx.createLinearGradient(0,0,0,180);
          g.addColorStop(0,'rgba(78,222,163,0.3)'); g.addColorStop(1,'rgba(78,222,163,0)');
          return g;
        }
      },{
        label: 'Fear Zone',
        data: [30,30,30,30,30,30,30],
        borderColor:'rgba(255,180,171,0.4)', borderWidth:1, borderDash:[6,4],
        pointRadius:0, fill:false
      },{
        label: 'Greed Zone',
        data: [70,70,70,70,70,70,70],
        borderColor:'rgba(78,222,163,0.4)', borderWidth:1, borderDash:[6,4],
        pointRadius:0, fill:false
      }]
    },
    options: {
      responsive:true,
      plugins:{
        legend:{ labels:{ padding:16, font:{ size:12 } } },
        tooltip:{ backgroundColor:'#1e2024', borderColor:'#464555', borderWidth:1, padding:10 }
      },
      scales:{
        x:{ grid:{ color:'rgba(70,69,85,0.3)' }, ticks:{ color:'#908fa0' } },
        y:{ min:0, max:100, grid:{ color:'rgba(70,69,85,0.3)' }, ticks:{ color:'#908fa0' } }
      }
    }
  });
}

function renderGeminiBullets() {
  const el = document.getElementById('gemini-bullets');
  el.innerHTML = GEMINI_BULLETS.map(b => `
    <div class="flex items-start gap-3 p-3 rounded-lg hover:bg-surface-container transition-colors">
      <span class="material-symbols-outlined shrink-0 mt-0.5" style="color:${b.color};font-size:18px">${b.icon}</span>
      <p class="text-body-sm text-on-surface-variant">${b.text}</p>
    </div>
  `).join('');
}

async function refreshGemini() {
  const btn = document.getElementById('refresh-btn');
  btn.innerHTML = `<span class="material-symbols-outlined text-[18px] animate-spin">refresh</span>Analyzing...`;
  btn.disabled = true;
  try {
    // Try to fetch real predictions from backend for key symbols
    const symbols = ['RELIANCE', 'INFY', 'TCS', 'HDFCBANK'];
    const results = await Promise.allSettled(symbols.map(s => apiGetPrediction(s)));
    const bullets = results
      .filter(r => r.status === 'fulfilled')
      .map(r => r.value)
      .map(p => {
        const icon = p.signal === 'BULLISH' ? 'trending_up' : p.signal === 'BEARISH' ? 'trending_down' : 'remove';
        const color = p.signal === 'BULLISH' ? '#4edea3' : p.signal === 'BEARISH' ? '#ffb4ab' : '#ffb95f';
        return { icon, color, text: `${p.symbol}: ${p.signal} · Predicted ₹${p.predicted_price.toFixed(2)} (${p.predicted_change_pct >= 0 ? '+' : ''}${p.predicted_change_pct.toFixed(2)}%) · CNN-LSTM model` };
      });
    if (bullets.length > 0) {
      const el = document.getElementById('gemini-bullets');
      el.innerHTML = bullets.map(b => `
        <div class="flex items-start gap-3 p-3 rounded-lg hover:bg-surface-container transition-colors">
          <span class="material-symbols-outlined shrink-0 mt-0.5" style="color:${b.color};font-size:18px">${b.icon}</span>
          <p class="text-body-sm text-on-surface-variant">${b.text}</p>
        </div>
      `).join('');
      showToast('Predictions refreshed from backend', 'success');
    } else {
      renderGeminiBullets();
      showToast('Backend offline — showing cached analysis', 'warning');
    }
  } catch (e) {
    renderGeminiBullets();
    showToast('Backend offline — showing cached analysis', 'warning');
  } finally {
    btn.innerHTML = `<span class="material-symbols-outlined text-[18px]">refresh</span>Refresh Analysis`;
    btn.disabled = false;
  }
}

function filterNews(filter, btn) {
  newsFilter = filter;
  document.querySelectorAll('#news-filter .tab-pill').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderNews();
}

function renderNews() {
  const items = newsFilter === 'all' ? NEWS_ITEMS : NEWS_ITEMS.filter(n => n.sentiment === newsFilter);
  const el = document.getElementById('news-list');
  el.innerHTML = items.map(n => {
    const c = n.sentiment==='bullish' ? '#4edea3' : n.sentiment==='bearish' ? '#ffb4ab' : '#ffb95f';
    const ic = n.sentiment==='bullish' ? 'trending_up' : n.sentiment==='bearish' ? 'trending_down' : 'remove';
    return `
    <div class="glass-panel rounded-xl p-4 hover-lift glow-on-hover cursor-pointer flex gap-3">
      <div class="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mt-0.5" style="background:${c}15;border:1px solid ${c}40">
        <span class="material-symbols-outlined text-[18px]" style="color:${c}">${ic}</span>
      </div>
      <div class="flex-grow min-w-0">
        <p class="text-h3 font-semibold text-on-background leading-snug mb-1">${n.title}</p>
        <div class="flex items-center gap-3 flex-wrap">
          <span class="text-label-caps text-on-surface-variant">${n.src}</span>
          <span class="text-label-caps text-on-surface-variant">·</span>
          <span class="text-label-caps text-on-surface-variant">${n.time}</span>
          <span class="text-label-caps font-bold" style="color:${c}">Sentiment: ${n.score}</span>
        </div>
      </div>
    </div>`;
  }).join('');
}

function animateGauge() {
  // Oscillate sentiment between 60–75
  let val = 68;
  let dir = 1;
  setInterval(() => {
    val += dir * (Math.random() * 0.8);
    if (val > 74) dir = -1;
    if (val < 62) dir = 1;
    const v = Math.round(val);
    document.getElementById('sentiment-score').textContent = `${v} / 100`;
    const label = v >= 75 ? 'Extreme Greed' : v >= 60 ? 'Greed (Bullish Bias)' : v >= 45 ? 'Neutral' : v >= 30 ? 'Fear' : 'Extreme Fear';
    document.getElementById('sentiment-label').textContent = label;
    // Rotate needle: 0=left(-90deg), 100=right(90deg) — mapped to -80..80deg
    const deg = -80 + (val / 100) * 160;
    const needle = document.getElementById('gauge-needle');
    if (needle) needle.style.transform = `translateX(-50%) rotate(${deg}deg)`;
  }, 1500);
}

function updateTime() {
  const el = document.getElementById('update-time');
  let s = 2;
  setInterval(() => {
    s++;
    el.textContent = s < 60 ? `Last update: ${s}s ago` : `Last update: ${Math.floor(s/60)}m ago`;
  }, 1000);
}

document.addEventListener('DOMContentLoaded', () => {
  renderSignals();
  renderSentimentChart();
  renderGeminiBullets();
  renderNews();
  animateGauge();
  updateTime();
  generateQR();
});

function generateQR() {
  const el = document.getElementById('qr-code');
  if (!el || typeof QRCode === 'undefined') return;
  // Encode the actual network IP so the mobile scanner can connect
  let host = window.location.hostname;
  if (!host || host === 'localhost' || host === '127.0.0.1') {
    host = '172.20.10.8'; // Use your local network IPv4 address
  }
  const backendUrl = `http://${host}:8000`;
  el.innerHTML = '';
  new QRCode(el, {
    text: backendUrl,
    width: 128,
    height: 128,
    colorDark: '#000000',
    colorLight: '#ffffff',
    correctLevel: QRCode.CorrectLevel.M,
  });
  // Show the URL below the QR
  const urlLabel = document.getElementById('qr-url-label');
  if (urlLabel) urlLabel.textContent = backendUrl;
}
