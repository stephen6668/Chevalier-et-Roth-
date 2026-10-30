/**
 * CHEVALIER & ROTH (CR) — APPLE STORE EXPERIENCE ENGINE
 * Features: Apple-Style Product Stages, Realtime Color Swapping, 
 * Logo Splash Intro, Waitlist & Giveaway Integration
 */

// ==========================================
// 1. CR LOGO INTRO (PRESERVED)
// ==========================================
function initCRIntroAnimation() {
  const introSeen = sessionStorage.getItem('cr_intro_seen');
  
  if (!document.getElementById('crIntroOverlay')) {
    const introHTML = `
      <div id="crIntroOverlay" role="dialog" aria-modal="true" aria-label="Chevalier & Roth Welcome">
        <div class="intro-halo"></div>
        <div class="intro-content">
          <div class="intro-monogram">CR</div>
          <div class="intro-brand">CHEVALIER & ROTH</div>
          <div class="intro-provenance">HAUTE COUTURE · LUXEMBOURG & MILANO</div>
          <div class="intro-line"></div>
        </div>
        <button type="button" class="intro-skip-btn" onclick="dismissCRIntro()">ÜBERSPRINGEN</button>
      </div>
    `;
    document.body.insertAdjacentHTML('afterbegin', introHTML);
  }

  const overlay = document.getElementById('crIntroOverlay');
  if (introSeen === '1' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    if (overlay) overlay.style.display = 'none';
    return;
  }

  setTimeout(() => { dismissCRIntro(); }, 2400);
}

function dismissCRIntro() {
  const overlay = document.getElementById('crIntroOverlay');
  if (!overlay) return;
  overlay.classList.add('hidden');
  sessionStorage.setItem('cr_intro_seen', '1');
  setTimeout(() => { overlay.style.display = 'none'; }, 800);
}

// ==========================================
// 2. APPLE-GRADE STAGE COLOR SWITCHER
// ==========================================
function switchStageColor(stageId, productId, colorName, dotElement) {
  const imgEl = document.getElementById(`stage-img-${stageId}`);
  if (!imgEl) return;
  
  const product = CRStore.products().find(p => p.id === productId);
  if (!product) return;

  const candidates = CRStore.productImageCandidatesForColor(product, colorName);
  if (candidates.length && candidates[0]) {
    imgEl.style.opacity = '0.4';
    imgEl.style.transform = 'scale(0.98)';
    
    setTimeout(() => {
      imgEl.src = candidates[0];
      imgEl.style.opacity = '1';
      imgEl.style.transform = 'scale(1)';
    }, 150);
  }

  // Update active dot in stage
  const picker = dotElement.closest('.stage-color-picker');
  if (picker) {
    picker.querySelectorAll('.color-dot').forEach(dot => dot.classList.remove('active'));
    dotElement.classList.add('active');
  }
}

// ==========================================
// 3. APPLE STORE NAVIGATION & FOOTER
// ==========================================
function openMenu() { document.getElementById('drawer')?.classList.add('open'); }
function closeMenu() { document.getElementById('drawer')?.classList.remove('open'); }

function updateCartCount() {
  const n = CRStore.cart().reduce((s, x) => s + x.qty, 0);
  document.querySelectorAll('[data-cart-count]').forEach(e => e.textContent = n);
}

function orderingEnabled() {
  return window.CRSiteConfig?.orderingEnabled === true;
}

