// ─── CHART HELPERS ────────────────────────────────────────────────────────────

Chart.defaults.color = '#c7c4d7';
Chart.defaults.borderColor = 'rgba(70,69,85,0.4)';
Chart.defaults.font.family = 'Inter';

function mkSparkline(id, data, color) {
  const canvas = document.getElementById(id);
  if (!canvas) return;
  const rising = data[data.length-1] >= data[0];
  const c = rising ? '#4edea3' : '#ffb4ab';
  return new Chart(canvas, {
    type: 'line',
    data: {
      labels: data.map((_,i)=>i),
      datasets: [{ data, borderColor: c, borderWidth: 1.5, pointRadius: 0,
        fill: true, backgroundColor: (ctx) => {
          const g = ctx.chart.ctx.createLinearGradient(0,0,0,40);
          g.addColorStop(0, c+'33'); g.addColorStop(1, c+'00');
          return g;
        }, tension: 0.4 }]
    },
    options: {
      responsive: true, animation: false,
      plugins: { legend: { display: false }, tooltip: { enabled: false } },
      scales: { x: { display: false }, y: { display: false } }
    }
  });
}

function mkAreaChart(id, labels, dataset, color='#c1c1ff', height=260) {
  const canvas = document.getElementById(id);
  if (!canvas) return null;
  canvas.height = height;
  return new Chart(canvas, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Price', data: dataset,
        borderColor: color, borderWidth: 2, pointRadius: 0,
        fill: true, tension: 0.3,
        backgroundColor: (ctx) => {
          const g = ctx.chart.ctx.createLinearGradient(0,0,0,height);
          g.addColorStop(0, color+'44'); g.addColorStop(1, color+'00');
          return g;
        }
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          mode: 'index', intersect: false,
          backgroundColor: '#1e2024', borderColor: '#464555', borderWidth: 1,
          titleColor: '#c7c4d7', bodyColor: '#e2e2e8', padding: 10
        }
      },
      scales: {
        x: { grid: { color: 'rgba(70,69,85,0.3)' }, ticks: { maxTicksLimit: 8, color: '#908fa0' } },
        y: { grid: { color: 'rgba(70,69,85,0.3)' }, ticks: { color: '#908fa0' } }
      }
    }
  });
}

function mkDonut(id, labels, data, colors) {
  const canvas = document.getElementById(id);
  if (!canvas) return;
  return new Chart(canvas, {
    type: 'doughnut',
    data: { labels, datasets: [{ data, backgroundColor: colors, borderWidth: 0, hoverOffset: 8 }] },
    options: {
      responsive: true, cutout: '70%',
      plugins: {
        legend: { position: 'bottom', labels: { padding: 16, font: { size: 12 } } },
        tooltip: { backgroundColor: '#1e2024', borderColor: '#464555', borderWidth: 1, padding: 10 }
      }
    }
  });
}

function mkBarChart(id, labels, data, color='#c1c1ff') {
  const canvas = document.getElementById(id);
  if (!canvas) return;
  return new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        data, backgroundColor: data.map(v => v >= 0 ? '#4edea3aa' : '#ffb4abaa'),
        borderColor:           data.map(v => v >= 0 ? '#4edea3'   : '#ffb4ab'),
        borderWidth: 1, borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false },
        tooltip: { backgroundColor:'#1e2024', borderColor:'#464555', borderWidth:1, padding:10 }
      },
      scales: {
        x: { grid: { display: false }, ticks: { color:'#908fa0', font:{ size:11 } } },
        y: { grid: { color:'rgba(70,69,85,0.3)' }, ticks: { color:'#908fa0' } }
      }
    }
  });
}
