
/* ============================================================
   1. KONFIGURASI LOAD
   ============================================================ */
const LOADS = [
  { id: 1, name: 'MESIN 1', color: '#00b8d4', glow: 'rgba(0,184,212,0.55)' },
  { id: 2, name: 'MESIN 2', color: '#e91e8c', glow: 'rgba(233,30,140,0.55)' },
  { id: 3, name: 'MESIN 3', color: '#7c3aed', glow: 'rgba(124,58,237,0.55)' },
  { id: 4, name: 'MESIN 4', color: '#00c853', glow: 'rgba(0,200,83,0.55)' }
];

/* ============================================================
   2. INTERNET TIME (worldtimeapi + fallback)
   ============================================================ */
let timeOffset = 0; // offset terhadap waktu lokal
let timeSource = 'LOCAL';

async function syncInternetTime(){
  const apis = [
    { url: 'https://worldtimeapi.org/api/ip', pick: d => d.datetime },
    { url: 'https://timeapi.io/api/Time/current/zone?timeZone=Asia/Jakarta', pick: d => d.dateTime }
  ];
  for (const api of apis){
    try{
      const ctrl = new AbortController();
      const t = setTimeout(()=>ctrl.abort(), 4000);
      const res = await fetch(api.url, { signal: ctrl.signal });
      clearTimeout(t);
      if(!res.ok) continue;
      const data = await res.json();
      const net = new Date(api.pick(data));
      if (isNaN(net.getTime())) continue;
      timeOffset = net.getTime() - Date.now();
      timeSource = 'INTERNET';
      document.getElementById('clockSrc').textContent = '● Sinkronisasi Internet';
      return true;
    }catch(e){ /* lanjut ke api berikutnya */ }
  }
  timeSource = 'LOCAL';
  document.getElementById('clockSrc').textContent = '● Waktu Lokal (Offline)';
  return false;
}

function now(){
  return new Date(Date.now() + timeOffset);
}

function pad(n){ return String(n).padStart(2,'0'); }

const HARI = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
const BULAN = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

