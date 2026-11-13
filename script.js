/* =========================================================
   Письмо при свече — сценарий
   ========================================================= */
(() => {
  'use strict';

  /* ---- Подставьте свои данные ---- */
  const CONFIG = {
    guestName: 'Диана',
    date: '5 декабря',
    time: '18:00',
    place: 'тайна сия будет открыта Вам особым посланием',   // заменить, когда станет известно
    dressCode: 'будет возвещено позже',                     // заменить, когда станет известно
    signer: 'Нурда',
  };

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  $$('[data-field]').forEach((el) => {
    const v = CONFIG[el.dataset.field];
    if (v) el.textContent = v;
  });

  /* =======================================================
     Свеча: тихое неравномерное мерцание
     ======================================================= */
  const flame = $('.flame-wrap');
  const light = $('.light');
  const shade = $('.shade');
  const waxGlow = $$('.wax-glow');
  const candleLight = $('.candle-light');
  const glint = $('.brass-glint');
  const embers = $$('.ember');
  const candle = $('.candle');
  const smokePaths = $$('.smoke path');

  /* уровень горения: 1 — горит, 0 — погасла */
  let lit = 1;
  let litAnim = null;      // { from, keys:[[ms, level]], start }
  let emberHeat = 1;       // тление фитиля после угасания
  let smokeStart = -1;
  let candleOut = false;

  // пламя оседает, вздрагивает, вспыхивает напоследок и гаснет
  const OUT_KEYS = [[0, 1], [260, 0.55], [430, 0.82], [700, 0.32], [880, 0.5], [1150, 0.12], [1300, 0]];
  const ON_KEYS = [[0, 0], [180, 0.35], [320, 0.25], [700, 1.12], [1100, 1]];

  function levelAt(keys, ms) {
    if (ms >= keys[keys.length - 1][0]) return keys[keys.length - 1][1];
    for (let i = 1; i < keys.length; i++) {
      if (ms < keys[i][0]) {
        const [t0, v0] = keys[i - 1], [t1, v1] = keys[i];
        const p = (ms - t0) / (t1 - t0);
        return v0 + (v1 - v0) * (p * p * (3 - 2 * p));
      }
    }
    return 1;
  }

  function setCandle(out) {
    if (out === candleOut) return;
    candleOut = out;
    const now = performance.now();
    if (out) {
      litAnim = { keys: OUT_KEYS, start: now };
      smokeStart = now + 1100;
      emberHeat = 1;
      setTimeout(() => { if (candleOut) document.body.classList.add('moonlit'); }, 900);
    } else {
      litAnim = { keys: ON_KEYS, start: now };
      smokeStart = -1;
      smokePaths.forEach((p) => p.setAttribute('d', ''));
      document.body.classList.remove('moonlit');
    }
    candle.setAttribute('aria-label', out ? 'Зажечь свечу' : 'Задуть свечу');
    candle.title = out ? 'Зажечь свечу' : 'Задуть свечу';
  }
  candle.addEventListener('click', () => setCandle(!candleOut));
  candle.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setCandle(!candleOut); }
  });

  /* струйка дыма от погасшего фитиля */
  const WICK_X = 80.5, WICK_Y = 83.8;
  function drawSmoke(now) {
    if (smokeStart < 0 || now < smokeStart) return;
    const t = (now - smokeStart) / 1000;
    if (t > 6.5) { smokePaths.forEach((p) => p.setAttribute('d', '')); smokeStart = -1; return; }
    const top = Math.min(190, t * 70);             // как высоко поднялся дым
    const tail = Math.max(0, (t - 2.2) * 55);      // фитиль остыл — дым отрывается снизу
    smokePaths.forEach((p, s) => {
      if (tail >= top) { p.setAttribute('d', ''); return; }
      let d = '';
      for (let y = tail; y <= top; y += 3) {
        const amp = y * (0.1 + s * 0.05) + 0.4;
        const x = WICK_X + Math.sin(y * (0.055 - s * 0.012) - t * (1.5 + s * 0.6) + s * 1.7) * amp + y * 0.06;
        d += (d ? ' L' : 'M') + x.toFixed(2) + ' ' + (WICK_Y - y).toFixed(2);
      }
      p.setAttribute('d', d);
    });
    const fade = Math.min(1, t / 0.4) * Math.max(0, 1 - t / 6.5);
    smokePaths.forEach((p) => { p.style.opacity = fade.toFixed(3); });
  }

  (function flicker() {
    let f = 1, target = 1, skew = 0, skewTarget = 0, sway = 0, swayTarget = 0, next = 0;
    const amp = reduceMotion ? 0.4 : 1;
    let prev = performance.now();
    function tick(t) {
      const dt = Math.min(0.1, (t - prev) / 1000);
      prev = t;
      if (t > next) {
        target = 0.84 + Math.random() * 0.16;
        if (Math.random() < 0.05) target = 0.6 + Math.random() * 0.15; // лёгкий сквозняк
        skewTarget = (Math.random() - 0.5) * 5 * amp;
        swayTarget = (Math.random() - 0.5) * 0.06 * amp;
        next = t + 70 + Math.random() * 260;
      }
      f += (target - f) * 0.11;
      skew += (skewTarget - skew) * 0.06;
      sway += (swayTarget - sway) * 0.08;
      const k = 1 - (1 - f) * amp;

      if (litAnim) {
        const ms = t - litAnim.start;
        lit = levelAt(litAnim.keys, ms);
        if (ms > litAnim.keys[litAnim.keys.length - 1][0]) litAnim = null;
      }
      const L = Math.max(0, lit);
      const Lc = Math.min(1, L);

      flame.style.transform =
        `translateX(${(sway * 20).toFixed(2)}px) skewX(${(skew * (2 - Lc)).toFixed(2)}deg) scale(${((0.95 + 0.05 * k) * (0.45 + 0.55 * Lc)).toFixed(3)}, ${((0.84 + 0.16 * k) * (0.12 + 0.88 * L)).toFixed(3)})`;
      flame.style.opacity = ((0.88 + 0.12 * k) * Math.min(1, L * 1.6)).toFixed(3);
      light.style.opacity = ((0.72 + 0.28 * k) * Lc).toFixed(3);
      shade.style.opacity = (1.06 - 0.08 * k * Lc).toFixed(3);
      const wg = ((0.55 + 0.45 * k) * Lc).toFixed(3);
      waxGlow.forEach((el) => { el.style.opacity = wg; });
      candleLight.style.opacity = ((0.65 + 0.35 * k) * Lc).toFixed(3);
      glint.style.opacity = ((0.6 + 0.4 * k) * Lc).toFixed(3);

      // фитиль: тлеет, пока горит, и медленно остывает после
      if (candleOut) emberHeat = Math.max(0, emberHeat - dt * 0.33);
      else emberHeat = Math.min(1, emberHeat + dt * 2);
      const glow = candleOut ? emberHeat * (0.75 + 0.25 * Math.random()) : 1;
      embers.forEach((el) => { el.style.opacity = glow.toFixed(3); });

      drawSmoke(t);
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  })();

  /* =======================================================
     Рваный край бумаги (стабильный, не «прыгает» при росте)
     ======================================================= */
  const hash = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
  function tear(el, amp = 2.6, step = 8) {
    const w = el.offsetWidth, h = el.offsetHeight;
    if (!w || !h) return;
    const off = (k, side) => {
      let d = hash(k * 4 + side) * amp;
      if (hash(k * 4 + side + 977) > 0.972) d += amp * 1.9; // редкие надрывы
      return d;
    };
    const p = [];
    const nx = Math.ceil(w / step), ny = Math.ceil(h / step);
    for (let k = 0; k <= nx; k++) p.push(`${Math.min(k * step, w)}px ${off(k, 0).toFixed(1)}px`);
    for (let k = 0; k <= ny; k++) p.push(`${(w - off(k, 1)).toFixed(1)}px ${Math.min(k * step, h)}px`);
    for (let k = nx; k >= 0; k--) p.push(`${Math.min(k * step, w)}px ${(h - off(k, 2)).toFixed(1)}px`);
    for (let k = ny; k >= 0; k--) p.push(`${off(k, 3).toFixed(1)}px ${Math.min(k * step, h)}px`);
    el.style.clipPath = `polygon(${p.join(',')})`;
  }
  const paper = $('.paper');
  let lastH = 0, lastW = 0;
  new ResizeObserver(() => {
    const w = paper.offsetWidth, h = paper.offsetHeight;
    if (Math.abs(h - lastH) > 1 || Math.abs(w - lastW) > 1) { lastH = h; lastW = w; tear(paper); }
  }).observe(paper);
  tear($('.insert'), 1.8, 7);

  /* =======================================================
     Перо: разбивка текста на буквы
     ======================================================= */
  function inkify(el) {
    const chars = [];
    const walk = (node) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            const w = document.createElement('span');
            w.className = 'w';
            for (const c of part) {
              const s = document.createElement('span');
              s.className = 'ch';
              s.textContent = c;
              s.style.setProperty('--o', (0.8 + Math.random() * 0.2).toFixed(2)); // неравномерность чернил
              w.appendChild(s);
              chars.push(s);
            }
            frag.appendChild(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && !n.hasAttribute('data-noink')) {
          walk(n);
        }
      });
    };
    walk(el);
    if (chars.length) chars[chars.length - 1].dataset.end = '1';
    return chars;
  }

  /* автопрокрутка вслед за пером, пока читатель сам не листает */
  let userScrolledAt = 0;
  ['wheel', 'touchstart', 'keydown'].forEach((e) =>
    addEventListener(e, () => { userScrolledAt = performance.now(); }, { passive: true }));
  function follow(span) {
    if (performance.now() - userScrolledAt < 5000) return;
    const r = span.getBoundingClientRect();
    if (r.bottom > innerHeight * 0.8) {
      scrollBy({ top: r.bottom - innerHeight * 0.55, behavior: reduceMotion ? 'auto' : 'smooth' });
    }
  }

  function quill(chars, { speed = 26, onDone } = {}) {
    let i = 0, timer = null, done = false;
    function step() {
      if (i >= chars.length) { end(false); return; }
      const s = chars[i++];
      s.classList.add('on');
      if (i % 4 === 0) follow(s);
      const c = s.textContent;
      let d = speed * (0.55 + Math.random() * 0.9);
      if (',;:'.includes(c)) d += speed * 7;
      else if ('.!?…'.includes(c)) d += speed * 15;
      else if (c === '—') d += speed * 4;
      if (s.dataset.end) d += speed * 24;
      if (Math.random() < 0.012) d += speed * 12; // перо в чернильницу
      timer = setTimeout(step, d);
    }
    function end(instant) {
      if (done) return;
      done = true;
      clearTimeout(timer);
      if (instant) {
        for (; i < chars.length; i++) {
          chars[i].style.animationDelay = (Math.random() * 0.4).toFixed(2) + 's';
          chars[i].classList.add('on', 'quick');
        }
      }
      if (onDone) onDone();
    }
    return { start: step, finish: () => end(true) };
  }

  /* =======================================================
     Подпись: живой наклон и неровная базовая линия
     ======================================================= */
  $$('.signature .sig-line').forEach((line, li) => {
    const words = line.textContent.trim().split(/\s+/);
    line.textContent = '';
    words.forEach((w, wi) => {
      const s = document.createElement('span');
      s.className = 'sw';
      s.textContent = w;
      const y = (hash(li * 31 + wi) - 0.5) * 4 + wi * 0.35;
      const r = (hash(li * 17 + wi + 5) - 0.5) * 3;
      s.style.transform = `translateY(${y.toFixed(1)}px) rotate(${r.toFixed(1)}deg)`;
      line.appendChild(s);
      if (wi < words.length - 1) line.appendChild(document.createTextNode(' '));
    });
  });

  /* =======================================================
     Вскрытие конверта
     ======================================================= */
  const envelope = $('.envelope');
  const envStage = $('.env-stage');
  const letter = $('.letter');
  const skipBtn = $('.skip');
  let state = 'closed';

  async function openEnvelope() {
    if (state !== 'closed') return;
    state = 'opening';
    const k = reduceMotion ? 0.4 : 1;
    envelope.classList.add('is-cracking');
    await sleep(750 * k);
    envelope.classList.add('is-broken');
    await sleep(600 * k);
    envelope.classList.add('is-open');
    await sleep(820 * k);
    envelope.classList.add('flap-behind');
    await sleep(950 * k);
    envelope.classList.add('is-drawing');
    await sleep(2300 * k);
    showLetter();
  }
  envelope.addEventListener('click', openEnvelope);
  envelope.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openEnvelope(); }
  });

  function showLetter() {
    state = 'letter';
    envStage.classList.add('is-leaving');
    letter.hidden = false;
    document.body.classList.remove('is-locked');
    letter.classList.add('is-unfolding');
    scrollTo(0, 0);
    setTimeout(() => { envStage.hidden = true; }, 1350);
    $('.unfold').addEventListener('animationend', () => {
      letter.classList.remove('is-unfolding');
    }, { once: true });
    setTimeout(startWriting, reduceMotion ? 300 : 1700);
  }

  /* =======================================================
     Письмо пишется
     ======================================================= */
  let mainQuill = null;
  function startWriting() {
    const chars = $$('.letter-text [data-ink]').flatMap(inkify);
    $('.dropcap').classList.add('on');
    mainQuill = quill(chars, { speed: 24, onDone: afterLetter });
    if (reduceMotion) { mainQuill.finish(); return; }
    skipBtn.hidden = false;
    requestAnimationFrame(() => skipBtn.classList.add('on'));
    setTimeout(() => mainQuill && mainQuill.start(), 1100);
  }
  skipBtn.addEventListener('click', () => { if (mainQuill) mainQuill.finish(); });

  async function afterLetter() {
    skipBtn.classList.remove('on');
    setTimeout(() => { skipBtn.hidden = true; }, 900);
    await sleep(700);
    const items = $$('.paper .reveal');
    for (const el of items) {
      el.classList.add('on');
      await sleep(reduceMotion ? 60 : 380);
    }
  }

  /* =======================================================
     Ответ
     ======================================================= */
  const btnYes = $('.btn-yes');
  const btnNo = $('.btn-no');
  const replyYes = $('.reply-yes');
  const replyNo = $('.reply-no');
  const actions = $('.actions');
  let answered = false;

  function writeReply(el, onDone) {
    el.hidden = false;
    el.classList.remove('fading');
    const chars = $$('p', el).flatMap(inkify);
    const q = quill(chars, { speed: 17, onDone });
    if (reduceMotion) q.finish(); else q.start();
    return q;
  }

  let noQuill = null;
  btnNo.addEventListener('click', () => {
    if (answered) return;
    if (btnNo.classList.contains('relent')) { accept(); return; }
    btnNo.classList.add('relent');
    btnNo.textContent = '…Ах, будь по-вашему. Я приду';
    noQuill = writeReply(replyNo);
  });
  btnYes.addEventListener('click', accept);

  async function accept() {
    if (answered) return;
    answered = true;
    actions.classList.add('gone');
    if (!replyNo.hidden) {
      if (noQuill) noQuill.finish();
      replyNo.classList.add('fading');
      await sleep(800);
      replyNo.hidden = true;
    }
    setTimeout(() => { actions.hidden = true; }, 900);
    roses(reduceMotion ? 10 : 46);
    if (!reduceMotion) setTimeout(() => roses(22), 3800);
    await sleep(500);
    writeReply(replyYes);
  }

  /* =======================================================
     Лепестки роз: падают с покачиванием и вращением
     ======================================================= */
  const petalLayer = $('.petals');
  const petals = [];
  let petalLoop = false;

  function roses(n) {
    const W = innerWidth;
    for (let i = 0; i < n; i++) {
      const size = 11 + Math.random() * 12;
      const el = document.createElement('div');
      el.className = 'petal';
      el.style.width = size + 'px';
      el.style.height = size * 1.25 + 'px';
      el.style.opacity = '0';
      el.innerHTML = `<svg viewBox="0 0 40 50"><use href="#petal${Math.random() < 0.55 ? 1 : 2}"/></svg>`;
      el.style.filter = `brightness(${(0.72 + Math.random() * 0.28).toFixed(2)})`;
      petalLayer.appendChild(el);
      petals.push({
        el,
        x: Math.random() * W,
        y: -40 - Math.random() * 120,
        vy: 38 + Math.random() * 42,          // px/s
        drift: (Math.random() - 0.4) * 14,    // лёгкий ветер
        swayA: 18 + Math.random() * 40,
        swayF: 0.35 + Math.random() * 0.55,   // Гц
        ph: Math.random() * Math.PI * 2,
        rx: Math.random() * 360, ry: Math.random() * 360, rz: Math.random() * 360,
        vrx: 40 + Math.random() * 120, vry: 30 + Math.random() * 100, vrz: (Math.random() - 0.5) * 70,
        delay: Math.random() * 3200,
        t: 0,
      });
    }
    if (!petalLoop) { petalLoop = true; let prev = performance.now(); requestAnimationFrame(function loop(now) {
      const dt = Math.min(0.05, (now - prev) / 1000);
      prev = now;
      const H = innerHeight;
      for (let i = petals.length - 1; i >= 0; i--) {
        const p = petals[i];
        if (p.delay > 0) { p.delay -= dt * 1000; continue; }
        p.t += dt;
        const s = Math.sin(p.t * p.swayF * Math.PI * 2 + p.ph);
        // когда лепесток повёрнут плашмя — падает медленнее, «планирует»
        const flat = Math.abs(Math.cos(p.rx * Math.PI / 180));
        p.y += p.vy * (0.55 + 0.45 * (1 - flat)) * dt + 10 * dt;
        p.x += p.drift * dt;
        p.rx += p.vrx * dt * (0.6 + 0.4 * Math.abs(s));
        p.ry += p.vry * dt;
        p.rz += p.vrz * dt;
        const x = p.x + s * p.swayA;
        const fadeIn = Math.min(1, p.t / 0.6);
        const fadeOut = Math.max(0, Math.min(1, (H + 30 - p.y) / 120));
        p.el.style.opacity = (fadeIn * fadeOut).toFixed(3);
        p.el.style.transform =
          `translate3d(${x.toFixed(1)}px, ${p.y.toFixed(1)}px, 0) rotateZ(${(p.rz + s * 25).toFixed(1)}deg) rotateX(${p.rx.toFixed(1)}deg) rotateY(${p.ry.toFixed(1)}deg)`;
        if (p.y > H + 40) { p.el.remove(); petals.splice(i, 1); }
      }
      if (petals.length) requestAnimationFrame(loop); else petalLoop = false;
    }); }
  }
})();
