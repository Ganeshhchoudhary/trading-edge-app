// ─── SETTINGS PAGE ─────────────────────────────────────────────────────────────

const SYS_SERVICES = [
  { name:'NSE Bridge Server',    host:'localhost:5001', status:'online',  latency:'12ms',  detail:'Python Flask · Live tick streaming' },
  { name:'Strategy API Server',  host:'localhost:5002', status:'online',  latency:'8ms',   detail:'FastAPI · Model inference endpoint'  },
  { name:'Kite Connect API',     host:'api.kite.trade', status:'online',  latency:'45ms',  detail:'Zerodha · Order routing & positions'  },
  { name:'Google Gemini API',    host:'generativelanguage.googleapis.com', status:'online', latency:'320ms', detail:'Gemini 2.0 Flash · Sentiment analysis' },
  { name:'Edge AI Runtime',      host:'On-device',      status:'online',  latency:'42ms',  detail:'ONNX Runtime · Local inference'       },
  { name:'Twitter Sentiment API',host:'api.twitter.com',status:'offline', latency:'—',     detail:'Rate limit exceeded · Will retry 16:00' },
];

function toggleVis(id) {
  const inp = document.getElementById(id);
  inp.type = inp.type === 'password' ? 'text' : 'password';
}

function renderSysStatus() {
  const el = document.getElementById('sys-status');
  el.innerHTML = SYS_SERVICES.map(s => {
    const c  = s.status==='online' ? '#4edea3' : '#ffb4ab';
    const dot = s.status==='online' ? 'online' : 'offline';
    return `
    <div class="p-4 rounded-xl bg-surface-container border border-outline-variant hover-lift">
      <div class="flex justify-between items-start mb-2">
        <span class="text-h3 font-semibold text-on-background">${s.name}</span>
        <span class="status-dot ${dot}"></span>
      </div>
      <div class="text-body-sm text-on-surface-variant mb-1">${s.host}</div>
      <div class="text-body-sm text-on-surface-variant mb-3">${s.detail}</div>
      <div class="flex justify-between items-center">
        <span class="text-label-caps font-bold uppercase" style="color:${c}">${s.status}</span>
        <span class="text-data-mono text-on-surface-variant">Latency: ${s.latency}</span>
      </div>
    </div>`;
  }).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  renderSysStatus();
});
