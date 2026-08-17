// ── FAVORITES SYSTEM ──────────────────────────────────────────────────────────
const FAV_KEY = 'mlp_favorites';

function getFavorites() {
  try { return JSON.parse(localStorage.getItem(FAV_KEY)) || []; }
  catch(e) { return []; }
}
function saveFavorites(favs) {
  localStorage.setItem(FAV_KEY, JSON.stringify(favs));
}
function isFavorited(id) {
  return getFavorites().some(f => f.id === id);
}
function toggleFavorite(id, label, url) {
  let favs = getFavorites();
  const idx = favs.findIndex(f => f.id === id);
  if (idx >= 0) favs.splice(idx, 1);
  else favs.push({ id, label, url });
  saveFavorites(favs);
  renderFavoritesPanel();
  document.querySelectorAll(`[data-fav-id="${id}"]`).forEach(btn => {
    btn.classList.toggle('active', isFavorited(id));
    btn.textContent = isFavorited(id) ? '★' : '☆';
  });
  updateFavCount();
}
function updateFavCount() {
  const count = getFavorites().length;
  const el = document.getElementById('favCount');
  if (el) { el.textContent = count; el.style.display = count > 0 ? 'flex' : 'none'; }
}
function renderFavoritesPanel() {
  const panel = document.getElementById('favoritesPanel');
  if (!panel) return;
  const favs = getFavorites();
  const t = (typeof LANG !== 'undefined' && LANG[currentLang]) ? LANG[currentLang] : {};
  const emptyText = t.fav_empty || 'No favorites yet.';
  const titleText = t.fav_title || 'Favorites';
  panel.innerHTML = `
    <div class="favorites-header">
      <span class="favorites-title">${titleText}</span>
      <button class="inquiry-close" onclick="toggleFavoritesPanel(false)">&times;</button>
    </div>
    ${favs.length === 0
      ? `<div class="favorites-empty">${emptyText}</div>`
      : favs.map(f => `
        <div class="fav-item">
          <a href="${f.url}">${f.label}</a>
          <button onclick="toggleFavorite('${f.id}', '', '')" aria-label="Remove">&times;</button>
        </div>
      `).join('')
    }
  `;
}
function toggleFavoritesPanel(force) {
  const panel = document.getElementById('favoritesPanel');
  if (!panel) return;
  const shouldOpen = force !== undefined ? force : !panel.classList.contains('open');
  panel.classList.toggle('open', shouldOpen);
  if (shouldOpen) renderFavoritesPanel();
}

function injectFavoritesWidget() {
  const fab = document.createElement('button');
  fab.className = 'favorites-fab';
  fab.setAttribute('aria-label', 'Favorites');
  fab.innerHTML = `★<span class="fav-count" id="favCount" style="display:none">0</span>`;
  fab.onclick = () => toggleFavoritesPanel();
  document.body.appendChild(fab);

  const panel = document.createElement('div');
  panel.className = 'favorites-panel';
  panel.id = 'favoritesPanel';
  document.body.appendChild(panel);

  updateFavCount();
}

// Adds a favorite-star button to a card/result if not already present
function addFavButton(container, id, label, url) {
  if (container.querySelector(`[data-fav-id="${id}"]`)) return;
  const btn = document.createElement('button');
  btn.className = 'fav-btn' + (isFavorited(id) ? ' active' : '');
  btn.setAttribute('data-fav-id', id);
  btn.textContent = isFavorited(id) ? '★' : '☆';
  btn.onclick = (e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(id, label, url); };
  container.style.position = container.style.position || 'relative';
  container.appendChild(btn);
}

