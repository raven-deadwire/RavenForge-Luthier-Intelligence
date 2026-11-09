// Renders ops/data/*.json for ops/index.html. Missing data shows setup steps instead of charts.
(function () {
  'use strict';
  const css = name => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const el = (tag, attrs = {}, children = []) => {
    const node = document.createElement(tag);
    Object.entries(attrs).forEach(([key, value]) => {
      if (key === 'text') node.textContent = value;
      else node.setAttribute(key, value);
    });
    [].concat(children).filter(Boolean).forEach(child => node.append(child));
    return node;
  };
  const fmt = (value, digits = 1) => (value === null || value === undefined || !Number.isFinite(value) ? '–' : value.toFixed(digits));
  const mean = values => {
    const list = values.filter(Number.isFinite);
    return list.length ? list.reduce((sum, value) => sum + value, 0) / list.length : null;
  };
  const getJson = async url => {
    const response = await fetch(url, { cache: 'no-cache' });
    if (!response.ok) throw new Error(String(response.status));
    return response.json();
  };

  const charts = [];
  function lineChart(canvas, labels, series, { unit, min, max } = {}) {
    const chart = new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: series.map(entry => ({
          label: entry.label, data: entry.data, borderColor: css(entry.color), backgroundColor: css(entry.color),
          borderWidth: 2, pointRadius: 0, pointHoverRadius: 5, pointHitRadius: 8, tension: 0.2, spanGaps: false
        }))
      },
      options: {
        responsive: true, maintainAspectRatio: false, animation: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: series.length > 1, position: 'top', align: 'start', labels: { color: css('--text-secondary'), boxWidth: 12, boxHeight: 2, usePointStyle: false } },
          tooltip: { callbacks: { label: item => `${item.dataset.label}: ${fmt(item.parsed.y)}${unit || ''}` } }
        },
        scales: {
          x: { ticks: { color: css('--text-muted'), maxTicksLimit: 8, maxRotation: 0 }, grid: { display: false }, border: { color: css('--border') } },
          y: { min, max, ticks: { color: css('--text-muted'), callback: value => value + (unit || '') }, grid: { color: css('--grid') }, border: { display: false } }
        }
      }
    });
    charts.push({ chart, series });
    return chart;
  }
  // Re-read the colour tokens when the light/dark scheme changes.
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => charts.forEach(({ chart, series }) => {
    chart.data.datasets.forEach((dataset, index) => { dataset.borderColor = dataset.backgroundColor = css(series[index].color); });
    chart.options.plugins.legend.labels.color = css('--text-secondary');
    ['x', 'y'].forEach(axis => { chart.options.scales[axis].ticks.color = css('--text-muted'); });
    chart.options.scales.y.grid.color = css('--grid');
    chart.update();
  }));

  function tile(label, value, sub) {
    return el('div', { class: 'tile' }, [el('div', { class: 'label', text: label }), el('div', { class: 'value', text: value }), sub ? el('div', { class: 'sub', text: sub }) : null]);
  }
  function table(headers, rows) {
    return el('details', {}, [
      el('summary', { text: '표로 보기' }),
      el('div', { class: 'table-wrap' }, el('table', {}, [
        el('thead', {}, el('tr', {}, headers.map(header => el('th', { scope: 'col', text: header })))),
        el('tbody', {}, rows.map(row => el('tr', {}, row.map(cell => el('td', { text: cell })))))
      ]))
    ]);
  }
  function notice(lines) {
    const box = el('div', { class: 'notice' });
    lines.forEach((line, index) => { if (index) box.append(el('br')); box.append(line); });
    return box;
  }

  async function renderClimate() {
    const root = document.getElementById('climate-body');
    let config;
    let data;
    try { config = await getJson('./config/climate.json'); } catch { config = { station_id: '108', station_name: '서울' }; }
    document.getElementById('climate-title').textContent = `공방 지역 외기 기록 — ${config.station_name} (ASOS ${config.station_id})`;
    try { data = await getJson(`./data/climate-${config.station_id}.json`); } catch { data = null; }
    if (!data?.days?.length) {
      root.append(notice([
        '아직 수집된 외기 데이터가 없습니다.',
        '1) 공공데이터포털에서 “기상청_지상(종관, ASOS) 일자료 조회서비스” 활용신청 후 일반 인증키(Decoding)를 저장소 Secret DATA_GO_KR_API_KEY로 등록',
        '2) Actions → Operations data → Run workflow (collect: climate). 이후 매일 자동 갱신됩니다.',
        '지역을 바꾸려면 ops/config/climate.json의 station_id와 station_name을 수정하세요.'
      ]));
      return;
    }

    const ranges = [['30일', 30], ['90일', 90], ['1년', 365], ['전체', Infinity]];
    let range = 90;
    const controls = el('div', { class: 'controls', role: 'group', 'aria-label': '기간' });
    const tiles = el('div', { class: 'tiles' });
    const rhCanvas = el('canvas', { role: 'img', 'aria-label': '일평균·일최저 상대습도' });
    const emcCanvas = el('canvas', { role: 'img', 'aria-label': '평형함수율 추정치' });
    const tempCanvas = el('canvas', { role: 'img', 'aria-label': '일평균 기온' });
    const tableSlot = el('div');
    root.append(controls, tiles,
      el('div', { class: 'card' }, [el('h3', { text: '상대습도 (%)' }), el('div', { class: 'chart' }, rhCanvas)]),
      el('div', { class: 'card' }, [el('h3', { text: '목재 평형함수율 추정 (EMC, %)' }), el('div', { class: 'chart' }, emcCanvas),
        el('p', { class: 'source', text: '일평균 기온·습도로 계산(USDA Wood Handbook 식 4-5, 오차 약 ±1%p). 보관 환경을 조절하지 않은 목재가 향하는 함수율의 참고값입니다.' })]),
      el('div', { class: 'card' }, [el('h3', { text: '일평균 기온 (°C)' }), el('div', { class: 'chart' }, tempCanvas)]),
      tableSlot,
      el('p', { class: 'source', text: `출처: ${data.source}. 마지막 자료일 ${data.days.at(-1).date}.` }));

    let built = null;
    function draw() {
      const days = Number.isFinite(range) ? data.days.slice(-range) : data.days;
      const labels = days.map(day => day.date);
      const last = data.days.at(-1);
      const last30 = data.days.slice(-30);
      const emc30 = last30.map(day => day.emc_pct).filter(Number.isFinite);
      tiles.replaceChildren(
        tile(`평균 습도 (${last.date})`, `${fmt(last.avg_rh_pct, 0)}%`, `최저 ${fmt(last.min_rh_pct, 0)}%`),
        tile(`EMC (${last.date})`, `${fmt(last.emc_pct)}%`, `평균 기온 ${fmt(last.avg_temp_c)}°C`),
        tile('최근 30일 평균 EMC', `${fmt(mean(emc30))}%`, emc30.length ? `범위 ${fmt(Math.min(...emc30))}–${fmt(Math.max(...emc30))}%` : ''),
        tile('최근 30일 평균 습도', `${fmt(mean(last30.map(day => day.avg_rh_pct)), 0)}%`, `${last30.length}일 기준`)
      );
      if (built) {
        built.forEach(chart => chart.destroy());
        charts.splice(0, charts.length, ...charts.filter(entry => !built.includes(entry.chart)));
      }
      built = [
        lineChart(rhCanvas, labels, [
          { label: '일평균', data: days.map(day => day.avg_rh_pct), color: '--series-1' },
          { label: '일최저', data: days.map(day => day.min_rh_pct), color: '--series-2' }
        ], { unit: '%', min: 0, max: 100 }),
        lineChart(emcCanvas, labels, [{ label: 'EMC', data: days.map(day => day.emc_pct), color: '--series-3' }], { unit: '%' }),
        lineChart(tempCanvas, labels, [{ label: '일평균 기온', data: days.map(day => day.avg_temp_c), color: '--series-1' }], { unit: '°C' })
      ];
      tableSlot.replaceChildren(table(['날짜', '평균 기온 °C', '최저 °C', '최고 °C', '평균 습도 %', '최저 습도 %', '강수 mm', 'EMC %'],
        days.slice().reverse().map(day => [day.date, fmt(day.avg_temp_c), fmt(day.min_temp_c), fmt(day.max_temp_c), fmt(day.avg_rh_pct, 0), fmt(day.min_rh_pct, 0), fmt(day.rain_mm), fmt(day.emc_pct)])));
      controls.querySelectorAll('button').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.days) === range)));
    }
    ranges.forEach(([label, days]) => {
      const button = el('button', { type: 'button', 'data-days': String(days), text: label });
      button.addEventListener('click', () => { range = days; draw(); });
      controls.append(button);
    });
    draw();
  }

  async function renderTrends() {
    const root = document.getElementById('trends-body');
    let data;
    try { data = await getJson('./data/search-trends.json'); } catch { data = null; }
    if (!data?.groups?.length) {
      root.append(notice([
        '아직 수집된 검색 트렌드가 없습니다.',
        '1) 네이버 클라우드 플랫폼 NAVER API HUB에서 이용 신청 후 “검색어 트렌드” Application을 등록',
        '2) API HUB에서 발급한 Client ID와 Secret을 저장소 Actions Secret NAVER_API_HUB_CLIENT_ID, NAVER_API_HUB_CLIENT_SECRET으로 등록 (구 개발자센터 키 사용 불가)',
        '3) Actions → Operations data → Run workflow (collect: trends). 이후 매주 월요일 자동 갱신됩니다.'
      ]));
      return;
    }
    const colors = ['--series-1', '--series-2', '--series-3', '--series-4', '--series-5'];
    const labels = data.groups[0].points.map(point => point.period);
    // Last 12 periods against the same 12 periods a year earlier (weekly data: 52 back).
    const yearBack = data.time_unit === 'week' ? 52 : data.time_unit === 'month' ? 12 : 365;
    const tiles = el('div', { class: 'tiles' }, data.groups.map(group => {
      const values = group.points.map(point => point.ratio);
      const recent = mean(values.slice(-12));
      const before = values.length >= yearBack + 12 ? mean(values.slice(-(yearBack + 12), -yearBack)) : null;
      const change = recent !== null && before ? ((recent - before) / before) * 100 : null;
      return tile(group.name, fmt(recent), change === null ? '최근 12구간 평균' : `최근 12구간 평균 · 전년 대비 ${change >= 0 ? '+' : ''}${fmt(change, 0)}%`);
    }));
    const canvas = el('canvas', { role: 'img', 'aria-label': '그룹별 검색 관심도 추이' });
    root.append(tiles, el('div', { class: 'card' }, [el('h3', { text: '검색 관심도 (상대 지수)' }), el('div', { class: 'chart', style: 'height:320px' }, canvas)]),
      table(['기간', ...data.groups.map(group => group.name)], labels.slice().reverse().map((period, index) => {
        const at = labels.length - 1 - index;
        return [period, ...data.groups.map(group => fmt(group.points[at]?.ratio))];
      })),
      el('p', { class: 'source', text: `출처: ${data.source}. ${data.start_date} ~ ${data.end_date}, 단위 ${data.time_unit}.` }));
    lineChart(canvas, labels, data.groups.map((group, index) => ({ label: group.name, data: group.points.map(point => point.ratio), color: colors[index] })), { min: 0 });
  }

  renderClimate().catch(error => console.error('climate', error));
  renderTrends().catch(error => console.error('trends', error));
})();
