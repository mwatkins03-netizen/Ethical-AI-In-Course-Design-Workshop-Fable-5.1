import { site, tracks, caseQuestions, instructions, takeawayPrompts, principleSeeds, pages, responseModes, localOnly, disclosure, accessibility } from './data.js?v=20260926a';
import { CardRenderer } from './webgl.js?v=20260926a';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s = '') => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const trackById = id => tracks.find(t => t.id === id);
const fmtClock = sec => { const s = Math.abs(Math.round(sec)); return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; };

/* ================= state ================= */
const STORE = 'ethics-ai-instructors:v1';
const seed = () => ({
  v: 1, name: '', discipline: '', role: '', track: '', mode: '', paneModes: {},
  curiosities: '', concerns: '',
  cases: {}, activeCase: {}, debriefNotes: '',
  dutyOfCare: '', principles: [{ text: '', scope: 'personal' }], leavingQuestions: '',
  audio: {}, updated: null
});
let state = seed();
try { const raw = localStorage.getItem(STORE); if (raw) state = { ...seed(), ...JSON.parse(raw) }; } catch { /* fresh */ }
if (!Array.isArray(state.principles) || !state.principles.length) state.principles = seed().principles;
state.audio = state.audio || {}; state.paneModes = state.paneModes || {}; state.cases = state.cases || {}; state.activeCase = state.activeCase || {};
let saveT = null;
function save() {
  state.updated = new Date().toISOString();
  clearTimeout(saveT);
  saveT = setTimeout(() => { try { localStorage.setItem(STORE, JSON.stringify(state)); } catch { /* quota */ } renderPreview(); markCaseNotes(); markPagesDone(); }, 180);
}
function getResp(key) { if (key.startsWith('case:')) { const [, c, q] = key.split(':'); return state.cases[c]?.[q] || ''; } return state[key] || ''; }
function setResp(key, v) { if (key.startsWith('case:')) { const [, c, q] = key.split(':'); state.cases[c] = state.cases[c] || {}; state.cases[c][q] = v; } else state[key] = v; save(); }

/* ================= audio clip store (IndexedDB) ================= */
const clipDB = (() => {
  let dbp = null;
  const open = () => dbp || (dbp = new Promise((res, rej) => { const r = indexedDB.open('ethics-ai-instructors-audio', 1); r.onupgradeneeded = () => r.result.createObjectStore('clips'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }));
  const tx = async (mode, fn) => { const db = await open(); return new Promise((res, rej) => { const t = db.transaction('clips', mode); const req = fn(t.objectStore('clips')); t.oncomplete = () => res(req?.result); t.onerror = () => rej(t.error); }); };
  return { put: (k, v) => tx('readwrite', s => s.put(v, k)), get: k => tx('readonly', s => s.get(k)), del: k => tx('readwrite', s => s.delete(k)), clear: () => tx('readwrite', s => s.clear()) };
})();

/* ================= motion + video ================= */
const motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
const storedMotion = localStorage.getItem('cases-motion');
let motionEnabled = storedMotion === null ? !motionQuery.matches : storedMotion === 'on';
const reduced = () => !motionEnabled;
const motionToggle = $('#motionToggle'), motionLabel = $('#motionLabel');
const ambientVideo = $('#ambientVideo'), ambientWrap = $('.ambient-video');
function syncAmbientVideo() {
  if (!ambientVideo) return;
  const covered = document.body.classList.contains('has-overlay');
  if (motionEnabled && !covered) { ambientWrap.classList.remove('is-paused'); ambientVideo.play().catch(() => {}); }
  else { ambientVideo.pause(); ambientWrap.classList.add('is-paused'); }
}
function updateMotion() {
  motionToggle.setAttribute('aria-pressed', String(motionEnabled));
  motionLabel.textContent = motionEnabled ? 'Motion on' : 'Motion off';
  document.documentElement.classList.toggle('motion-off', !motionEnabled);
  syncAmbientVideo();
  if (!motionEnabled) $$('.reveal').forEach(el => el.classList.add('is-in'));
}
motionToggle.addEventListener('click', () => { motionEnabled = !motionEnabled; localStorage.setItem('cases-motion', motionEnabled ? 'on' : 'off'); updateMotion(); });
document.addEventListener('visibilitychange', () => { if (!document.hidden) syncAmbientVideo(); });
addEventListener('pointerdown', syncAmbientVideo, { once: true });
addEventListener('keydown', syncAmbientVideo, { once: true });

/* ================= transition wipe ================= */
const transition = $('#transition');
function runTransition(mid) {
  if (reduced()) { mid(); return; }
  transition.className = 'transition is-in';
  setTimeout(() => { mid(); transition.className = 'transition is-out'; setTimeout(() => { transition.className = 'transition'; }, 700); }, 560);
}
function goTo(sel) {
  const el = $(sel); if (!el) return;
  el.scrollIntoView({ behavior: 'instant', block: 'start' });
  const h = $('h2', el) || el; h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true });
}