// ── UNIT CONVERTER ─────────────────────────────────────────────────────────────
const CONVERTERS = {
  dilution: {
    label: { fr:'Dilution → CFU', en:'Dilution → CFU', ar:'تخفيف → CFU' },
    calc: (v) => {
      const count = +document.getElementById('convA').value;
      const dilution = +document.getElementById('convB').value;
      if (!count || !dilution) return null;
      return (count * Math.pow(10, dilution)).toExponential(2);
    },
    labelA: { fr:'Colonies comptees', en:'Colonies counted', ar:'المستعمرات المعدودة' },
    labelB: { fr:'Facteur dilution (10^n)', en:'Dilution factor (10^n)', ar:'عامل التخفيف (10^n)' },
    unit: 'CFU/mL'
  },
  temp: {
    label: { fr:'°C ⇄ °F', en:'°C ⇄ °F', ar:'°C ⇄ °F' },
    calc: () => {
      const c = document.getElementById('convA').value;
      if (c === '') return null;
      return ((+c) * 9/5 + 32).toFixed(1);
    },
    labelA: { fr:'Celsius (°C)', en:'Celsius (°C)', ar:'مئوية (°C)' },
    labelB: null,
    unit: '°F'
  },
  molarity: {
    label: { fr:'g ⇄ mol', en:'g ⇄ mol', ar:'غ ⇄ مول' },
    calc: () => {
      const mass = +document.getElementById('convA').value;
      const mm = +document.getElementById('convB').value;
      if (!mass || !mm) return null;
      return (mass / mm).toFixed(4);
    },
    labelA: { fr:'Masse (g)', en:'Mass (g)', ar:'الكتلة (غ)' },
    labelB: { fr:'Masse molaire (g/mol)', en:'Molar mass (g/mol)', ar:'الكتلة المولية (غ/مول)' },
    unit: 'mol'
  }
};
let activeConverter = 'dilution';

function injectConverterWidget() {
  const fab = document.createElement('button');
  fab.className = 'converter-fab';
  fab.setAttribute('aria-label', 'Unit converter');
  fab.innerHTML = '⇄';
  fab.onclick = () => toggleConverterPanel();
  document.body.appendChild(fab);

  const panel = document.createElement('div');
  panel.className = 'converter-panel';
  panel.id = 'converterPanel';
  document.body.appendChild(panel);
  renderConverterPanel();
}

function toggleConverterPanel(force) {
  const panel = document.getElementById('converterPanel');
  if (!panel) return;
  const shouldOpen = force !== undefined ? force : !panel.classList.contains('open');
  panel.classList.toggle('open', shouldOpen);
}

function switchConverter(key) {
  activeConverter = key;
  renderConverterPanel();
}

function renderConverterPanel() {
  const panel = document.getElementById('converterPanel');
  if (!panel) return;
  const lang = (typeof currentLang !== 'undefined') ? currentLang : 'fr';
  const t = (typeof LANG !== 'undefined' && LANG[lang]) ? LANG[lang] : {};
  const conv = CONVERTERS[activeConverter];
  panel.innerHTML = `
    <div class="favorites-header">
      <span class="favorites-title">${t.conv_title || 'Converter'}</span>
      <button class="inquiry-close" onclick="toggleConverterPanel(false)">&times;</button>
    </div>
    <div class="converter-tabs">
      ${Object.keys(CONVERTERS).map(k => `<button class="converter-tab ${k===activeConverter?'active':''}" onclick="switchConverter('${k}')">${CONVERTERS[k].label[lang]}</button>`).join('')}
    </div>
    <div class="converter-body">
      <input type="number" id="convA" placeholder="${conv.labelA[lang]}" oninput="runConverter()"/>
      ${conv.labelB ? `<input type="number" id="convB" placeholder="${conv.labelB[lang]}" oninput="runConverter()"/>` : ''}
      <div class="converter-result" id="convResult">-</div>
    </div>
  `;
}

function runConverter() {
  const conv = CONVERTERS[activeConverter];
  const result = conv.calc();
  const box = document.getElementById('convResult');
  box.textContent = result !== null ? `${result} ${conv.unit}` : '-';
}