function header() {
  if (document.querySelector('.header')) return;
  document.body.insertAdjacentHTML('afterbegin', `
    <div class="topbar">
      <span>Die erste Kollektion öffnet am 02.01.2027.</span>
      <a href="javascript:void(0)" onclick="openGiveawayIntro(true)">Jetzt am offiziellen Maison Giveaway teilnehmen &gt;</a>
    </div>
    <header class="header">
      <div class="header-inner">
        <a class="brand" href="index.html">
          <img src="logo.PNG" alt="CR Logo">
          <span>CHEVALIER & ROTH</span>
        </a>
        <nav class="nav">
          <a href="index.html">Übersicht</a>
          <a href="shop.html">Store</a>
          <a href="product.html?id=p1">Half-Zip</a>
          <a href="product.html?id=p2">Trouser</a>
          <a href="product.html?id=p3">Bodysuit</a>
          <a href="about.html">Maison</a>
          <a href="contact.html">Concierge</a>
        </nav>
        <div style="display:flex;align-items:center;gap:18px">
          <a href="account.html" id="accountLink" style="font-size:12px;opacity:0.8">Account</a>
          ${orderingEnabled() ? '<a href="cart.html" class="nav-pill">Tasche (<span data-cart-count>0</span>)</a>' : '<span class="nav-pill">02.01.2027</span>'}
          <button class="burger" onclick="openMenu()" aria-label="Menü">☰</button>
        </div>
      </div>
    </header>
    <div class="drawer" id="drawer">
      <button class="drawer-close" onclick="closeMenu()">×</button>
      <nav class="drawer-nav">
        <a href="index.html">Übersicht</a>
        <a href="shop.html">Kollektion</a>
        <a href="product.html?id=p1">Heritage Half-Zip</a>
        <a href="product.html?id=p2">Tailored Trouser</a>
        <a href="product.html?id=p3">Maison Bodysuit</a>
        <a href="about.html">Über die Maison</a>
        <a href="account.html" id="drawerAccountLink">Kundenkonto</a>
        ${orderingEnabled() ? '<a href="cart.html">Einkaufstasche</a>' : ''}
        <hr style="border:0;border-top:1px solid #e5e5ea;margin:10px 0">
        <a href="impressum.html" style="font-size:14px;color:#86868b">Impressum</a>
        <a href="datenschutz.html" style="font-size:14px;color:#86868b">Datenschutz</a>
        <a href="agb.html" style="font-size:14px;color:#86868b">AGB</a>
      </nav>
    </div>
  `);
  updateCartCount();
}

function footer() {
  if (document.querySelector('.apple-footer')) return;
  document.body.insertAdjacentHTML('beforeend', `
    <footer class="apple-footer">
      <div class="apple-footer-inner">
        <div class="footer-disclaimer">
          1. Alle Preise sind Nettopreise vor Mehrwertsteuer. Bei Bestellabschluss wird die gesetzliche Mehrwertsteuer von 17 % automatisch hinzugerechnet.
          Die Erstkollektion wird am 02.01.2027 offiziell für Bestellungen freigegeben. Jedes Kleidungsstück wird in handwerklicher Perfektion in Italien gefertigt.
        </div>
        <div class="footer-nav-grid">
          <div class="footer-col">
            <h4>Kollektion</h4>
            <a href="product.html?id=p1">Heritage Half-Zip</a>
            <a href="product.html?id=p2">Tailored Trouser</a>
            <a href="product.html?id=p3">Maison Bodysuit</a>
            <a href="shop.html">Alle Teile ansehen</a>
          </div>
          <div class="footer-col">
            <h4>Maison</h4>
            <a href="about.html">Unsere Geschichte</a>
            <a href="contact.html">Concierge-Service</a>
            <a href="giveaway-rules.html">Giveaway Teilnahme</a>
          </div>
          <div class="footer-col">
            <h4>Konto & Service</h4>
            <a href="account.html">Kundenkonto</a>
            <a href="versand.html">Versandinformationen</a>
            <a href="zahlung.html">Zahlungsarten</a>
            <a href="widerruf.html">Rückgaberecht</a>
          </div>
          <div class="footer-col">
            <h4>Rechtliches</h4>
            <a href="impressum.html">Impressum</a>
            <a href="datenschutz.html">Datenschutz</a>
            <a href="cookies.html">Cookie-Richtlinie</a>
            <a href="agb.html">AGB</a>
          </div>
        </div>
        <div class="footer-bottom">
          <span>Copyright © 2026 Chevalier & Roth. Alle Rechte vorbehalten. Luxembourg & Milano.</span>
          <span>Designed in Luxembourg · Crafted in Italy</span>
        </div>
      </div>
    </footer>
  `);
}