/* ================= reveal + progress ================= */
const io = new IntersectionObserver(entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px', threshold: .08 });
function observeReveals() { $$('.reveal:not(.is-in)').forEach(el => io.observe(el)); if (!motionEnabled) $$('.reveal').forEach(el => el.classList.add('is-in')); }
const progressFill = $('#progressFill');
addEventListener('scroll', () => {
  const max = document.documentElement.scrollHeight - innerHeight;
  progressFill.style.width = `${max > 0 ? (scrollY / max) * 100 : 0}%`;
  $$('.reveal:not(.is-in)').forEach(el => { if (el.getBoundingClientRect().top < innerHeight * .95) el.classList.add('is-in'); });
}, { passive: true });

/* ================= hero gallery: illustrated cards on WebGL (ported from Teaching for Discernment) ================= */
const hero = $('.hero'), canvas = $('#glCanvas'), hitLayer = $('#projectHitboxes'), metaLayer = $('#projectMeta'), fallback = $('#fallbackGallery');
const counter = $('#deckCounter'), progress = $('#deckFill');
const g = { current: 0, target: 0, velocity: 0, pointer: { x: innerWidth / 2, y: innerHeight / 2 }, dragging: false, dragX: 0, dragStart: 0, moved: 0, suppressClick: false, time: 0, hover: -1, hoverMix: pages.map(() => 0), tilt: pages.map(() => ({ x: 0, y: 0 })), active: 0 };
const metrics = { cardW: 330, cardH: 412, gap: 80, step: 410, max: 0, centerY: 0, startX: 0, top: 0, h: 0 };
let renderer = null, cards = [];
function measure() {
  const r = canvas.getBoundingClientRect(); const vw = innerWidth, sh = r.height || innerHeight, mobile = vw < 980;
  metrics.top = r.top; metrics.h = sh;
  metrics.cardH = mobile ? clamp(sh * .62, 240, 380) : clamp(sh * .74, 400, 680); metrics.cardW = metrics.cardH * .8;
  metrics.gap = mobile ? 32 : clamp(vw * .05, 56, 110); metrics.step = metrics.cardW + metrics.gap;
  metrics.startX = vw * .5; metrics.centerY = mobile ? sh * .42 : sh * .4;
  metaLayer.style.setProperty('--card-w', `${metrics.cardW}px`);
  metrics.max = (pages.length - 1) * metrics.step;
}
function createDom() {
  hitLayer.innerHTML = ''; metaLayer.innerHTML = ''; fallback.innerHTML = '';
  pages.forEach((p, i) => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'project-hitbox'; b.dataset.i = i;
    b.setAttribute('aria-label', `Open step ${i + 1} of ${pages.length}: ${p.title}, ${p.sub}`);
    b.addEventListener('focus', () => { g.target = i * metrics.step; });
    b.addEventListener('mouseenter', () => { g.hover = i; }); b.addEventListener('mouseleave', () => { g.hover = -1; });
    b.addEventListener('click', e => { if (g.suppressClick) { e.preventDefault(); g.suppressClick = false; return; } openStep(i); });
    hitLayer.appendChild(b);
    const m = document.createElement('div'); m.className = 'project-meta';
    m.innerHTML = `<div class="project-meta__text"><div class="project-meta__line"><span>${p.num}</span><p>${esc(p.sub)}</p></div><h2>${esc(p.title)}</h2><span class="meta-done" data-done></span></div><button class="meta-details" type="button" tabindex="-1" aria-hidden="true">Open step</button>`;
    m.querySelector('.meta-details').addEventListener('click', () => openStep(i)); metaLayer.appendChild(m);
    const fb = document.createElement('button'); fb.type = 'button'; fb.className = 'fallback-card'; fb.setAttribute('aria-label', `Open step ${i + 1}: ${p.title}`);
    fb.innerHTML = `<img src="${p.asset}" alt="" /><span><b>${p.num} · ${esc(p.title)}</b><small>${esc(p.sub)}</small></span>`; fb.addEventListener('click', () => openStep(i)); fallback.appendChild(fb);
  });
}
function layout() {
  const nearest = clamp(Math.round(g.current / metrics.step), 0, pages.length - 1); g.active = nearest;
  metrics.top = canvas.getBoundingClientRect().top; const py = g.pointer.y - metrics.top;
  cards = pages.map((p, i) => {
    const hoverTarget = motionEnabled && i === g.hover ? 1 : 0; g.hoverMix[i] += (hoverTarget - g.hoverMix[i]) * (reduced() ? 1 : .12);
    const centerX = metrics.startX + i * metrics.step - g.current;
    const localX = clamp((g.pointer.x - (centerX - metrics.cardW / 2)) / metrics.cardW, 0, 1) - .5;
    const localY = clamp((py - (metrics.centerY - metrics.cardH / 2)) / metrics.cardH, 0, 1) - .5;
    const tx = motionEnabled && i === g.hover ? localX : 0, ty = motionEnabled && i === g.hover ? localY : 0;
    g.tilt[i].x += (tx - g.tilt[i].x) * (reduced() ? 1 : .1); g.tilt[i].y += (ty - g.tilt[i].y) * (reduced() ? 1 : .1);
    const scale = 1 + g.hoverMix[i] * .055 + (i === nearest ? .012 : 0);
    const w = metrics.cardW * scale, h = metrics.cardH * scale;
    return { x: centerX - w / 2, y: metrics.centerY - h / 2 - g.hoverMix[i] * 14, w, h, hover: g.hoverMix[i], tiltX: g.tilt[i].x, tiltY: g.tilt[i].y, effect: p.effect };
  });
  [...hitLayer.children].forEach((el, i) => { const c = cards[i]; Object.assign(el.style, { left: `${c.x}px`, top: `${c.y}px`, width: `${c.w}px`, height: `${c.h}px` }); });
  [...metaLayer.children].forEach((el, i) => { const c = cards[i]; el.style.left = `${c.x + c.w / 2}px`; el.style.top = `${c.y + c.h + 14}px`; });
  counter.textContent = `Step ${String(nearest + 1).padStart(2, '0')} of ${String(pages.length).padStart(2, '0')}`;
  progress.style.width = `${metrics.max ? (g.current / metrics.max) * 100 : 0}%`;
}
function animate(t) {
  g.time = motionEnabled ? t * .001 : 0;
  g.velocity += (g.target - g.current) * .055; g.velocity *= .79;
  if (reduced()) { g.current = g.target; g.velocity = 0; } else g.current += g.velocity;
  g.current = clamp(g.current, 0, metrics.max);
  layout(); renderer?.draw(cards, { pointer: { x: g.pointer.x, y: g.pointer.y - metrics.top }, time: g.time, velocity: g.velocity });
  requestAnimationFrame(animate);
}
function snap() { g.target = clamp(Math.round(g.target / metrics.step) * metrics.step, 0, metrics.max); }
function openStep(i) { g.target = i * metrics.step; runTransition(() => goTo(pages[i].target)); }
hero.addEventListener('pointerdown', e => { if (e.button !== 0 || e.target.closest('.hero__copy, .meta-details')) return; g.dragging = true; g.moved = 0; g.suppressClick = false; g.dragX = e.clientX; g.dragStart = g.target; });
addEventListener('pointermove', e => { g.pointer = { x: e.clientX, y: e.clientY }; if (g.dragging) { g.moved = Math.max(g.moved, Math.abs(e.clientX - g.dragX)); g.target = clamp(g.dragStart - (e.clientX - g.dragX) * 1.35, 0, metrics.max); } });
const up = () => { if (!g.dragging) return; g.dragging = false; g.suppressClick = g.moved > 8; snap(); setTimeout(() => { g.suppressClick = false; }, 80); };
addEventListener('pointerup', up); addEventListener('pointercancel', up);
hero.addEventListener('wheel', e => {
  const horizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY);
  if (!horizontal && !e.shiftKey) return;
  e.preventDefault(); g.target = clamp(g.target + (horizontal ? e.deltaX : e.deltaY) * .9, 0, metrics.max);
  clearTimeout(hero._wt); hero._wt = setTimeout(snap, 140);
}, { passive: false });
hitLayer.addEventListener('keydown', e => {
  const idx = Math.round(g.target / metrics.step); let n = null;
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') n = clamp(idx + 1, 0, pages.length - 1);
  if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') n = clamp(idx - 1, 0, pages.length - 1);
  if (e.key === 'Home') n = 0; if (e.key === 'End') n = pages.length - 1;
  if (n === null) return; e.preventDefault(); g.target = n * metrics.step; hitLayer.children[n].focus({ preventScroll: true });
});
function resizeGallery() { measure(); renderer?.resize(); layout(); }
addEventListener('resize', resizeGallery);
function markPagesDone() {
  const done = {
    curiosities: !!(state.curiosities.trim() || state.concerns.trim() || state.name.trim()) || ['curiosities', 'concerns'].some(k => state.audio[k]),
    cases: Object.values(state.cases).some(c => Object.values(c).some(v => v && v.trim())) || Object.keys(state.audio).some(k => k.startsWith('case:')) || !!state.debriefNotes.trim(),
    takeaways: !!(state.dutyOfCare.trim() || state.leavingQuestions.trim()) || state.principles.some(p => p.text.trim()) || ['dutyOfCare', 'leavingQuestions'].some(k => state.audio[k]),
    export: false
  };
  $$('[data-done]', metaLayer).forEach((el, i) => { el.textContent = done[pages[i].id] ? '✓ notes saved on this device' : ''; });
}