// ── SUPPORT / DONATION WIDGET ────────────────────────────────────────────────
const SUPPORT_QUOTES = {
  fr: { text: "Celui qui ne remercie pas les gens ne remercie pas Dieu. Chaque geste de soutien, aussi modeste soit-il, honore le travail et l'effort qu'il represente.", cite: "Sagesse partagee" },
  en: { text: "Whoever does not thank people does not thank God. Every gesture of support, however modest, honors the work and effort it represents.", cite: "Shared wisdom" },
  ar: { text: "من لا يشكر الناس لا يشكر الله. كل بادرة دعم، مهما كانت متواضعة، تكرّم العمل والجهد الذي تمثله.", cite: "حكمة مشتركة" }
};
const DONATION_INFO = {
  ccp: { compte: '0040145075', cle: '84', nom: 'Zekraoui', prenom: 'Rabah Allaa Eddine' },
  baridimob: '00799999004014507584'
};

function injectSupportWidget() {
  if (document.getElementById('supportOverlay')) return;
  const overlay = document.createElement('div');
  overlay.className = 'support-overlay';
  overlay.id = 'supportOverlay';
  overlay.onclick = (e) => { if (e.target === overlay) toggleSupport(false); };
  overlay.innerHTML = `<div class="support-panel" id="supportPanel"></div>`;
  document.body.appendChild(overlay);
}

function renderSupportPanel() {
  const panel = document.getElementById('supportPanel');
  const lang = (typeof currentLang !== 'undefined') ? currentLang : 'fr';
  const t = (typeof LANG !== 'undefined' && LANG[lang]) ? LANG[lang] : {};
  const q = SUPPORT_QUOTES[lang] || SUPPORT_QUOTES.fr;
  panel.innerHTML = `
    <div class="support-header">
      <div>
        <div class="support-icon-badge">\uD83D\uDC9B</div>
        <div class="support-title">${t.support_title || 'Support this project'}</div>
      </div>
      <button class="inquiry-close" onclick="toggleSupport(false)">&times;</button>
    </div>
    <p class="support-sub">${t.support_sub || 'MicroLab Pro stays free, ad-free, and open for every student. If it helped you, a small contribution helps keep it maintained and growing.'}</p>
    <blockquote class="support-quote">${q.text}<cite>${q.cite}</cite></blockquote>
    <div class="support-method">
      <div class="support-method-label">\uD83D\uDCB3 CCP</div>
      <div class="support-row"><span class="support-row-key">${t.support_account || 'Compte'}</span><span class="support-row-val">${DONATION_INFO.ccp.compte}<button class="copy-btn" onclick="copySupportValue('${DONATION_INFO.ccp.compte}', this)">\u29C9</button></span></div>
      <div class="support-row"><span class="support-row-key">${t.support_key || 'Cle'}</span><span class="support-row-val">${DONATION_INFO.ccp.cle}</span></div>
      <div class="support-row"><span class="support-row-key">${t.support_name || 'Nom'}</span><span class="support-row-val" style="font-family:var(--font);font-weight:600;">${DONATION_INFO.ccp.nom} ${DONATION_INFO.ccp.prenom}</span></div>
    </div>
    <div class="support-method">
      <div class="support-method-label">\uD83D\uDCF1 BaridiMob</div>
      <div class="support-row"><span class="support-row-key">RIP</span><span class="support-row-val">${DONATION_INFO.baridimob}<button class="copy-btn" onclick="copySupportValue('${DONATION_INFO.baridimob}', this)">\u29C9</button></span></div>
    </div>
    <button class="support-close-btn" onclick="toggleSupport(false)">${t.support_close || 'Close'}</button>
  `;
}

function copySupportValue(value, btn) {
  navigator.clipboard?.writeText(value).then(() => {
    btn.classList.add('copied');
    btn.textContent = '\u2713';
    setTimeout(() => { btn.classList.remove('copied'); btn.innerHTML = '&#10697;'; }, 1500);
  }).catch(() => {});
}

function toggleSupport(force) {
  const overlay = document.getElementById('supportOverlay');
  if (!overlay) return;
  const shouldOpen = force !== undefined ? force : !overlay.classList.contains('open');
  overlay.classList.toggle('open', shouldOpen);
  document.body.style.overflow = shouldOpen ? 'hidden' : '';
  if (shouldOpen) renderSupportPanel();
}

