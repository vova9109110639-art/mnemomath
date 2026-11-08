/* МнемоМатика — «Опыты»: 12 интерактивных сцен. Каждая: mount({stage, ctl, out}) → функция очистки.
   sin — розовый, cos — голубой, tg — жёлтый, «ок» — зелёный. */
(function () {
  'use strict';
  const LAB = (window.LAB = { sims: [] });
  const U = () => FM.util;
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const dec = (step) => (String(step).split('.')[1] || '').length;
  const num = (x, d) => (+(+x).toFixed(d == null ? 2 : d)).toString().replace('.', ',').replace('-', '−');
  const rad = (d) => (d * Math.PI) / 180, deg = (r) => (r * 180) / Math.PI;
  const SIN = '#ff9ad5', COS = '#7db8ff', TAN = '#ffd166', OK = '#6ee7a5', WHITE = '#fff';

  const slider = (id, label, min, max, step, val, unit) =>
    '<label class="sl"><span>' + label + ' <b id="' + id + '-v">' + num(val, dec(step)) + '</b> ' + unit + '</span><input type="range" id="' + id + '" min="' + min + '" max="' + max + '" step="' + step + '" value="' + val + '"></label>';
  function bind(ctl, ids, on) {
    const get = () => Object.fromEntries(ids.map((id) => [id, +ctl.querySelector('#' + id).value]));
    ids.forEach((id) => {
      const inp = ctl.querySelector('#' + id), out = ctl.querySelector('#' + id + '-v'), d = dec(inp.step);
      inp.addEventListener('input', () => { out.textContent = num(inp.value, d); on(get(), id); if (window.FX) FX.sfx('move'); });
    });
    return get;
  }
  function loop(fn) {
    let alive = true, raf = 0, last = performance.now();
    const step = (ts) => { if (!alive) return; const dt = Math.min(0.05, (ts - last) / 1000); last = ts; fn(dt, ts / 1000); raf = requestAnimationFrame(step); };
    raf = requestAnimationFrame(step);
    return () => { alive = false; cancelAnimationFrame(raf); };
  }
  const svg = (w, h, inner) => '<svg viewBox="0 0 ' + w + ' ' + h + '" class="svg" role="img" aria-label="опыт">' + inner + '</svg>';
  const DEFS = '<defs><marker id="ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="3.4" markerHeight="3.4" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="context-stroke"/></marker></defs>';
  const set = (el, o) => { for (const k in o) el.setAttribute(k, o[k]); };
  const T = (x, y, s, fill, size, anchor, extra) => '<text x="' + x + '" y="' + y + '" fill="' + (fill || WHITE) + '" font-size="' + (size || 14) + '" text-anchor="' + (anchor || 'start') + '" ' + (extra || '') + '>' + s + '</text>';
  const L = (x1, y1, x2, y2, col, w, extra) => '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="' + col + '" stroke-width="' + (w || 2) + '" ' + (extra || '') + '/>';
  const pts = (arr) => arr.map((p) => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
  const poly = (arr, fill, stroke, w) => '<polygon points="' + pts(arr) + '" fill="' + fill + '" stroke="' + (stroke || 'none') + '" stroke-width="' + (w || 1.5) + '" stroke-linejoin="round"/>';
  const rect = (x, y, w, h, fill, stroke) => '<rect x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + Math.max(0, w).toFixed(1) + '" height="' + Math.max(0, h).toFixed(1) + '" fill="' + fill + '" stroke="' + (stroke || 'rgba(255,255,255,.7)') + '" stroke-width="1.5"/>';
  const add = (s) => LAB.sims.push(s);
  /* перетаскивание точки: возвращает координаты курсора в системе svg */
  function dragger(svgEl, onMove) {
    let on = false;
    const pos = (e) => { const p = svgEl.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svgEl.getScreenCTM().inverse()); };
    svgEl.addEventListener('pointerdown', (e) => { on = true; svgEl.setPointerCapture(e.pointerId); const p = pos(e); onMove(p.x, p.y); });
    svgEl.addEventListener('pointermove', (e) => { if (!on) return; const p = pos(e); onMove(p.x, p.y); });
    svgEl.addEventListener('pointerup', () => { on = false; });
    svgEl.addEventListener('pointercancel', () => { on = false; });
  }
  /* координатная сетка: x0..x1, y0..y1, шаг по x и y, отображение P */
  function grid(P, x0, x1, y0, y1, sx, sy) {
    let g = '';
    for (let x = Math.ceil(x0 / sx) * sx; x <= x1 + 1e-9; x += sx) g += L(P.X(x), P.Y(y0), P.X(x), P.Y(y1), 'rgba(255,255,255,' + (Math.abs(x) < 1e-9 ? '.7' : '.12') + ')', Math.abs(x) < 1e-9 ? 2 : 1);
    for (let y = Math.ceil(y0 / sy) * sy; y <= y1 + 1e-9; y += sy) g += L(P.X(x0), P.Y(y), P.X(x1), P.Y(y), 'rgba(255,255,255,' + (Math.abs(y) < 1e-9 ? '.7' : '.12') + ')', Math.abs(y) < 1e-9 ? 2 : 1);
    return g;
  }

  /* ============ 1. Единичная окружность ============ */
  add({
    id: 'circle', icon: '🎡', name: 'Единичная окружность', fid: 'circ-xy', f: 'M(cosα; sinα)',
    tip: 'Потяни жёлтую точку мышкой или пальцем. Её координаты — это (cos α; sin α). Смотри на знаки по четвертям: они совпадают с таблицей справа.',
    mount(c) {
      const W = 640, H = 360, CX = 190, CY = 180, R = 130;
      let ticks = '';
      [0, 30, 45, 60, 90, 120, 135, 150, 180, 210, 225, 240, 270, 300, 315, 330].forEach((a) => { const x = CX + R * Math.cos(rad(a)), y = CY - R * Math.sin(rad(a)), lx = CX + (R + 22) * Math.cos(rad(a)), ly = CY - (R + 22) * Math.sin(rad(a)); ticks += '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="3" fill="#fff" opacity=".7"/>' + T(lx.toFixed(1), (ly + 4).toFixed(1), a + '°', WHITE, 11, 'middle', 'opacity=".65"'); });
      const rows = [['I', '+', '+', '+'], ['II', '+', '−', '−'], ['III', '−', '−', '+'], ['IV', '−', '+', '−']];
      let table = T(470, 70, 'sin', SIN, 15, 'middle') + T(520, 70, 'cos', COS, 15, 'middle') + T(570, 70, 'tg', TAN, 15, 'middle');
      rows.forEach((r, i) => { const y = 108 + i * 44; table += '<rect class="qrow" id="q' + i + '" x="395" y="' + (y - 24) + '" width="220" height="36" rx="10" fill="rgba(255,255,255,.07)"/>' + T(412, y, r[0], WHITE, 16, 'start', 'font-weight="700"') + T(470, y, r[1], r[1] === '+' ? OK : '#ff7b7b', 20, 'middle') + T(520, y, r[2], r[2] === '+' ? OK : '#ff7b7b', 20, 'middle') + T(570, y, r[3], r[3] === '+' ? OK : '#ff7b7b', 20, 'middle'); });
      c.stage.innerHTML = svg(W, H, DEFS + L(CX - R - 30, CY, CX + R + 30, CY, 'rgba(255,255,255,.6)') + L(CX, CY - R - 30, CX, CY + R + 30, 'rgba(255,255,255,.6)') +
        '<circle cx="' + CX + '" cy="' + CY + '" r="' + R + '" fill="rgba(255,255,255,.06)" stroke="#fff" stroke-width="2.5"/>' + ticks +
        '<polygon id="tri" fill="rgba(255,255,255,.14)"/><line id="lx" stroke="' + COS + '" stroke-width="5" stroke-linecap="round"/><line id="ly" stroke="' + SIN + '" stroke-width="5" stroke-linecap="round"/><line id="rd" stroke="#fff" stroke-width="2.5"/>' +
        '<path id="arc" fill="none" stroke="' + TAN + '" stroke-width="3"/><circle id="pt" r="10" fill="' + TAN + '" stroke="#fff" stroke-width="2.5" style="cursor:grab"/>' +
        '<text id="tc" fill="' + COS + '" font-size="14" text-anchor="middle"/><text id="ts" fill="' + SIN + '" font-size="14"/>' + T(440, 40, 'знаки по четвертям', WHITE, 14, 'start', 'opacity=".8"') + table);
      c.ctl.innerHTML = slider('a', 'Угол α', 0, 360, 1, 40, '°') + '<div class="presets" id="pr">' + [30, 45, 60, 90, 120, 180, 270].map((v) => '<button class="ghost sm" data-a="' + v + '">' + v + '°</button>').join('') + '</div>';
      const q = (s) => c.stage.querySelector(s), svgEl = c.stage.querySelector('svg'), slider_ = c.ctl.querySelector('#a');
      let a = 40;
      const upd = () => {
        const x = Math.cos(rad(a)), y = Math.sin(rad(a)), px = CX + R * x, py = CY - R * y;
        set(q('#pt'), { cx: px, cy: py }); set(q('#rd'), { x1: CX, y1: CY, x2: px, y2: py }); set(q('#lx'), { x1: CX, y1: CY, x2: px, y2: CY }); set(q('#ly'), { x1: px, y1: CY, x2: px, y2: py });
        q('#tri').setAttribute('points', pts([[CX, CY], [px, CY], [px, py]]));
        const ar = 26, ex = CX + ar * x, ey = CY - ar * y; q('#arc').setAttribute('d', 'M' + (CX + ar) + ',' + CY + ' A' + ar + ',' + ar + ' 0 ' + (a > 180 ? 1 : 0) + ' 0 ' + ex.toFixed(1) + ',' + ey.toFixed(1));
        set(q('#tc'), { x: ((CX + px) / 2).toFixed(1), y: (CY + (y >= 0 ? 20 : -10)).toFixed(1) }); q('#tc').textContent = 'cos α';
        set(q('#ts'), { x: (px + (x >= 0 ? 10 : -48)).toFixed(1), y: ((CY + py) / 2 + 4).toFixed(1) }); q('#ts').textContent = 'sin α';
        const qi = a === 360 ? 3 : Math.min(3, Math.floor(a / 90));
        for (let i = 0; i < 4; i++) q('#q' + i).setAttribute('fill', i === qi ? 'rgba(255,209,102,.35)' : 'rgba(255,255,255,.07)');
        const tg = Math.abs(x) < 1e-9 ? 'не определён' : num(y / x, 3);
        c.out.innerHTML = U().math('cosα = x = ' + num(x, 3)) + '<br>' + U().math('sinα = y = ' + num(y, 3)) + '<div class="mini">tg α = ' + tg + ' · α = ' + a + '° = ' + FM.piStr(a / 180) + ' рад · ' + ['I', 'II', 'III', 'IV'][qi] + ' четверть</div>';
      };
      const setA = (v) => { a = clamp(Math.round(v), 0, 360); slider_.value = a; c.ctl.querySelector('#a-v').textContent = a; upd(); };
      dragger(svgEl, (mx, my) => { let d = deg(Math.atan2(CY - my, mx - CX)); if (d < 0) d += 360; setA(d); });
      bind(c.ctl, ['a'], (g) => { a = g.a; upd(); });
      c.ctl.querySelectorAll('[data-a]').forEach((b) => (b.onclick = () => setA(+b.dataset.a)));
      upd();
      return loop(() => {});
    }
  });

  /* ============ 2. Прямоугольный треугольник ============ */
  add({
    id: 'triangle', icon: '📐', name: 'Треугольник: синус и косинус', fid: 'sin-def',
    tip: 'Измени размер гипотенузы — отношения a/c, b/c, a/b не поменяются, они зависят только от угла. Включи второй (подобный) треугольник и убедись.',
    mount(c) {
      const W = 640, H = 330, OX = 56, OY = 290, S = 23;
      c.stage.innerHTML = svg(W, H, DEFS + '<polygon id="t2" fill="rgba(255,209,102,.18)" stroke="' + TAN + '" stroke-width="2" stroke-dasharray="6 5"/><polygon id="t1" fill="rgba(125,184,255,.2)" stroke="#fff" stroke-width="3" stroke-linejoin="round"/>' +
        '<path id="ra" fill="none" stroke="#fff" stroke-width="2"/><path id="ar" fill="none" stroke="' + TAN + '" stroke-width="3"/><text id="la" fill="' + SIN + '" font-size="18" font-weight="700"/><text id="lb" fill="' + COS + '" font-size="18" font-weight="700"/><text id="lc" fill="#fff" font-size="18" font-weight="700"/><text id="lal" fill="' + TAN + '" font-size="18" font-weight="700">α</text>' +
        '<g id="box"/>');
      c.ctl.innerHTML = slider('al', 'Угол α', 5, 85, 1, 35, '°') + slider('cc', 'Гипотенуза c', 3, 12, 0.5, 9, 'см') + '<div class="presets"><button class="ghost sm" id="sim">▫ Подобный треугольник: выкл</button></div>';
      const q = (s) => c.stage.querySelector(s);
      let al = 35, cc = 9, sim = false;
      const upd = () => {
        const a = cc * Math.sin(rad(al)), b = cc * Math.cos(rad(al)), A = [OX, OY], B = [OX + b * S, OY], C = [OX + b * S, OY - a * S];
        q('#t1').setAttribute('points', pts([A, B, C])); const k = 0.5; q('#t2').setAttribute('points', sim ? pts([A, [OX + b * S * k, OY], [OX + b * S * k, OY - a * S * k]]) : '');
        const r = 14; q('#ra').setAttribute('d', 'M' + (B[0] - r) + ',' + B[1] + ' L' + (B[0] - r) + ',' + (B[1] - r) + ' L' + B[0] + ',' + (B[1] - r));
        const ar = 38; q('#ar').setAttribute('d', 'M' + (OX + ar) + ',' + OY + ' A' + ar + ',' + ar + ' 0 0 0 ' + (OX + ar * Math.cos(rad(al))).toFixed(1) + ',' + (OY - ar * Math.sin(rad(al))).toFixed(1));
        set(q('#lal'), { x: OX + 50, y: OY - 10 }); q('#la').textContent = 'a'; set(q('#la'), { x: B[0] + 12, y: (B[1] + C[1]) / 2 + 6 });
        q('#lb').textContent = 'b'; set(q('#lb'), { x: (A[0] + B[0]) / 2 - 4, y: OY + 24 }); q('#lc').textContent = 'c'; set(q('#lc'), { x: (A[0] + C[0]) / 2 - 22, y: (A[1] + C[1]) / 2 - 8 });
        q('#box').innerHTML = T(400, 70, 'sinα = a/c = ' + num(a, 2) + '/' + num(cc, 1) + ' = ' + num(Math.sin(rad(al)), 3), SIN, 17) + T(400, 110, 'cosα = b/c = ' + num(b, 2) + '/' + num(cc, 1) + ' = ' + num(Math.cos(rad(al)), 3), COS, 17) + T(400, 150, 'tgα = a/b = ' + num(a, 2) + '/' + num(b, 2) + ' = ' + num(a / b, 3), TAN, 17) + (sim ? T(400, 200, 'Малый треугольник: те же отношения', TAN, 14) : '');
        c.out.innerHTML = U().math('sinα = {a|c} = ' + num(Math.sin(rad(al)), 3)) + '<div class="mini">a = c·sinα = ' + num(a, 2) + ' см · b = c·cosα = ' + num(b, 2) + ' см · α = ' + al + '°, 90° − α = ' + (90 - al) + '°</div>';
      };
      bind(c.ctl, ['al', 'cc'], (g) => { al = g.al; cc = g.cc; upd(); });
      c.ctl.querySelector('#sim').onclick = (e) => { sim = !sim; e.target.textContent = '▫ Подобный треугольник: ' + (sim ? 'вкл' : 'выкл'); e.target.classList.toggle('on', sim); upd(); };
      upd();
      return loop(() => {});
    }
  });

  /* ============ 3. Синусоида из окружности ============ */
  add({
    id: 'wave', icon: '🎢', name: 'Синусоида из окружности', fid: 'sin-graph', f: 'y = sin x',
    tip: 'Точка бегает по окружности, а её высота рисует синусоиду. Переключись на косинус: теперь «рисует» горизонтальная координата. Поставь на паузу и двигай угол.',
    mount(c) {
      const W = 640, H = 340, CX = 120, CY = 170, R = 80, GX = 250, GW = 370, GH = 80;
      const gx = (t) => GX + (t / (2 * Math.PI)) * GW;
      c.stage.innerHTML = svg(W, H, DEFS + '<circle cx="' + CX + '" cy="' + CY + '" r="' + R + '" fill="rgba(255,255,255,.06)" stroke="#fff" stroke-width="2"/>' + L(CX - R - 14, CY, CX + R + 14, CY, 'rgba(255,255,255,.5)') + L(CX, CY - R - 14, CX, CY + R + 14, 'rgba(255,255,255,.5)') +
        L(GX, CY, GX + GW + 10, CY, 'rgba(255,255,255,.6)') + L(GX, CY - GH - 20, GX, CY + GH + 20, 'rgba(255,255,255,.6)') + [0.5, 1, 1.5, 2].map((k) => L(gx(k * Math.PI), CY - 5, gx(k * Math.PI), CY + 5, '#fff') + T(gx(k * Math.PI), CY + 22, k === 1 ? 'π' : k === 2 ? '2π' : k === 0.5 ? 'π/2' : '3π/2', WHITE, 12, 'middle', 'opacity=".7"')).join('') +
        T(GX + GW + 8, CY - GH - 4, '1', WHITE, 12, 'start', 'opacity=".7"') + T(GX + GW + 8, CY + GH + 12, '−1', WHITE, 12, 'start', 'opacity=".7"') +
        '<path id="curve" fill="none" stroke="' + SIN + '" stroke-width="3.5"/><line id="rd" stroke="#fff" stroke-width="2.5"/><line id="proj" stroke-dasharray="5 5" stroke-width="2"/><line id="conn" stroke="rgba(255,255,255,.6)" stroke-width="1.5" stroke-dasharray="4 4"/><circle id="pt" r="8" fill="' + TAN + '" stroke="#fff" stroke-width="2"/><circle id="gp" r="7" fill="' + TAN + '" stroke="#fff" stroke-width="2"/>' + '<text id="lbl" x="' + (GX + 8) + '" y="30" fill="#fff" font-size="18" font-weight="600"/>');
      c.ctl.innerHTML = '<div class="presets" id="fn"><button class="ghost sm on" data-f="sin">sin</button><button class="ghost sm" data-f="cos">cos</button><button class="ghost sm" id="play">⏸ Пауза</button></div>' + slider('t', 'Угол', 0, 360, 1, 40, '°');
      const q = (s) => c.stage.querySelector(s);
      let t = rad(40), fn = 'sin', run = true;
      const val = (tt) => (fn === 'sin' ? Math.sin(tt) : Math.cos(tt));
      const curve = () => { let d = ''; for (let k = 0; k <= 120; k++) { const tt = (k / 120) * 2 * Math.PI; d += (k ? 'L' : 'M') + gx(tt).toFixed(1) + ',' + (CY - val(tt) * GH).toFixed(1); } q('#curve').setAttribute('d', d); q('#curve').setAttribute('stroke', fn === 'sin' ? SIN : COS); q('#proj').setAttribute('stroke', fn === 'sin' ? SIN : COS); };
      const upd = () => {
        const x = Math.cos(t), y = Math.sin(t), px = CX + R * x, py = CY - R * y, gv = val(t), gyy = CY - gv * GH;
        set(q('#pt'), { cx: px, cy: py }); set(q('#rd'), { x1: CX, y1: CY, x2: px, y2: py });
        if (fn === 'sin') set(q('#proj'), { x1: px, y1: py, x2: px, y2: CY }); else set(q('#proj'), { x1: px, y1: py, x2: CX, y2: py });
        set(q('#gp'), { cx: gx(t), cy: gyy }); set(q('#conn'), fn === 'sin' ? { x1: px, y1: py, x2: gx(t), y2: gyy } : { x1: px, y1: py, x2: gx(t), y2: gyy });
        q('#lbl').textContent = 'y = ' + fn + ' x = ' + num(gv, 3) + '   (x = ' + Math.round(deg(t)) + '°)';
        c.out.innerHTML = U().math(fn + 'α = ' + num(gv, 3)) + '<div class="mini">α = ' + Math.round(deg(t)) + '° = ' + FM.piStr(deg(t) / 180) + ' рад · один оборот = 2π ≈ 6,28 — период</div>';
        c.ctl.querySelector('#t').value = Math.round(deg(t)); c.ctl.querySelector('#t-v').textContent = Math.round(deg(t));
      };
      bind(c.ctl, ['t'], (g) => { t = rad(g.t); run = false; c.ctl.querySelector('#play').textContent = '▶ Играть'; upd(); });
      c.ctl.querySelectorAll('[data-f]').forEach((b) => (b.onclick = () => { fn = b.dataset.f; c.ctl.querySelectorAll('[data-f]').forEach((x) => x.classList.toggle('on', x === b)); curve(); upd(); }));
      c.ctl.querySelector('#play').onclick = (e) => { run = !run; e.target.textContent = run ? '⏸ Пауза' : '▶ Играть'; };
      curve(); upd();
      return loop((dt) => { if (!run) return; t = (t + dt * 0.9) % (2 * Math.PI); upd(); });
    }
  });

  /* ============ 4. Преобразования графика ============ */
  add({
    id: 'transform', icon: '🎛️', name: 'График y = A·sin(ωx + φ) + k', fid: 'transform', f: 'y = A·sin(ωx + φ) + k',
    tip: 'Крути ручки: A растягивает по вертикали, ω сжимает по горизонтали, φ сдвигает влево или вправо, k поднимает весь график. Серым показан обычный синус.',
    mount(c) {
      const W = 640, H = 330, P = { X: (x) => 320 + x * 46, Y: (y) => 165 - y * 34 };
      c.stage.innerHTML = svg(W, H, DEFS + grid(P, -6.5, 6.5, -4.6, 4.6, Math.PI, 1) + '<path id="ref" fill="none" stroke="rgba(255,255,255,.35)" stroke-width="2" stroke-dasharray="5 5"/><path id="cv" fill="none" stroke="' + SIN + '" stroke-width="4"/>' + '<line id="mid" stroke="' + TAN + '" stroke-width="1.5" stroke-dasharray="6 5"/>' +
        [-2, -1, 1, 2].map((k) => T(P.X(k * Math.PI), P.Y(0) + 17, (k === 1 ? '' : k === -1 ? '−' : k) + 'π', WHITE, 12, 'middle', 'opacity=".7"')).join('') + T(P.X(0) + 6, P.Y(4) + 4, '4', WHITE, 11, 'start', 'opacity=".6"') + T(P.X(0) + 6, P.Y(-4) + 4, '−4', WHITE, 11, 'start', 'opacity=".6"'));
      c.ctl.innerHTML = slider('A', 'Амплитуда A', 0.5, 3, 0.5, 2, '') + slider('w', 'Частота ω', 0.5, 4, 0.5, 1, '') + slider('ph', 'Фаза φ', -3.1, 3.1, 0.1, 0, 'рад') + slider('k', 'Сдвиг вверх k', -2, 2, 0.5, 0, '');
      const q = (s) => c.stage.querySelector(s);
      let A = 2, w = 1, ph = 0, k = 0;
      const path = (f) => { let d = ''; for (let i = 0; i <= 260; i++) { const x = -6.5 + (13 * i) / 260, y = f(x); d += (i ? 'L' : 'M') + P.X(x).toFixed(1) + ',' + clamp(P.Y(y), -20, 350).toFixed(1); } return d; };
      const upd = () => {
        q('#cv').setAttribute('d', path((x) => A * Math.sin(w * x + ph) + k)); q('#ref').setAttribute('d', path((x) => Math.sin(x)));
        set(q('#mid'), { x1: P.X(-6.5), x2: P.X(6.5), y1: P.Y(k), y2: P.Y(k) });
        const T_ = (2 * Math.PI) / w;
        c.out.innerHTML = U().math('y = ' + num(A, 1) + '·sin(' + num(w, 1) + 'x ' + (ph < 0 ? '−' : '+') + ' ' + num(Math.abs(ph), 1) + ') ' + (k < 0 ? '−' : '+') + ' ' + num(Math.abs(k), 1)) + '<div class="mini">период T = 2π/ω = ' + FM.piStr(T_ / Math.PI) + ' · сдвиг по x: ' + num(-ph / w, 2) + ' · max = ' + num(A + k, 1) + ', min = ' + num(-A + k, 1) + '</div>';
      };
      bind(c.ctl, ['A', 'w', 'ph', 'k'], (g) => { A = g.A; w = g.w; ph = g.ph; k = g.k; upd(); });
      upd();
      return loop(() => {});
    }
  });

  /* ============ 5. sin² + cos² = 1 ============ */
  add({
    id: 'identity', icon: '🏛️', name: 'Теорема Пифагора на окружности', fid: 'pyth-id',
    tip: 'Квадрат на гипотенузе имеет площадь 1 (радиус окружности = 1). Квадраты на катетах — cos²α и sin²α. Какой бы угол ни выбрал, они вместе дают тот же квадрат.',
    mount(c) {
      const W = 640, H = 360, OX = 170, OY = 280, S = 150;
      c.stage.innerHTML = svg(W, H, DEFS + '<g id="sq"/><polygon id="tr" fill="rgba(255,255,255,.18)" stroke="#fff" stroke-width="3" stroke-linejoin="round"/><g id="tx"/>');
      c.ctl.innerHTML = slider('a', 'Угол α', 5, 85, 1, 35, '°');
      const q = (s) => c.stage.querySelector(s);
      let a = 35;
      const upd = () => {
        const co = Math.cos(rad(a)), si = Math.sin(rad(a)), O = [OX, OY], A = [OX + co * S, OY], P = [A[0], OY - si * S], dx = P[0] - O[0], dy = P[1] - O[1], n = [dy, -dx];
        const sqH = [O, A, [A[0], A[1] + co * S], [O[0], O[1] + co * S]], sqV = [A, P, [P[0] + si * S, P[1]], [A[0] + si * S, A[1]]], sqY = [O, P, [P[0] + n[0], P[1] + n[1]], [O[0] + n[0], O[1] + n[1]]];
        q('#sq').innerHTML = poly(sqY, 'rgba(255,209,102,.28)', TAN, 2) + poly(sqH, 'rgba(125,184,255,.38)', COS, 2) + poly(sqV, 'rgba(255,154,213,.38)', SIN, 2);
        q('#tr').setAttribute('points', pts([O, A, P]));
        const cen = (poly_) => [poly_.reduce((s, p) => s + p[0], 0) / 4, poly_.reduce((s, p) => s + p[1], 0) / 4];
        const cH = cen(sqH), cV = cen(sqV), cY = cen(sqY);
        q('#tx').innerHTML = T(cH[0], cH[1] + 5, 'cos²α = ' + num(co * co, 3), COS, 15, 'middle', 'font-weight="700"') + T(cV[0], cV[1] - 4, 'sin²α', SIN, si * S > 40 ? 15 : 11, 'middle', 'font-weight="700"') + T(cV[0], cV[1] + 14, num(si * si, 3), SIN, si * S > 40 ? 13 : 10, 'middle') + T(cY[0], cY[1], '1² = 1', TAN, 17, 'middle', 'font-weight="700"') + T(440, 60, 'cos²α + sin²α', WHITE, 17) + T(440, 90, num(co * co, 3) + ' + ' + num(si * si, 3) + ' = ' + num(co * co + si * si, 3), OK, 20, 'start', 'font-weight="700"');
        c.out.innerHTML = U().math('sin^2α + cos^2α = ' + num(si * si, 3) + ' + ' + num(co * co, 3) + ' = 1') + '<div class="mini">Гипотенуза равна радиусу = 1, катеты: cos α = ' + num(co, 3) + ', sin α = ' + num(si, 3) + '</div>';
      };
      bind(c.ctl, ['a'], (g) => { a = g.a; upd(); });
      upd();
      return loop(() => {});
    }
  });

  /* ============ 6. Теорема косинусов ============ */
  add({
    id: 'lawcos', icon: '🗼', name: 'Теорема косинусов', fid: 'law-cos',
    tip: 'При C = 90° теорема превращается в Пифагора. Меньше 90° — сторона c короче «пифагоровой», больше 90° — длиннее: поправка −2ab·cos C меняет знак.',
    mount(c) {
      const W = 640, H = 330, CXp = 250, CYp = 270, S = 27;
      c.stage.innerHTML = svg(W, H, DEFS + '<polygon id="tr" fill="rgba(125,184,255,.2)" stroke="#fff" stroke-width="3" stroke-linejoin="round"/><path id="arc" fill="none" stroke="' + TAN + '" stroke-width="3"/><g id="lab"/><g id="bars"/>');
      c.ctl.innerHTML = slider('a', 'Сторона a', 2, 9, 0.5, 6, 'см') + slider('b', 'Сторона b', 2, 9, 0.5, 8, 'см') + slider('C', 'Угол C между ними', 10, 170, 1, 60, '°') + '<div class="presets"><button class="ghost sm" data-C="90">C = 90° (Пифагор)</button></div>';
      const q = (s) => c.stage.querySelector(s);
      let a = 6, b = 8, C = 60;
      const upd = () => {
        const Cc = [CXp, CYp], A = [CXp + b * S, CYp], B = [CXp + a * S * Math.cos(rad(C)), CYp - a * S * Math.sin(rad(C))], c2 = a * a + b * b - 2 * a * b * Math.cos(rad(C)), cc = Math.sqrt(c2), pyth = a * a + b * b;
        q('#tr').setAttribute('points', pts([Cc, A, B]));
        const ar = 34; q('#arc').setAttribute('d', 'M' + (CXp + ar) + ',' + CYp + ' A' + ar + ',' + ar + ' 0 0 0 ' + (CXp + ar * Math.cos(rad(C))).toFixed(1) + ',' + (CYp - ar * Math.sin(rad(C))).toFixed(1));
        q('#lab').innerHTML = T((Cc[0] + A[0]) / 2, CYp + 22, 'b = ' + num(b, 1), COS, 16, 'middle', 'font-weight="700"') + T((Cc[0] + B[0]) / 2 - 24, (Cc[1] + B[1]) / 2 - 6, 'a = ' + num(a, 1), SIN, 16, 'middle', 'font-weight="700"') + T((A[0] + B[0]) / 2 + 22, (A[1] + B[1]) / 2 - 6, 'c = ' + num(cc, 2), TAN, 16, 'middle', 'font-weight="700"') + T(CXp + 44, CYp - 8, 'C', TAN, 16, 'start', 'font-weight="700"');
        const sc = 1.05, bx = 420, by = 80;
        q('#bars').innerHTML = T(bx, by - 18, 'площади (квадраты сторон)', WHITE, 13, 'start', 'opacity=".8"') + rect(bx, by, pyth * sc * 0.9, 22, 'rgba(125,184,255,.5)') + T(bx + 4, by + 16, 'a² + b² = ' + num(pyth, 1), WHITE, 13) +
          rect(bx, by + 36, Math.abs(2 * a * b * Math.cos(rad(C))) * sc * 0.9, 22, C < 90 ? 'rgba(110,231,165,.5)' : 'rgba(255,123,123,.5)') + T(bx + 4, by + 52, (C < 90 ? '− ' : '+ ') + num(Math.abs(2 * a * b * Math.cos(rad(C))), 1) + '  (−2ab·cosC)', WHITE, 13) +
          rect(bx, by + 72, c2 * sc * 0.9, 22, 'rgba(255,209,102,.55)') + T(bx + 4, by + 88, 'c² = ' + num(c2, 1), WHITE, 13);
        c.out.innerHTML = U().math('c^2 = a^2 + b^2 − 2·a·b·cosC = ' + num(pyth, 1) + (C < 90 ? ' − ' : ' + ') + num(Math.abs(2 * a * b * Math.cos(rad(C))), 1) + ' = ' + num(c2, 1)) + '<div class="mini">c = ' + num(cc, 2) + ' см · ' + (Math.abs(C - 90) < 0.5 ? 'угол прямой — это теорема Пифагора' : C < 90 ? 'угол острый: c короче √(a² + b²)' : 'угол тупой: c длиннее √(a² + b²)') + '</div>';
      };
      bind(c.ctl, ['a', 'b', 'C'], (g) => { a = g.a; b = g.b; C = g.C; upd(); });
      c.ctl.querySelector('[data-C]').onclick = () => { const s = c.ctl.querySelector('#C'); s.value = 90; s.dispatchEvent(new Event('input')); };
      upd();
      return loop(() => {});
    }
  });

  /* ============ 7. Рука-таблица ============ */
  add({
    id: 'hand', icon: '🖐️', name: 'Рука-таблица значений', fid: 'hand', f: 'sinα = {√n|2}',
    tip: 'Нажми на палец — он «загнётся». Пальцы слева от него дают значение синуса (√n / 2), пальцы справа — значение косинуса (√(4 − n) / 2).',
    mount(c) {
      const W = 640, H = 330, ANG = [0, 30, 45, 60, 90], NAME = ['мизинец', 'безымянный', 'средний', 'указательный', 'большой'];
      const FX_ = [186, 256, 326, 396, 476], FH = [100, 128, 142, 126, 92];
      let g = '<rect x="170" y="190" width="300" height="120" rx="46" fill="rgba(255,213,170,.5)" stroke="#fff" stroke-width="2"/>';
      ANG.forEach((a, i) => { g += '<g class="fg" data-i="' + i + '" style="cursor:pointer"><rect class="fgr" x="' + FX_[i] + '" y="' + (200 - FH[i]) + '" width="46" height="' + (FH[i] + 8) + '" rx="23" stroke="#fff" stroke-width="2.5" ' + (i === 4 ? 'transform="rotate(28 ' + (FX_[i] + 23) + ' 210)"' : '') + '/>' + T(FX_[i] + 23, 290, a + '°', WHITE, 16, 'middle', 'font-weight="700"') + T(FX_[i] + 23, 312, NAME[i], WHITE, 11, 'middle', 'opacity=".6"') + '</g>'; });
      c.stage.innerHTML = svg(W, H, DEFS + g + '<g id="res"/>');
      c.ctl.innerHTML = '<div class="presets" id="fg">' + ANG.map((a, i) => '<button class="ghost sm" data-i="' + i + '">' + a + '°</button>').join('') + '</div>';
      const q = (s) => c.stage.querySelector(s);
      let n = 3;
      const upd = () => {
        c.stage.querySelectorAll('.fg').forEach((el) => {
          const i = +el.dataset.i, b = el.querySelector('.fgr');
          b.setAttribute('fill', i === n ? 'rgba(255,209,102,.95)' : i < n ? 'rgba(255,154,213,.85)' : 'rgba(125,184,255,.85)');
          const h = i === n ? 40 : FH[i]; b.setAttribute('y', 200 - h); b.setAttribute('height', h + 8);
        });
        c.ctl.querySelectorAll('[data-i]').forEach((b) => b.classList.toggle('on', +b.dataset.i === n));
        const s = Math.sqrt(n) / 2, cs = Math.sqrt(4 - n) / 2;
        q('#res').innerHTML = T(20, 40, 'Угол ' + ANG[n] + '°: слева ' + n + ' пальц.' + (n === 1 ? '' : ''), SIN, 18, 'start', 'font-weight="600"') + T(20, 70, 'справа ' + (4 - n) + ' пальц.', COS, 18, 'start', 'font-weight="600"') + T(20, 110, 'sin ' + ANG[n] + '° = √' + n + '/2 = ' + num(s, 3), SIN, 17) + T(20, 140, 'cos ' + ANG[n] + '° = √' + (4 - n) + '/2 = ' + num(cs, 3), COS, 17);
        c.out.innerHTML = U().math('sin' + ANG[n] + '° = {√' + n + '|2} = ' + num(s, 3)) + '<br>' + U().math('cos' + ANG[n] + '° = {√' + (4 - n) + '|2} = ' + num(cs, 3)) + '<div class="mini">Пальцы слева (розовые) считаем для синуса, справа (голубые) — для косинуса.</div>';
      };
      c.stage.querySelectorAll('.fg').forEach((el) => el.addEventListener('click', () => { n = +el.dataset.i; upd(); if (window.FX) FX.sfx('click'); }));
      c.ctl.querySelectorAll('[data-i]').forEach((b) => (b.onclick = () => { n = +b.dataset.i; upd(); }));
      upd();
      return loop(() => {});
    }
  });

  /* ============ 8. (a + b)² — площадь ============ */
  add({
    id: 'sqsum', icon: '🟦', name: 'Площадь и формулы сокращённого умножения', fid: 'sq-sum',
    tip: 'Выбери режим. Квадрат суммы собирается из двух квадратов и двух прямоугольников; квадрат разности получается вычитанием полосок; разность квадратов — перекройкой «уголка» в прямоугольник.',
    mount(c) {
      const W = 640, H = 330, U_ = 18, X0 = 40, Y0 = 16;
      c.stage.innerHTML = svg(W, H, DEFS + '<g id="sh"/>');
      c.ctl.innerHTML = '<div class="presets" id="md"><button class="ghost sm on" data-m="sum">(a + b)²</button><button class="ghost sm" data-m="diff">(a − b)²</button><button class="ghost sm" data-m="sq">a² − b²</button></div>' + slider('a', 'Сторона a', 2, 9, 1, 6, '') + slider('b', 'Сторона b', 1, 8, 1, 3, '');
      const q = (s) => c.stage.querySelector(s);
      let a = 6, b = 3, mode = 'sum';
      const R_ = (x, y, w, h, fill, txt, tcol) => rect(X0 + x * U_, Y0 + y * U_, w * U_, h * U_, fill) + (txt ? T(X0 + (x + w / 2) * U_, Y0 + (y + h / 2) * U_ + 5, txt, tcol || WHITE, w * U_ > 42 ? 14 : 10, 'middle', 'font-weight="700"') : '');
      const upd = () => {
        let s = '', html = '';
        if (mode === 'sum') {
          s = R_(0, 0, a, a, 'rgba(125,184,255,.55)', 'a² = ' + a * a) + R_(a, 0, b, a, 'rgba(255,209,102,.55)', 'ab = ' + a * b) + R_(0, a, a, b, 'rgba(255,209,102,.55)', 'ab = ' + a * b) + R_(a, a, b, b, 'rgba(255,154,213,.6)', 'b² = ' + b * b);
          s += T(X0 + 420, 60, 'сторона (a + b) = ' + (a + b), WHITE, 16) + T(X0 + 420, 92, '(a + b)² = ' + (a + b) * (a + b), TAN, 20, 'start', 'font-weight="700"') + T(X0 + 420, 126, a * a + ' + ' + a * b + ' + ' + a * b + ' + ' + b * b + ' = ' + (a + b) * (a + b), OK, 16);
          html = U().math('(a + b)^2 = a^2 + 2·a·b + b^2 = ' + a * a + ' + ' + 2 * a * b + ' + ' + b * b + ' = ' + (a + b) * (a + b));
        } else if (mode === 'diff') {
          if (b >= a) { s = T(X0, 80, 'Для (a − b)² нужно, чтобы a > b', '#ff7b7b', 18); html = '<div class="mini">Сделай a больше b.</div>'; }
          else {
            s = R_(0, 0, a, a, 'rgba(255,255,255,.08)') + R_(0, 0, a - b, a - b, 'rgba(110,231,165,.55)', '(a−b)² = ' + (a - b) * (a - b)) + R_(a - b, 0, b, a - b, 'rgba(255,209,102,.5)', 'ab − b²') + R_(0, a - b, a - b, b, 'rgba(255,209,102,.5)', 'ab − b²') + R_(a - b, a - b, b, b, 'rgba(255,154,213,.6)', 'b²');
            s += T(X0 + 420, 60, 'квадрат a² = ' + a * a, WHITE, 16) + T(X0 + 420, 92, 'вычли 2 полоски ab: − ' + 2 * a * b, TAN, 16) + T(X0 + 420, 122, 'угол b² вычли дважды: + ' + b * b, SIN, 16) + T(X0 + 420, 160, '(a − b)² = ' + (a - b) * (a - b), OK, 20, 'start', 'font-weight="700"');
            html = U().math('(a − b)^2 = a^2 − 2·a·b + b^2 = ' + a * a + ' − ' + 2 * a * b + ' + ' + b * b + ' = ' + (a - b) * (a - b));
          }
        } else {
          if (b >= a) { s = T(X0, 80, 'Для a² − b² нужно, чтобы a > b', '#ff7b7b', 18); html = '<div class="mini">Сделай a больше b.</div>'; }
          else {
            s = R_(0, 0, a, a, 'rgba(255,255,255,.05)') + R_(a - b, 0, b, b, 'rgba(255,255,255,.12)', 'b²') + R_(0, b, a, a - b, 'rgba(125,184,255,.55)', 'a × (a−b)') + R_(0, 0, a - b, b, 'rgba(255,154,213,.55)');
            const ox = 360, oy = 16;
            s += rect(ox, oy + b * U_, a * U_, (a - b) * U_, 'rgba(125,184,255,.55)') + rect(ox + a * U_, oy + b * U_, b * U_, (a - b) * U_, 'rgba(255,154,213,.55)') + T(ox + (a + b) * U_ / 2, oy + b * U_ - 8, '(a + b)', WHITE, 14, 'middle') + T(ox - 6, oy + b * U_ + (a - b) * U_ / 2 + 5, '(a − b)', WHITE, 14, 'end');
            s += T(X0, 318, 'Уголок a² − b² = ' + (a * a - b * b), WHITE, 15) + T(ox, 318, 'Прямоугольник (a − b)(a + b) = ' + (a - b) * (a + b), OK, 15);
            html = U().math('a^2 − b^2 = (a − b)·(a + b) = ' + (a - b) + '·' + (a + b) + ' = ' + (a * a - b * b));
          }
        }
        q('#sh').innerHTML = s; c.out.innerHTML = html;
      };
      bind(c.ctl, ['a', 'b'], (g) => { a = g.a; b = g.b; upd(); });
      c.ctl.querySelectorAll('[data-m]').forEach((bt) => (bt.onclick = () => { mode = bt.dataset.m; c.ctl.querySelectorAll('[data-m]').forEach((x) => x.classList.toggle('on', x === bt)); upd(); }));
      upd();
      return loop(() => {});
    }
  });

  /* ============ 9. Парабола и дискриминант ============ */
  add({
    id: 'parabola', icon: '🌉', name: 'Парабола и дискриминант', fid: 'disc', f: 'y = a·x^2 + b·x + c',
    tip: 'Меняй a, b, c и следи за дискриминантом: два корня — парабола пересекает ось x дважды, D = 0 — касается, D < 0 — не достаёт до оси.',
    mount(c) {
      const W = 640, H = 340, P = { X: (x) => 320 + x * 34, Y: (y) => 190 - y * 15 };
      c.stage.innerHTML = svg(W, H, DEFS + '<clipPath id="pc"><rect x="0" y="0" width="640" height="340"/></clipPath>' + grid(P, -9, 9, -12, 10, 1, 2) + '<g clip-path="url(#pc)"><path id="cv" fill="none" stroke="' + SIN + '" stroke-width="4"/></g><line id="ax" stroke="' + TAN + '" stroke-width="1.5" stroke-dasharray="6 5"/><circle id="vt" r="7" fill="' + TAN + '" stroke="#fff" stroke-width="2"/><circle id="r1" r="7" fill="' + OK + '" stroke="#fff" stroke-width="2"/><circle id="r2" r="7" fill="' + OK + '" stroke="#fff" stroke-width="2"/><g id="tt"/>');
      c.ctl.innerHTML = slider('a', 'Коэффициент a', -3, 3, 0.5, 1, '') + slider('b', 'Коэффициент b', -10, 10, 1, -4, '') + slider('c', 'Свободный член c', -10, 10, 1, 3, '');
      const q = (s) => c.stage.querySelector(s);
      let a = 1, b = -4, cc = 3;
      const upd = () => {
        if (Math.abs(a) < 0.01) a = 0.5;
        let d = ''; for (let i = 0; i <= 360; i++) { const x = -9 + (18 * i) / 360, y = a * x * x + b * x + cc; d += (i ? 'L' : 'M') + P.X(x).toFixed(1) + ',' + clamp(P.Y(y), -400, 700).toFixed(1); } q('#cv').setAttribute('d', d);
        const D = b * b - 4 * a * cc, x0 = -b / (2 * a), y0 = a * x0 * x0 + b * x0 + cc;
        set(q('#vt'), { cx: P.X(x0), cy: clamp(P.Y(y0), -20, 360) }); set(q('#ax'), { x1: P.X(x0), x2: P.X(x0), y1: 0, y2: H });
        const showRoots = D >= 0, r1 = (-b - Math.sqrt(Math.max(D, 0))) / (2 * a), r2 = (-b + Math.sqrt(Math.max(D, 0))) / (2 * a);
        set(q('#r1'), { cx: P.X(r1), cy: P.Y(0), opacity: showRoots ? 1 : 0 }); set(q('#r2'), { cx: P.X(r2), cy: P.Y(0), opacity: showRoots && D > 0 ? 1 : 0 });
        q('#tt').innerHTML = T(16, 28, 'D = b² − 4ac = ' + num(D, 1), D > 0 ? OK : D === 0 ? TAN : '#ff7b7b', 18, 'start', 'font-weight="700"') + T(16, 52, D > 0 ? 'два корня' : D === 0 ? 'один корень (касание)' : 'корней нет', WHITE, 14);
        c.out.innerHTML = U().math('D = b^2 − 4·a·c = ' + num(b * b, 0) + ' − 4·' + num(a, 1) + '·' + cc + ' = ' + num(D, 1)) + '<div class="mini">' + (D >= 0 ? 'x₁ = ' + num(Math.min(r1, r2), 2) + (D > 0 ? ', x₂ = ' + num(Math.max(r1, r2), 2) : '') : 'действительных корней нет') + ' · вершина (' + num(x0, 2) + '; ' + num(y0, 2) + ')</div>';
      };
      bind(c.ctl, ['a', 'b', 'c'], (g) => { a = g.a; b = g.b; cc = g.c; upd(); });
      upd();
      return loop(() => {});
    }
  });

  /* ============ 10. Две прямые ============ */
  add({
    id: 'lines', icon: '🛣️', name: 'Две прямые и система', fid: 'lin-fn', f: 'y = k·x + b',
    tip: 'Поставь k₁ = k₂ — прямые параллельны. Сделай k₁·k₂ = −1 — перпендикулярны. Иначе они пересекаются: точка пересечения — решение системы.',
    mount(c) {
      const W = 640, H = 330, P = { X: (x) => 320 + x * 33, Y: (y) => 165 - y * 33 };
      c.stage.innerHTML = svg(W, H, DEFS + '<clipPath id="lc"><rect x="0" y="0" width="640" height="330"/></clipPath>' + grid(P, -9, 9, -5, 5, 1, 1) + '<g clip-path="url(#lc)"><line id="l1" stroke="' + SIN + '" stroke-width="4"/><line id="l2" stroke="' + COS + '" stroke-width="4"/></g><circle id="ip" r="8" fill="' + TAN + '" stroke="#fff" stroke-width="2.5"/><g id="tt"/>');
      c.ctl.innerHTML = slider('k1', 'k₁ (розовая)', -3, 3, 0.5, 1, '') + slider('b1', 'b₁', -4, 4, 1, 1, '') + slider('k2', 'k₂ (голубая)', -3, 3, 0.5, -0.5, '') + slider('b2', 'b₂', -4, 4, 1, -2, '');
      const q = (s) => c.stage.querySelector(s);
      let k1 = 1, b1 = 1, k2 = -0.5, b2 = -2;
      const upd = () => {
        const seg = (id, k, b) => set(q(id), { x1: P.X(-12), y1: P.Y(-12 * k + b), x2: P.X(12), y2: P.Y(12 * k + b) });
        seg('#l1', k1, b1); seg('#l2', k2, b2);
        let verdict, html = '', ix = null;
        if (k1 === k2) verdict = b1 === b2 ? 'прямые совпадают' : 'параллельны — решений нет'; else { ix = (b2 - b1) / (k1 - k2); verdict = Math.abs(k1 * k2 + 1) < 1e-9 ? 'перпендикулярны, пересекаются в точке' : 'пересекаются в точке'; }
        if (ix !== null) { const iy = k1 * ix + b1; set(q('#ip'), { cx: P.X(ix), cy: P.Y(iy), opacity: 1 }); html = U().math('x = {b_2 − b_1|k_1 − k_2} = {' + b2 + ' − (' + b1 + ')|' + num(k1, 1) + ' − (' + num(k2, 1) + ')} = ' + num(ix, 2)) + '<div class="mini">' + verdict + ' (' + num(ix, 2) + '; ' + num(iy, 2) + ') · k₁·k₂ = ' + num(k1 * k2, 2) + '</div>'; } else { set(q('#ip'), { opacity: 0 }); html = '<div class="mini">k₁ = k₂ = ' + num(k1, 1) + ': ' + verdict + '</div>'; }
        q('#tt').innerHTML = T(16, 26, 'y = ' + num(k1, 1) + 'x ' + (b1 < 0 ? '−' : '+') + ' ' + Math.abs(b1), SIN, 16, 'start', 'font-weight="700"') + T(16, 48, 'y = ' + num(k2, 1) + 'x ' + (b2 < 0 ? '−' : '+') + ' ' + Math.abs(b2), COS, 16, 'start', 'font-weight="700"');
        c.out.innerHTML = html;
      };
      bind(c.ctl, ['k1', 'b1', 'k2', 'b2'], (g) => { k1 = g.k1; b1 = g.b1; k2 = g.k2; b2 = g.b2; upd(); });
      upd();
      return loop(() => {});
    }
  });

  /* ============ 11. Прогрессии ============ */
  add({
    id: 'prog', icon: '🦠', name: 'Арифметическая и геометрическая прогрессии', fid: 'ar-n',
    tip: 'Арифметическая: каждый столбик выше предыдущего на одно и то же d — вершины лежат на прямой. Геометрическая: каждый в q раз больше — быстрый рост (или затухание при q < 1).',
    mount(c) {
      const W = 640, H = 320, BASE = 200, X0 = 40, BW = 38;
      c.stage.innerHTML = svg(W, H, DEFS + L(X0 - 10, BASE, W - 20, BASE, 'rgba(255,255,255,.6)') + '<g id="br"/>');
      c.ctl.innerHTML = '<div class="presets" id="md"><button class="ghost sm on" data-m="ar">Арифметическая</button><button class="ghost sm" data-m="geo">Геометрическая</button></div>' + slider('a1', 'Первый член', 1, 10, 1, 2, '') + '<div id="dq">' + slider('d', 'Разность d', -2, 5, 1, 2, '') + '</div>' + slider('n', 'Число членов n', 2, 10, 1, 8, '');
      const q = (s) => c.stage.querySelector(s);
      let mode = 'ar', a1 = 2, d = 2, qq = 2, n = 8;
      const drawCtl = () => { c.ctl.querySelector('#dq').innerHTML = mode === 'ar' ? slider('d', 'Разность d', -2, 5, 1, d, '') : slider('qq', 'Знаменатель q', 0.5, 3, 0.5, qq, ''); bind(c.ctl.querySelector('#dq'), [mode === 'ar' ? 'd' : 'qq'], (g) => { if (mode === 'ar') d = g.d; else qq = g.qq; upd(); }); };
      const upd = () => {
        const v = []; for (let k = 1; k <= n; k++) v.push(mode === 'ar' ? a1 + (k - 1) * d : a1 * Math.pow(qq, k - 1));
        const mx = Math.max(...v.map((x) => Math.abs(x)), 1), sc = 150 / mx; let s = '', sum = 0;
        v.forEach((x, i) => { sum += x; const h = x * sc, bx = X0 + i * (BW + 6); s += rect(bx, h >= 0 ? BASE - h : BASE, BW, Math.abs(h), mode === 'ar' ? 'rgba(125,184,255,.6)' : 'rgba(255,154,213,.6)') + T(bx + BW / 2, h >= 0 ? BASE - h - 6 : BASE + Math.abs(h) + 16, num(x, 1), WHITE, 12, 'middle', 'font-weight="700"') + T(bx + BW / 2, BASE + (h >= 0 ? 18 : -6), (mode === 'ar' ? 'a' : 'b') + (i + 1), WHITE, 11, 'middle', 'opacity=".6"'); });
        q('#br').innerHTML = s + T(X0, 28, mode === 'ar' ? 'a_n = a₁ + (n − 1)·d' : 'b_n = b₁·q^(n − 1)', TAN, 17, 'start', 'font-weight="700"') + T(X0, 52, 'сумма ' + n + ' членов: ' + num(sum, 2), OK, 16);
        const last = v[n - 1];
        c.out.innerHTML = mode === 'ar' ? U().math('a_n = a_1 + (n − 1)·d = ' + a1 + ' + ' + (n - 1) + '·' + d + ' = ' + num(last, 0)) + '<div class="mini">S_n = (a₁ + a_n)·n/2 = ' + num(((a1 + last) * n) / 2, 1) + '</div>' : U().math('b_n = b_1·q^(n − 1) = ' + a1 + '·' + num(qq, 1) + '^' + (n - 1) + ' = ' + num(last, 2)) + '<div class="mini">S_n = ' + num(qq === 1 ? a1 * n : (a1 * (Math.pow(qq, n) - 1)) / (qq - 1), 2) + '</div>';
      };
      bind(c.ctl, ['a1', 'n'], (g) => { a1 = g.a1; n = g.n; upd(); });
      c.ctl.querySelectorAll('[data-m]').forEach((bt) => (bt.onclick = () => { mode = bt.dataset.m; c.ctl.querySelectorAll('[data-m]').forEach((x) => x.classList.toggle('on', x === bt)); drawCtl(); upd(); }));
      drawCtl(); upd();
      return loop(() => {});
    }
  });

  /* ============ 12. Степень и логарифм — зеркало ============ */
  add({
    id: 'expo', icon: '🎚️', name: 'Степень и логарифм: зеркальные функции', fid: 'log-id', f: 'a^(log_a b) = b',
    tip: 'Графики y = aˣ и y = log_a x зеркальны относительно прямой y = x. Возьми точку на показательной кривой — её отражение лежит на логарифмической: показатель и результат меняются местами.',
    mount(c) {
      const W = 640, H = 340, P = { X: (x) => 190 + x * 32, Y: (y) => 270 - y * 32 };
      c.stage.innerHTML = svg(W, H, DEFS + '<clipPath id="ec"><rect x="0" y="0" width="640" height="340"/></clipPath>' + grid(P, -5, 14, -2, 8, 1, 1) + '<g clip-path="url(#ec)"><line x1="' + P.X(-5) + '" y1="' + P.Y(-5) + '" x2="' + P.X(14) + '" y2="' + P.Y(14) + '" stroke="rgba(255,255,255,.45)" stroke-width="2" stroke-dasharray="6 6"/><path id="ex" fill="none" stroke="' + SIN + '" stroke-width="4"/><path id="lg" fill="none" stroke="' + COS + '" stroke-width="4"/></g>' +
        '<line id="cn" stroke="rgba(255,255,255,.6)" stroke-width="1.5" stroke-dasharray="4 4"/><circle id="p1" r="7" fill="' + SIN + '" stroke="#fff" stroke-width="2"/><circle id="p2" r="7" fill="' + COS + '" stroke="#fff" stroke-width="2"/><g id="tt"/>');
      c.ctl.innerHTML = slider('a', 'Основание a', 1.2, 4, 0.1, 2, '') + slider('t', 'Показатель t', -2, 3, 0.1, 2, '');
      const q = (s) => c.stage.querySelector(s);
      let a = 2, t = 2;
      const upd = () => {
        let d1 = '', d2 = ''; for (let i = 0; i <= 300; i++) { const x = -5 + (19 * i) / 300; d1 += (i ? 'L' : 'M') + P.X(x).toFixed(1) + ',' + clamp(P.Y(Math.pow(a, x)), -300, 700).toFixed(1); if (x > 0.02) d2 += (d2 ? 'L' : 'M') + P.X(x).toFixed(1) + ',' + clamp(P.Y(Math.log(x) / Math.log(a)), -300, 700).toFixed(1); }
        q('#ex').setAttribute('d', d1); q('#lg').setAttribute('d', d2);
        const y = Math.pow(a, t); set(q('#p1'), { cx: P.X(t), cy: P.Y(y) }); set(q('#p2'), { cx: P.X(y), cy: P.Y(t) }); set(q('#cn'), { x1: P.X(t), y1: P.Y(y), x2: P.X(y), y2: P.Y(t) });
        q('#tt').innerHTML = T(16, 26, 'y = a^x', SIN, 17, 'start', 'font-weight="700"') + T(16, 50, 'y = log_a x', COS, 17, 'start', 'font-weight="700"') + T(16, 74, 'y = x (зеркало)', WHITE, 13, 'start', 'opacity=".7"');
        c.out.innerHTML = U().math('a^t = ' + num(a, 1) + '^' + num(t, 1) + ' = ' + num(y, 3)) + '<br>' + U().math('log_a(' + num(y, 3) + ') = ' + num(t, 1)) + '<div class="mini">Точки (t; aᵗ) и (aᵗ; t) симметричны относительно y = x.</div>';
      };
      bind(c.ctl, ['a', 't'], (g) => { a = g.a; t = g.t; upd(); });
      upd();
      return loop(() => {});
    }
  });
})();