// ==========================================
// 4. WAITLIST & MODALS
// ==========================================
let _waitlistProduct = null;
function ensureWaitlistModal() {
  if (document.getElementById('waitlistModal')) return;
  document.body.insertAdjacentHTML('beforeend', `
    <div class="waitlist-modal" id="waitlistModal" role="dialog" aria-modal="true">
      <div class="waitlist-box">
        <button class="waitlist-close" onclick="closeWaitlist()" aria-label="Schließen">×</button>
        <span class="stage-eyebrow" style="font-size:11px">PRIORITÄTSZUGANG</span>
        <h2 style="font-size:28px;margin-bottom:8px">Auf die Warteliste</h2>
        <p style="font-size:15px;color:var(--apple-ink-secondary)" id="waitProductLabel"></p>
        <div class="form-grid">
          <label class="field full"><span>Name</span><input id="waitName" autocomplete="name" required></label>
          <label class="field full"><span>E-Mail</span><input id="waitEmail" type="email" autocomplete="email" required></label>
          <label class="field"><span>Größe (optional)</span><input id="waitSize" placeholder="S, M, L..."></label>
          <label class="field"><span>Farbe (optional)</span><input id="waitColor" placeholder="Beige, Schwarz..."></label>
        </div>
        <button class="btn dark-pill" style="width:100%;margin-top:20px" onclick="submitWaitlist()">EINTRAGEN</button>
        <div id="waitMsg" style="margin-top:12px;font-size:13px;text-align:center"></div>
      </div>
    </div>
  `);
}

async function openWaitlist(productId) {
  _waitlistProduct = CRStore.products().find(p => p.id === productId);
  if (!_waitlistProduct) return;
  ensureWaitlistModal();
  document.getElementById('waitProductLabel').textContent = `${_waitlistProduct.name} — Reservierung für die Erstkollektion.`;
  document.getElementById('waitMsg').textContent = '';
  document.getElementById('waitlistModal').classList.add('open');
}

function closeWaitlist() { document.getElementById('waitlistModal')?.classList.remove('open'); }

async function submitWaitlist() {
  if (!_waitlistProduct) return;
  const msg = document.getElementById('waitMsg');
  msg.textContent = 'Speichere in Appwrite…';
  try {
    await CRAppwrite.addToWaitlist({
      productId: _waitlistProduct.id,
      productName: _waitlistProduct.name,
      name: document.getElementById('waitName').value.trim(),
      email: document.getElementById('waitEmail').value.trim(),
      size: document.getElementById('waitSize').value.trim(),
      color: document.getElementById('waitColor').value.trim()
    });
    msg.textContent = '✓ Erfolgreich vorgemerkt. Sie erhalten als Erste Bescheid.';
    msg.style.color = '#1b7d34';
    setTimeout(closeWaitlist, 1500);
  } catch (e) {
    msg.textContent = e.message || 'Fehler beim Speichern.';
    msg.style.color = '#c53929';
  }
}

// Complete the look Set Builder
let _activeSetId = '';
function ensureSetUI() {
  if (document.getElementById('setBuilderModal')) return;
  document.body.insertAdjacentHTML('beforeend', `
    <div class="set-builder-modal" id="setBuilderModal" role="dialog" aria-modal="true">
      <div class="set-builder-card">
        <button class="giveaway-x" onclick="closeSetBuilder()" aria-label="Schließen">×</button>
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px">
          <div>
            <span class="stage-eyebrow">ENSEMBLE CONFIGURATOR</span>
            <h2 id="setBuilderTitle" style="font-size:32px">The Set</h2>
          </div>
          <div style="text-align:right">
            <span style="font-size:11px;color:var(--apple-ink-tertiary)">SET PREIS</span>
            <div id="setBuilderPrice" style="font-size:28px;font-weight:600"></div>
          </div>
        </div>
        <div id="setBuilderItems" style="display:grid;grid-template-columns:1fr 1fr;gap:20px"></div>
        <button class="btn dark-pill" id="setBuilderAdd" style="width:100%;margin-top:24px" onclick="addActiveSetToCart()">ENSEMBLE WÄHLEN</button>
        <div id="setBuilderMsg" style="text-align:center;font-size:13px;margin-top:10px"></div>
      </div>
    </div>
  `);
}

function closeSetBuilder() { document.getElementById('setBuilderModal')?.classList.remove('open'); }