// ── OTHER PROJECTS / WEBSITES ────────────────────────────────────────────────
const OTHER_SITES = [
  { name: 'LabPrepDz', url: 'https://intj-boy.github.io/LabPrepDz/' }, 
  { name: 'ExpoShare', url: 'https://intj-boy.github.io/ExpoShare/' }
  // Add up to 4 more entries here as future projects launch:
  // { name: 'ProjectName', url: 'https://example.com' }
];
const OTHER_SITES_MAX_SLOTS = 6;

function injectOtherSitesFooter() {
  const footer = document.querySelector('footer');
  if (!footer || footer.querySelector('.other-sites')) return;
  const lang = (typeof currentLang !== 'undefined') ? currentLang : 'fr';
  const t = (typeof LANG !== 'undefined' && LANG[lang]) ? LANG[lang] : {};
  const wrap = document.createElement('div');
  wrap.className = 'other-sites';
  const linksHtml = OTHER_SITES.map(s => `
    <a class="other-site-link" href="${s.url}" target="_blank" rel="noopener">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 3h7v7M21 3l-9 9M12 5H7a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5"/></svg>
      ${s.name}
    </a>`).join('');
  const emptySlots = Math.max(0, OTHER_SITES_MAX_SLOTS - OTHER_SITES.length);
  const slotsHtml = Array(emptySlots).fill('<span class="other-site-slot">+</span>').join('');
  wrap.innerHTML = `
    <div class="other-sites-title">${t.other_sites_title || 'More projects'}</div>
    <div class="other-sites-grid">${linksHtml}${slotsHtml}</div>
  `;
  footer.insertBefore(wrap, footer.querySelector('.footer-copy'));
}

function injectSupportButton() {
  const footer = document.querySelector('footer');
  if (!footer || footer.querySelector('.support-btn')) return;
  const lang = (typeof currentLang !== 'undefined') ? currentLang : 'fr';
  const t = (typeof LANG !== 'undefined' && LANG[lang]) ? LANG[lang] : {};
  let actionsRow = footer.querySelector('.footer-actions');
  if (!actionsRow) {
    actionsRow = document.createElement('div');
    actionsRow.className = 'footer-actions';
    const socialLink = footer.querySelector('.footer-social');
    if (socialLink) {
      footer.insertBefore(actionsRow, socialLink);
      actionsRow.appendChild(socialLink);
    } else {
      footer.appendChild(actionsRow);
    }
  }
  if (actionsRow.querySelector('.support-btn')) return;
  const btn = document.createElement('button');
  btn.className = 'support-btn';
  btn.onclick = () => toggleSupport();
  btn.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21s-6.7-4.3-9.3-8.2C.8 9.6 1.6 5.9 5 4.4c2-.9 4.2-.3 5.5 1.2l1.5 1.7 1.5-1.7c1.3-1.5 3.5-2.1 5.5-1.2 3.4 1.5 4.2 5.2 2.3 8.4C18.7 16.7 12 21 12 21z"/></svg><span>${t.support_btn || 'Support this project'}</span>`;
  actionsRow.appendChild(btn);
}

