const LEAD_ENDPOINT = 'https://lead-relay.leestygpt.workers.dev/lead/QXNKA9ZSP5';
const TG_LINK = 'https://t.me/biology_lv'; // резерв: заявка в Telegram, если форма недоступна
(() => {
  const root = document.documentElement;
  root.classList.add('js');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const safe = fn => { try { fn(); } catch (e) { console.error(e); } };
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const NS = 'http://www.w3.org/2000/svg';
  const el = (tag, attrs = {}, parent) => {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  };

  // sticky bar
  safe(() => {
    const bar = $('#bar');
    const f = () => bar.classList.toggle('show', scrollY > 30);
    addEventListener('scroll', f, { passive: true }); f();
  });

  // smooth anchors
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const h = a.getAttribute('href'); if (h.length < 2) return;
    const t = $(h); if (!t) return;
    e.preventDefault();
    scrollTo({ top: t.getBoundingClientRect().top + scrollY - 56, behavior: reduce ? 'auto' : 'smooth' });
  }));

  // ===== map of school biology: 7 columns = grades 5..11 =====
  const GAPS = [
    [0, 2, 'Клетка'], [0, 4, 'Царства живого'],
    [1, 1, 'Фотосинтез'], [1, 4, 'Корень и побег'],
    [2, 3, 'Членистоногие'],
    [3, 1, 'Кровообращение'], [3, 4, 'Нервная система'],
    [4, 3, 'Наследственность'],
    [5, 1, 'Митоз и мейоз'], [5, 4, 'Биосинтез белка'],
    [6, 2, 'Генетические задачи'], [6, 5, 'Экосистемы']
  ];
  const R = 40, SQ = Math.sqrt(3), COLS = 7, ROWS = 6;
  const MW = 2 * R + (COLS - 1) * 1.5 * R, MH = SQ * R * ROWS + SQ * R / 2 + 40;
  const hexPts = (x, y, r) => [0, 1, 2, 3, 4, 5].map(i => (x + r * Math.cos(i * Math.PI / 3)).toFixed(1) + ',' + (y + r * Math.sin(i * Math.PI / 3)).toFixed(1)).join(' ');
  const hash = (c, r) => ((c * 73856093) ^ (r * 19349663)) >>> 0;

  function buildMap(svg, mode) {
    svg.setAttribute('viewBox', `0 0 ${MW} ${MH}`);
    const cells = [];
    const addCells = (parent, hl) => {
      for (let c = 0; c < COLS; c++) for (let r = 0; r < ROWS; r++) {
        const x = R + c * 1.5 * R, y = SQ * R / 2 + r * SQ * R + (c % 2 ? SQ * R / 2 : 0);
        const gi = GAPS.findIndex(g => g[0] === c && g[1] === r);
        const h = hash(c, r);
        const g = el('g', { class: 'cell v' + (h % 3) + (hl && gi >= 0 ? ' gap' : '') }, parent);
        el('polygon', { points: hexPts(x, y, R - 1) }, g);
        el('circle', { class: 'nuc', cx: x + ((h >> 3) % 9 - 4), cy: y + ((h >> 6) % 9 - 4), r: 5 + h % 3 }, g);
        if (mode === 'scene' && gi >= 0) {
          el('polygon', { class: 'ring', points: hexPts(x, y, R - 1) }, g);
          el('path', { class: 'tick', d: `M${x - 11},${y + 1} L${x - 3},${y + 9} L${x + 12},${y - 9}` }, g);
          const t = el('text', { class: 'num', x, y }, g); t.textContent = '';
        }
        if (mode === 'scene' && gi >= 0) cells.push({ g, x, y, gi, c, r });
      }
    };
    const labels = parent => {
      for (let c = 0; c < COLS; c++) {
        const t = el('text', { class: 'glab', x: R + c * 1.5 * R, y: MH - 8 }, parent);
        t.textContent = c === 0 ? '5 класс' : String(5 + c);
      }
    };
    return { cells, addCells, labels };
  }

  const lensShape = (parent, r) => {
    const g = el('g', { class: 'lens' }, parent);
    el('line', { class: 'lens__h', x1: r * .72, y1: r * .72, x2: r * 1.5, y2: r * 1.5 }, g);
    el('circle', { class: 'lens__ring', r }, g);
    el('path', { class: 'lens__glare', d: `M${-r * .6},${-r * .15} A${r * .62},${r * .62} 0 0 1 ${-r * .15},${-r * .6}` }, g);
    return g;
  };

  // ===== hero lens =====
  safe(() => {
    const svg = $('#heroMap'), tag = $('#lensTag'), box = $('#lensbox');
    if (!svg) return;
    const m = buildMap(svg, 'hero');
    const base = el('g', {}, svg); m.addCells(base, false);
    const gapCells = [];
    // zoom layer inside clip
    const LR = 92, ZOOM = 1.32;
    const defs = el('defs', {}, svg);
    const cp = el('clipPath', { id: 'lensClip' }, defs);
    const cc = el('circle', { r: LR }, cp);
    const clipG = el('g', { 'clip-path': 'url(#lensClip)' }, svg);
    const zoomG = el('g', {}, clipG);
    m.addCells(zoomG, true);
    m.labels(svg);
    const lens = lensShape(svg, LR);
    // gap centres
    GAPS.forEach(g => {
      const c = g[0], r = g[1];
      gapCells.push({ x: R + c * 1.5 * R, y: SQ * R / 2 + r * SQ * R + (c % 2 ? SQ * R / 2 : 0), t: g[2], c });
    });
    let cx = MW * .5, cy = MH * .45, tx = cx, ty = cy, lastPtr = -1e9, t0 = 0, visible = true;
    const place = () => {
      cc.setAttribute('cx', cx); cc.setAttribute('cy', cy);
      zoomG.setAttribute('transform', `translate(${cx} ${cy}) scale(${ZOOM}) translate(${-cx} ${-cy})`);
      lens.setAttribute('transform', `translate(${cx} ${cy})`);
      // tag
      let hit = null, best = R * .95;
      gapCells.forEach(g => { const d = Math.hypot(g.x - cx, g.y - cy); if (d < best) { best = d; hit = g; } });
      if (hit) { tag.textContent = (5 + hit.c) + ' класс · ' + hit.t; tag.classList.add('on'); tag.style.left = clamp(hit.x / MW * 100, 24, 76) + '%'; tag.style.top = ((hit.y - R * .6) / MH * 100) + '%'; }
      else tag.classList.remove('on');
    };
    if (reduce) { cx = gapCells[2].x; cy = gapCells[2].y; place(); return; }
    const toSvg = e => { const r = svg.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * MW, (e.clientY - r.top) / r.height * MH]; };
    box.addEventListener('pointermove', e => { const p = toSvg(e); tx = clamp(p[0], 0, MW); ty = clamp(p[1], 0, MH - 30); lastPtr = performance.now(); }, { passive: true });
    new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible) requestAnimationFrame(loop); }).observe(box);
    const loop = now => {
      if (!visible) return;
      if (now - lastPtr > 2200) {
        const t = now / 1000;
        tx = MW * (.5 + .36 * Math.sin(t * .42)); ty = MH * (.44 + .32 * Math.sin(t * .6 + 1));
      }
      cx = lerp(cx, tx, .09); cy = lerp(cy, ty, .09);
      place();
      requestAnimationFrame(loop);
    };
    place(); requestAnimationFrame(loop);
  });

  // ===== scene: scan -> number -> fix =====
  safe(() => {
    const scene = $('#map'); if (!scene) return;
    const svg = $('#sceneMap');
    const m = buildMap(svg, 'scene');
    const g0 = el('g', {}, svg);
    m.addCells(g0, false);
    m.labels(svg);
    const cells = m.cells.sort((a, b) => a.c - b.c || a.r - b.r);
    cells.forEach((cl, i) => { cl.g.querySelector('.num').textContent = String(i + 1); cl.idx = i; });
    const lens = lensShape(svg, 76);
    const steps = $$('#steps li'), nF = $('#nFound'), nX = $('#nFixed');
    let lastStep = -1, lastF = -1, lastX = -1;
    const n = cells.length;
    const apply = p => {
      const sp = clamp((p - .03) / .45);
      const lx = lerp(-30, MW + 30, sp), ly = MH * .42 + Math.sin(sp * Math.PI * 3) * MH * .26;
      lens.setAttribute('transform', `translate(${lx} ${ly})`);
      lens.style.opacity = (p < .03 ? 0 : p < .52 ? 1 : 0);
      let found = 0, fixed = 0;
      cells.forEach(cl => {
        const f = sp > 0 && cl.x <= lx - 10, num = p > .5 + cl.idx * (.14 / n), fx = p > .66 + cl.idx * (.25 / n);
        if (f) found++; if (fx) fixed++;
        cl.g.classList.toggle('found', f && !fx);
        cl.g.classList.toggle('numbered', num && !fx);
        cl.g.classList.toggle('fixed', fx);
      });
      if (found !== lastF) { nF.textContent = found; lastF = found; }
      if (fixed !== lastX) { nX.textContent = fixed; lastX = fixed; }
      const st = p < .5 ? 0 : p < .66 ? 1 : p < .92 ? 2 : 3;
      if (st !== lastStep) { lastStep = st; steps.forEach((l, i) => l.classList.toggle('on', i === st)); }
    };
    if (reduce) {
      scene.style.height = 'auto'; $('.scene__pin', scene).style.position = 'static'; $('.scene__pin', scene).style.height = 'auto';
      apply(1); lens.style.display = 'none'; steps.forEach(l => l.style.display = 'block');
      steps.forEach(l => { l.classList.add('on'); l.style.opacity = 1; });
      $('.scene__in', scene).style.maxHeight = 'none';
      svg.style.height = 'auto'; svg.style.maxHeight = '70vh';
      return;
    }
    let tick = false;
    const upd = () => { tick = false; const r = scene.getBoundingClientRect(); apply(clamp(-r.top / Math.max(1, r.height - innerHeight))); };
    const on = () => { if (!tick) { tick = true; requestAnimationFrame(upd); } };
    addEventListener('scroll', on, { passive: true }); addEventListener('resize', on); upd();
  });

  // ===== manifest: words light up on scroll =====
  safe(() => {
    const p = $('#manifest'); if (!p || reduce) return;
    const words = p.textContent.trim().split(/\s+/);
    p.textContent = '';
    const ws = words.map((w, i) => { const s = document.createElement('span'); s.className = 'w'; s.textContent = w; p.append(s, i < words.length - 1 ? ' ' : ''); return s; });
    let tick = false;
    const f = () => {
      tick = false;
      const r = p.getBoundingClientRect();
      const prog = clamp((innerHeight * .82 - r.top) / (innerHeight * .5 + r.height * .6));
      ws.forEach((s, i) => { s.style.opacity = (.16 + .84 * clamp(prog * (ws.length + 3) - i)).toFixed(2); });
    };
    addEventListener('scroll', () => { if (!tick) { tick = true; requestAnimationFrame(f); } }, { passive: true });
    addEventListener('resize', f); f();
  });

  // ===== struck-out list =====
  safe(() => {
    const items = $$('#crossed li'); if (!items.length) return;
    if (reduce || !('IntersectionObserver' in window)) { items.forEach(i => i.classList.add('struck')); return; }
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { const i = items.indexOf(e.target); setTimeout(() => e.target.classList.add('struck'), 250 + i * 380); io.unobserve(e.target); }
    }), { rootMargin: '0px 0px -20% 0px' });
    items.forEach(i => io.observe(i));
  });

  // ===== format tabs =====
  safe(() => {
    const tabs = $$('[data-pill-item]'), panels = $$('#panels .panel');
    const sel = i => {
      tabs.forEach((t, k) => t.setAttribute('aria-selected', k === i));
      panels.forEach((p, k) => { p.hidden = k !== i; p.classList.toggle('on', k === i); });
      const sub = $('#subject');
      if (sub) sub.value = ['Биология', 'Биология: подготовка к ОГЭ', 'Биология: подготовка к ЕГЭ'][i];
    };
    tabs.forEach((t, i) => t.addEventListener('click', () => sel(i)));
  });

  // ===== form =====
  const form = $('#leadForm');
  form && form.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]'), orig = btn.textContent, msg = $('#msg');
    const payload = {}; new FormData(form).forEach((v, k) => { payload[k] = v; });
    if (payload._gotcha) return;
    msg.textContent = '';
    if (!payload.name.trim() || !payload.contact.trim()) { msg.textContent = 'Укажите имя и телефон или мессенджер.'; return; }
    if (!form.consent.checked) { msg.textContent = 'Отметьте согласие на обработку персональных данных.'; return; }
    payload.phone = payload.contact;
    payload.comment = 'Класс: ' + payload.grade + '. Предмет: ' + payload.subject + (payload.comment ? '. Запрос: ' + payload.comment : '');
    delete payload.consent;
    const tgText = 'Заявка с сайта. Имя: ' + payload.name + '. Контакт: ' + payload.contact + '. ' + payload.comment;
    const tgLink = TG_LINK + '?text=' + encodeURIComponent(tgText);
    btn.disabled = true; btn.textContent = 'Отправляю...';
    const ctrl = new AbortController(), timer = setTimeout(() => ctrl.abort(), 8000);
    try {
      const r = await fetch(LEAD_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal: ctrl.signal });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      msg.textContent = 'Заявка отправлена. Скоро свяжусь.'; form.reset();
    } catch (err) {
      console.error(err);
      msg.textContent = 'Заявка не ушла автоматически. Отправьте её одним касанием в Telegram: ';
      const a = document.createElement('a'); a.href = tgLink; a.target = '_blank'; a.rel = 'noopener'; a.textContent = 'отправить в Telegram';
      msg.append(a, '. Текст уже готов, останется нажать «Отправить».');
    } finally {
      clearTimeout(timer); btn.disabled = false; btn.textContent = orig;
    }
  });

  // ===== документы крупно =====
  safe(() => {
    const lb = $('#lb'); if (!lb || !lb.showModal) return;
    const img = $('#lbImg'), cap = $('#lbCap');
    $$('#docs button').forEach(b => b.addEventListener('click', () => {
      img.src = b.dataset.full; img.alt = b.dataset.cap; cap.textContent = b.dataset.cap;
      lb.showModal();
    }));
    lb.addEventListener('click', e => { if (e.target === lb) lb.close(); });
  });
})();