async function openSetBuilder(bundleId) {
  ensureSetUI();
  const bundle = CRStore.bundleById(bundleId);
  if (!bundle) return;
  const ps = CRStore.bundleProducts(bundle);
  _activeSetId = bundle.id;
  document.getElementById('setBuilderTitle').textContent = bundle.name;
  document.getElementById('setBuilderPrice').textContent = CRStore.money(bundle.price);
  
  document.getElementById('setBuilderItems').innerHTML = ps.map((p, idx) => {
    const cands = CRStore.productImageCandidatesForColor(p, 'Beige/Braun');
    return `
      <div class="set-item" data-product-id="${p.id}" style="background:var(--apple-canvas);padding:20px;border-radius:16px">
        <div style="aspect-ratio:3/4;overflow:hidden;background:#fff;border-radius:10px;margin-bottom:12px">
          <img src="${cands[0]||''}" style="width:100%;height:100%;object-fit:cover">
        </div>
        <b>${p.name}</b>
        <label class="field" style="margin-top:8px"><span>Größe</span>
          <select class="set-size">${(p.sizes||[]).map(s=>`<option value="${s}">${s}</option>`).join('')}</select>
        </label>
        <label class="field" style="margin-top:8px"><span>Farbe</span>
          <select class="set-color">${(p.colors||[]).map(c=>`<option value="${c}">${c}</option>`).join('')}</select>
        </label>
      </div>
    `;
  }).join('');
  document.getElementById('setBuilderModal').classList.add('open');
}

function addActiveSetToCart() {
  if (!orderingEnabled()) {
    alert('Bestellungen öffnen am 02.01.2027.');
    return;
  }
}

// ==========================================
// 5. GIVEAWAY LOGIC (FIRST COLLECTION)
// ==========================================
let _giveawayPrizeId = 'p1';
function ensureGiveawayUI() {
  if (document.getElementById('giveawayIntro')) return;
  document.body.insertAdjacentHTML('beforeend', `
    <div class="giveaway-modal" id="giveawayIntro" role="dialog" aria-modal="true">
      <div class="giveaway-intro-card" style="text-align:center">
        <button class="giveaway-x" onclick="closeGiveawayIntro()" aria-label="Schließen">×</button>
        <span class="stage-eyebrow">MAISON GIVEAWAY</span>
        <h2 style="font-size:36px;margin:8px 0 14px">Gewinne dein Wunschstück.</h2>
        <p style="font-size:16px;color:var(--apple-ink-secondary);margin-bottom:28px">Zum Start der ersten Kollektion verlosen wir die ersten gefertigten Stücke aus Italien. Wähle dein Lieblingsstück.</p>
        <div class="apple-btn-group" style="justify-content:center">
          <button class="btn gold-pill" onclick="openGiveawayEntry()">JETZT TEILNEHMEN</button>
          <button class="btn light" onclick="closeGiveawayIntro()">Später</button>
        </div>
      </div>
    </div>

    <div class="giveaway-modal" id="giveawayEntry" role="dialog" aria-modal="true">
      <div class="giveaway-entry-card">
        <button class="giveaway-x" onclick="closeGiveawayEntry()" aria-label="Schließen">×</button>
        <span class="stage-eyebrow">FIRST COLLECTION · 02.01.2027</span>
        <h2 style="font-size:32px;margin:6px 0 18px">Wähle dein Wunschdesign</h2>
        <div id="giveawayPrizeGrid" style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:24px"></div>
        <form class="form-grid" onsubmit="event.preventDefault();submitGiveawayEntry()">
          <label class="field"><span>Vorname</span><input id="giveawayFirstName" required></label>
          <label class="field"><span>Nachname</span><input id="giveawayLastName" required></label>
          <label class="field full"><span>E-Mail</span><input id="giveawayEmail" type="email" required></label>
          <div class="full" style="background:var(--apple-canvas);padding:16px;border-radius:12px;font-size:13px">
            <label style="display:flex;gap:10px;align-items:center;margin-bottom:8px">
              <input type="checkbox" id="giveawayTikTokFollow" required> Ich folge Chevalier & Roth auf TikTok.
            </label>
            <label style="display:flex;gap:10px;align-items:center">
              <input type="checkbox" id="giveawayInstagramFollow" required> Ich folge Chevalier & Roth auf Instagram.
            </label>
          </div>
          <button class="btn dark-pill full" id="giveawaySubmitBtn" style="margin-top:12px">TEILNAHME BESTÄTIGEN</button>
          <div id="giveawayMsg" class="full" style="text-align:center;font-size:13px;margin-top:8px"></div>
        </form>
      </div>
    </div>
    <button class="giveaway-fab" onclick="openGiveawayIntro(true)"><span>CR</span><b>GIVEAWAY</b></button>
  `);
}