// ── DAILY QUIZ (6th feature: quick practice widget available on every page) ────
const DAILY_QUIZ_BANK = [
  { q:{fr:"Quel test differencie S. aureus des SCN ?",en:"Which test differentiates S. aureus from CoNS?",ar:"ما الاختبار الذي يميز S. aureus عن SCN؟"},
    opts:{fr:["Catalase","Coagulase","Oxydase"],en:["Catalase","Coagulase","Oxidase"],ar:["كاتالاز","كواغولاز","أوكسيداز"]}, correct:1 },
  { q:{fr:"Quelle temperature pour l'autoclave standard ?",en:"What temperature for standard autoclaving?",ar:"ما حرارة التعقيم القياسي بالأوتوكلاف؟"},
    opts:{fr:["100°C","121°C","160°C"],en:["100°C","121°C","160°C"],ar:["100°C","121°C","160°C"]}, correct:1 },
  { q:{fr:"Quel milieu est selectif pour Listeria ?",en:"Which medium is selective for Listeria?",ar:"أي وسط انتقائي لليستيريا؟"},
    opts:{fr:["Chapman","ALOA","TCBS"],en:["Chapman","ALOA","TCBS"],ar:["Chapman","ALOA","TCBS"]}, correct:1 },
  { q:{fr:"Que signifie m dans un plan d'echantillonnage ?",en:"What does m mean in a sampling plan?",ar:"ماذا تعني m في خطة أخذ العينات؟"},
    opts:{fr:["Seuil de rejet absolu","Seuil satisfaisant","Nombre d'echantillons"],en:["Absolute rejection limit","Satisfactory threshold","Number of samples"],ar:["حد الرفض المطلق","الحد المُرضي","عدد العينات"]}, correct:1 },
  { q:{fr:"Quel colorant est un mordant en coloration de Gram ?",en:"Which dye is a mordant in Gram staining?",ar:"أي صبغة تعمل كمثبت في صبغة غرام؟"},
    opts:{fr:["Safranine","Lugol","Fuchsine"],en:["Safranin","Lugol's iodine","Fuchsin"],ar:["سافرانين","لوغول","فوشين"]}, correct:1 },
  { q:{fr:"Quelle bacterie cause le cholera ?",en:"Which bacterium causes cholera?",ar:"أي بكتيريا تسبب الكوليرا؟"},
    opts:{fr:["Vibrio cholerae","Shigella sp.","Salmonella sp."],en:["Vibrio cholerae","Shigella sp.","Salmonella sp."],ar:["Vibrio cholerae","Shigella sp.","Salmonella sp."]}, correct:0 },
  { q:{fr:"Quel gaz est utilise pour l'atmosphere de Campylobacter ?",en:"Which gas mix is used for Campylobacter atmosphere?",ar:"أي مزيج غازي يُستخدم لجو Campylobacter؟"},
    opts:{fr:["100% O2","5% O2, 10% CO2","Azote pur"],en:["100% O2","5% O2, 10% CO2","Pure nitrogen"],ar:["100% O2","5% O2، 10% CO2","نيتروجين نقي"]}, correct:1 },
  { q:{fr:"Quelle enzyme confere resistance aux beta-lactamines chez Klebsiella ?",en:"Which enzyme confers beta-lactam resistance in Klebsiella?",ar:"أي إنزيم يمنح مقاومة البيتا-لاكتام في Klebsiella؟"},
    opts:{fr:["BLSE","Coagulase","Catalase"],en:["ESBL","Coagulase","Catalase"],ar:["BLSE","كواغولاز","كاتالاز"]}, correct:0 },
  { q:{fr:"Quel est le temps de contact typique de l'ethanol 70% ?",en:"What is the typical contact time for 70% ethanol?",ar:"ما زمن التماس النموذجي لإيثانول 70%؟"},
    opts:{fr:["1-2 min","10-30 min","1 heure"],en:["1-2 min","10-30 min","1 hour"],ar:["1-2 دقيقة","10-30 دقيقة","ساعة واحدة"]}, correct:0 },
  { q:{fr:"Quelle valeur mesure le temps de reduction decimale ?",en:"Which value measures the decimal reduction time?",ar:"أي قيمة تقيس زمن التخفيض العشري؟"},
    opts:{fr:["Valeur Z","Valeur D","Valeur F"],en:["Z-value","D-value","F-value"],ar:["القيمة Z","القيمة D","القيمة F"]}, correct:1 }
];
const DAILYQUIZ_KEY = 'mlp_dailyquiz_streak';
const DAILYQUIZ_DATE_KEY = 'mlp_dailyquiz_lastdate';
let dqCurrentIdx = null;