/* ================= static copy ================= */
$('#heroDek').textContent = site.dek;
$('#seatingLine').textContent = site.seating;
$('#localBadge').textContent = localOnly.badge; $('#localLong').textContent = localOnly.long;
$('#slidesLink').href = site.slides;
$('#curiositiesInstructions').innerHTML = instructions.curiosities.map(p => `<p>${esc(p)}</p>`).join('');
$('#casesInstructions').innerHTML = instructions.cases.map(p => `<p>${esc(p)}</p>`).join('');
$('#takeawaysInstruction').textContent = instructions.takeaways;
$('#valuesTitle').textContent = takeawayPrompts.values;
const timerStatus = $('#timerStatus');
const announce = msg => { timerStatus.textContent = ''; setTimeout(() => { timerStatus.textContent = msg; }, 30); };

/* ================= topic picker ================= */
function renderTablePicker() {
  $('#tablePicker').innerHTML = tracks.map(t => `
    <button class="table-card ${state.track === t.id ? 'is-picked' : ''}" type="button" data-track="${t.id}" style="--c:${t.color}" aria-pressed="${state.track === t.id}">
      <span class="table-card__swatch" aria-hidden="true">${t.short.slice(0, 1)}</span>
      <span><span class="table-card__title">${esc(t.title)}</span><span class="table-card__meta">${esc(t.blurb)}</span></span>
      <span class="table-card__pick">${state.track === t.id ? 'Your topic' : 'Pick this topic'}</span>
    </button>`).join('');
  $$('.table-card').forEach(b => b.addEventListener('click', () => pickTrack(b.dataset.track)));
}
function pickTrack(id) {
  state.track = id; save();
  document.documentElement.style.setProperty('--accent', trackById(id).color);
  renderTablePicker(); viewTrack = id; renderTrackTabs(); renderCases(); echoTrack();
  $(`.table-card[data-track="${id}"]`)?.focus();
  announce(`Topic picked: ${trackById(id).title}. The three cases below are now for this topic.`);
}
function echoTrack() {
  const t = trackById(state.track);
  $('#trackEcho').textContent = t ? `Your topic: ${t.title}. Change it any time from the topic menu in Case Studies.` : 'Pick your topic from the menu at the top of Case Studies so the cases match your table.';
}

/* ================= response modes: talk / type / record ================= */
const modeIcons = {
  talk: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h11v8H9l-4 3v-3H4z"/><path d="M15 9h5v7h-1v3l-3-3h-4v-2"/></svg>',
  type: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="6" width="18" height="12" rx="2"/><path d="M7 10h.01M11 10h.01M15 10h.01M7 14h10"/></svg>',
  record: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3M9 21h6"/></svg>'
};
const modeFor = pane => state.paneModes[pane] || state.mode || 'type';
function renderModePicker() {
  $('#modePicker').innerHTML = responseModes.map(m => `<button class="mode-card" type="button" data-mode="${m.id}" aria-pressed="${state.mode === m.id}">
    <span class="mode-card__icon">${modeIcons[m.id]}</span><h3>${esc(m.label)}</h3><p class="mode-card__tag">${esc(m.tagline)}</p><p class="mode-card__text">${esc(m.text)}</p><span class="mode-card__pick">${state.mode === m.id ? 'Your default' : 'Choose'}</span></button>`).join('');
  $$('.mode-card').forEach(b => b.addEventListener('click', () => { state.mode = b.dataset.mode; state.paneModes = {}; save(); renderModePicker(); renderAllPanes(); announce(`Response mode: ${responseModes.find(m => m.id === state.mode).label}. Every prompt now opens this way; switch any single prompt from its pane.`); $(`.mode-card[data-mode="${state.mode}"]`)?.focus(); }));
}
function modeSwitch(pane) {
  return `<div class="mode-switch" role="group" aria-label="Response mode for this pane">${responseModes.map(m => `<button type="button" data-pane-mode="${m.id}" aria-pressed="${modeFor(pane) === m.id}">${esc(m.short)}</button>`).join('')}</div>`;
}
function wireSwitch(paneEl, pane, rerender) {
  $$('[data-pane-mode]', paneEl).forEach(b => b.addEventListener('click', () => { state.paneModes[pane] = b.dataset.paneMode; save(); rerender(); $(`[data-pane-mode="${b.dataset.paneMode}"]`, paneEl)?.focus(); }));
}
function responseField(key, label, hint, mode) {
  const val = getResp(key);
  if (mode === 'talk') return `<div class="resp" data-mode="talk" data-key="${esc(key)}"><span class="resp__label">${esc(label)}</span><div class="resp__talk"><p>${esc(label)}</p><small>Talk it through at your table. ${esc(hint)}</small><details ${val ? 'open' : ''}><summary>Jot one line for the export (optional)</summary><label class="field field--area resp__note"><span class="visually-hidden">${esc(label)}, one-line note</span><textarea rows="2" data-resp="${esc(key)}">${esc(val)}</textarea></label></details></div></div>`;
  if (mode === 'record') return `<div class="resp" data-mode="record" data-key="${esc(key)}"><span class="resp__label">${esc(label)}</span><div data-rec-slot></div><label class="field field--area resp__transcript"><span>Transcript or notes (editable)</span><textarea rows="3" data-resp="${esc(key)}" placeholder="Your transcript appears here after you stop recording. Edit freely.">${esc(val)}</textarea></label></div>`;
  return `<div class="resp" data-mode="type" data-key="${esc(key)}"><label class="field field--area"><span>${esc(label)}</span><textarea rows="4" data-resp="${esc(key)}" placeholder="${esc(hint)}">${esc(val)}</textarea></label></div>`;
}
function wireResponses(root) {
  $$('[data-resp]', root).forEach(ta => { ta.addEventListener('input', () => setResp(ta.dataset.resp, ta.value)); });
  $$('.resp[data-mode="record"]', root).forEach(r => { attachRecorder($('textarea', r), r.dataset.key, $('.resp__label', r).textContent, $('[data-rec-slot]', r)); });
}
function renderPane(paneEl) {
  const pane = paneEl.dataset.pane; const mode = modeFor(pane);
  const sw = $('.mode-switch', paneEl);
  if (sw) sw.outerHTML = modeSwitch(pane);
  else { const anchor = $('.callout__label', paneEl) || $('.pane-head', paneEl) || paneEl.firstElementChild; anchor.insertAdjacentHTML('afterend', modeSwitch(pane)); }
  $$('[data-response]', paneEl).forEach(slot => { slot.innerHTML = responseField(slot.dataset.response, slot.dataset.label, slot.dataset.hint, mode); });
  wireResponses(paneEl); wireSwitch(paneEl, pane, () => renderPane(paneEl));
}
function renderAllPanes() { $$('.response-pane:not(#caseResponse)').forEach(renderPane); renderCaseResponse(); }

