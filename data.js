// ─── SHARED MOCK DATA ────────────────────────────────────────────────────────

const GAINERS = [
  { sym:'RELIANCE', name:'Reliance Industries', price:'2,941.50', chg:'+3.21%', vol:'12.4M' },
  { sym:'INFY',     name:'Infosys Ltd',         price:'1,542.80', chg:'+2.85%', vol:'8.1M'  },
  { sym:'TCS',      name:'Tata Consultancy',    price:'3,821.00', chg:'+2.40%', vol:'5.2M'  },
  { sym:'HDFCBANK', name:'HDFC Bank',           price:'1,628.95', chg:'+1.92%', vol:'10.7M' },
  { sym:'WIPRO',    name:'Wipro Ltd',           price:'482.35',   chg:'+1.74%', vol:'6.9M'  },
];

const LOSERS = [
  { sym:'ONGC',     name:'Oil & Natural Gas',   price:'265.40',   chg:'-2.14%', vol:'9.3M'  },
  { sym:'BPCL',     name:'BPCL',                price:'318.70',   chg:'-1.88%', vol:'7.2M'  },
  { sym:'COALINDIA',name:'Coal India',           price:'447.15',   chg:'-1.53%', vol:'4.4M'  },
  { sym:'NTPC',     name:'NTPC Ltd',            price:'382.60',   chg:'-1.21%', vol:'5.8M'  },
  { sym:'GAIL',     name:'GAIL India',          price:'198.80',   chg:'-0.97%', vol:'3.1M'  },
];

const POSITIONS = [
  { sym:'RELIANCE', qty:50,  avg:2840,   ltp:2941.50, pnl:'+₹5,075', pct:'+3.57%', dir:'up'   },
  { sym:'TCS',      qty:20,  avg:3750,   ltp:3821.00, pnl:'+₹1,420', pct:'+1.89%', dir:'up'   },
  { sym:'NIFTY FUT',qty:1,   avg:24100,  ltp:24461,   pnl:'+₹9,025', pct:'+1.50%', dir:'up'   },
  { sym:'ONGC',     qty:200, avg:272,    ltp:265.40,  pnl:'-₹1,320', pct:'-2.43%', dir:'down' },
];

const SIGNALS_FEED = [
  { time:'15:28', sym:'RELIANCE', signal:'BUY',  price:'₹2,938', conf:91, src:'Edge AI',  status:'Executed' },
  { time:'15:15', sym:'NIFTY',   signal:'HOLD',  price:'₹24,440',conf:76, src:'Gemini',   status:'Monitoring'},
  { time:'14:52', sym:'INFY',    signal:'BUY',   price:'₹1,534', conf:88, src:'Edge AI',  status:'Executed' },
  { time:'14:31', sym:'ONGC',    signal:'SELL',  price:'₹268',   conf:83, src:'Gemini',   status:'Executed' },
  { time:'13:47', sym:'TCS',     signal:'BUY',   price:'₹3,798', conf:79, src:'Edge AI',  status:'Executed' },
  { time:'13:10', sym:'HDFCBANK',signal:'HOLD',  price:'₹1,614', conf:62, src:'Gemini',   status:'Monitoring'},
  { time:'12:22', sym:'WIPRO',   signal:'BUY',   price:'₹476',   conf:71, src:'Edge AI',  status:'Executed' },
  { time:'11:55', sym:'BPCL',    signal:'SELL',  price:'₹325',   conf:85, src:'Gemini',   status:'Executed' },
];

const NSE_STOCKS = [
  'RELIANCE','TCS','HDFCBANK','INFY','HINDUNILVR','ICICIBANK','KOTAKBANK',
  'BAJFINANCE','SBIN','BHARTIARTL','LT','AXISBANK','ITC','ASIANPAINT','MARUTI',
  'WIPRO','HCLTECH','TECHM','ULTRACEMCO','TITAN','NESTLEIND','BAJAJFINSV','SUNPHARMA',
  'POWERGRID','NTPC','ONGC','COALINDIA','GAIL','BPCL','DRREDDY'
];

// Generate a sparkline dataset
function sparkData(base, pts=20, volatility=0.012, trend=1) {
  const d = [base];
  for (let i=1; i<pts; i++) {
    const change = d[i-1] * (1 + (Math.random()-0.5)*volatility + trend*0.001);
    d.push(parseFloat(change.toFixed(2)));
  }
  return d;
}

// Generate intraday candle-like line data (48 points = full day 5-min)
function intradayData(base, pts=78, vol=0.008) {
  return sparkData(base, pts, vol, 0.3);
}

// Clock
function startClock() {
  const el = document.getElementById('clock');
  if (!el) return;
  function tick() {
    const now = new Date();
    const h = now.getHours().toString().padStart(2,'0');
    const m = now.getMinutes().toString().padStart(2,'0');
    const s = now.getSeconds().toString().padStart(2,'0');
    el.textContent = `${h}:${m}:${s} IST`;
  }
  tick(); setInterval(tick, 1000);
}

// Toast
function showToast(msg, type='info') {
  const colors = { info:'#c1c1ff', success:'#4edea3', error:'#ffb4ab', warning:'#ffb95f' };
  const icons  = { info:'info', success:'check_circle', error:'error', warning:'warning' };
  const t = document.createElement('div');
  t.className = 'toast';
  t.innerHTML = `<span class="material-symbols-outlined" style="color:${colors[type]};font-size:18px">${icons[type]}</span><span>${msg}</span>`;
  document.body.appendChild(t);
  setTimeout(() => { t.classList.add('fade-out'); setTimeout(()=>t.remove(), 300); }, 3000);
}

// Format currency
function fmt(n) { return '₹' + parseFloat(n).toLocaleString('en-IN'); }

startClock();
