/**
 * app.js  v2
 * 主な変更点:
 *   - 年齢層を「現在の勤続年数」ではなく「資格取得時点の年齢」で分類
 *   - SS7-1G / SS7-2G を統合（グループ別分析なし）
 *   - 生年月日カラムを使い、取得年月日との差分で取得時年齢を算出
 */

import {
  CSV_COLUMNS,
  CERT_CATEGORIES,
  DIFFICULTY_CONFIG,
  AGE_GROUPS,
  DISPLAY_CONFIG,
} from './config.js';

const { createApp, ref, computed, watch, nextTick } = Vue;

// =====================================================
// CSV パーサー（Shift-JIS / UTF-8 自動判定）
// =====================================================
async function parseCSVFile(file) {
  const tryDecode = (buf, enc) => {
    try { return new TextDecoder(enc, { fatal: true }).decode(buf); } catch { return null; }
  };
  const buffer = await file.arrayBuffer();
  const text =
    tryDecode(buffer, 'utf-8') ||
    tryDecode(buffer, 'shift-jis') ||
    tryDecode(buffer, 'euc-jp') ||
    new TextDecoder('shift-jis').decode(buffer);

  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const headers = parseCSVLine(lines[0]);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const vals = parseCSVLine(lines[i]);
    const row = {};
    headers.forEach((h, idx) => { row[h.trim()] = (vals[idx] || '').trim(); });
    rows.push(row);
  }
  return rows;
}

function parseCSVLine(line) {
  const result = []; let cur = ''; let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') { if (inQ && line[i+1] === '"') { cur += '"'; i++; } else { inQ = !inQ; } }
    else if (c === ',' && !inQ) { result.push(cur); cur = ''; }
    else { cur += c; }
  }
  result.push(cur);
  return result;
}