/* ================= identity fields ================= */
function bindFields() {
  $$('input[data-key]').forEach(el => { el.value = state[el.dataset.key] ?? ''; el.oninput = () => { state[el.dataset.key] = el.value; save(); }; });
  const roles = [['notetaker', 'The notetaker'], ['participant', 'Talking with my table'], ['quiet', 'At a quiet table']];
  $('#roleChoices').innerHTML = roles.map(([v, l]) => `<button type="button" data-role="${v}" aria-pressed="${state.role === v}">${l}</button>`).join('');
  $$('#roleChoices button').forEach(b => b.addEventListener('click', () => { state.role = state.role === b.dataset.role ? '' : b.dataset.role; save(); $$('#roleChoices button').forEach(x => x.setAttribute('aria-pressed', String(x.dataset.role === state.role))); }));
}

/* ================= recorder ================= */
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
const canRecord = !!(navigator.mediaDevices?.getUserMedia && window.MediaRecorder);
let activeStop = null;
let transcribePref = localStorage.getItem('cases-transcribe') !== 'off';
function attachRecorder(ta, key, label, slot) {
  const box = slot || document.createElement('div'); box.className = 'rec'; box.dataset.for = key;
  if (!slot) (ta.closest('label') || ta).insertAdjacentElement('afterend', box);
  if (!canRecord) { box.innerHTML = `<p class="rec__unsupported">Audio recording is not available in this browser. Talking at the table or typing works everywhere.</p>`; return; }
  const cid = `clip-${key.replace(/[^a-z0-9]+/gi, '-')}`;
  box.innerHTML = `
    <div class="rec__row">
      <button class="rec__btn" type="button" aria-describedby="${cid}-status"><i aria-hidden="true"></i><span>Record a spoken response</span></button>
      ${SR ? `<label class="rec__opt"><input type="checkbox" ${transcribePref ? 'checked' : ''}> Transcribe into the text box</label>` : `<span class="rec__opt">Transcription is not available in this browser; recording only.</span>`}
    </div>
    <p class="rec__status" id="${cid}-status" role="status"></p>
    <p class="rec__interim" aria-hidden="true"></p>
    <div class="rec__clip" hidden><audio controls preload="metadata" aria-label="Your recording for: ${esc(label)}"></audio><span class="rec__len"></span><button class="rec__del" type="button">Delete recording</button></div>
    <details><summary>How recording works · stays on this device</summary><p>${esc(localOnly.long)}</p><p>${esc(disclosure.speech)}</p></details>`;
  const btn = $('.rec__btn', box), lbl = $('.rec__btn span', box), status = $('.rec__status', box), interim = $('.rec__interim', box), clipRow = $('.rec__clip', box), audio = $('audio', box), len = $('.rec__len', box), del = $('.rec__del', box), opt = $('.rec__opt input', box);
  opt?.addEventListener('change', () => { transcribePref = opt.checked; localStorage.setItem('cases-transcribe', transcribePref ? 'on' : 'off'); $$('.rec__opt input').forEach(i => { i.checked = transcribePref; }); });
  const showClip = async () => {
    const meta = state.audio[key]; if (!meta) { clipRow.hidden = true; return; }
    const blob = await clipDB.get(key).catch(() => null); if (!blob) { clipRow.hidden = true; return; }
    if (audio.src) URL.revokeObjectURL(audio.src); audio.src = URL.createObjectURL(blob); len.textContent = `${fmtClock(meta.duration)} · saved on this device`; clipRow.hidden = false; lbl.textContent = 'Record again (replaces this clip)';
  };
  showClip();
  del.addEventListener('click', async () => { await clipDB.del(key).catch(() => {}); delete state.audio[key]; save(); clipRow.hidden = true; lbl.textContent = 'Record a spoken response'; status.textContent = 'Recording deleted from this device. Your typed text was kept.'; btn.focus(); });
  let rec = null, chunks = [], recog = null, finals = '', startedAt = 0, tickIv = null;
  const stop = () => { if (rec && rec.state !== 'inactive') rec.stop(); if (recog) { const r = recog; recog = null; try { r.stop(); } catch {} } clearInterval(tickIv); };
  btn.addEventListener('click', async () => {
    if (rec && rec.state === 'recording') { stop(); return; }
    if (activeStop && activeStop !== stop) activeStop();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'].find(m => MediaRecorder.isTypeSupported(m)) || '';
      rec = new MediaRecorder(stream, mime ? { mimeType: mime, audioBitsPerSecond: 48000 } : undefined); chunks = []; finals = '';
      rec.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
      rec.onstop = async () => {
        stream.getTracks().forEach(t => t.stop()); activeStop = null;
        const duration = (Date.now() - startedAt) / 1000;
        const blob = new Blob(chunks, { type: rec.mimeType || mime || 'audio/webm' });
        try { await clipDB.put(key, blob); state.audio[key] = { duration, mime: blob.type, created: new Date().toISOString(), transcribed: !!finals.trim() }; } catch { status.textContent = 'Could not save the recording on this device (storage blocked). Your transcript, if any, was kept.'; }
        if (finals.trim()) { ta.value = (ta.value.trim() ? ta.value.replace(/\s+$/, '') + '\n\n' : '') + finals.trim(); ta.dispatchEvent(new Event('input', { bubbles: true })); }
        save(); await showClip();
        btn.classList.remove('is-live'); interim.textContent = '';
        status.textContent = `Recording saved on this device (${fmtClock(duration)}).${finals.trim() ? ' Transcript added to the text box; please review it.' : (opt?.checked ? ' No speech was recognized; you can type instead.' : '')}`;
      };
      startedAt = Date.now(); rec.start(250); activeStop = stop;
      btn.classList.add('is-live'); lbl.textContent = 'Stop recording'; status.textContent = 'Recording… 00:00';
      tickIv = setInterval(() => { status.textContent = `Recording… ${fmtClock((Date.now() - startedAt) / 1000)}${recog ? ' · listening for speech' : ''}`; }, 500);
      if (SR && opt?.checked) {
        recog = new SR(); recog.continuous = true; recog.interimResults = true; recog.lang = document.documentElement.lang || 'en-US';
        recog.onresult = e => { let live = ''; for (let i = e.resultIndex; i < e.results.length; i++) { const r = e.results[i]; if (r.isFinal) finals += (finals && !finals.endsWith(' ') ? ' ' : '') + r[0].transcript.trim(); else live += r[0].transcript; } interim.textContent = live; };
        recog.onerror = ev => { if (ev.error === 'not-allowed' || ev.error === 'service-not-allowed') { status.textContent = 'Transcription was blocked by the browser; recording audio only.'; recog = null; } };
        recog.onend = () => { if (rec && rec.state === 'recording' && recog) { try { recog.start(); } catch { /* restarted too fast */ } } };
        try { recog.start(); } catch { recog = null; }
      }
    } catch (err) {
      status.textContent = err?.name === 'NotAllowedError' ? 'Microphone access was denied. You can allow it in the browser’s site settings, or switch this pane to Type or Talk.' : 'Could not start the microphone. You can switch this pane to Type or Talk instead.';
    }
  });
}