function getStreak() {
  return parseInt(localStorage.getItem(DAILYQUIZ_KEY) || '0', 10);
}
function bumpStreakIfNewDay() {
  const today = new Date().toDateString();
  const last = localStorage.getItem(DAILYQUIZ_DATE_KEY);
  if (last !== today) {
    const streak = last && isYesterday(last) ? getStreak() + 1 : 1;
    localStorage.setItem(DAILYQUIZ_KEY, String(streak));
    localStorage.setItem(DAILYQUIZ_DATE_KEY, today);
  }
}
function isYesterday(dateStr) {
  const d = new Date(dateStr);
  const y = new Date();
  y.setDate(y.getDate() - 1);
  return d.toDateString() === y.toDateString();
}

function pickDailyQuestion() {
  dqCurrentIdx = Math.floor(Math.random() * DAILY_QUIZ_BANK.length);
  return DAILY_QUIZ_BANK[dqCurrentIdx];
}

function injectDailyQuizWidget() {
  const fab = document.createElement('button');
  fab.className = 'dailyquiz-fab';
  fab.setAttribute('aria-label', 'Daily quiz');
  fab.innerHTML = '?';
  fab.onclick = () => toggleDailyQuiz();
  document.body.appendChild(fab);

  const overlay = document.createElement('div');
  overlay.className = 'dailyquiz-overlay';
  overlay.id = 'dailyquizOverlay';
  overlay.onclick = (e) => { if (e.target === overlay) toggleDailyQuiz(false); };
  overlay.innerHTML = `<div class="dailyquiz-panel" id="dailyquizPanel"></div>`;
  document.body.appendChild(overlay);
}

function toggleDailyQuiz(force) {
  const overlay = document.getElementById('dailyquizOverlay');
  if (!overlay) return;
  const shouldOpen = force !== undefined ? force : !overlay.classList.contains('open');
  overlay.classList.toggle('open', shouldOpen);
  if (shouldOpen) renderDailyQuiz();
}

function renderDailyQuiz() {
  const panel = document.getElementById('dailyquizPanel');
  const lang = (typeof currentLang !== 'undefined') ? currentLang : 'fr';
  const t = (typeof LANG !== 'undefined' && LANG[lang]) ? LANG[lang] : {};
  const item = pickDailyQuestion();
  const streak = getStreak();
  panel.innerHTML = `
    <div class="dailyquiz-header">
      <span class="dailyquiz-badge">${t.dq_badge || 'Quick Practice'}</span>
      <span class="dailyquiz-streak"><span class="flame">\uD83D\uDD25</span> ${streak} ${t.dq_streak || 'day streak'}</span>
    </div>
    <div class="dailyquiz-q">${item.q[lang]}</div>
    <div class="qcm-options">
      ${item.opts[lang].map((opt,i) => `<button class="qcm-opt" onclick="answerDailyQuiz(${i})">${opt}</button>`).join('')}
    </div>
    <div class="qcm-explain" id="dqExplain" style="margin-top:0.75rem;"></div>
  `;
}

function answerDailyQuiz(idx) {
  const item = DAILY_QUIZ_BANK[dqCurrentIdx];
  const lang = (typeof currentLang !== 'undefined') ? currentLang : 'fr';
  const t = (typeof LANG !== 'undefined' && LANG[lang]) ? LANG[lang] : {};
  const buttons = document.querySelectorAll('.dailyquiz-panel .qcm-opt');
  buttons.forEach((b,i) => {
    b.classList.add(i === item.correct ? 'correct' : (i === idx ? 'wrong' : ''));
    b.onclick = null;
  });
  if (idx === item.correct) bumpStreakIfNewDay();
  const explainEl = document.getElementById('dqExplain');
  explainEl.style.display = 'block';
  explainEl.innerHTML = (idx === item.correct ? (t.dq_correct || 'Correct!') : (t.dq_wrong || 'Not quite.')) +
    `<button class="dailyquiz-next" onclick="renderDailyQuiz()">${t.dq_next || 'Next question'} \u2192</button>`;
}