function openGiveawayIntro(force = false) {
  ensureGiveawayUI();
  if (!force && sessionStorage.getItem('cr_giveaway_intro_seen') === '1') return;
  document.getElementById('giveawayIntro')?.classList.add('open');
  if (!force) sessionStorage.setItem('cr_giveaway_intro_seen', '1');
}

function closeGiveawayIntro() { document.getElementById('giveawayIntro')?.classList.remove('open'); }
function closeGiveawayEntry() { document.getElementById('giveawayEntry')?.classList.remove('open'); }

function openGiveawayEntry() {
  closeGiveawayIntro();
  ensureGiveawayUI();
  document.getElementById('giveawayEntry')?.classList.add('open');
  const grid = document.getElementById('giveawayPrizeGrid');
  const ps = CRStore.products().slice(0, 3);
  grid.innerHTML = ps.map(p => {
    const cands = CRStore.productImageCandidatesForColor(p, 'Beige/Braun');
    const selected = _giveawayPrizeId === p.id;
    return `
      <div onclick="_giveawayPrizeId='${p.id}';openGiveawayEntry()" style="border:2px solid ${selected?'#0071e3':'var(--apple-hairline)'};border-radius:14px;padding:12px;text-align:center;cursor:pointer;background:#fff">
        <div style="aspect-ratio:3/4;overflow:hidden;border-radius:8px;background:var(--apple-canvas);margin-bottom:8px">
          <img src="${cands[0]||''}" style="width:100%;height:100%;object-fit:cover">
        </div>
        <b style="font-size:14px;display:block">${p.name}</b>
        <span style="font-size:11px;color:${selected?'#0071e3':'#86868b'}">${selected?'✓ Ausgewählt':'Wählen'}</span>
      </div>
    `;
  }).join('');
}

async function submitGiveawayEntry() {
  const msg = document.getElementById('giveawayMsg');
  const btn = document.getElementById('giveawaySubmitBtn');
  btn.disabled = true;
  msg.textContent = 'Speichere Teilnahme in Appwrite…';
  try {
    const p = CRStore.products().find(x => x.id === _giveawayPrizeId);
    await CRCommerce.createGiveawayEntry({
      firstName: document.getElementById('giveawayFirstName').value.trim(),
      lastName: document.getElementById('giveawayLastName').value.trim(),
      email: document.getElementById('giveawayEmail').value.trim(),
      prizeId: p.id,
      prizeName: p.name,
      privacyAccepted: true
    });
    msg.textContent = '✓ Erfolgreich registriert! Viel Glück bei der Auslosung am 02.01.2027.';
    msg.style.color = '#1b7d34';
    setTimeout(closeGiveawayEntry, 1800);
  } catch (e) {
    msg.textContent = e.message || 'Fehler beim Absenden.';
    msg.style.color = '#c53929';
  } finally {
    btn.disabled = false;
  }
}

// Launch countdown
let _launchTimer = null;
function startLaunchCountdown() {
  const el = document.getElementById('launchCountdownTime');
  if (!el) return;
  const target = new Date('2027-01-02T00:00:00+01:00').getTime();
  const tick = () => {
    const diff = target - Date.now();
    if (diff <= 0) { el.textContent = 'DIE KOLLEKTION IST LIVE'; return; }
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    el.innerHTML = `
      <div class="countdown-unit"><b>${d}</b><span>Tage</span></div>
      <div class="countdown-unit"><b>${h}</b><span>Std</span></div>
      <div class="countdown-unit"><b>${m}</b><span>Min</span></div>
      <div class="countdown-unit"><b>${s}</b><span>Sek</span></div>
    `;
  };
  tick();
  _launchTimer = setInterval(tick, 1000);
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  initCRIntroAnimation();
  header();
  footer();
  ensureWaitlistModal();
  ensureSetUI();
  ensureGiveawayUI();
  startLaunchCountdown();
  updateCartCount();
  setTimeout(() => openGiveawayIntro(false), 800);
});