/* ================= case studies: side by side ================= */
let viewTrack = null;
function renderTrackTabs() { viewTrack = viewTrack || state.track || tracks[0].id; }
const activeCaseOf = t => state.activeCase[t.id] || t.cases[0].id;
function renderCases() {
  const t = trackById(viewTrack); const active = activeCaseOf(t);
  $('#caseTabs').innerHTML = t.cases.map((c, i) => `<button class="case-tab" type="button" data-case="${c.id}" style="--accent:${t.color}" aria-pressed="${c.id === active}"><b aria-hidden="true">0${i + 1}</b><span>${esc(c.title)}</span><small>Case ${i + 1} of 3 <span class="dot-text"></span></small></button>`).join('');
  $$('.case-tab').forEach(b => b.addEventListener('click', () => setActiveCase(t.id, b.dataset.case)));
  renderCasePane(); renderCaseResponse(); markCaseNotes();
}
function renderCasePane() {
  const t = trackById(viewTrack); const id = activeCaseOf(t); const idx = t.cases.findIndex(c => c.id === id); const c = t.cases[idx];
  $('#casePane').innerHTML = `<article class="sheet case-sheet" style="--c:${t.color};--accent:${t.color}" aria-labelledby="${c.id}-title">
    <div class="case-card__head"><span class="case-card__num" aria-hidden="true">0${idx + 1}</span><span class="case-card__label">${esc(t.short)} · case ${idx + 1} of 3</span></div>
    <h3 id="${c.id}-title">${esc(c.title)}</h3>${c.text.map(p => `<p>${esc(p)}</p>`).join('')}
    <div class="case-card__foot">${c.source ? `<a href="${c.source.href}" target="_blank" rel="noopener">Source: ${esc(c.source.label)} <span aria-hidden="true">↗</span><span class="visually-hidden">(opens in a new tab)</span></a>` : '<span></span>'}<button class="text-action" type="button" data-print-case>Print this case as a discussion sheet</button></div>
  </article>`;
  $('[data-print-case]').addEventListener('click', () => { document.body.classList.add('print-case'); const done = () => { document.body.classList.remove('print-case'); removeEventListener('afterprint', done); }; addEventListener('afterprint', done); print(); setTimeout(done, 1500); });
}
function renderCaseResponse() {
  const t = trackById(viewTrack); if (!t) return; const id = activeCaseOf(t); const idx = t.cases.findIndex(c => c.id === id); const c = t.cases[idx]; const mode = modeFor('case');
  const pane = $('#caseResponse');
  pane.innerHTML = `<div class="sheet" style="--c:${t.color}">
    <div class="pane-head"><div><p class="eyebrow">YOUR RESPONSE · QUESTIONS TO CONSIDER</p><h3 class="cq-title" style="margin:6px 0 0;font-size:clamp(20px,1.8vw,26px);letter-spacing:-.04em">${esc(c.title)}</h3></div>${modeSwitch('case')}</div>
    <p class="field-note" style="margin:0 0 14px">${esc(responseModes.find(m => m.id === mode).tagline)} Stored on this device only.</p>
    <div class="cq-grid">${caseQuestions.map(q => responseField(`case:${c.id}:${q.id}`, q.text, 'Your table’s thinking.', mode)).join('')}</div>
    <div class="cq-nav">${idx > 0 ? `<button class="text-action" type="button" data-go="${t.cases[idx - 1].id}">← Previous case</button>` : '<span></span>'}${idx < 2 ? `<button class="text-action" type="button" data-go="${t.cases[idx + 1].id}">Next case →</button>` : `<a class="text-action" href="#step-takeaways" style="text-decoration:none">On to takeaways →</a>`}</div>
  </div>`;
  wireResponses(pane); wireSwitch(pane, 'case', renderCaseResponse);
  $$('[data-go]', pane).forEach(b => b.addEventListener('click', () => setActiveCase(t.id, b.dataset.go, true)));
}
function setActiveCase(trackId, caseId, focusTitle) {
  state.activeCase[trackId] = caseId; save();
  $$('.case-tab').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.case === caseId)));
  renderCasePane(); renderCaseResponse(); markCaseNotes();
  const h = $(`#${caseId}-title`); if (h) { h.setAttribute('tabindex', '-1'); if (focusTitle) h.focus({ preventScroll: true }); }
  if (focusTitle) $('#casePane').scrollIntoView({ behavior: motionEnabled ? 'smooth' : 'instant', block: 'start' });
}
function markCaseNotes() { $$('.case-tab').forEach(b => { const n = state.cases[b.dataset.case] || {}; const has = Object.values(n).some(v => v && v.trim()) || caseQuestions.some(q => state.audio[`case:${b.dataset.case}:${q.id}`]); $('.dot-text', b).textContent = has ? '· notes saved' : ''; }); }