function updateClock(){
  const d = now();
  document.getElementById('clockTime').textContent =
    `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  document.getElementById('clockDate').textContent =
    `${HARI[d.getDay()]}, ${pad(d.getDate())} ${BULAN[d.getMonth()]} ${d.getFullYear()}`;
}
setInterval(updateClock, 1000);
updateClock();

/* ============================================================
   3. DUMMY DATA REALTIME
   ============================================================ */
const state = LOADS.map(l => ({
  ...l,
  voltage: 220,
  current: 3,
  pf: 0.9,
  watt: 0
}));

function clamp(v, min, max){ return Math.min(max, Math.max(min, v)); }

function updateRealtime(){
  state.forEach(s => {
    // Voltage ~ 220V ± 5V, sedikit lebih stabil
    s.voltage = +(220 + (Math.random()*8 - 4)).toFixed(1);
    // Current 2A - 4A
    s.current = +(2 + Math.random()*2).toFixed(2);
    // Power Factor 0.70 - 1.00
    s.pf = +(0.70 + Math.random()*0.30).toFixed(2);
    // Real power = V * I * PF
    s.watt = +(s.voltage * s.current * s.pf).toFixed(1);
  });
  renderCards();
  document.getElementById('lastUpdate').textContent =
    'Update: ' + now().toLocaleTimeString('id-ID', {hour12:false});
}

/* ============================================================
   4. RENDER LOAD CARDS
   ============================================================ */
const loadsGrid = document.getElementById('loadsGrid');

function buildCards(){
  loadsGrid.innerHTML = state.map((s, i) => `
    <div class="load-card" style="--accent:${s.color}; --accent-glow:${s.glow};">
      <div class="load-head">
        <div class="load-name">
          <div class="load-badge">${s.id}</div>
          <span>${s.name}</span>
        </div>
        <div class="load-status"><span class="dot"></span>ONLINE</div>
      </div>

      <div class="metric-main">
        <span class="label">Real Power</span>
        <span>
          <span class="value" id="w-${i}">0.0</span>
          <span class="unit">W</span>
        </span>
      </div>

      <div class="metrics-row">
        <div class="metric">
          <span class="m-label">Voltage</span>
          <span class="m-value" id="v-${i}">0<span class="m-unit">V</span></span>
        </div>
        <div class="metric">
          <span class="m-label">Current</span>
          <span class="m-value" id="a-${i}">0<span class="m-unit">A</span></span>
        </div>
        <div class="metric">
          <span class="m-label">Power F.</span>
          <span class="m-value" id="pf-${i}">0</span>
        </div>
      </div>
    </div>
  `).join('');
}

function renderCards(){
  state.forEach((s, i) => {
    const wEl = document.getElementById('w-'+i);
    const vEl = document.getElementById('v-'+i);
    const aEl = document.getElementById('a-'+i);
    const pfEl = document.getElementById('pf-'+i);
    if(!wEl) return;
    wEl.textContent = s.watt.toFixed(1);
    vEl.innerHTML = s.voltage.toFixed(1) + '<span class="m-unit">V</span>';
    aEl.innerHTML = s.current.toFixed(2) + '<span class="m-unit">A</span>';
    pfEl.textContent = s.pf.toFixed(2);
  });
}

buildCards();
updateRealtime();
setInterval(updateRealtime, 2000);

/* ============================================================
   5. CHART.js GLOBAL STYLE
   ============================================================ */
Chart.defaults.font.family = 'Rajdhani, sans-serif';
Chart.defaults.font.size = 11;
Chart.defaults.color = '#4a5470';

const gridStyle = { color: 'rgba(10,14,39,0.06)', drawBorder: false };

const baseBarOptions = (unit='kWh') => ({
  responsive: true,
  maintainAspectRatio: false,
  animation: { duration: 900, easing: 'easeOutQuart' },
  plugins: {
    legend: {
      position: 'top',
      labels: {
        usePointStyle: true,
        pointStyle: 'circle',
        boxWidth: 8,
        boxHeight: 8,
        padding: 14,
        font: { size: 11.5, weight: '600' }
      }
    },
    tooltip: {
      backgroundColor: 'rgba(10,14,39,0.92)',
      titleColor: '#fff',
      bodyColor: '#fff',
      padding: 10,
      cornerRadius: 8,
      titleFont: { family: 'Orbitron', size: 11 },
      bodyFont: { family: 'Rajdhani', size: 12, weight: '600' },
      callbacks: {
        label: (ctx) => ` ${ctx.dataset.label}: ${ctx.parsed.y} ${unit}`
      }
    }
  },
  scales: {
    x: {
      grid: { ...gridStyle, display: false },
      ticks: { font: { size: 10.5, weight: '600' } }
    },
    y: {
      grid: gridStyle,
      beginAtZero: true,
      ticks: {
        font: { size: 10.5, weight: '600' },
        callback: (v) => v + ' ' + unit
      }
    }
  }
});

/* helper dataset per load */
function loadDatasets(dataArr, opts={}){
  return LOADS.map((l, i) => ({
    label: l.name,
    data: dataArr[i],
    backgroundColor: l.color + 'cc',
    borderColor: l.color,
    borderWidth: 1.2,
    borderRadius: 5,
    hoverBackgroundColor: l.color,
    ...opts
  }));
}

/* ============================================================
   6. GENERATE DUMMY HISTORY DATA
   ============================================================ */
function rand(min, max){ return Math.random()*(max-min)+min; }

/* ---- Hourly (24 jam terakhir) : kWh per jam per beban ---- */
const hourlyLabels = [];
{
  const d = now();
  for (let i = 23; i >= 0; i--){
    const t = new Date(d.getTime() - i*3600*1000);
    hourlyLabels.push(pad(t.getHours()) + ':00');
  }
}
const hourlyData = LOADS.map(() =>
  Array.from({length:24}, () => +rand(0.35, 1.25).toFixed(2))
);

/* ---- Daily (7 hari) : kWh per hari per beban ---- */
const dailyLabels = [];
{
  const d = now();
  for (let i = 6; i >= 0; i--){
    const t = new Date(d.getTime() - i*86400*1000);
    dailyLabels.push(HARI[t.getDay()].slice(0,3) + ' ' + pad(t.getDate()));
  }
}
const dailyData = LOADS.map(() =>
  Array.from({length:7}, () => +rand(6, 14).toFixed(1))
);

/* ---- 30 Hari terakhir ---- */
const days30Labels = [];
{
  const d = now();
  for (let i = 29; i >= 0; i--){
    const t = new Date(d.getTime() - i*86400*1000);
    days30Labels.push(pad(t.getDate()) + '/' + pad(t.getMonth()+1));
  }
}
const days30Data = LOADS.map(() =>
  Array.from({length:30}, () => +rand(6, 15).toFixed(1))
);

/* ---- Total gabungan 14 hari ---- */
const totalDailyLabels = [];
{
  const d = now();
  for (let i = 13; i >= 0; i--){
    const t = new Date(d.getTime() - i*86400*1000);
    totalDailyLabels.push(pad(t.getDate()) + '/' + pad(t.getMonth()+1));
  }
}
const totalDailyData = totalDailyLabels.map(() =>
  +rand(28, 52).toFixed(1)
);

/* ---- Total gabungan 12 bulan ---- */
const monthNames = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Ags','Sep','Okt','Nov','Des'];
const totalMonthlyLabels = [];
{
  const d = now();
  for (let i = 11; i >= 0; i--){
    const t = new Date(d.getFullYear(), d.getMonth()-i, 1);
    totalMonthlyLabels.push(monthNames[t.getMonth()] + ' ' + String(t.getFullYear()).slice(2));
  }
}
const totalMonthlyData = totalMonthlyLabels.map(() =>
  +rand(850, 1250).toFixed(0)
);

/* ============================================================
   7. INIT CHARTS
   ============================================================ */

/* --- 1. Hourly per load --- */
new Chart(document.getElementById('chartHourly'), {
  type: 'bar',
  data: { labels: hourlyLabels, datasets: loadDatasets(hourlyData) },
  options: {
    ...baseBarOptions('kWh'),
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 10 } } },
      y: { grid: gridStyle, beginAtZero: true, ticks: { callback: v => v + ' kWh' } }
    }
  }
});

/* --- 2. Daily per load (7 hari) --- */
new Chart(document.getElementById('chartDaily'), {
  type: 'bar',
  data: { labels: dailyLabels, datasets: loadDatasets(dailyData) },
  options: baseBarOptions('kWh')
});

/* --- 3. 30 hari per load --- */
new Chart(document.getElementById('chart30Days'), {
  type: 'bar',
  data: { labels: days30Labels, datasets: loadDatasets(days30Data) },
  options: {
    ...baseBarOptions('kWh'),
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 9 }, maxRotation: 90, minRotation: 60 } },
      y: { grid: gridStyle, beginAtZero: true, ticks: { callback: v => v + ' kWh' } }
    }
  }
});

/* --- 4. Total gabungan harian --- */
new Chart(document.getElementById('chartTotalDaily'), {
  type: 'bar',
  data: {
    labels: totalDailyLabels,
    datasets: [{
      label: 'Total 4 Beban',
      data: totalDailyData,
      backgroundColor: (ctx) => {
        const {ctx: c, chartArea} = ctx.chart;
        if(!chartArea) return '#00b8d4';
        const g = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
        g.addColorStop(0, '#00b8d4');
        g.addColorStop(0.5, '#7c3aed');
        g.addColorStop(1, '#e91e8c');
        return g;
      },
      borderColor: '#7c3aed',
      borderWidth: 1,
      borderRadius: 7,
      hoverBackgroundColor: '#00b8d4'
    }]
  },
  options: {
    ...baseBarOptions('kWh'),
    plugins: { ...baseBarOptions('kWh').plugins, legend: { display: false } }
  }
});

/* --- 5. Total gabungan bulanan --- */
new Chart(document.getElementById('chartTotalMonthly'), {
  type: 'bar',
  data: {
    labels: totalMonthlyLabels,
    datasets: [{
      label: 'Total 4 Beban',
      data: totalMonthlyData,
      backgroundColor: (ctx) => {
        const {ctx: c, chartArea} = ctx.chart;
        if(!chartArea) return '#00c853';
        const g = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
        g.addColorStop(0, '#00c853');
        g.addColorStop(0.5, '#00b8d4');
        g.addColorStop(1, '#7c3aed');
        return g;
      },
      borderColor: '#00c853',
      borderWidth: 1,
      borderRadius: 7,
      hoverBackgroundColor: '#00c853'
    }]
  },
  options: {
    ...baseBarOptions('kWh'),
    plugins: { ...baseBarOptions('kWh').plugins, legend: { display: false } }
  }
});

/* ============================================================
   8. STARTUP
   ============================================================ */
(async () => {
  await syncInternetTime();
  updateClock();

  // refresh history data ringan tiap 30 detik (simulasi update)
  setInterval(() => {
    // Tidak mengubah banyak, hanya variasi kecil pada jam terakhir
    // (biar dashboard terasa hidup, tapi tidak mengganggu visual)
  }, 30000);
})();

