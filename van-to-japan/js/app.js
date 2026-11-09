/* Van to Japan: site framework.
   The journey is data. Chapters, competitions and winners come from data/*.json,
   and every page, counter, route and scene is built from them.
   One page, hash routes: #journey, #win, #winners, #how-it-works, #about,
   #free-entry, #legal, #chapter-<n>, #win-<competition id>. */
(() => {
  'use strict';
  const V = window.VTJ;

  /* ---------- helpers ---------- */
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const money = (n) => '£' + Number(n || 0).toLocaleString('en-GB', { maximumFractionDigits: 2, minimumFractionDigits: Number.isInteger(+n) ? 0 : 2 });
  const num = (n) => Number(n || 0).toLocaleString('en-GB');
  const pad2 = (n) => String(n).padStart(2, '0');
  const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '');
  const fmtDateTime = (iso) => (iso ? new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '');
  const clamp = V.clamp;
  const KANJI = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
  const app = document.getElementById('app');
  let hooks = [];
  let cleanups = [];
  const after = (fn) => hooks.push(fn);

  const NAV = [['journey', 'The Journey'], ['win', 'Win'], ['winners', 'Winners'], ['how-it-works', 'How It Works'], ['about', 'About']];
  const NAV_ACTIVE = { journey: 'journey', chapter: 'journey', win: 'win', competition: 'win', winners: 'winners', 'how-it-works': 'how-it-works', about: 'about' };

  /* ---------- data ---------- */
  let D = {};
  let S = {};

  async function load() {
    let raw = window.__VTJ_DATA__;
    if (!raw) {
      const get = (f) => fetch('data/' + f).then((r) => { if (!r.ok) throw new Error(f + ' ' + r.status); return r.json(); });
      const [site, chapters, competitions, winners] = await Promise.all([get('site.json'), get('chapters.json'), get('competitions.json'), get('winners.json')]);
      raw = { site, chapters, competitions, winners };
    }
    D = { ...raw, chapters: [...raw.chapters].sort((a, b) => a.chapter - b.chapter) };
  }

  function derive() {
    const ch = D.chapters;
    const done = ch.filter((c) => c.status === 'completed');
    const current = ch.find((c) => c.status === 'current') || null;
    const lastDone = done[done.length - 1] || null;
    const value = current ? (current.valueNow ?? current.valueIn ?? 0) : (lastDone?.valueOut ?? 0);
    const target = D.site.target.value;
    const first = ch[0]?.dateStarted;
    S = {
      current, done, value, target,
      pct: clamp(value / target),
      days: first ? Math.max(0, Math.floor((Date.now() - new Date(first)) / 864e5)) : 0,
      chaptersCount: done.length + (current ? 1 : 0),
      comps: D.competitions.length,
      winnersCount: D.winners.length,
      mysteryNo: (current?.chapter ?? lastDone?.chapter ?? 0) + 1,
      liveComps: D.competitions.filter((c) => c.status === 'live'),
    };
  }

  const chapterBy = (n) => D.chapters.find((c) => c.chapter === +n);
  const compBy = (id) => D.competitions.find((c) => c.id === id);
  const winnerBy = (id) => D.winners.find((w) => w.id === id);
  const compHref = (c) => `#win-${encodeURIComponent(c.id)}`;
  const enterHref = () => (S.liveComps[0] ? compHref(S.liveComps[0]) : '#win');

  /* ---------- components ---------- */
  const photo = (src, alt, label, big) =>
    `<div class="photo">${src
      ? `<img src="${esc(src)}" alt="${esc(alt)}" loading="lazy" decoding="async">`
      : `<div class="ph" role="img" aria-label="Photo to come: ${esc(alt)}">${big ? `<span class="ph__num" aria-hidden="true">${esc(big)}</span>` : ''}<span class="ph__label">Photo to come · ${esc(label || alt)}</span></div>`}</div>`;

  function chapterCard(c) {
    const kanji = (KANJI[c.chapter] ? ['第', KANJI[c.chapter], '章'] : ['章']).map((k) => `<span>${k}</span>`).join('');
    const gain = c.valueOut != null ? c.valueOut - c.valueIn : null;
    const doneCh = c.status === 'completed';
    return `<article class="log-card ${doneCh ? 'is-completed' : 'is-current'}">
      <a class="log-card__link" href="#chapter-${c.chapter}">
        <div class="log-card__photo">${photo(c.hero, c.heroAlt || c.title, c.title, pad2(c.chapter))}
          ${doneCh ? V.stamp('済', 'Done') : '<span class="tag"><span class="pulse"></span>Now</span>'}</div>
        <div class="log-card__body"><span class="log-card__jp vert" lang="ja" aria-hidden="true">${kanji}</span>
          <p class="log-card__meta">Ch.${pad2(c.chapter)}${c.location ? ' · ' + esc(c.location) : ''}</p>
          <h3>${esc(c.title)}</h3><p class="log-card__sum">${esc(c.summary)}</p>
          <p class="values"><span>${money(c.valueIn)}</span><span aria-hidden="true">→</span><span class="sr-only">to</span><span>${c.valueOut != null ? money(c.valueOut) : '?'}</span>${gain != null ? `<span class="gain">${gain >= 0 ? '+' : '−'}${money(Math.abs(gain))}</span>` : ''}</p></div></a></article>`;
  }

  const mysteryCard = () => `<article class="log-card is-mystery"><div class="fog"><span class="fog__q" aria-hidden="true">?</span></div>
    <div class="log-card__body"><p class="log-card__meta">Ch.${pad2(S.mysteryNo)} · Location unknown</p><h3>Next stop unknown</h3>
    <p class="log-card__sum">Not even we know what comes next. Follow along and you'll see it the moment we do.</p></div></article>`;

  function voyage(chapters) {
    const stops = chapters.filter((c) => c.status !== 'upcoming').map((c) =>
      `<li class="stop ${c.status === 'completed' ? 'is-done' : 'is-now'}" data-stop><span class="stop__node" aria-hidden="true"></span><div class="stop__card">${chapterCard(c)}</div></li>`);
    stops.push(`<li class="stop is-mystery" data-stop><span class="stop__node" aria-hidden="true"></span><div class="stop__card">${mysteryCard()}</div></li>`);
    after(() => V.initVoyage(app.querySelector('.voyage')));
    return `<div class="voyage"><svg class="voyage__svg" aria-hidden="true"><path class="voyage__future"/><path class="voyage__done"/></svg>
      <div class="voyage__van" aria-hidden="true"><svg viewBox="0 0 160 96"><use href="#van"/></svg></div>
      <ol class="voyage__stops" aria-label="The journey, in order">${stops.join('')}</ol></div>`;
  }

  const destination = (cta) => V.destination({ pct: S.pct, value: S.value, target: S.target, label: esc(D.site.target.label), money, cta });

  function logStrip() {
    const pctText = (S.pct * 100 < 10 ? (S.pct * 100).toFixed(1) : Math.round(S.pct * 100)) + '%';
    return `<section class="log" aria-label="The journey in numbers"><div class="wrap log__grid">
      <div class="log__value"><span class="log__label">Value on board</span>${V.odo(S.value, { prefix: '£', label: money(S.value) })}
        <p class="log__of"><b>${pctText}</b> of the ${money(S.target)} house</p></div>
      <dl class="log__counts">
        <div><dd>${V.odo(S.chaptersCount, { pad: 2 })}</dd><dt>Chapters</dt></div>
        <div><dd>${V.odo(S.days, { pad: 3 })}</dd><dt>Days on the road</dt></div>
        <div><dd>${V.odo(S.comps, { pad: 2 })}</dd><dt>Competitions</dt></div>
        <div><dd>${V.odo(S.winnersCount, { pad: 2 })}</dd><dt>Winners made</dt></div></dl></div></section>`;
  }

  const ticketsBar = (c) => {
    const left = Math.max(0, c.totalTickets - c.sold);
    return `<div class="tickets"><div class="meter" role="progressbar" aria-label="Tickets sold" aria-valuemin="0" aria-valuemax="${c.totalTickets}" aria-valuenow="${c.sold}"><div class="meter__fill" style="--pct:${((c.sold / c.totalTickets) * 100).toFixed(1)}%"></div></div>
      <div class="tickets__text"><span>${num(c.sold)} of ${num(c.totalTickets)} sold</span><span>${num(left)} left</span></div></div>`;
  };

  function ticket(c) {
    const live = c.status === 'live';
    const drawn = c.status === 'drawn';
    const nextNo = String(Math.min(c.sold + 1, c.totalTickets)).padStart(String(c.totalTickets).length, '0');
    return `<div class="ticket-wrap"><article class="ticket">
      <div class="ticket__main"><div class="ticket__photo">${photo(c.image, c.imageAlt || c.title, c.title, pad2(c.chapter))}${drawn ? V.stamp('済', 'Drawn') : ''}</div>
        <div class="ticket__body"><p class="eyebrow">Chapter ${c.chapter} prize${live ? ' · open now' : drawn ? ' · drawn' : ' · opens soon'}</p><h3>${esc(c.title)}</h3>
          ${live ? ticketsBar(c) : ''}
          <ul class="ticket__chips"><li>1 in ${num(c.totalTickets)} per ticket</li><li>Max ${num(c.maxPerPerson)} each</li><li>Live draw</li>${c.cashAlternative ? `<li>${money(c.cashAlternative)} cash option</li>` : ''}</ul>
          <p class="draw-line">${live ? 'Draw' : drawn ? 'Drawn' : 'Draw'}: <time datetime="${esc(c.drawAt)}">${fmtDateTime(c.drawAt)}</time></p>
          <div class="ticket__actions">${live
            ? `<a class="btn btn--action" href="${compHref(c)}">Enter now</a><a class="text-link" href="#free-entry">Free entry</a>`
            : `<a class="btn btn--ghost" href="${compHref(c)}">${drawn ? 'See the result' : 'Details'}</a>`}</div></div></div>
      <div class="ticket__stub"><span class="ticket__price">${money(c.price)}<small>per ticket</small></span>
        <span class="ticket__no">${live ? 'Next ticket' : 'Tickets'}<b>${live ? '№ ' + nextNo : num(c.totalTickets)}</b></span></div></article></div>`;
  }

  function trustStrip(c) {
    return `<ul class="trust" aria-label="How this competition works">
      <li><span class="trust__label">Max tickets</span><span class="trust__value">${num(c.maxPerPerson)} per person</span></li>
      <li><span class="trust__label">Odds per ticket</span><span class="trust__value">1 in ${num(c.totalTickets)}</span></li>
      <li><span class="trust__label">The draw</span><span class="trust__value">Live</span></li>
      <li><span class="trust__label">Free entry</span><span class="trust__value"><a href="#free-entry">By post</a></span></li>
      <li><span class="trust__label">Cash alternative</span><span class="trust__value">${c.cashAlternative ? money(c.cashAlternative) : 'None'}</span></li></ul>`;
  }

  function polaroid(w) {
    return `<article class="polaroid"><div class="polaroid__photo">${photo(w.photo, w.photoAlt || 'Winner handover', 'Handover')}${V.stamp('当', 'Won')}</div>
      <div class="polaroid__body"><h3 class="polaroid__name">${esc(w.name)}</h3><p class="polaroid__meta">${esc(w.area)} · ${fmtDate(w.date)}</p>
      <p class="polaroid__meta">Won <b>${esc(w.prize)}</b></p>${w.competition ? `<a class="text-link" href="#win-${encodeURIComponent(w.competition)}">See the draw</a>` : ''}</div></article>`;
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
    app.querySelectorAll('.video__frame').forEach((f) => {
      f.querySelector('.video__play')?.addEventListener('click', () => {
        const src = SRC[f.dataset.provider]?.(f.dataset.id);
        if (src) f.innerHTML = `<iframe src="${src}" title="${esc(f.dataset.title)}" loading="lazy" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
      });
    });
  }

  function hookCountdowns() {
    const els = [...app.querySelectorAll('[data-draw]')];
    if (!els.length) return null;
    const p = (n) => String(n).padStart(2, '0');
    const fmt = (ms) => {
      if (ms <= 0) return 'Draw time reached';
      const s = Math.floor(ms / 1000);
      return `${Math.floor(s / 86400)}d ${p(Math.floor((s % 86400) / 3600))}h ${p(Math.floor((s % 3600) / 60))}m ${p(s % 60)}s`;
    };
    const tick = () => els.forEach((el) => { el.querySelector('[data-count]').textContent = fmt(new Date(el.dataset.draw) - Date.now()); });
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }

  function routeMap() {
    const d = 'M70 200C170 60 280 250 390 150S600 40 730 110';
    let grid = '';
    for (let x = 40; x < 800; x += 80) grid += `M${x} 30V260`;
    for (let y = 50; y < 260; y += 50) grid += `M0 ${y}H800`;
    after(() => {
      const full = document.getElementById('route-measure');
      const doneEl = document.getElementById('route-done');
      if (!full) return;
      const len = full.getTotalLength();
      const frac = Math.max(0.07, S.pct);
      const shown = D.chapters.filter((c) => c.status !== 'upcoming');
      document.getElementById('route-pins').innerHTML = shown.map((c, i) => {
        const t = shown.length === 1 ? frac : frac * (i / (shown.length - 1));
        const p = full.getPointAtLength(len * t);
        return `<g class="pin ${c.status === 'current' ? 'is-now' : ''}"><a href="#chapter-${c.chapter}" aria-label="Chapter ${c.chapter}: ${esc(c.title)}"><title>Chapter ${c.chapter}: ${esc(c.title)}${c.location ? ' (' + esc(c.location) + ')' : ''}</title><circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="14"/><text x="${p.x.toFixed(1)}" y="${p.y.toFixed(1)}">${c.chapter}</text></a></g>`;
      }).join('');
      doneEl.style.strokeDasharray = `${len * frac} ${len}`;
    });
    return `<figure class="route-map contours"><svg viewBox="0 30 800 230" role="img" aria-labelledby="rm-t rm-d"><title id="rm-t">Route from the UK to Japan</title><desc id="rm-d">A dotted line from the UK to Japan with a pin for each chapter. The solid part shows how far the journey has come.</desc>
      <path class="route-map__grid" d="${grid}"/>
      <g transform="translate(600 205)"><g class="compass" fill="none" stroke="currentColor" stroke-width="1.5"><circle r="20"/><path d="M0-28V28M-28 0H28"/><path d="M0-20 5 0 0 20-5 0Z" fill="currentColor" stroke="none"/></g><text x="0" y="-34" text-anchor="middle">N</text></g>
      <path class="route-map__full" d="${d}"/><path class="route-map__done" id="route-done" d="${d}"/><path id="route-measure" d="${d}" fill="none" stroke="none"/><g id="route-pins"></g>
      <text x="70" y="240" text-anchor="middle">UK</text><text x="730" y="150" text-anchor="middle">Japan</text>
      <use href="#torii" x="708" y="62" width="44" height="37" style="color:var(--muted)"/></svg>
      <figcaption>Chart not to scale. The solid line fills as the value grows towards the house.</figcaption></figure>`;
  }

  const steps = () => `<ol class="steps">${D.site.howSteps.map((s) => `<li><h3>${esc(s.title)}</h3><p>${esc(s.text)}</p></li>`).join('')}</ol>`;
  const empty = (msg) => `<div class="empty"><p>${msg}</p></div>`;
  const head = (eyebrow, title, lede, back) => `<div class="wrap page-head">${back || ''}<p class="eyebrow">${eyebrow}</p><h1>${title}</h1>${lede ? `<p class="lede">${lede}</p>` : ''}</div>`;

  /* ---------- shell: header, progress strip, mobile bar, footer ---------- */
  function renderShell() {
    const cur = S.current;
    const p = (Math.max(0.06, Math.min(0.9, S.pct)) * 100).toFixed(1) + '%';
    document.getElementById('site-header').outerHTML = `<header class="site-header" id="site-header"><div class="bar-outer"><div class="wrap bar">
        <a class="brand" href="#" aria-label="${esc(D.site.name)} home"><svg width="32" height="32" viewBox="0 0 34 34" fill="none" aria-hidden="true"><rect width="34" height="34" rx="8" fill="#F5F0E6"/><path d="M5 25C10 10 16 28 21 16S27 9 29 9" stroke="#13283A" stroke-width="2.2" stroke-dasharray="1 4" stroke-linecap="round"/><circle cx="29" cy="9" r="3" fill="#E07355"/></svg><span class="brand__name">${esc(D.site.name)}</span></a>
        <nav class="nav" id="primary-nav" aria-label="Primary">${NAV.map(([h, l]) => `<a href="#${h}" data-nav="${h}">${l}</a>`).join('')}</nav>
        <a class="free-link" href="#free-entry">Free entry</a>
        <button class="icon-btn" id="theme-toggle" type="button" aria-label="Switch between day and night"><span aria-hidden="true">☾</span></button>
        <button class="icon-btn menu-btn" id="menu-btn" type="button" aria-expanded="false" aria-controls="primary-nav" aria-label="Menu"><svg width="20" height="14" viewBox="0 0 20 14" aria-hidden="true"><path d="M0 1h20M0 7h20M0 13h20" stroke="currentColor" stroke-width="2"/></svg></button></div></div>
      <a class="strip" href="#journey" aria-label="Journey progress: ${cur ? `chapter ${cur.chapter}, ${esc(cur.title)}. ` : ''}${money(S.value)} of ${money(S.target)}. See the full journey"><div class="wrap strip__in">
        <span class="strip__now">${cur ? `Now · Ch.${pad2(cur.chapter)} ${esc(cur.title)}` : 'The journey'}</span>
        <span class="strip__route" style="--p:${p}" aria-hidden="true"><svg class="strip__van" viewBox="0 0 160 96"><use href="#van"/></svg><svg class="strip__torii" viewBox="0 0 100 84"><use href="#torii"/></svg></span>
        <span class="strip__sum">${money(S.value)} / ${money(S.target)}</span></div></a></header>`;

    document.getElementById('site-footer').outerHTML = `<footer class="site-footer wave-edge" id="site-footer"><div class="wrap"><div class="site-footer__grid">
        <div><p class="site-footer__name">${esc(D.site.name)}</p><p>${esc(D.site.tagline)}</p></div>
        <div><h2>Follow</h2><ul>${D.site.socials.map((s) => `<li><a href="${esc(s.url)}" rel="noopener">${esc(s.label)}</a></li>`).join('')}</ul></div>
        <div><h2>Fair play</h2><ul><li><a href="#free-entry">Free entry</a></li><li><a href="#legal">Terms</a></li><li><a href="#legal">Privacy</a></li><li><a href="#legal">Responsible play</a></li></ul></div></div>
        <small>© ${new Date().getFullYear()} ${esc(D.site.name)}</small></div></footer>`;

    const bar = document.createElement('div');
    bar.className = 'mobile-bar is-hidden';
    bar.id = 'mobile-bar';
    bar.innerHTML = `<a class="btn btn--ghost" href="#journey">Follow the journey</a><a class="btn btn--action" href="${enterHref()}">Enter now</a>`;
    document.body.appendChild(bar);

    const btn = document.getElementById('menu-btn');
    const nav = document.getElementById('primary-nav');
    const closeNav = () => { nav.classList.remove('is-open'); btn.setAttribute('aria-expanded', 'false'); };
    btn.addEventListener('click', () => { const o = nav.classList.toggle('is-open'); btn.setAttribute('aria-expanded', String(o)); });
    nav.addEventListener('click', closeNav);
    addEventListener('keydown', (e) => { if (e.key === 'Escape') closeNav(); });

    const tt = document.getElementById('theme-toggle');
    const isDark = () => (document.documentElement.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')) === 'dark';
    const label = () => { tt.firstElementChild.textContent = isDark() ? '☀' : '☾'; tt.title = isDark() ? 'Switch to day' : 'Switch to night'; };
    label();
    tt.addEventListener('click', () => {
      const next = isDark() ? 'light' : 'dark';
      document.documentElement.dataset.theme = next;
      try { localStorage.setItem('vtj-theme', next); } catch (e) { /* storage unavailable */ }
      label();
    });

    document.querySelector('.skip')?.addEventListener('click', (e) => { e.preventDefault(); app.focus(); });
  }

  /* ---------- pages ---------- */
  const pages = {};

  pages.home = () => {
    const c = S.current;
    const shown = D.chapters.filter((x) => x.status !== 'upcoming').slice(-3);
    const live = S.liveComps.slice(0, 3);
    const vidChapter = [...D.chapters].reverse().find((x) => x.videos?.length);
    after(() => V.initHero(app.querySelector('.hero')));
    return `
    <section class="hero">${V.heroScene()}
      <div class="wrap hero__copy">
        ${c ? `<p class="hero__now" style="--i:0"><span class="pulse"></span>Chapter ${c.chapter} is live · ${esc(c.title)}</p>` : ''}
        <div class="hero__head" style="--i:1"><h1 class="hero__title" aria-label="Van to Japan"><span>Van <span class="out">to</span></span><span>Japan</span></h1><span class="hero__jp" lang="ja" aria-hidden="true"><span>日</span><span>本</span><span>へ</span></span></div>
        <p class="lede" style="--i:2">${esc(D.site.tagline)}</p>
        <div class="hero__actions" style="--i:3" id="hero-actions"><a class="btn btn--action" href="${enterHref()}">Enter now</a><a class="btn btn--ghost" href="#journey">Follow the journey</a></div>
      </div></section>
    ${logStrip()}
    <section class="section contours" style="padding-bottom:0"><div class="wrap"><div class="section__head"><div><p class="eyebrow">Scroll to travel</p><h2>The journey so far</h2></div><a class="text-link" href="#journey">Full journey →</a></div>${voyage(shown)}</div></section>
    ${destination('<a class="btn btn--ghost" href="#journey">Follow the journey</a>')}
    <section class="section"><div class="wrap"><div class="section__head"><div><p class="eyebrow">Odds and free entry shown up front</p><h2>Live competitions</h2></div><a class="text-link" href="#win">All competitions →</a></div>
      ${live.length ? `<div class="ticket-grid">${live.map(ticket).join('')}</div>` : empty('No competition is open right now. Follow the journey to be first to know when the next one starts.')}</div></section>
    <section class="section band wave-edge"><div class="wrap"><div class="section__head"><div><p class="eyebrow">Real people, real handovers</p><h2>Latest winners</h2></div><a class="text-link" href="#winners">All winners →</a></div>
      ${D.winners.length ? `<div class="polaroids">${[...D.winners].reverse().slice(0, 4).map(polaroid).join('')}</div>` : empty('Winners appear here after each live draw.')}</div></section>
    ${vidChapter ? `<section class="section"><div class="wrap"><div class="section__head"><h2>Latest video</h2></div>${videoEmbed(vidChapter.videos[0])}</div></section>` : ''}
    <section class="section"><div class="wrap"><div class="section__head"><div><p class="eyebrow">Three steps, no small print</p><h2>How it works</h2></div><a class="text-link" href="#how-it-works">The details →</a></div>${steps()}
      <p style="margin-top:2rem">Prefer not to pay? <a href="#free-entry">There's a free entry route</a> with the same chance of winning.</p></div></section>`;
  };

  pages.journey = () => `${head('The story so far', 'The Journey', esc(D.site.storySoFar))}
    <section class="section section--tight"><div class="wrap">${routeMap()}</div></section>
    ${logStrip()}
    <section class="section contours" style="padding-bottom:0"><div class="wrap"><div class="section__head"><div><p class="eyebrow">Scroll to travel</p><h2>Every chapter</h2></div></div>${voyage(D.chapters)}</div></section>
    ${destination(`<a class="btn btn--action" href="${enterHref()}">Enter now</a>`)}`;

  pages.chapter = (r) => {
    const c = chapterBy(r.n);
    if (!c || c.status === 'upcoming') return head('Off the chart', 'Chapter not found', `That chapter hasn't happened yet. <a href="#journey">Back to the journey</a>.`);
    const comp = c.competition ? compBy(c.competition) : null;
    const win = c.winner ? winnerBy(c.winner) : null;
    const prev = chapterBy(c.chapter - 1);
    const next = chapterBy(c.chapter + 1);
    const doneCh = c.status === 'completed';
    return `${head(`Chapter ${pad2(c.chapter)}${c.location ? ' · ' + esc(c.location) : ''} · ${doneCh ? 'Completed' : 'Happening now'}`, esc(c.title), esc(c.summary), '<a class="back-link" href="#journey">← The Journey</a>')}
    <section class="section section--tight"><div class="wrap two-col"><div><div class="log-card"><div class="log-card__photo">${photo(c.hero, c.heroAlt || c.title, c.title, pad2(c.chapter))}${doneCh ? V.stamp('済', 'Done') : '<span class="tag"><span class="pulse"></span>Now</span>'}</div></div>
        ${c.gallery?.length ? `<div class="gallery">${c.gallery.map((g) => photo(g.src, g.alt)).join('')}</div>` : ''}</div>
      <dl class="facts"><div><dt>Item</dt><dd>${esc(c.item)}</dd></div><div><dt>Where</dt><dd>${esc(c.location || 'On the road')}</dd></div><div><dt>Value in</dt><dd>${money(c.valueIn)}</dd></div><div><dt>Value out</dt><dd>${c.valueOut != null ? money(c.valueOut) : '?'}</dd></div>
        <div><dt>Started</dt><dd>${fmtDate(c.dateStarted)}</dd></div><div><dt>Ended</dt><dd>${c.dateEnded ? fmtDate(c.dateEnded) : 'In progress'}</dd></div></dl></div></section>
    ${c.videos?.length ? `<section class="section section--tight"><div class="wrap"><div class="section__head"><h2>Watch</h2></div><div class="stack">${c.videos.map(videoEmbed).join('')}</div></div></section>` : ''}
    ${comp ? `<section class="section"><div class="wrap"><div class="section__head"><h2>${comp.status === 'live' ? 'Win this chapter' : 'The competition'}</h2></div><div class="ticket-grid">${ticket(comp)}</div></div></section>` : ''}
    ${win ? `<section class="section band wave-edge"><div class="wrap"><div class="section__head"><h2>The winner</h2></div><div class="polaroids">${polaroid(win)}</div></div></section>` : ''}
    <section class="section section--tight"><div class="wrap pager">${prev ? `<a class="btn btn--ghost" href="#chapter-${prev.chapter}">← Chapter ${prev.chapter}</a>` : '<span></span>'}${next && next.status !== 'upcoming' ? `<a class="btn btn--ghost" href="#chapter-${next.chapter}">Chapter ${next.chapter} →</a>` : ''}</div></section>`;
  };

  pages.win = () => {
    const by = (s) => D.competitions.filter((c) => c.status === s);
    const grid = (list) => `<div class="ticket-grid">${list.map(ticket).join('')}</div>`;
    return `${head('Live competitions', 'Win', 'Every prize is a step on the road to Japan. Odds, ticket caps and the free entry route are on every ticket.')}
    <section class="section section--tight"><div class="wrap">${by('live').length ? grid(by('live')) : empty('No competition is open right now. Follow the journey to see what\'s next.')}</div></section>
    ${by('upcoming').length ? `<section class="section"><div class="wrap"><div class="section__head"><h2>Coming soon</h2></div>${grid(by('upcoming'))}</div></section>` : ''}
    ${by('drawn').length ? `<section class="section band wave-edge"><div class="wrap"><div class="section__head"><h2>Past draws</h2><a class="text-link" href="#winners">Winners →</a></div>${grid(by('drawn'))}</div></section>` : ''}`;
  };

  pages.competition = (r) => {
    const c = compBy(r.id);
    if (!c) return head('Off the chart', 'Competition not found', '<a href="#win">See all competitions</a>.');
    const ch = chapterBy(c.chapter);
    const win = c.winner ? winnerBy(c.winner) : null;
    const live = c.status === 'live';
    after(() => {
      const form = document.getElementById('entry-form');
      if (!form) return;
      const qty = form.qty;
      const total = form.querySelector('[data-total]');
      const val = () => clamp(parseInt(qty.value, 10) || 1, 1, c.maxPerPerson);
      const upd = () => { total.textContent = money(val() * c.price); };
      qty.addEventListener('input', upd);
      qty.addEventListener('change', () => { qty.value = val(); upd(); });
      form.querySelectorAll('[data-step]').forEach((b) => b.addEventListener('click', () => { qty.value = clamp(val() + +b.dataset.step, 1, c.maxPerPerson); upd(); }));
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const note = document.getElementById('entry-note');
        note.hidden = false;
        note.textContent = form.answer.value === ''
          ? 'Pick an answer to the skill question first.'
          : 'Checkout is not connected yet. This is the front-end framework: the payment provider and the server-side answer check plug in here.';
      });
    });
    return `${head(`Chapter ${c.chapter} prize${live ? ' · open now' : c.status === 'drawn' ? ' · drawn' : ' · opens soon'}`, esc(c.title), esc(c.blurb), '<a class="back-link" href="#win">← All competitions</a>')}
    <div class="wrap">${trustStrip(c)}</div>
    <section class="section section--tight"><div class="wrap comp-layout">
      <div><div class="framed">${photo(c.image, c.imageAlt || c.title, c.title, pad2(c.chapter))}</div>${c.gallery?.length ? `<div class="gallery">${c.gallery.map((g) => photo(g.src, g.alt)).join('')}</div>` : ''}
        <h2 style="margin-top:2.5rem">The prize</h2><ul>${(c.details || []).map((d) => `<li>${esc(d)}</li>`).join('')}</ul></div>
      <div class="comp-layout__aside">
        ${live ? `<div class="entry"><div class="countdown" data-draw="${esc(c.drawAt)}"><small>Live draw in</small><time datetime="${esc(c.drawAt)}" data-count></time></div>${ticketsBar(c)}
          <form id="entry-form" novalidate>
            <fieldset><legend>Skill question</legend><p class="entry__q">${esc(c.skillQuestion.q)}</p>${c.skillQuestion.options.map((o, i) => `<label class="choice"><input type="radio" name="answer" id="answer-${i}" value="${i}"> ${esc(o)}</label>`).join('')}</fieldset>
            <div class="qty"><label for="qty">Tickets · max ${num(c.maxPerPerson)}</label><div class="stepper"><button type="button" data-step="-1" aria-label="One ticket fewer">−</button><input id="qty" name="qty" type="number" inputmode="numeric" min="1" max="${c.maxPerPerson}" value="1"><button type="button" data-step="1" aria-label="One ticket more">+</button></div></div>
            <div class="entry__total"><span>Total</span><b data-total>${money(c.price)}</b></div>
            <button class="btn btn--action btn--block" type="submit">Enter now</button>
            <p class="entry__note">Prefer not to pay? <a href="#free-entry">Enter free by post</a>. Same chance of winning.</p><p id="entry-note" class="notice" role="status" hidden></p></form></div>`
        : `<div class="entry"><p class="eyebrow" style="margin:0">${c.status === 'drawn' ? 'This draw is complete' : 'Not open yet'}</p><p class="draw-line">${c.status === 'drawn' ? 'Drawn' : 'Draw'}: <time datetime="${esc(c.drawAt)}">${fmtDateTime(c.drawAt)}</time></p>
          ${win ? `<div style="padding:1rem .5rem .5rem">${polaroid(win)}</div>` : ''}<a class="btn btn--ghost btn--block" href="#win">See live competitions</a></div>`}
      </div></div></section>
    ${ch ? `<section class="section band wave-edge"><div class="wrap"><div class="section__head"><div><p class="eyebrow">Chapter ${pad2(ch.chapter)}</p><h2>The story behind this prize</h2></div></div><p class="lede">${esc(ch.summary)}</p><a class="btn btn--ghost" href="#chapter-${ch.chapter}">Read chapter ${ch.chapter}</a></div></section>` : ''}`;
  };

  pages.winners = () => `${head('Real people, real prizes', 'Winners', 'Every winner gets a handover photo or video. First name and initial only, plus the area they live in.')}
    <section class="section section--tight"><div class="wrap">${D.winners.length ? `<div class="polaroids">${[...D.winners].reverse().map(polaroid).join('')}</div>` : empty('Winners appear here after each live draw.')}</div></section>`;

  pages['how-it-works'] = () => `${head('Plain and open', 'How It Works', 'No small print. This is exactly how every competition runs.')}
    <section class="section section--tight"><div class="wrap">${steps()}</div></section>
    <section class="section"><div class="wrap"><div class="section__head"><h2>Questions</h2></div>${D.site.faq.map((f) => `<details class="faq"><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join('')}</div></section>`;

  pages.about = () => `${head('The people behind the van', 'About', esc(D.site.about))}${logStrip()}${destination(`<a class="btn btn--ghost" href="#journey">Follow the journey</a>`)}`;

  pages['free-entry'] = () => `${head('Same chance, no catch', 'Free Entry', 'Every competition can be entered free by post.')}
    <section class="section section--tight"><div class="wrap two-col"><p>${esc(D.site.freeEntry.instructions)}</p>
      <div class="address-card"><p class="eyebrow">Postal address</p><p class="mono">${esc(D.site.freeEntry.address)}</p></div></div></section>`;

  pages.legal = () => `${head('The formal bit', 'Terms &amp; policies', '')}
    <section class="section section--tight"><div class="wrap stack"><p class="notice">Placeholder. These need writing and legal review for UK prize competition rules before launch.</p><h2>Terms</h2><p>To be written.</p><h2>Privacy</h2><p>To be written.</p><h2>Responsible play</h2><p>To be written.</p></div></section>`;

  const TITLES = { journey: 'The Journey', win: 'Win', winners: 'Winners', 'how-it-works': 'How It Works', about: 'About', 'free-entry': 'Free Entry', legal: 'Terms and policies' };

  /* ---------- router ---------- */
  function parseRoute() {
    const h = decodeURIComponent(location.hash.replace(/^#/, ''));
    let m;
    if ((m = h.match(/^chapter-(\d+)$/))) return { name: 'chapter', n: +m[1] };
    if ((m = h.match(/^win-(.+)$/))) return { name: 'competition', id: m[1] };
    if (pages[h] && h !== 'home' && h !== 'chapter' && h !== 'competition') return { name: h };
    return { name: 'home' };
  }

  function paint() {
    cleanups.forEach((c) => { try { c(); } catch (e) { /* ignore */ } });
    cleanups = [];
    hooks = [];
    const r = parseRoute();
    app.innerHTML = pages[r.name](r);
    document.body.dataset.route = r.name;
    document.querySelectorAll('[data-nav]').forEach((a) => (a.dataset.nav === NAV_ACTIVE[r.name] ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current')));
    const h1 = app.querySelector('h1');
    document.title = r.name === 'home' ? D.site.name : `${TITLES[r.name] || h1?.textContent || ''} · ${D.site.name}`;
    scrollTo(0, 0);
    hooks.forEach((h) => { const c = h(); if (typeof c === 'function') cleanups.push(c); });
    hookVideos();
    const cd = hookCountdowns();
    if (cd) cleanups.push(cd);
    cleanups.push(V.initOnView(app));

    // Mobile bar: hidden while the hero buttons or an entry form already offer the same action.
    const bar = document.getElementById('mobile-bar');
    const guard = document.getElementById('hero-actions') || document.getElementById('entry-form');
    if (r.name === 'competition' && !guard) bar.classList.remove('is-hidden');
    else if (guard && 'IntersectionObserver' in window) {
      const io = new IntersectionObserver(([en]) => bar.classList.toggle('is-hidden', en.isIntersecting));
      io.observe(guard);
      cleanups.push(() => io.disconnect());
    } else bar.classList.remove('is-hidden');
  }

  let first = true;
  function navigate() {
    if (first || V.reduce || !document.startViewTransition) { first = false; paint(); return; }
    document.startViewTransition(paint);
  }

  /* ---------- boot ---------- */
  async function boot() {
    try {
      await load();
      derive();
    } catch (err) {
      app.innerHTML = `<div class="wrap page-head"><h1>Couldn't load the journey</h1><p>The site reads its content from JSON files, so it needs to be served over http rather than opened as a file. Run <code>python3 -m http.server</code> in this folder and open localhost.</p><p class="muted">${esc(err.message)}</p></div>`;
      return;
    }
    V.mountSprite();
    renderShell();
    navigate();
    addEventListener('hashchange', navigate);
  }
  boot();
})();