/* ================= values / principles ================= */
const scopes = [['personal', 'My practice'], ['department', 'Dept. / university policy'], ['both', 'Both']];
function renderPrinciples() {
  $('#principleList').innerHTML = state.principles.map((p, i) => `<li class="principle" data-i="${i}">
    <span class="principle__num" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span>
    <label><span class="visually-hidden">Value or principle ${i + 1}</span><textarea rows="1" placeholder="${i === 0 ? 'A value or principle I could actually follow…' : 'Another…'}">${esc(p.text)}</textarea></label>
    <div class="principle__side"><div class="scope" role="group" aria-label="Scope of principle ${i + 1}">${scopes.map(([v, l]) => `<button type="button" data-scope="${v}" aria-pressed="${p.scope === v}">${l}</button>`).join('')}</div>${state.principles.length > 1 ? `<button class="principle__remove" type="button" aria-label="Remove principle ${i + 1}">Remove</button>` : ''}</div>
  </li>`).join('');
  $$('.principle').forEach(li => {
    const i = Number(li.dataset.i), ta = $('textarea', li);
    const grow = () => { ta.style.height = 'auto'; ta.style.height = `${ta.scrollHeight}px`; }; grow();
    ta.addEventListener('input', () => { state.principles[i].text = ta.value; grow(); save(); });
    $$('[data-scope]', li).forEach(b => b.addEventListener('click', () => { state.principles[i].scope = b.dataset.scope; save(); $$('[data-scope]', li).forEach(x => x.setAttribute('aria-pressed', String(x.dataset.scope === state.principles[i].scope))); }));
    $('.principle__remove', li)?.addEventListener('click', () => { state.principles.splice(i, 1); save(); renderPrinciples(); $('#addPrinciple').focus(); });
  });
  $('#seedChips').innerHTML = principleSeeds.map(s => `<button type="button" data-seed="${esc(s)}" aria-label="Add seed: ${esc(s)}">${esc(s)}</button>`).join('');
  $$('[data-seed]').forEach(b => b.addEventListener('click', () => addPrinciple(b.dataset.seed)));
}
function addPrinciple(text = '') {
  const empty = state.principles.findIndex(p => !p.text.trim());
  if (text && empty >= 0) state.principles[empty].text = text; else state.principles.push({ text, scope: 'personal' });
  save(); renderPrinciples();
  const tas = $$('.principle textarea'); const target = text && empty >= 0 ? tas[empty] : tas[tas.length - 1]; target?.focus();
}
$('#addPrinciple').addEventListener('click', () => addPrinciple(''));