// =====================================================
// 日付ユーティリティ
// =====================================================
function parseDate(str) {
  if (!str) return null;
  const m = String(str).match(/(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  if (!m) return null;
  return new Date(+m[1], +m[2] - 1, +m[3]);
}

function calcAgeAt(acquiredDateStr, birthDateStr) {
  const acq  = parseDate(acquiredDateStr);
  const born = parseDate(birthDateStr);
  if (!acq || !born) return null;
  let age = acq.getFullYear() - born.getFullYear();
  const mo = acq.getMonth() - born.getMonth();
  if (mo < 0 || (mo === 0 && acq.getDate() < born.getDate())) age--;
  return age;
}

function getYear(dateStr) {
  const d = parseDate(dateStr);
  return d ? d.getFullYear() : null;
}

// =====================================================
// 分類ユーティリティ
// =====================================================
function classifyCategory(certName) {
  const name = certName || '';
  for (const cat of CERT_CATEGORIES) {
    if (cat.key === 'other') continue;
    if (cat.namePatterns.some(p => name.toLowerCase().includes(p.toLowerCase()))) return cat.key;
  }
  return 'other';
}

function classifyDifficulty(certName, categoryKey) {
  const config = DIFFICULTY_CONFIG[categoryKey];
  if (!config) return 'other';
  const name = certName || '';
  for (const lv of config.levels) {
    if (lv.namePatterns.some(p => name.toLowerCase().includes(p.toLowerCase()))) return lv.key;
  }
  return config.levels[0]?.key || 'other';
}

function classifyAgeGroupByAge(ageAtAcquisition) {
  if (ageAtAcquisition === null) return AGE_GROUPS[AGE_GROUPS.length - 1].key;
  for (const g of AGE_GROUPS) {
    if (ageAtAcquisition >= g.minAge && ageAtAcquisition <= g.maxAge) return g.key;
  }
  return AGE_GROUPS[AGE_GROUPS.length - 1].key;
}

function transformRows(rawRows) {
  return rawRows.map(row => {
    const certName     = row[CSV_COLUMNS.certName] || '';
    const acquiredDate = row[CSV_COLUMNS.acquiredDate] || '';
    const birthDate    = row[CSV_COLUMNS.birthDate] || '';
    const categoryKey  = classifyCategory(certName);
    const ageAtAcq     = calcAgeAt(acquiredDate, birthDate);
    return {
      memberId:         row[CSV_COLUMNS.memberId] || '',
      certName,
      acquiredYear:     getYear(acquiredDate),
      categoryKey,
      difficultyKey:    classifyDifficulty(certName, categoryKey),
      ageGroupKey:      classifyAgeGroupByAge(ageAtAcq),
      ageAtAcquisition: ageAtAcq,
      gender:           row[CSV_COLUMNS.gender] || '',
    };
  }).filter(r => r.acquiredYear && r.memberId);
}

// =====================================================
// Chart.js ヘルパー
// =====================================================
const chartInstances = {};
function destroyChart(id) {
  if (chartInstances[id]) { chartInstances[id].destroy(); delete chartInstances[id]; }
}
function buildChart(id, config) {
  destroyChart(id);
  const el = document.getElementById(id);
  if (!el) return;
  chartInstances[id] = new Chart(el.getContext('2d'), config);
}

// =====================================================
// Vue アプリ
// =====================================================
createApp({
  setup() {
    const records         = ref([]);
    const isDragging      = ref(false);
    const activeTab       = ref('overview');
    const selectedDiffCat = ref(CERT_CATEGORIES.filter(c => c.key !== 'other')[0]?.key || 'it');
    const errorMsg        = ref('');

    const years = computed(() => {
      if (!records.value.length) return [];
      const ys = [...new Set(records.value.map(r => r.acquiredYear))].sort();
      const start = DISPLAY_CONFIG.yearRange?.start || ys[0];
      const end   = DISPLAY_CONFIG.yearRange?.end   || ys[ys.length - 1];
      const result = [];
      for (let y = start; y <= end; y++) result.push(y);
      return result;
    });

    const members = computed(() => [...new Set(records.value.map(r => r.memberId))]);

    const totalCerts      = computed(() => records.value.length);
    const memberCount     = computed(() => members.value.length);
    const avgPerMember    = computed(() =>
      memberCount.value ? (totalCerts.value / memberCount.value).toFixed(1) : 0
    );
    const recentYearCount = computed(() => {
      const y = new Date().getFullYear();
      return records.value.filter(r => r.acquiredYear >= y - 1).length;
    });

    const categorySummary = computed(() =>
      CERT_CATEGORIES.map(cat => {
        const count = records.value.filter(r => r.categoryKey === cat.key).length;
        const pct   = totalCerts.value ? Math.round(count / totalCerts.value * 100) : 0;
        return { ...cat, count, pct };
      }).filter(c => c.count > 0)
    );

    const memberSummary = computed(() =>
      members.value
        .map(id => ({ id, count: records.value.filter(r => r.memberId === id).length }))
        .sort((a, b) => b.count - a.count)
    );

    const trendData = computed(() =>
      years.value.map(y => records.value.filter(r => r.acquiredYear === y).length)
    );

    const ageGroupData = computed(() =>
      AGE_GROUPS.map(g => ({
        ...g,
        data: years.value.map(y =>
          records.value.filter(r => r.acquiredYear === y && r.ageGroupKey === g.key).length
        ),
      }))
    );

    const levelData = computed(() => {
      const config = DIFFICULTY_CONFIG[selectedDiffCat.value];
      if (!config) return [];
      const catRecs = records.value.filter(r => r.categoryKey === selectedDiffCat.value);
      return config.levels.map(lv => ({
        ...lv,
        data: years.value.map(y =>
          catRecs.filter(r => r.acquiredYear === y && r.difficultyKey === lv.key).length
        ),
      }));
    });

    const currentLevelInsight = computed(() => {
      const cat    = CERT_CATEGORIES.find(c => c.key === selectedDiffCat.value);
      const config = DIFFICULTY_CONFIG[selectedDiffCat.value];
      if (!config || !cat) return '';
      const total    = records.value.filter(r => r.categoryKey === selectedDiffCat.value).length;
      const advanced = records.value.filter(
        r => r.categoryKey === selectedDiffCat.value && r.difficultyKey === DISPLAY_CONFIG.advancedLevelKey
      ).length;
      const advPct = total ? Math.round(advanced / total * 100) : 0;
      return `${cat.label}カテゴリ 計${total}件 / うち上位資格 ${advanced}件（${advPct}%）`;
    });

    const heatmapData = computed(() =>
      CERT_CATEGORIES.filter(c => c.key !== 'other').map(cat => ({
        ...cat,
        memberCounts: members.value.map(id =>
          records.value.filter(r => r.memberId === id && r.categoryKey === cat.key).length
        ),
      }))
    );

    const stepData = computed(() =>
      CERT_CATEGORIES.filter(c => DIFFICULTY_CONFIG[c.key]?.levels?.length > 1).map(cat => {
        const total    = records.value.filter(r => r.categoryKey === cat.key).length;
        const advanced = records.value.filter(
          r => r.categoryKey === cat.key && r.difficultyKey === DISPLAY_CONFIG.advancedLevelKey
        ).length;
        const advPct = total ? Math.round(advanced / total * 100) : 0;
        return { label: cat.label, color: cat.color, advPct, begPct: 100 - advPct };
      })
    );

    // ---------- ファイル読み込み ----------
    async function loadFile(file) {
      errorMsg.value = '';
      if (!file || !file.name.endsWith('.csv')) { errorMsg.value = 'CSVファイルを選択してください'; return; }
      try {
        const raw = await parseCSVFile(file);
        records.value = transformRows(raw);
        if (!records.value.length)
          errorMsg.value = 'データが読み込めませんでした。config.js の CSV_COLUMNS を確認してください。';
      } catch (e) {
        errorMsg.value = '読み込みエラー: ' + e.message;
      }
    }

    const onFileInput = e => loadFile(e.target.files[0]);
    const onDrop      = e => { isDragging.value = false; loadFile(e.dataTransfer.files[0]); };

    // ---------- チャート描画 ----------
    function drawOverviewCharts() {
      nextTick(() => {
        buildChart('chart-donut', {
          type: 'doughnut',
          data: {
            labels: categorySummary.value.map(c => c.label),
            datasets: [{ data: categorySummary.value.map(c => c.count), backgroundColor: categorySummary.value.map(c => c.color), borderWidth: 2, borderColor: 'transparent' }],
          },
          options: { responsive: true, maintainAspectRatio: false, cutout: '60%', plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${ctx.raw}件` } } } },
        });
        buildChart('chart-member-bar', {
          type: 'bar',
          data: {
            labels: memberSummary.value.map(m => m.id),
            datasets: [{ data: memberSummary.value.map(m => m.count), backgroundColor: '#378ADD', borderRadius: 3, borderWidth: 0 }],
          },
          options: {
            indexAxis: 'y', responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { x: { grid: { color: 'rgba(120,120,120,0.1)' }, beginAtZero: true }, y: { grid: { display: false }, ticks: { font: { size: 11 } } } },
          },
        });
      });
    }

    function drawTrendChart() {
      nextTick(() => {
        const maxY = new Date().getFullYear() - 1;
        buildChart('chart-trend', {
          type: 'bar',
          data: { labels: years.value.map(String), datasets: [{ data: trendData.value, backgroundColor: years.value.map(y => y > maxY ? '#E24B4A' : '#378ADD'), borderRadius: 4, borderWidth: 0 }] },
          options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => ` ${c.raw}件` } } },
            scales: { x: { grid: { display: false }, ticks: { font: { size: 11 } } }, y: { grid: { color: 'rgba(120,120,120,0.1)' }, beginAtZero: true, ticks: { stepSize: 1 } } },
          },
        });
      });
    }

    function drawAgeChart() {
      nextTick(() => {
        buildChart('chart-age', {
          type: 'bar',
          data: { labels: years.value.map(String), datasets: ageGroupData.value.map(g => ({ label: g.label, data: g.data, backgroundColor: g.color, borderWidth: 0 })) },
          options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false }, tooltip: { mode: 'index' } },
            scales: { x: { stacked: true, grid: { display: false }, ticks: { font: { size: 11 } } }, y: { stacked: true, grid: { color: 'rgba(120,120,120,0.1)' }, beginAtZero: true } },
          },
        });
      });
    }

    function drawLevelChart() {
      nextTick(() => {
        buildChart('chart-level', {
          type: 'bar',
          data: { labels: years.value.map(String), datasets: levelData.value.map(lv => ({ label: lv.label, data: lv.data, backgroundColor: lv.color, borderWidth: 0 })) },
          options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false }, tooltip: { mode: 'index' } },
            scales: { x: { stacked: true, grid: { display: false }, ticks: { font: { size: 11 } } }, y: { stacked: true, grid: { color: 'rgba(120,120,120,0.1)' }, beginAtZero: true } },
          },
        });
      });
    }

    function drawStepChart() {
      nextTick(() => {
        buildChart('chart-step', {
          type: 'bar',
          data: {
            labels: stepData.value.map(s => s.label),
            datasets: [
              { label: '初級止まり',  data: stepData.value.map(s => s.begPct), backgroundColor: '#D3D1C7', borderWidth: 0 },
              { label: '上位移行済み', data: stepData.value.map(s => s.advPct), backgroundColor: '#378ADD', borderWidth: 0 },
            ],
          },
          options: {
            indexAxis: 'y', responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => ` ${c.dataset.label}: ${c.raw}%` } } },
            scales: { x: { stacked: true, max: 100, ticks: { callback: v => v + '%', font: { size: 11 } }, grid: { color: 'rgba(120,120,120,0.1)' } }, y: { stacked: true, grid: { display: false }, ticks: { font: { size: 11 } } } },
          },
        });
      });
    }

    watch(activeTab, tab => {
      if (tab === 'overview') drawOverviewCharts();
      if (tab === 'trend')    drawTrendChart();
      if (tab === 'age')      drawAgeChart();
      if (tab === 'level')    drawLevelChart();
      if (tab === 'gap')      drawStepChart();
    });
    watch(selectedDiffCat, () => { if (activeTab.value === 'level') drawLevelChart(); });
    watch(records, () => {
      nextTick(() => {
        if (activeTab.value === 'overview') drawOverviewCharts();
        if (activeTab.value === 'trend')    drawTrendChart();
        if (activeTab.value === 'age')      drawAgeChart();
        if (activeTab.value === 'level')    drawLevelChart();
        if (activeTab.value === 'gap')      drawStepChart();
      });
    });

    function heatColor(catColor, value, maxVal) {
      if (value === 0) return { bg: '#D3D1C7', opacity: 0.2 };
      return { bg: catColor, opacity: 0.15 + (value / (maxVal || 1)) * 0.85 };
    }
    function maxCountInCat(cat) { return Math.max(...cat.memberCounts, 1); }

    return {
      records, isDragging, activeTab, selectedDiffCat, errorMsg,
      CERT_CATEGORIES, DIFFICULTY_CONFIG, AGE_GROUPS, DISPLAY_CONFIG,
      years, members,
      totalCerts, memberCount, avgPerMember, recentYearCount,
      categorySummary, memberSummary, heatmapData, stepData,
      currentLevelInsight, levelData,
      onFileInput, onDrop, heatColor, maxCountInCat,
    };
  },
}).mount('#app');
