/* Van to Japan: site framework.
   The journey is data. Chapters, competitions and winners come from /data/*.json,
   and every page, counter, timeline and map is built from them. */
(() => {
  'use strict';

  /* ---------- helpers ---------- */
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const money = (n) => '£' + Number(n || 0).toLocaleString('en-GB', { maximumFractionDigits: 2, minimumFractionDigits: Number.isInteger(+n) ? 0 : 2 });
  const num = (n) => Number(n || 0).toLocaleString('en-GB');
  const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '');
  const fmtDateTime = (iso) => (iso ? new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '');
  const clamp = (n, a = 0, b = 1) => Math.min(b, Math.max(a, n));
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const KANJI = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
  const page = document.body.dataset.page || 'home';
  const hooks = [];
  document.documentElement.classList.add('js');

  const NAV = [
    ['journey.html', 'The Journey', 'journey'],
    ['win.html', 'Win', 'win'],
    ['winners.html', 'Winners', 'winners'],
    ['how-it-works.html', 'How It Works', 'how'],
    ['about.html', 'About', 'about'],
  ];
  const NAV_ACTIVE = { journey: 'journey', chapter: 'journey', win: 'win', competition: 'win', winners: 'winners', how: 'how', about: 'about' };

  /* ---------- data ---------- */
  let D = {};
  let S = {}; // derived state

  async function load() {
    const get = (f) => fetch('data/' + f).then((r) => { if (!r.ok) throw new Error(f + ' ' + r.status); return r.json(); });
    const [site, chapters, competitions, winners] = await Promise.all([get('site.json'), get('chapters.json'), get('competitions.json'), get('winners.json')]);
    D = { site, chapters: [...chapters].sort((a, b) => a.chapter - b.chapter), competitions, winners };
  }

  function derive() {
    const ch = D.chapters;
    const done = ch.filter((c) => c.status === 'completed');
    const current = ch.find((c) => c.status === 'current') || null;
    const upcoming = ch.filter((c) => c.status === 'upcoming');
    const lastDone = done[done.length - 1] || null;
    const value = current ? (current.valueNow ?? current.valueIn ?? 0) : (lastDone?.valueOut ?? 0);
    const target = D.site.target.value;
    const first = ch[0]?.dateStarted;
    const days = first ? Math.max(0, Math.floor((Date.now() - new Date(first)) / 864e5)) : 0;
    const maxNo = ch.reduce((m, c) => Math.max(m, c.chapter), 0);
    S = {
      current, done, upcoming, value, target,
      pct: clamp(value / target),
      days,
      chaptersCount: done.length + (current ? 1 : 0),
      comps: D.competitions.length,
      winnersCount: D.winners.length,
      mysteryNo: (current?.chapter ?? lastDone?.chapter ?? 0) + 1,
      hasUpcomingEntry: upcoming.length > 0,
      maxNo,
      liveComps: D.competitions.filter((c) => c.status === 'live'),
    };
  }

  const chapterBy = (n) => D.chapters.find((c) => c.chapter === +n);
  const compBy = (id) => D.competitions.find((c) => c.id === id);
  const winnerBy = (id) => D.winners.find((w) => w.id === id);
  const enterHref = () => (S.liveComps[0] ? `competition.html?id=${encodeURIComponent(S.liveComps[0].id)}` : 'win.html');

  /* ---------- small components ---------- */
  const photo = (src, alt, label) =>
    `<div class="photo">${src
      ? `<img src="${esc(src)}" alt="${esc(alt)}" loading="lazy" decoding="async">`
      : `<div class="ph" role="img" aria-label="Placeholder: ${esc(alt)}"><span>PHOTO · ${esc(label || alt)}</span></div>`}</div>`;

  const stamp = (top, bottom) => `<span class="stamp" aria-hidden="true"><span class="stamp__n">${esc(top)}</span><span class="stamp__t">${esc(bottom)}</span></span>`;

  const toriiSvg = `<svg class="torii" viewBox="0 0 100 80" fill="currentColor" aria-hidden="true"><path d="M4 14 Q50 2 96 14 L94 24 Q50 14 6 24Z"/><rect x="16" y="28" width="68" height="8" rx="1"/><rect x="22" y="24" width="9" height="54" rx="1"/><rect x="69" y="24" width="9" height="54" rx="1"/><rect x="45" y="22" width="10" height="8"/></svg>`;

  function chapterCard(c) {
    const stateCls = c.status === 'completed' ? 'is-completed' : c.status === 'current' ? 'is-current' : 'is-upcoming';
    if (c.status === 'upcoming') {
      return `<article class="card chapter-card ${stateCls}"><div class="chapter-card__media"><div class="photo"><span class="mystery-mark" aria-hidden="true">?</span></div></div>
        <div class="chapter-card__body"><p class="eyebrow">Chapter ${c.chapter}</p><h3>${c.revealTitle ? esc(c.title) : 'Next stop unknown'}</h3><p class="values">Coming up</p></div></article>`;
    }
    const kanji = KANJI[c.chapter] ? `第${KANJI[c.chapter]}章` : '章';
    const values = `<p class="values"><b>${money(c.valueIn)}</b> in${c.valueOut != null ? ` → <b>${money(c.valueOut)}</b> out` : ' → ?'}</p>`;
    return `<article class="card card--link chapter-card ${stateCls} ${c.status === 'completed' ? 'stamp-anim' : ''}">
      <a class="chapter-card__link" href="chapter.html?n=${c.chapter}">
        <div class="chapter-card__media">${photo(c.hero, c.heroAlt || c.title, c.title)}
          ${c.status === 'completed' ? stamp('№' + c.chapter, 'Done') : '<span class="tag">Now</span>'}</div>
        <div class="chapter-card__body"><span class="chapter-card__kanji" lang="ja" aria-hidden="true">${kanji}</span>
          <p class="eyebrow">Chapter ${c.chapter}${c.location ? ' · ' + esc(c.location) : ''}</p>
          <h3>${esc(c.title)}</h3>${values}</div></a></article>`;
  }

  const mysteryCard = () => `<article class="card chapter-card is-mystery"><div class="chapter-card__media"><div class="photo"><span class="mystery-mark" aria-hidden="true">?</span></div></div>
    <div class="chapter-card__body"><p class="eyebrow">Chapter ${S.mysteryNo}</p><h3>Next stop unknown</h3><p class="values">To be revealed</p></div></article>`;

  const japanCard = () => `<article class="card chapter-card is-japan" aria-label="The destination: a house in Japan"><div class="chapter-card__media"><div class="photo">${toriiSvg}</div></div>
    <div class="chapter-card__body"><span class="chapter-card__kanji" lang="ja" aria-hidden="true">日本</span><p class="eyebrow">The destination</p><h3>${esc(D.site.target.label)}</h3><p class="values">Target <b>${money(S.target)}</b></p></div></article>`;

  function timeline(chapters, opts = {}) {
    const items = chapters.map((c) => `<li class="${c.status === 'completed' ? 'is-done' : c.status === 'current' ? 'is-now' : ''}">${chapterCard(c)}</li>`);
    const lastShown = chapters[chapters.length - 1];
    const lastIsEnd = lastShown && lastShown.chapter === S.maxNo;
    if (!S.hasUpcomingEntry || !lastIsEnd) items.push(`<li>${mysteryCard()}</li>`);
    items.push(`<li>${japanCard()}</li>`);
    return `<ol class="timeline ${opts.scroll ? 'timeline--scroll' : ''}" aria-label="The journey, in order">${items.join('')}</ol>`;
  }

  function valueMeter() {
    return `<div class="meter-block"><div class="meter-block__row"><span>Value meter</span><span>${money(S.value)} of ${money(S.target)}</span></div>
      <div class="meter" role="progressbar" aria-label="Current value towards the house in Japan" aria-valuemin="0" aria-valuemax="${S.target}" aria-valuenow="${S.value}"><div class="meter__fill" style="--pct:${(S.pct * 100).toFixed(2)}%"></div></div></div>`;
  }

  const tradeCounter = () => `<dl class="counter">
    <div><dd>${num(S.chaptersCount)}</dd><dt>Chapters</dt></div>
    <div><dd>${num(S.days)}</dd><dt>Days on the road</dt></div>
    <div><dd>${num(S.comps)}</dd><dt>Competitions</dt></div>
    <div><dd>${num(S.winnersCount)}</dd><dt>Winners made</dt></div></dl>`;

  const progressPanel = () => `<div class="progress-panel">${valueMeter()}${tradeCounter()}</div>`;

  function routeMap() {
    const d = 'M70 200 C 170 60, 280 250, 390 150 S 600 40, 730 110';
    return `<figure class="route-map"><svg viewBox="0 30 800 230" role="img" aria-labelledby="rm-t rm-d"><title id="rm-t">Route from the UK to Japan</title><desc id="rm-d">A dashed line from the UK to Japan with a pin for each chapter. The solid part shows how far the journey has come.</desc>
      <path class="route-map__full" d="${d}"/><path class="route-map__done" id="route-done" d="${d}"/><path id="route-measure" d="${d}" fill="none" stroke="none"/><g id="route-pins"></g>
      <text x="70" y="240" text-anchor="middle">UK</text><text x="730" y="150" text-anchor="middle">Japan</text>
      <g transform="translate(702 62) scale(.5)" fill="currentColor" style="color:var(--muted)"><path d="M4 14 Q50 2 96 14 L94 24 Q50 14 6 24Z"/><rect x="16" y="28" width="68" height="8"/><rect x="22" y="24" width="9" height="54"/><rect x="69" y="24" width="9" height="54"/></g></svg>
      <figcaption>A symbolic route, not literal miles. The solid line fills as the value grows towards the house.</figcaption></figure>`;
  }

  function hookRouteMap(scrollDraw) {
    const full = document.getElementById('route-measure');
    const doneEl = document.getElementById('route-done');
    const pinsG = document.getElementById('route-pins');
    if (!full || !doneEl) return;
    const L = full.getTotalLength();
    const frac = Math.max(0.06, S.pct);
    const shown = D.chapters.filter((c) => c.status !== 'upcoming');
    pinsG.innerHTML = shown.map((c, i) => {
      const t = shown.length === 1 ? frac : frac * (i / (shown.length - 1));
      const p = full.getPointAtLength(L * t);
      return `<g class="pin ${c.status === 'current' ? 'is-now' : ''}"><a href="chapter.html?n=${c.chapter}" aria-label="Chapter ${c.chapter}: ${esc(c.title)}"><title>Chapter ${c.chapter}: ${esc(c.title)}${c.location ? ' (' + esc(c.location) + ')' : ''}</title><circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="14"/><text x="${p.x.toFixed(1)}" y="${p.y.toFixed(1)}">${c.chapter}</text></a></g>`;
    }).join('');
    const set = (p) => { doneEl.style.strokeDasharray = `${L * frac * p} ${L}`; };
    if (!scrollDraw || reduceMotion) { set(1); return; }
    const host = doneEl.closest('figure');
    const tick = () => {
      const r = host.getBoundingClientRect();
      const vh = innerHeight;
      set(clamp((vh * 0.85 - r.top) / (r.height + vh * 0.35)));
    };
    tick();
    addEventListener('scroll', tick, { passive: true });
    addEventListener('resize', tick);
  }

  const ticketsBar = (c) => {
    const left = Math.max(0, c.totalTickets - c.sold);
    return `<div class="tickets"><div class="meter" role="progressbar" aria-label="Tickets sold" aria-valuemin="0" aria-valuemax="${c.totalTickets}" aria-valuenow="${c.sold}"><div class="meter__fill" style="--pct:${((c.sold / c.totalTickets) * 100).toFixed(1)}%"></div></div>
      <div class="tickets__text"><span>${num(c.sold)} of ${num(c.totalTickets)} sold</span><span>${num(left)} left</span></div></div>`;
  };

  function competitionCard(c) {
    const href = `competition.html?id=${encodeURIComponent(c.id)}`;
    const live = c.status === 'live';
    const drawn = c.status === 'drawn';
    return `<article class="card comp-card ${drawn ? 'stamp-anim' : ''}"><div class="comp-card__media">${photo(c.image, c.imageAlt || c.title, c.title)}${drawn ? stamp('Drawn', fmtDate(c.drawAt).split(' ').slice(0, 2).join(' ')) : ''}</div>
      <div class="comp-card__body"><p class="eyebrow">Chapter ${c.chapter}</p><h3>${esc(c.title)}</h3>
        <p class="comp-card__price">${money(c.price)} <span class="muted">per ticket</span></p>
        ${live ? ticketsBar(c) : ''}
        <p class="draw-line">${live ? 'Draw: ' : drawn ? 'Drawn: ' : 'Opens soon · draw: '}<time datetime="${esc(c.drawAt)}">${fmtDateTime(c.drawAt)}</time></p>
        <div class="comp-card__actions">${live
          ? `<a class="btn btn--action" href="${href}">Enter now</a><a class="text-link" href="free-entry.html">Free entry</a>`
          : `<a class="btn btn--secondary" href="${href}">${drawn ? 'View result' : 'Details'}</a>`}</div></div></article>`;
  }

  function trustStrip(c) {
    return `<ul class="trust" aria-label="How this competition works">
      <li><span class="trust__label">Max tickets</span><span class="trust__value">${num(c.maxPerPerson)} per person</span></li>
      <li><span class="trust__label">Odds</span><span class="trust__value">1 in ${num(c.totalTickets)} per ticket</span></li>
      <li><span class="trust__label">Live draw</span><span class="trust__value">${esc(D.site.draw.platform)}</span></li>
      <li><span class="trust__label">Free entry</span><span class="trust__value"><a href="free-entry.html">Enter by post</a></span></li>
      <li><span class="trust__label">Cash alternative</span><span class="trust__value">${c.cashAlternative ? money(c.cashAlternative) : 'None'}</span></li></ul>`;
  }

  function winnerCard(w) {
    return `<article class="card winner-card">${photo(w.photo, w.photoAlt || 'Winner handover', 'Handover')}
      <div class="winner-card__body"><p class="eyebrow">${esc(w.area)}</p><h3>${esc(w.name)}</h3><p class="values">Won <b>${esc(w.prize)}</b><br>${fmtDate(w.date)}</p>
      ${w.competition ? `<a class="text-link" href="competition.html?id=${encodeURIComponent(w.competition)}">See the draw</a>` : ''}</div></article>`;
  }

  function videoEmbed(v) {
    return `<figure class="video ${v.provider === 'tiktok' ? 'video--portrait' : ''}"><div class="video__frame" data-provider="${esc(v.provider)}" data-id="${esc(v.id)}" data-title="${esc(v.caption)}">
      <button class="video__play" type="button" aria-label="Play video: ${esc(v.caption)}"><span aria-hidden="true">▶</span></button></div>
      <figcaption>${esc(v.caption)}${v.transcript ? ` <details><summary>Transcript</summary><p>${esc(v.transcript)}</p></details>` : ''}</figcaption></figure>`;
  }

  function hookVideos() {
    const SRC = {
      youtube: (id) => `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1`,
      tiktok: (id) => `https://www.tiktok.com/embed/v2/${encodeURIComponent(id)}`,
      instagram: (id) => `https://www.instagram.com/p/${encodeURIComponent(id)}/embed`,
    };
    document.querySelectorAll('.video__frame').forEach((f) => {
      f.querySelector('.video__play')?.addEventListener('click', () => {
        const src = SRC[f.dataset.provider]?.(f.dataset.id);
        if (!src) return;
        f.innerHTML = `<iframe src="${src}" title="${esc(f.dataset.title)}" loading="lazy" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
      });
    });
  }

  function hookCountdowns() {
    const els = document.querySelectorAll('[data-draw]');
    if (!els.length) return;
    const fmt = (ms) => {
      if (ms <= 0) return 'Draw time reached';
      const s = Math.floor(ms / 1000);
      const p = (n) => String(n).padStart(2, '0');
      return `${Math.floor(s / 86400)}d ${p(Math.floor((s % 86400) / 3600))}h ${p(Math.floor((s % 3600) / 60))}m ${p(s % 60)}s`;
    };
    const tick = () => els.forEach((el) => { el.querySelector('[data-count]').textContent = fmt(new Date(el.dataset.draw) - Date.now()); });
    tick();
    setInterval(tick, 1000);
  }

  function hookStamps() {
    const els = document.querySelectorAll('.stamp-anim');
    if (!els.length) return;
    if (reduceMotion || !('IntersectionObserver' in window)) { els.forEach((e) => e.classList.add('in-view')); return; }
    const io = new IntersectionObserver((entries) => entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('in-view'); io.unobserve(en.target); } }), { threshold: 0.4 });
    els.forEach((e) => io.observe(e));
  }

  const steps = () => `<ol class="steps">${D.site.howSteps.map((s) => `<li><h3>${esc(s.title)}</h3><p>${esc(s.text)}</p></li>`).join('')}</ol>`;
  const empty = (msg) => `<div class="empty"><p>${msg}</p></div>`;

  /* ---------- shell: header, progress strip, mobile bar, footer ---------- */
  function renderShell() {
    const active = NAV_ACTIVE[page];
    const cur = S.current;
    const strip = `<a class="progress-strip" href="journey.html" aria-label="Journey progress: see the full journey"><div class="progress-strip__inner">
      <strong>${cur ? `Now: Chapter ${cur.chapter} · ${esc(cur.title)}` : 'The journey'}</strong>
      <div class="meter" aria-hidden="true"><div class="meter__fill" style="--pct:${(S.pct * 100).toFixed(2)}%"></div></div>
      <span class="mono">${money(S.value)} / ${money(S.target)}</span></div></a>`;
    document.getElementById('site-header').outerHTML = `<header class="site-header" id="site-header"><div class="wrap site-header__bar">
        <a class="brand" href="index.html" aria-label="${esc(D.site.name)} home"><svg width="34" height="34" viewBox="0 0 34 34" fill="none" aria-hidden="true"><rect width="34" height="34" rx="8" fill="#F5F0E6"/><path d="M5 25C10 10 16 28 21 16S27 9 29 9" stroke="#13283A" stroke-width="2.2" stroke-dasharray="1 4" stroke-linecap="round"/><circle cx="29" cy="9" r="3" fill="#C8412D"/></svg><span class="brand__name">${esc(D.site.name)}</span></a>
        <div class="site-header__tools"><a class="free-link" href="free-entry.html">Free entry</a>
          <button class="icon-btn" id="theme-toggle" type="button" aria-label="Switch between day and night theme"><span aria-hidden="true">☾</span></button>
          <button class="icon-btn menu-btn" id="menu-btn" type="button" aria-expanded="false" aria-controls="primary-nav">Menu</button></div>
        <div class="site-header__nav-wrap"><nav class="nav" id="primary-nav" aria-label="Primary">${NAV.map(([h, l, k]) => `<a href="${h}"${k === active ? ' aria-current="page"' : ''}>${l}</a>`).join('')}</nav></div></div>${strip}</header>`;

    document.getElementById('site-footer').outerHTML = `<footer class="site-footer" id="site-footer"><div class="wrap"><div class="site-footer__grid">
        <div><h2>${esc(D.site.name)}</h2><p>${esc(D.site.tagline)}</p></div>
        <div><h2>Follow</h2><ul>${D.site.socials.map((s) => `<li><a href="${esc(s.url)}" rel="noopener">${esc(s.label)}</a></li>`).join('')}</ul></div>
        <div><h2>Fair play</h2><ul><li><a href="free-entry.html">Free entry</a></li><li><a href="legal.html#terms">Terms</a></li><li><a href="legal.html#privacy">Privacy</a></li><li><a href="legal.html#responsible-play">Responsible play</a></li></ul></div></div>
        <small>© ${new Date().getFullYear()} ${esc(D.site.name)}</small></div></footer>`;

    const bar = document.createElement('div');
    bar.className = 'mobile-bar';
    bar.innerHTML = `<a class="btn btn--secondary" href="journey.html">Follow the journey</a><a class="btn btn--action" href="${enterHref()}">Enter now</a>`;
    document.body.appendChild(bar);

    const btn = document.getElementById('menu-btn');
    const nav = document.getElementById('primary-nav');
    btn.addEventListener('click', () => { const o = nav.classList.toggle('is-open'); btn.setAttribute('aria-expanded', String(o)); });
    const tt = document.getElementById('theme-toggle');
    const isDark = () => (document.documentElement.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')) === 'dark';
    const label = () => { tt.firstElementChild.textContent = isDark() ? '☀' : '☾'; tt.title = isDark() ? 'Switch to day theme' : 'Switch to night theme'; };
    label();
    tt.addEventListener('click', () => {
      const next = isDark() ? 'light' : 'dark';
      document.documentElement.dataset.theme = next;
      try { localStorage.setItem('vtj-theme', next); } catch (e) { /* storage unavailable */ }
      label();
    });
  }

  /* ---------- pages ---------- */
  const pages = {};

  pages.home = () => {
    const c = S.current;
    const shown = D.chapters.filter((x) => x.status !== 'upcoming').slice(-3);
    const live = S.liveComps.slice(0, 3);
    const vidChapter = [...D.chapters].reverse().find((x) => x.videos?.length);
    hooks.push(() => hookRouteMap(false));
    return `
    <section class="hero"><div class="hero__media">${photo(c?.hero, c?.heroAlt || 'The current van', c ? c.title : 'Hero')}</div>
      <div class="wrap hero__body"><p class="eyebrow">${c ? `Chapter ${c.chapter} · Now` : 'The journey'}</p><h1>${esc(D.site.name)}</h1><p class="lede">${esc(D.site.tagline)}</p>
      <div class="hero__actions"><a class="btn btn--action" href="${enterHref()}">Enter now</a><a class="btn btn--secondary" href="journey.html">Follow the journey</a></div></div></section>
    <section class="section section--tight"><div class="wrap">${progressPanel()}</div></section>
    <section class="section contours"><div class="wrap"><div class="section__head"><h2>The journey so far</h2><a class="text-link" href="journey.html">Full journey →</a></div>${timeline(shown, { scroll: true })}</div></section>
    <section class="section"><div class="wrap"><div class="section__head"><h2>Live competitions</h2><a class="text-link" href="win.html">All competitions →</a></div>
      ${live.length ? `<div class="comp-grid">${live.map(competitionCard).join('')}</div>` : empty('No competition is open right now. Follow the journey to be first to know when the next one starts.')}</div></section>
    <section class="section panel-bg"><div class="wrap"><div class="section__head"><h2>Latest winners</h2><a class="text-link" href="winners.html">All winners →</a></div>
      ${D.winners.length ? `<div class="winner-row">${[...D.winners].reverse().map(winnerCard).join('')}</div>` : empty('Winners appear here after each live draw.')}</div></section>
    ${vidChapter ? `<section class="section"><div class="wrap"><div class="section__head"><h2>Latest video</h2></div>${videoEmbed(vidChapter.videos[0])}</div></section>` : ''}
    <section class="section"><div class="wrap"><div class="section__head"><h2>How it works</h2><a class="text-link" href="how-it-works.html">The details →</a></div>${steps()}
      <p style="margin-top:1rem">Prefer not to pay? <a href="free-entry.html">There's a free entry route</a> with the same chance.</p></div></section>`;
  };

  pages.journey = () => {
    hooks.push(() => hookRouteMap(true));
    return `<div class="wrap page-head"><p class="eyebrow">The story so far</p><h1>The Journey</h1><p>${esc(D.site.storySoFar)}</p></div>
    <section class="section section--tight"><div class="wrap">${routeMap()}</div></section>
    <section class="section contours"><div class="wrap"><div class="section__head"><h2>Every chapter</h2></div>${timeline(D.chapters, { scroll: true })}</div></section>
    <section class="section section--tight"><div class="wrap">${progressPanel()}</div></section>`;
  };

  pages.chapter = () => {
    const n = new URLSearchParams(location.search).get('n');
    const c = chapterBy(n);
    if (!c || c.status === 'upcoming') return `<div class="wrap page-head"><h1>Chapter not found</h1><p>That chapter hasn't happened yet. <a href="journey.html">Back to the journey</a>.</p></div>`;
    document.title = `${c.title} · Chapter ${c.chapter} · ${D.site.name}`;
    const comp = c.competition ? compBy(c.competition) : null;
    const win = c.winner ? winnerBy(c.winner) : null;
    const prev = chapterBy(c.chapter - 1);
    const next = chapterBy(c.chapter + 1);
    return `<div class="wrap page-head"><a class="back-link" href="journey.html">← The Journey</a>
      <p class="eyebrow">Chapter ${c.chapter}${c.location ? ' · ' + esc(c.location) : ''} · ${c.status === 'completed' ? 'Completed' : 'Current'}</p><h1>${esc(c.title)}</h1><p class="lede">${esc(c.summary)}</p></div>
    <section class="section section--tight stamp-anim"><div class="wrap two-col"><div>${photo(c.hero, c.heroAlt || c.title, c.title)}
        ${c.gallery?.length ? `<div class="gallery gallery--wide">${c.gallery.map((g) => photo(g.src, g.alt)).join('')}</div>` : ''}</div>
      <div class="stack"><dl class="facts"><div><dt>Item</dt><dd>${esc(c.item)}</dd></div><div><dt>Value in</dt><dd>${money(c.valueIn)}</dd></div><div><dt>Value out</dt><dd>${c.valueOut != null ? money(c.valueOut) : '?'}</dd></div>
        <div><dt>Started</dt><dd>${fmtDate(c.dateStarted)}</dd></div><div><dt>Ended</dt><dd>${c.dateEnded ? fmtDate(c.dateEnded) : 'In progress'}</dd></div></dl>
        ${c.status === 'completed' ? stamp('№' + c.chapter, 'Done') : '<span class="tag">Now</span>'}</div></div></section>
    ${c.videos?.length ? `<section class="section section--tight"><div class="wrap"><div class="section__head"><h2>Watch</h2></div><div class="stack">${c.videos.map(videoEmbed).join('')}</div></div></section>` : ''}
    ${comp ? `<section class="section panel-bg"><div class="wrap"><div class="section__head"><h2>${comp.status === 'live' ? 'Win this chapter' : 'The competition'}</h2></div><div class="comp-grid">${competitionCard(comp)}</div>
      ${win ? `<h3 style="margin-top:2rem">The winner</h3><div class="winner-grid" style="max-width:18rem">${winnerCard(win)}</div>` : ''}</div></section>` : ''}
    <section class="section section--tight"><div class="wrap pager">${prev ? `<a class="btn btn--secondary" href="chapter.html?n=${prev.chapter}">← Chapter ${prev.chapter}</a>` : '<span></span>'}${next && next.status !== 'upcoming' ? `<a class="btn btn--secondary" href="chapter.html?n=${next.chapter}">Chapter ${next.chapter} →</a>` : ''}</div></section>`;
  };

  pages.win = () => {
    const by = (s) => D.competitions.filter((c) => c.status === s);
    const grid = (list) => `<div class="comp-grid">${list.map(competitionCard).join('')}</div>`;
    return `<div class="wrap page-head"><p class="eyebrow">Live competitions</p><h1>Win</h1><p>Every prize is a step on the road to Japan. Odds, ticket caps and the free entry route are shown on every competition.</p></div>
    <section class="section section--tight"><div class="wrap">${by('live').length ? grid(by('live')) : empty('No competition is open right now. Follow the journey to see what\'s next.')}</div></section>
    ${by('upcoming').length ? `<section class="section section--tight"><div class="wrap"><div class="section__head"><h2>Coming soon</h2></div>${grid(by('upcoming'))}</div></section>` : ''}
    ${by('drawn').length ? `<section class="section section--tight panel-bg"><div class="wrap"><div class="section__head"><h2>Past draws</h2><a class="text-link" href="winners.html">Winners →</a></div>${grid(by('drawn'))}</div></section>` : ''}`;
  };

  pages.competition = () => {
    const id = new URLSearchParams(location.search).get('id');
    const c = compBy(id) || S.liveComps[0];
    if (!c) return `<div class="wrap page-head"><h1>Competition not found</h1><p><a href="win.html">See all competitions</a>.</p></div>`;
    document.title = `${c.title} · Win · ${D.site.name}`;
    const ch = chapterBy(c.chapter);
    const win = c.winner ? winnerBy(c.winner) : null;
    const live = c.status === 'live';
    hooks.push(() => {
      const form = document.getElementById('entry-form');
      if (!form) return;
      const qty = form.qty;
      const total = form.querySelector('[data-total]');
      const upd = () => { const n = clamp(parseInt(qty.value, 10) || 1, 1, c.maxPerPerson); total.textContent = money(n * c.price); };
      qty.addEventListener('input', upd);
      upd();
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const note = document.getElementById('entry-note');
        note.hidden = false;
        note.textContent = 'Checkout is not connected yet. This is the front-end framework: wire your payment provider and a server-side skill-question check in here.';
      });
    });
    return `<div class="wrap page-head"><a class="back-link" href="win.html">← All competitions</a><p class="eyebrow">Chapter ${c.chapter} prize${live ? '' : ' · ' + (c.status === 'drawn' ? 'Drawn' : 'Opens soon')}</p><h1>${esc(c.title)}</h1><p class="lede">${esc(c.blurb)}</p></div>
    <div class="wrap stack" style="padding-bottom:var(--space-6)">${trustStrip(c)}</div>
    <section class="section section--tight"><div class="wrap comp-layout">
      <div>${photo(c.image, c.imageAlt || c.title, c.title)}${c.gallery?.length ? `<div class="gallery">${c.gallery.map((g) => photo(g.src, g.alt)).join('')}</div>` : ''}
        <h2 style="margin-top:2rem">The prize</h2><ul>${(c.details || []).map((d) => `<li>${esc(d)}</li>`).join('')}</ul></div>
      <div class="comp-layout__aside stack">
        ${live ? `<div class="entry"><div class="countdown" data-draw="${esc(c.drawAt)}"><small>Draw in</small><time datetime="${esc(c.drawAt)}" data-count></time></div>${ticketsBar(c)}
          <form id="entry-form" class="stack" novalidate>
            <fieldset><legend>Skill question</legend><p style="margin:0">${esc(c.skillQuestion.q)}</p>${c.skillQuestion.options.map((o, i) => `<label class="choice"><input type="radio" name="answer" value="${i}" required> ${esc(o)}</label>`).join('')}</fieldset>
            <div class="qty"><label for="qty">Tickets (max ${num(c.maxPerPerson)})</label><input id="qty" name="qty" type="number" inputmode="numeric" min="1" max="${c.maxPerPerson}" value="1"></div>
            <div class="entry__total"><span>Total</span><span data-total>${money(c.price)}</span></div>
            <button class="btn btn--action btn--block" type="submit">Enter now</button>
            <p class="entry__note">Prefer not to pay? <a href="free-entry.html">Enter free by post</a>. Same chance, no catch.</p><p id="entry-note" class="notice" role="status" hidden></p></form></div>`
        : `<div class="entry"><p class="eyebrow">${c.status === 'drawn' ? 'This draw is complete' : 'Not open yet'}</p><p class="draw-line">${c.status === 'drawn' ? 'Drawn' : 'Draw'}: <time datetime="${esc(c.drawAt)}">${fmtDateTime(c.drawAt)}</time></p>
          ${win ? winnerCard(win) : ''}<a class="btn btn--secondary btn--block" href="win.html">See live competitions</a></div>`}
      </div></div></section>
    ${ch ? `<section class="section panel-bg"><div class="wrap"><div class="section__head"><h2>The story behind this prize</h2></div><div class="two-col"><div><p class="lede">${esc(ch.summary)}</p><a class="btn btn--secondary" href="chapter.html?n=${ch.chapter}">Read Chapter ${ch.chapter}</a></div></div></div></section>` : ''}`;
  };

  pages.winners = () => `<div class="wrap page-head"><p class="eyebrow">Real people, real prizes</p><h1>Winners</h1><p>Every winner gets a handover photo or video. First name and initial only, plus the area they live in.</p></div>
    <section class="section section--tight"><div class="wrap">${D.winners.length ? `<div class="winner-grid">${[...D.winners].reverse().map(winnerCard).join('')}</div>` : empty('Winners appear here after each live draw.')}</div></section>`;

  pages.how = () => `<div class="wrap page-head"><p class="eyebrow">Plain and open</p><h1>How It Works</h1><p>No small print. Here's exactly how every competition runs.</p></div>
    <section class="section section--tight"><div class="wrap">${steps()}</div></section>
    <section class="section"><div class="wrap"><div class="section__head"><h2>Questions</h2></div>${D.site.faq.map((f) => `<details class="faq"><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join('')}</div></section>`;

  pages.about = () => `<div class="wrap page-head"><p class="eyebrow">The people behind the van</p><h1>About</h1><p class="lede">${esc(D.site.about)}</p></div>
    <section class="section section--tight"><div class="wrap">${progressPanel()}</div></section>`;

  pages.freeEntry = () => `<div class="wrap page-head"><p class="eyebrow">Same chance, no catch</p><h1>Free Entry</h1><p class="lede">Every competition can be entered free by post.</p></div>
    <section class="section section--tight"><div class="wrap two-col"><div class="stack"><p>${esc(D.site.freeEntry.instructions)}</p></div>
      <div class="panel-bg" style="padding:var(--space-5);border-radius:var(--radius)"><p class="eyebrow">Postal address</p><p class="mono" style="margin:0">${esc(D.site.freeEntry.address)}</p></div></div></section>`;

  pages.legal = () => `<div class="wrap page-head"><h1>Terms &amp; policies</h1><p class="notice">Placeholder. Have these written or reviewed for UK prize competition rules before launch.</p></div>
    <section class="section section--tight"><div class="wrap stack"><h2 id="terms">Terms</h2><p>To be written.</p><h2 id="privacy">Privacy</h2><p>To be written.</p><h2 id="responsible-play">Responsible play</h2><p>To be written.</p></div></section>`;

  /* ---------- boot ---------- */
  async function boot() {
    const app = document.getElementById('app');
    try {
      await load();
      derive();
    } catch (err) {
      app.innerHTML = `<div class="wrap page-head"><h1>Couldn't load the journey</h1><p>The site reads its content from JSON files, so it needs to be served over http (not opened as a file). Run <code>python3 -m http.server</code> in this folder and open localhost.</p><p class="muted">${esc(err.message)}</p></div>`;
      return;
    }
    renderShell();
    if (!document.title || document.title === 'Van to Japan') document.title = D.site.name;
    app.innerHTML = (pages[page] || pages.home)();
    hooks.forEach((h) => h());
    hookVideos();
    hookCountdowns();
    hookStamps();
  }
  boot();
})();