/* ================= export ================= */
function reportSections() {
  const t = trackById(state.track); const modeLabel = state.mode ? responseModes.find(m => m.id === state.mode).label : '';
  const secs = [];
  secs.push({ h: 'Who I am', items: [['Name', state.name], ['Department / discipline', state.discipline], ['Topic', t ? t.title : ''], ['At my table', { notetaker: 'The notetaker', participant: 'Talking with my table', quiet: 'At a quiet table' }[state.role] || ''], ['How I responded', modeLabel]] });
  secs.push({ h: 'Curiosities and Concerns', items: [['What I am curious about', state.curiosities, 'curiosities'], ['What concerns me', state.concerns, 'concerns']] });
  tracks.forEach(tr => tr.cases.forEach((c, i) => {
    const n = state.cases[c.id] || {}; const hasAudio = caseQuestions.some(q => state.audio[`case:${c.id}:${q.id}`]);
    if (!Object.values(n).some(v => v && v.trim()) && !hasAudio) return;
    secs.push({ h: `Case study · ${tr.title} · ${i + 1}. ${c.title}`, body: c.text, source: c.source, items: caseQuestions.map(q => [q.text, n[q.id] || '', `case:${c.id}:${q.id}`]) });
  }));
  secs.push({ h: 'Debrief', items: [['What I heard from other tables', state.debriefNotes, 'debriefNotes']] });
  const ps = state.principles.filter(p => p.text.trim());
  secs.push({ h: 'Takeaways, Questions, and Commitments', items: [[takeawayPrompts.duty, state.dutyOfCare, 'dutyOfCare']], list: ps.map(p => `${p.text.trim()} (${{ personal: 'my practice', department: 'department or university policy', both: 'my practice and department or university policy' }[p.scope]})`), listLabel: takeawayPrompts.values, items2: [[takeawayPrompts.questions, state.leavingQuestions, 'leavingQuestions']] });
  return secs;
}
const audioNote = key => state.audio[key] ? `<p class="p-audio">Audio recording · ${fmtClock(state.audio[key].duration)} · saved on this device · included in the HTML download</p>` : '';
const itemsHtml = (items, esc2 = esc) => (items || []).map(([k, v, key]) => `<p class="p-eyebrow">${esc2(k)}</p>${v && v.trim() ? `<blockquote>${esc2(v)}</blockquote>` : '<p class="p-empty">—</p>'}${key ? audioNote(key) : ''}`).join('');
function renderPreview() {
  const secs = reportSections();
  $('#preview').innerHTML = secs.map(s => `<h2>${esc(s.h)}</h2>${s.body ? s.body.map(p => `<p style="color:#4f5063;font-size:14px">${esc(p)}</p>`).join('') : ''}${itemsHtml(s.items)}${s.list ? `<p class="p-eyebrow">${esc(s.listLabel)}</p>${s.list.length ? `<ol>${s.list.map(l => `<li>${esc(l)}</li>`).join('')}</ol>` : '<p class="p-empty">No values or principles yet.</p>'}` : ''}${itemsHtml(s.items2)}`).join('');
}
const blobToDataUrl = blob => new Promise(res => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(blob); });
async function reportHtml() {
  const secs = reportSections(); const t = trackById(state.track); const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const clips = {};
  for (const key of Object.keys(state.audio)) { const b = await clipDB.get(key).catch(() => null); if (b) clips[key] = await blobToDataUrl(b); }
  const items = it => (it || []).map(([k, v, key]) => `<h3>${esc(k)}</h3>${v && v.trim() ? `<blockquote>${esc(v)}</blockquote>` : '<p class="empty">—</p>'}${key && clips[key] ? `<p class="audio"><span>Spoken response (${fmtClock(state.audio[key].duration)})</span><audio controls preload="metadata" src="${clips[key]}" aria-label="Spoken response: ${esc(k)}"></audio></p>` : ''}`).join('');
  const body = secs.map(s => `<section><h2>${esc(s.h)}</h2>${s.body ? `<div class="case">${s.body.map(p => `<p>${esc(p)}</p>`).join('')}${s.source ? `<p class="src">Source: <a href="${s.source.href}">${esc(s.source.label)}</a></p>` : ''}</div>` : ''}${items(s.items)}${s.list ? `<h3>${esc(s.listLabel)}</h3>${s.list.length ? `<ol class="principles">${s.list.map(l => `<li>${esc(l)}</li>`).join('')}</ol>` : '<p class="empty">No values or principles recorded.</p>'}` : ''}${items(s.items2)}</section>`).join('');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>The Ethics of Using AI as Instructors — my workshop notes</title>
<style>body{margin:0;background:#F8EDD9;color:#142142;font-family:"IBM Plex Serif",Georgia,"Times New Roman",serif;line-height:1.55}main{max-width:820px;margin:0 auto;padding:56px 28px 80px}header{border-bottom:2px solid #142142;padding-bottom:22px;margin-bottom:30px}.eyebrow{font-family:"IBM Plex Sans",Arial,Helvetica,sans-serif;font-size:12px;letter-spacing:.17em;text-transform:uppercase;color:#4f5063;font-weight:800;margin:0 0 8px}h1{font-family:"IBM Plex Sans",Arial,Helvetica,sans-serif;font-size:44px;letter-spacing:-.05em;line-height:.95;margin:0 0 14px;font-weight:700}h1 strong{color:#CF142B}h2{font-family:"IBM Plex Sans",Arial,Helvetica,sans-serif;font-size:24px;letter-spacing:-.04em;margin:44px 0 12px;font-weight:700}h3{font-family:"IBM Plex Sans",Arial,Helvetica,sans-serif;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#4f5063;margin:22px 0 6px;font-weight:800}blockquote{margin:0;padding:14px 18px;background:#fffaf0;border-left:4px solid #CF142B;border-radius:0 8px 8px 0;white-space:pre-wrap;box-shadow:0 8px 24px rgba(20,33,66,.08)}.case{background:#f1e4cc;padding:18px 22px;border-radius:8px;font-size:15px}.case p{margin:0 0 10px}.case p:last-child{margin:0}.src{font-family:"IBM Plex Sans",Arial,Helvetica,sans-serif;font-size:12px}.src a{color:#006BA6}.empty{color:#5b5c6e;font-style:italic;margin:0}.audio{display:grid;gap:6px;margin:10px 0 0;font-family:"IBM Plex Sans",Arial,Helvetica,sans-serif;font-size:12px;color:#4f5063}.audio audio{width:100%;max-width:480px}ol.principles{padding-left:22px;font-size:19px}ol.principles li{margin:8px 0;padding-left:6px}.local{font-family:"IBM Plex Sans",Arial,Helvetica,sans-serif;font-size:12px;color:#006BA6;border:1px solid #006BA6;border-radius:8px;padding:10px 14px;margin:18px 0 0}footer{margin-top:60px;padding-top:20px;border-top:1px solid rgba(20,33,66,.18);font-family:"IBM Plex Sans",Arial,Helvetica,sans-serif;font-size:12px;color:#4f5063;line-height:1.6}footer .ai{display:inline-block;border:1px solid #142142;border-radius:4px;padding:1px 5px;font-size:9px;margin-right:6px;color:#142142}@media print{body{background:#fff}blockquote,.case{box-shadow:none;border:1px solid #ccc}audio{display:none}}</style></head>
<body><main><header><p class="eyebrow">${esc(site.title)} · Faculty workshop · AI Institute &amp; CETL, University of Mississippi</p><h1>My workshop <strong>notes</strong></h1><p class="eyebrow">${esc(state.name || 'Attendee')}${state.discipline ? ' · ' + esc(state.discipline) : ''}${t ? ' · ' + esc(t.title) : ''} · ${date}</p><p class="local"><strong>This file was created on your device.</strong> The workshop site has no server; nothing in it was uploaded anywhere. Share this file only if and how you choose.</p></header>${body}
<footer><p><strong>${esc(site.title)}</strong> was created by ${esc(site.authorLine)} and presented by the ${esc(site.orgs)}. Case studies, instructions, and discussion questions by the workshop facilitators. The four questions to consider: ${caseQuestions.map(q => esc(q.text)).join(' ')}</p><p><span class="ai">AI</span><strong>AI disclosure:</strong> The workshop website and this export template were built with Anthropic Claude (Fable 5.1) under the authors’ direction; case studies and prompts are the facilitators’ own words. Everything in the quotation blocks was written or spoken by the attendee named in the header; any transcript came from the attendee’s own browser speech-recognition service and may contain errors.</p></footer></main></body></html>`;
}
function reportText() {
  const secs = reportSections(); const lines = [`${site.title.toUpperCase()} — MY WORKSHOP NOTES`, `${state.name || 'Attendee'}${state.discipline ? ' · ' + state.discipline : ''}`, 'Created on my device; nothing was uploaded by the workshop site.', ''];
  const items = it => (it || []).forEach(([k, v, key]) => { lines.push(k + ':', v && v.trim() ? v : '—'); if (key && state.audio[key]) lines.push(`[spoken response, ${fmtClock(state.audio[key].duration)}, in the HTML download]`); lines.push(''); });
  secs.forEach(s => { lines.push(s.h.toUpperCase(), ''); if (s.body) { s.body.forEach(p => lines.push(p)); lines.push(''); } items(s.items); if (s.list) { lines.push(s.listLabel + ':'); s.list.forEach((l, i) => lines.push(`${i + 1}. ${l}`)); if (!s.list.length) lines.push('—'); lines.push(''); } items(s.items2); });
  lines.push(`— Created by ${site.authorLine}; presented by the ${site.orgs}. Site built with Anthropic Claude (Fable 5.1); case studies and prompts are the facilitators’ own words.`);
  return lines.join('\n');
}
const status = $('#exportStatus');
const flash = m => { status.textContent = m; setTimeout(() => { if (status.textContent === m) status.textContent = ''; }, 6000); };
$('#exportHtml').addEventListener('click', async () => {
  flash('Preparing your file…');
  const html = await reportHtml();
  const blob = new Blob([html], { type: 'text/html' }); const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = `ethics-of-ai-as-instructors-notes-${(state.name || 'attendee').toLowerCase().replace(/[^a-z0-9]+/g, '-')}.html`; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  flash(`Downloaded to your device${Object.keys(state.audio).length ? ' with your recordings embedded' : ''}. Open it in any browser; it needs nothing else.`);
});
$('#exportPdf').addEventListener('click', async () => { const w = open('', '_blank'); if (!w) { flash('Pop-up blocked. Allow pop-ups for this page, or use the HTML download.'); return; } w.document.write(await reportHtml()); w.document.close(); w.focus(); setTimeout(() => w.print(), 400); });
$('#exportCopy').addEventListener('click', async () => {
  const text = reportText();
  try { await navigator.clipboard.writeText(text); flash('Copied to clipboard.'); }
  catch { const ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); flash('Copied to clipboard.'); } catch { flash('Copy failed. Use the HTML download instead.'); } ta.remove(); }
});
$('#clearAll').addEventListener('click', async () => {
  if (!confirm('Clear everything you have written and recorded on this device? Export first if you want to keep it.')) return;
  state = seed(); try { localStorage.removeItem(STORE); } catch {} await clipDB.clear().catch(() => {}); document.documentElement.style.removeProperty('--accent');
  bindFields(); renderTablePicker(); renderModePicker(); viewTrack = null; renderTrackTabs(); renderCases(); renderAllPanes(); renderPrinciples(); renderPreview(); echoTrack(); markPagesDone(); flash('Cleared from this device.');
});

/* ================= info panel ================= */
const infoPanel = $('#infoPanel'), infoContent = $('#infoContent'), infoClose = $('#infoClose'), mainEl = $('#main'), headerEl = $('.site-header');
let returnFocus = null;
function openInfo(label) { returnFocus = document.activeElement; document.body.classList.add('has-overlay'); syncAmbientVideo(); mainEl.setAttribute('inert', ''); headerEl.setAttribute('inert', ''); infoPanel.setAttribute('aria-label', label); infoPanel.classList.add('is-open'); infoPanel.removeAttribute('inert'); infoPanel.setAttribute('aria-hidden', 'false'); infoPanel.scrollTop = 0; infoClose.focus(); }
function closeInfo() { document.body.classList.remove('has-overlay'); syncAmbientVideo(); mainEl.removeAttribute('inert'); headerEl.removeAttribute('inert'); infoPanel.classList.remove('is-open'); infoPanel.setAttribute('inert', ''); infoPanel.setAttribute('aria-hidden', 'true'); returnFocus?.focus(); }
infoClose.addEventListener('click', closeInfo);
addEventListener('keydown', e => { if (e.key === 'Escape' && infoPanel.classList.contains('is-open')) closeInfo(); });
const ext = (href, label) => `<a href="${href}" target="_blank" rel="noopener">${esc(label)}<span class="visually-hidden"> (opens in a new tab)</span></a>`;
function openAbout() {
  infoContent.innerHTML = `<p class="eyebrow">ABOUT THE WORKSHOP SITE</p><h1 class="info-title--long">The Ethics of Using AI <strong>as Instructors</strong></h1><p class="lead">${esc(site.dek)}</p>
  <p>This site is the workshop’s worksheet and its take-home. Attendees pick a topic, decide whether to talk, type, or record, share curiosities and concerns, work through three case studies side by side with their responses, and write their duty of care, values, and open questions in their own words. Everything is stored only in the attendee’s browser and exported as a single HTML file. The facilitators’ ${ext(site.slides, 'slide deck')} accompanies the session.</p>
  <div class="callout callout--green local-callout"><p class="callout__label"><span class="local-badge__lock" aria-hidden="true"></span> Stored on your device only</p><p>${esc(localOnly.long)}</p></div>
  <div class="callout callout--rose"><p class="callout__label">Attribution</p><p>Created by <strong>${esc(site.authorLine)}</strong>, University of Mississippi. Presented by the <strong>${esc(site.orgs)}</strong>. Case studies, instructions, discussion questions, and takeaway prompts were written by the workshop facilitators. Two cases draw on published reporting: ${ext(tracks[1].cases[2].source.href, tracks[1].cases[2].source.label)} and ${ext(tracks[2].cases[0].source.href, tracks[2].cases[0].source.label)}. The card renderer is reused from the ${ext('https://mwatkins03-netizen.github.io/Discernment-Workshop-2.0-GPT-5.6-Fable-5/', 'Teaching for Discernment')} workshop site; the step illustrations were drawn for this workshop in that site’s style.</p></div>
  <section aria-labelledby="a11yHeading"><p class="eyebrow" style="margin-top:70px">ACCESSIBILITY STATEMENT</p><h2 id="a11yHeading" class="section-heading" style="margin-top:10px">Built to be <strong>usable by everyone</strong></h2><p class="lead">${esc(accessibility.target)}</p><ul class="a11y-list">${accessibility.features.map(f => `<li>${esc(f)}</li>`).join('')}</ul><p>${esc(accessibility.known)}</p><p><strong>Report a barrier.</strong> ${esc(accessibility.contact)}</p></section>
  <section class="about-disclosure" aria-labelledby="aiDisclosureHeading"><div class="disclosure-label"><span aria-hidden="true">AI</span><strong>Full AI disclosure</strong></div><h2 id="aiDisclosureHeading" class="section-heading" style="margin-top:10px">Human direction.<br><strong>Transparent assistance.</strong></h2>
  <div class="disclosure-grid"><article><p class="eyebrow">HUMAN CONTRIBUTION</p><h3>Watkins, Donahue &amp; Clevenger</h3><p>${esc(disclosure.human)}</p></article><article><p class="eyebrow">AI CONTRIBUTION</p><h3>Anthropic Claude</h3><p>${esc(disclosure.ai)}</p></article><article><p class="eyebrow">LIMITS</p><h3>What this label does not claim</h3><p>${esc(disclosure.limits)}</p></article></div>
  <p class="disclosure-privacy"><strong>Data note:</strong> ${esc(disclosure.data)}</p><p class="disclosure-privacy"><strong>Speech recognition:</strong> ${esc(disclosure.speech)}</p><p class="disclosure-privacy"><strong>Brand:</strong> ${esc(disclosure.brand)}</p><p class="disclosure-privacy">${esc(disclosure.date)}</p></section>`;
  openInfo('About, accessibility statement, and full AI disclosure');
}
$('#aboutButton').addEventListener('click', openAbout); $('#aboutButton2').addEventListener('click', openAbout);

/* ================= init ================= */
async function init() {
  window.__ethicsBooted = true;
  if (state.track) document.documentElement.style.setProperty('--accent', trackById(state.track).color);
  createDom(); measure();
  try { renderer = new CardRenderer(canvas, pages); await renderer.load(); }
  catch (e) { console.warn('Using DOM fallback', e); canvas.style.display = 'none'; fallback.style.display = 'flex'; fallback.setAttribute('aria-hidden', 'false'); hitLayer.style.display = 'none'; metaLayer.style.display = 'none'; }
  renderTablePicker(); renderModePicker(); bindFields(); echoTrack(); renderTrackTabs(); renderCases(); renderAllPanes(); renderPrinciples(); renderPreview(); markPagesDone();
  updateMotion(); observeReveals(); resizeGallery(); requestAnimationFrame(animate);
  setTimeout(() => $('#preloader').classList.add('is-hidden'), 650);
  if (location.hash) setTimeout(() => document.getElementById(location.hash.slice(1))?.scrollIntoView({ behavior: 'instant' }), 800);
}
init();
