/* Van to Japan: illustration and motion.
   Everything drawn here is built from a few short shapes and generated wave paths.
   All motion is skipped for visitors who prefer reduced motion. */
window.VTJ = (() => {
  'use strict';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (n, a = 0, b = 1) => Math.min(b, Math.max(a, n));
  const L = 'var(--van-line,#13283A)';

  /* ---------- shared SVG sprite: the van, the torii, the ink filter ---------- */
  const SPRITE = `<svg width="0" height="0" aria-hidden="true" focusable="false"><defs>
    <symbol id="van" viewBox="0 0 160 96">
      <g stroke="${L}" stroke-width="1.6" stroke-linecap="round" fill="none"><path d="M16 13 132 3M20 15 124 7"/><path d="M26 16H112M34 16v5M70 16v5M104 16v5"/></g>
      <circle cx="48" cy="9.5" r="6.5" fill="var(--sun,#E07355)" stroke="${L}" stroke-width="1.4"/>
      <rect x="62" y="6" width="24" height="10" rx="1.5" fill="#D9C9A8" stroke="${L}" stroke-width="1.4"/>
      <path d="M14 21H112Q122 21 127 31L139 52Q150 54 150 64V76Q150 80 146 80H14Q10 80 10 76V25Q10 21 14 21Z" fill="var(--van-body,#F5F0E6)" stroke="${L}" stroke-width="2"/>
      <path d="M11 60H149V76Q149 79 146 79H14Q11 79 11 76Z" fill="var(--van-band,#3F5B4A)"/>
      <path d="M100 28H113Q117 28 120 33L129 50H100Z" fill="var(--van-glass,#2F506B)"/>
      <rect x="70" y="28" width="24" height="20" rx="2" fill="var(--van-glass,#2F506B)"/>
      <path d="M97 23V79" stroke="${L}" stroke-width="1.2" opacity=".45"/>
      <text x="17" y="50" font-family="'Barlow Condensed','Arial Narrow',sans-serif" font-weight="700" font-size="9.5" letter-spacing="1" fill="${L}" opacity=".7">FRESH FISH</text>
      <rect x="146" y="57" width="5" height="8" rx="2" fill="var(--van-lamp,#F3D58A)"/>
      <rect x="9" y="58" width="3" height="9" rx="1" fill="var(--sun,#E07355)"/>
      <rect x="143" y="74" width="10" height="5" rx="2" fill="var(--van-wheel,#0B1826)"/>
      <circle cx="40" cy="80" r="12.5" fill="var(--van-wheel,#0B1826)"/><circle cx="40" cy="80" r="5" fill="var(--van-body,#F5F0E6)"/>
      <circle cx="120" cy="80" r="12.5" fill="var(--van-wheel,#0B1826)"/><circle cx="120" cy="80" r="5" fill="var(--van-body,#F5F0E6)"/>
    </symbol>
    <symbol id="torii" viewBox="0 0 100 84"><g fill="currentColor"><path d="M2 12Q50 0 98 12L95 22Q50 12 5 22Z"/><rect x="14" y="30" width="72" height="7"/><path d="M22 20h9l2 64h-13Z"/><path d="M69 20h9l2 64h-13Z"/><rect x="46" y="20" width="8" height="10"/></g></symbol>
    <filter id="ink" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="3" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="2.6"/></filter>
    <linearGradient id="beam-g" x1="0" x2="1"><stop offset="0" stop-color="#F3D58A" stop-opacity=".85"/><stop offset="1" stop-color="#F3D58A" stop-opacity="0"/></linearGradient>
  </defs></svg>`;

  function mountSprite() {
    if (document.getElementById('vtj-sprite')) return;
    const d = document.createElement('div');
    d.id = 'vtj-sprite';
    d.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
    d.innerHTML = SPRITE;
    document.body.prepend(d);
  }

  /* ---------- waves: generated, periodic every 1200 units so they loop cleanly ---------- */
  function wavePath(kind, amp, base) {
    let d = `M0 ${base}`;
    if (kind === 'cusp') {
      const k = [1, 0.7, 1.2, 0.85, 1.1, 0.75, 1, 0.9];
      for (let r = 0; r < 4; r++) for (let i = 0; i < 8; i++) d += `q75 ${(amp * 2 * k[i]).toFixed(1)} 150 0`;
    } else {
      for (let r = 0; r < 12; r++) d += `q100 ${-amp} 200 0t200 0`;
    }
    return d + 'V100H0Z';
  }
  const wave = (cls, kind, amp, base) => `<div class="wave ${cls}"><svg viewBox="0 0 4800 100" preserveAspectRatio="none" aria-hidden="true"><path d="${wavePath(kind, amp, base)}"/></svg></div>`;

  function stars(n, colour = '#F5F0E6') {
    let seed = 7;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const layer = () => Array.from({ length: n }, () => `${Math.round(rnd() * 2200)}px ${Math.round(rnd() * 620)}px 0 ${rnd() > 0.85 ? 1 : 0}px ${colour}`).join(',');
    return `<div class="scene__stars" aria-hidden="true"><i style="box-shadow:${layer()}"></i><i style="box-shadow:${layer()}"></i></div>`;
  }

  /* ---------- hero: a British harbour at first light, Japan on the horizon ---------- */
  function heroScene() {
    const gulls = [[40, '-6s', '50%', 1], [56, '-31s', '58%', 0.7], [47, '-19s', '44%', 0.85]]
      .map(([t, d, y, s]) => `<svg class="gull" viewBox="0 0 28 12" style="--t:${t}s;--d:${d};--y:${y};--s:${s}"><path d="M2 10Q9 2 14 9Q19 2 26 10"/></svg>`).join('');
    return `<div class="scene" aria-hidden="true">${stars(60)}<div class="scene__sun"></div>${gulls}
      <div class="scene__island"><svg viewBox="0 0 340 120"><path d="M0 120C40 96 70 70 110 78S170 40 215 62 300 100 340 120Z" fill="var(--far)"/><use href="#torii" x="34" y="56" width="76" height="64" style="color:var(--far-2)"/></svg></div>
      <div class="scene__glint"></div>
      ${wave('wave--1', 'sine', 5, 10)}${wave('wave--2 wave--rev', 'cusp', 7, 6)}
      <div class="scene__quay"><svg viewBox="0 0 560 340">
        <path class="beam" d="M76 95 660-30V150Z" fill="url(#beam-g)"/>
        <path d="M54 190 61 112H91L98 190Z" fill="var(--lh-body)"/>
        <path d="M58.5 140H93.5L95.3 160H56.7Z" fill="var(--sun)"/>
        <rect x="54" y="105" width="44" height="7" rx="1" fill="var(--quay)"/>
        <rect x="65" y="86" width="22" height="19" fill="var(--lamp)"/>
        <path d="M65 86v19M76 86v19M87 86v19M76 72v-8" stroke="var(--quay)" stroke-width="2"/>
        <path d="M60 86 76 72 92 86Z" fill="var(--quay)"/>
        <circle cx="76" cy="95" r="17" fill="var(--lamp)" style="opacity:calc(var(--beam) * .7)"/>
        <rect x="128" y="168" width="30" height="22" rx="2" fill="#D9C9A8" stroke="var(--quay)" stroke-width="1.5"/><path d="M128 175h30M128 182h30" stroke="var(--quay)" stroke-width="1"/>
        <path d="M176 172v-7" stroke="var(--quay)" stroke-width="2"/><circle cx="176" cy="181" r="9" fill="var(--sun)"/>
        <path d="M-80 190H432V216H452V340H-80Z" fill="var(--quay)"/>
        <path d="M-80 190H432" stroke="var(--quay-edge)" stroke-width="3"/>
        <path d="M-80 232H452M-80 268H452M-80 304H452" stroke="var(--quay-edge)" stroke-width="1" opacity=".55"/>
        <path d="M214 190v-12h-3v-5h14v5h-3v12ZM420 190v-12h-3v-5h14v5h-3v12Z" fill="var(--quay)"/>
        <circle class="puff" cx="248" cy="180" r="5"/><circle class="puff" cx="248" cy="180" r="5"/>
        <path class="headlight" d="M392 160 486 144V182Z" fill="url(#beam-g)"/>
        <g class="van-idle"><use href="#van" x="250" y="102" width="152" height="91"/></g>
      </svg></div>
      <svg class="scene__route"><defs><mask id="route-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="100%" height="100%"><path class="reveal"/></mask></defs><path class="dash" mask="url(#route-mask)"/></svg>
      ${wave('wave--3', 'cusp', 9, 8)}${wave('wave--4 wave--rev', 'cusp', 16, 22)}</div>`;
  }

  function initHero(hero) {
    const scene = hero.querySelector('.scene');
    const quay = hero.querySelector('.scene__quay');
    const isl = hero.querySelector('.scene__island');
    const route = hero.querySelector('.scene__route');
    const dash = route.querySelector('.dash');
    const reveal = route.querySelector('.reveal');
    const build = () => {
      const r = scene.getBoundingClientRect();
      const q = quay.getBoundingClientRect();
      const i = isl.getBoundingClientRect();
      if (!r.width) return;
      const qs = q.width / 560;
      const is = i.width / 340;
      const x1 = q.left - r.left + 410 * qs, y1 = q.top - r.top + 150 * qs;
      const x2 = i.left - r.left + 72 * is, y2 = i.top - r.top + 52 * is;
      const d = `M${x1.toFixed(1)} ${y1.toFixed(1)}Q${((x1 + x2) / 2).toFixed(1)} ${(Math.min(y1, y2) - clamp(r.width * 0.1, 36, 170)).toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`;
      route.setAttribute('viewBox', `0 0 ${r.width} ${r.height}`);
      dash.setAttribute('d', d);
      reveal.setAttribute('d', d);
      reveal.style.setProperty('--len', Math.ceil(reveal.getTotalLength()) + 20);
      if (reduce) reveal.style.strokeDashoffset = 0;
    };
    build();
    const ro = new ResizeObserver(build);
    ro.observe(scene);
    let raf = 0;
    const move = (e) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const r = hero.getBoundingClientRect();
        hero.style.setProperty('--mx', (((e.clientX - r.left) / r.width) * 2 - 1).toFixed(3));
        hero.style.setProperty('--my', (((e.clientY - r.top) / r.height) * 2 - 1).toFixed(3));
      });
    };
    const fine = matchMedia('(hover: hover) and (pointer: fine)').matches && !reduce;
    if (fine) hero.addEventListener('pointermove', move);
    return () => { ro.disconnect(); hero.removeEventListener('pointermove', move); };
  }

  /* ---------- destination: the house fills like a tide gauge ---------- */
  function destination({ pct, value, target, label, money, cta = '' }) {
    const top = 122, bot = 322, h = bot - top;
    const rise = Math.max(0.1, pct) * h; // keep a visible sliver; the printed figure is the true one
    const pctText = (pct * 100 < 10 ? (pct * 100).toFixed(1) : Math.round(pct * 100)) + '%';
    let w = `M-130 ${bot}`;
    for (let i = 0; i < 6; i++) w += 'q32.5 -9 65 0t65 0';
    w += `V${bot + h + 20}H-130Z`;
    const roof = 'M90 204Q124 208 152 170L186 122H334L368 170Q396 208 430 204L424 216H96Z';
    const ticks = [0, 1 / 3, 2 / 3, 1].map((f) => {
      const y = bot - f * h;
      return `<path d="M64 ${y}h12" stroke="var(--dest-muted)" stroke-width="1.5"/><text x="58" y="${y + 4}" text-anchor="end">${f ? '£' + Math.round((target * f) / 1000) + 'k' : '£0'}</text>`;
    }).join('');
    return `<section class="dest wave-edge" aria-labelledby="dest-h">${stars(50)}
      <div class="wrap dest__grid"><div class="dest__copy"><p class="eyebrow">The destination · <span lang="ja">目的地</span></p><h2 id="dest-h">${label}</h2>
        <p>Every van, every trade and every draw raises the tide a little. When it reaches the roof, we buy the house.</p>
        <p class="dest__pct">${pctText}<small>of the way</small></p><p class="dest__sum"><b>${money(value)}</b> of ${money(target)}</p>${cta}</div>
      <div class="dest__art"><svg viewBox="-24 60 568 282" role="img" aria-label="A house in Japan drawn as a dashed outline, filled ${pctText} of the way up like a tide gauge, beside a torii gate">
        <defs><clipPath id="house-clip"><path d="${roof}"/><rect x="134" y="214" width="252" height="96"/><rect x="120" y="310" width="280" height="12"/></clipPath></defs>
        <circle class="dest__sun" cx="260" cy="206" r="128"/>
        <g clip-path="url(#house-clip)"><rect x="90" y="110" width="340" height="220" fill="var(--dest-bg)" opacity=".55"/>
          <g class="tide is-low" style="--tide-y:${-rise.toFixed(1)}px"><path class="tide__water tide__wave" d="${w}"/></g></g>
        <path class="house-outline" d="${roof}M134 214V310M386 214V310M120 310H400V322H120Z"/>
        <path class="house-detail" d="M150 186H370M228 310V240H292V310M260 240V310M156 240H206V284H156ZM181 240V284M156 262H206M314 240H364V284H314ZM339 240V284M314 262H364"/>
        <path d="M70 ${top}V${bot}" stroke="var(--dest-muted)" stroke-width="1.5"/>${ticks}
        <path d="M64 ${bot - rise}H${134}" stroke="var(--dest-text)" stroke-width="1.5" stroke-dasharray="2 4"/>
        <text class="now-label" x="58" y="${bot - rise + 4}" text-anchor="end">NOW ${money(value)}</text>
        <use href="#torii" x="424" y="238" width="100" height="84" style="color:var(--dest-line)"/>
      </svg></div></div>
      <div class="dest__sea" aria-hidden="true">${wave('wave--1', 'sine', 8, 14)}${wave('wave--2 wave--rev', 'cusp', 9, 8)}${wave('wave--3', 'cusp', 16, 30)}</div></section>`;
  }

  /* ---------- odometer ---------- */
  function odo(value, { pad = 0, prefix = '', label = '' } = {}) {
    const s = (typeof value === 'number' ? Math.round(value).toLocaleString('en-GB') : String(value)).padStart(pad, '0');
    let i = 0;
    const cells = [...s].map((ch) => (/\d/.test(ch)
      ? `<span class="odo__cell"><span class="odo__reel" style="--d:${ch};--i:${i++}">${'0123456789'.split('').map((n) => `<span>${n}</span>`).join('')}</span></span>`
      : `<span class="odo__sep">${ch}</span>`)).join('');
    return `<span class="odo" role="img" aria-label="${label || prefix + s}">${prefix ? `<span class="odo__pre" aria-hidden="true">${prefix}</span>` : ''}<span aria-hidden="true" style="display:contents">${cells}</span></span>`;
  }

  /* ---------- stamp ---------- */
  const stamp = (kanji, text) => `<span class="stamp" aria-hidden="true"><span class="stamp__k" lang="ja">${kanji}</span><span class="stamp__t">${text}</span></span>`;

  /* ---------- on-view effects: odometers roll, stamps press, the tide comes in ---------- */
  function initOnView(root) {
    const odos = [...root.querySelectorAll('.odo')];
    const stamps = [...root.querySelectorAll('.stamp')];
    const tides = [...root.querySelectorAll('.tide')];
    if (reduce || !('IntersectionObserver' in window)) { tides.forEach((t) => t.classList.remove('is-low')); return () => {}; }
    const vh = innerHeight;
    stamps.forEach((s) => { if (s.getBoundingClientRect().top > vh * 0.9) s.classList.add('is-waiting'); });
    const io = new IntersectionObserver((entries) => entries.forEach((en) => {
      if (!en.isIntersecting) return;
      const t = en.target;
      io.unobserve(t);
      if (t.classList.contains('odo')) t.classList.add('is-rolling');
      else if (t.classList.contains('tide')) t.classList.remove('is-low');
      else if (t.classList.contains('is-waiting')) { t.classList.remove('is-waiting'); t.classList.add('is-pressing'); }
    }), { threshold: 0.35 });
    [...odos, ...stamps, ...tides.map((t) => t)].forEach((e) => io.observe(e));
    return () => io.disconnect();
  }

  /* ---------- voyage: the route draws itself and the van drives it as you scroll ---------- */
  function initVoyage(root) {
    const svg = root.querySelector('.voyage__svg');
    const fut = root.querySelector('.voyage__future');
    const done = root.querySelector('.voyage__done');
    const van = root.querySelector('.voyage__van');
    const vanSvg = van.querySelector('svg');
    const stops = [...root.querySelectorAll('[data-stop]')];
    let total = 0, lNow = 0, lStart = 0, raf = 0, dir = 1;

    const build = () => {
      const r = root.getBoundingClientRect();
      if (!r.width || !stops.length) return;
      svg.setAttribute('viewBox', `0 0 ${r.width} ${r.height}`);
      const pts = stops.map((s) => {
        const n = s.querySelector('.stop__node').getBoundingClientRect();
        return { x: n.left - r.left + n.width / 2, y: n.top - r.top + n.height / 2, now: s.classList.contains('is-now'), done: s.classList.contains('is-done') };
      });
      const amp = r.width > 900 ? 70 : 9;
      let d = `M${pts[0].x} 0L${pts[0].x} ${pts[0].y}`;
      let dNow = pts[0].now || pts[0].done ? d : null;
      pts.forEach((p, i) => {
        if (!i) return;
        const q = pts[i - 1];
        const dy = p.y - q.y;
        const s = (i % 2 ? 1 : -1) * amp;
        d += `C${q.x + s} ${q.y + dy * 0.45} ${p.x + s} ${p.y - dy * 0.45} ${p.x} ${p.y}`;
        if (p.now || p.done) dNow = d;
      });
      const last = pts[pts.length - 1];
      d += `L${last.x} ${r.height}`;
      done.setAttribute('d', dNow || `M${pts[0].x} 0`);
      lNow = done.getTotalLength();
      lStart = Math.min(pts[0].y, lNow);
      fut.setAttribute('d', d);
      done.setAttribute('d', d);
      total = fut.getTotalLength();
      tick();
    };

    const place = (l) => {
      const p = fut.getPointAtLength(l);
      const a = fut.getPointAtLength(Math.max(0, l - 6));
      const b = fut.getPointAtLength(Math.min(total, l + 6));
      const dx = b.x - a.x;
      if (Math.abs(dx) > 1.2) dir = dx > 0 ? 1 : -1;
      const tilt = clamp(dx * 1.4, -9, 9) * dir;
      van.style.transform = `translate(${p.x.toFixed(1)}px,${p.y.toFixed(1)}px)`;
      vanSvg.style.transform = `scaleX(${dir}) rotate(${tilt.toFixed(1)}deg)`;
      done.style.strokeDasharray = `${l.toFixed(1)} ${total + 10}`;
    };

    const tick = () => {
      raf = 0;
      if (!total) return;
      if (reduce) { place(lNow); return; }
      const r = root.getBoundingClientRect();
      const focusY = innerHeight * 0.55 - r.top;
      let lo = lStart, hi = lNow;
      if (focusY <= fut.getPointAtLength(lo).y) { place(lo); return; }
      if (focusY >= fut.getPointAtLength(hi).y) { place(hi); return; }
      for (let i = 0; i < 14; i++) {
        const mid = (lo + hi) / 2;
        if (fut.getPointAtLength(mid).y < focusY) lo = mid; else hi = mid;
      }
      place((lo + hi) / 2);
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(tick); };

    build();
    const ro = new ResizeObserver(build);
    ro.observe(root);
    addEventListener('scroll', onScroll, { passive: true });
    return () => { ro.disconnect(); removeEventListener('scroll', onScroll); };
  }

  return { reduce, clamp, mountSprite, wave, stars, heroScene, initHero, destination, odo, stamp, initOnView, initVoyage };
})();