// ── PRINT EXPORT ─────────────────────────────────────────────────────────────
function printResult() {
  window.print();
}

// ── THEME TOGGLE ─────────────────────────────────────────────────────────────
const THEME_KEY = 'mlp_theme';

function getTheme() {
  return localStorage.getItem(THEME_KEY) || 'dark';
}
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(THEME_KEY, theme);
  document.querySelectorAll('.theme-toggle').forEach(btn => {
    btn.textContent = theme === 'light' ? '\u263E' : '\u2600';
    btn.setAttribute('title', theme === 'light' ? 'Dark mode' : 'Light mode');
  });
}
function toggleTheme() {
  applyTheme(getTheme() === 'light' ? 'dark' : 'light');
}
function injectThemeToggle() {
  const navRight = document.querySelector('.nav-right');
  if (!navRight || navRight.querySelector('.theme-toggle')) return;
  const btn = document.createElement('button');
  btn.className = 'theme-toggle';
  btn.setAttribute('aria-label', 'Toggle theme');
  btn.onclick = toggleTheme;
  navRight.insertBefore(btn, navRight.firstChild);
  applyTheme(getTheme());
}

// ── PRINTABLE CHEAT SHEETS ───────────────────────────────────────────────────
// Each tool page defines window.CHEATSHEET_DATA = { title, sections: [{heading, rows: [[..]], headers: [..]}] }
// before calling injectCheatSheetButton().
function buildCheatSheetHTML() {
  const data = window.CHEATSHEET_DATA;
  if (!data) return '';
  const lang = (typeof currentLang !== 'undefined') ? currentLang : 'fr';
  const dateStr = new Date().toLocaleDateString();
  let html = `<h1>MicroLab Pro &middot; ${data.title}</h1>`;
  data.sections.forEach(sec => {
    html += `<h2>${sec.heading}</h2><table><thead><tr>${sec.headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>`;
    sec.rows.forEach(row => {
      html += `<tr>${row.map(c=>`<td>${c}</td>`).join('')}</tr>`;
    });
    html += `</tbody></table>`;
  });
  html += `<div class="cs-footer">Zekraoui Rabah AllaaEddine \uD83E\uDD91 &copy; 2026 &middot; ${dateStr}</div>`;
  return html;
}
function printCheatSheet() {
  let page = document.getElementById('cheatsheetPage');
  if (!page) {
    page = document.createElement('div');
    page.id = 'cheatsheetPage';
    page.className = 'cheatsheet-page';
    document.body.appendChild(page);
  }
  page.innerHTML = buildCheatSheetHTML();
  document.body.classList.add('printing-cheatsheet');
  window.print();
  setTimeout(() => document.body.classList.remove('printing-cheatsheet'), 500);
}
function injectCheatSheetButton(targetSelector) {
  if (!window.CHEATSHEET_DATA) return;
  const target = document.querySelector(targetSelector);
  if (!target || target.querySelector('.cheatsheet-btn')) return;
  const t = (typeof LANG !== 'undefined' && LANG[currentLang]) ? LANG[currentLang] : {};
  const btn = document.createElement('button');
  btn.className = 'cheatsheet-btn';
  btn.innerHTML = `\uD83D\uDCC4 ${t.cheatsheet_btn || 'Print cheat sheet'}`;
  btn.onclick = printCheatSheet;
  target.appendChild(btn);
}

document.addEventListener('DOMContentLoaded', () => {
  injectFavoritesWidget();
  injectConverterWidget();
  injectThemeToggle();
  injectDailyQuizWidget();
  injectSupportWidget();
  injectSupportButton();
  injectOtherSitesFooter();
  const dateEl = document.getElementById('printDate');
  if (dateEl) dateEl.textContent = new Date().toLocaleDateString();
});
window.addEventListener('langchange', () => {
  const footer = document.querySelector('footer');
  if (footer) {
    footer.querySelectorAll('.support-btn, .other-sites').forEach(el => el.remove());
    injectSupportButton();
    injectOtherSitesFooter();
  }
});
