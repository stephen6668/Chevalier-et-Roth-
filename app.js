/**
 * CHEVALIER & ROTH (CR) — LUXURY APPLICATION ENGINE
 * Features: High-Jewelry Logo Intro, Apple-grade Scroll Reveals, 
 * Cart & Modals, Appwrite & Stripe Integration
 */

// ==========================================
// 1. MAISON INTRO ANIMATION (SESSION-CONTROLLED)
// ==========================================
function initCRIntroAnimation() {
  const introSeen = sessionStorage.getItem('cr_intro_seen');
  
  // Create Intro DOM if it does not already exist
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
        <button type="button" class="intro-skip-btn" onclick="dismissCRIntro()">SKIP INTRO</button>
      </div>
    `;
    document.body.insertAdjacentHTML('afterbegin', introHTML);
  }

  const overlay = document.getElementById('crIntroOverlay');

  // If already viewed or prefers-reduced-motion, dismiss instantly
  if (introSeen === '1' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    if (overlay) overlay.style.display = 'none';
    return;
  }

  // Smooth exit after 2.6 seconds
  setTimeout(() => {
    dismissCRIntro();
  }, 2600);
}

function dismissCRIntro() {
  const overlay = document.getElementById('crIntroOverlay');
  if (!overlay) return;
  overlay.classList.add('hidden');
  sessionStorage.setItem('cr_intro_seen', '1');
  setTimeout(() => {
    overlay.style.display = 'none';
  }, 850);
}

// ==========================================
// 2. SCROLL REVEAL OBSERVER (APPLE-STYLE)
// ==========================================
function initScrollAnimations() {
  const revealElements = document.querySelectorAll('.reveal-fade-up, .card, .story-copy, .pillar-box');
  if (!('IntersectionObserver' in window)) {
    revealElements.forEach(el => el.classList.add('is-revealed'));
    return;
  }

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-revealed');
        obs.unobserve(entry.target);
      }
    });
  }, {
    rootMargin: '0px 0px -60px 0px',
    threshold: 0.12
  });

  revealElements.forEach(el => {
    el.classList.add('reveal-fade-up');
    observer.observe(el);
  });
}

// ==========================================
// 3. CORE NAVIGATION & SHELL
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
    <div class="topbar">DESIGNED IN LUXEMBOURG · CRAFTED IN ITALY · FIRST COLLECTION 02.01.2027</div>
    <section class="launch-countdown" id="launchCountdown">
      <div class="launch-countdown-inner">
        <div class="launch-countdown-copy">
          <span class="launch-kicker">FIRST COLLECTION · 02.01.2027</span>
          <strong>Collection Launch & Exklusives Giveaway</strong>
          <small>Offizieller Countdown zur ersten Edition & Ziehung der Gewinnerstücke.</small>
        </div>
        <div class="launch-countdown-time" id="launchCountdownTime" aria-live="polite"></div>
        <button type="button" class="launch-countdown-cta" onclick="openGiveawayIntro(true)">JETZT TEILNEHMEN</button>
      </div>
    </section>
    <header class="header">
      <div class="header-inner">
        <nav class="nav">
          <a href="index.html">Home</a>
          <a href="shop.html">Shop</a>
          <a href="collections.html">Collections</a>
          <a href="about.html">Maison</a>
          <a href="contact.html">Contact</a>
        </nav>
        <a class="brand" href="index.html">
          <img src="logo.PNG" alt="Chevalier & Roth Logo">
          <span>CHEVALIER & ROTH</span>
        </a>
        <nav class="nav right">
          <a href="search.html">Search</a>
          <a href="account.html" id="accountLink">Account</a>
          ${orderingEnabled() ? '<a href="cart.html">Bag (<span data-cart-count>0</span>)</a>' : '<span class="nav-launch-note">LAUNCH 02.01.2027</span>'}
        </nav>
        <button class="burger" onclick="openMenu()" aria-label="Menü öffnen">☰</button>
      </div>
    </header>
    <div class="drawer" id="drawer">
      <button class="drawer-close" onclick="closeMenu()" aria-label="Menü schließen">×</button>
      <nav class="drawer-nav">
        <a href="index.html">Home</a>
        <a href="shop.html">Shop</a>
        <a href="collections.html">Collections</a>
        <a href="about.html">Maison</a>
        <a href="contact.html">Contact</a>
        <a href="search.html">Search</a>
        <a href="account.html" id="drawerAccountLink">Account</a>
        ${orderingEnabled() ? '<a href="cart.html">Bag</a>' : '<span class="drawer-launch-note">LAUNCH 02.01.2027</span>'}
        <hr style="border:0;border-top:1px solid rgba(255,255,255,0.1);margin:15px 0">
        <a href="impressum.html" style="font-size:16px">Legal Notice</a>
        <a href="datenschutz.html" style="font-size:16px">Privacy</a>
        <a href="agb.html" style="font-size:16px">Terms</a>
        <a href="admin.html" style="font-size:16px">Admin</a>
      </nav>
    </div>
  `);
  updateCartCount();
}

function footer() {
  if (document.querySelector('.footer')) return;
  document.body.insertAdjacentHTML('beforeend', `
    <footer class="footer">
      <div class="footer-grid">
        <div>
          <h3>CHEVALIER & ROTH</h3>
          <p style="color:rgba(255,255,255,0.65);line-height:1.8;max-width:380px;font-size:13px;margin-bottom:16px">
            Refined European wardrobe pieces designed in Luxembourg and produced with sartorial perfection in Italy.
          </p>
          <small style="color:rgba(255,255,255,0.4)">© 2026 Chevalier & Roth. All rights reserved.</small>
        </div>
        <div>
          <h4>KOLLEKTION</h4>
          <a href="shop.html">Katalog</a>
          <a href="collections.html">Editionen</a>
          <a href="search.html">Suche</a>
        </div>
        <div>
          <h4>SERVICE</h4>
          <a href="contact.html">Kundenservice</a>
          <a href="versand.html">Versand & Logistik</a>
          <a href="zahlung.html">Zahlungsarten</a>
          <a href="widerruf.html">Rückgabe</a>
        </div>
        <div>
          <h4>MAISON</h4>
          <a href="about.html">Unsere Geschichte</a>
          <a href="account.html">Kundenkonto</a>
          <a href="giveaway-rules.html">Gewinnspielregeln</a>
        </div>
        <div>
          <h4>RECHTLICHES</h4>
          <a href="impressum.html">Impressum</a>
          <a href="datenschutz.html">Datenschutz</a>
          <a href="cookies.html">Cookie-Richtlinie</a>
          <a href="agb.html">AGB</a>
        </div>
      </div>
      <div class="footer-legal-bar">
        <span>LUXEMBOURG · MILAN · PARIS</span>
        <span>HÖCHSTE EUROPÄISCHE QUALITÄTSSTANDARDS</span>
      </div>
    </footer>
  `);
}

// ==========================================
// 4. PRODUCT CARDS & RENDERING
// ==========================================
function productCard(p) {
  const _imgCandidates = CRStore.productImageCandidatesForColor(p, 'Beige/Braun');
  const img = CRStore.esc(_imgCandidates[0] || '');
  const imgFallbacks = CRStore.esc(encodeURIComponent(JSON.stringify(_imgCandidates.slice(1))));
  const soldOut = orderingEnabled() && Number(p.stock || 0) <= 0;

  return `
    <article class="card ${soldOut ? 'is-sold-out' : ''}">
      <a href="product.html?id=${encodeURIComponent(p.id)}">
        <div class="card-media">
          ${img ? `<img src="${img}" data-cr-fallbacks="${imgFallbacks}" alt="${CRStore.esc(p.name)}" loading="lazy" decoding="async" onerror="if(!CRStore.tryNextImage(this)){this.style.display='none';this.nextElementSibling.style.display='grid'}"><div class="ph image-fallback" style="display:none">CR</div>` : `<div class="ph">CR</div>`}
          ${soldOut ? '<div class="soldout-overlay">SOLD OUT</div>' : ''}
        </div>
        <div class="card-body">
          <span class="card-category">${CRStore.esc(p.category)}</span>
          <div class="card-title">${CRStore.esc(p.name)}</div>
          <div class="meta">
            <div class="price-stack">
              <b>${CRStore.money(CRStore.price(p))}</b>
              <small>+ ${CRStore.vatPercent()}% VAT · ${CRStore.money(CRStore.grossFromNet(CRStore.price(p)))} total</small>
            </div>
            ${!orderingEnabled() ? '<span class="badge launch-badge">02.01.2027</span>' : (soldOut ? '<span class="badge soldout-badge">SOLD OUT</span>' : (p.badge ? `<span class="badge launch-badge">${CRStore.esc(p.badge)}</span>` : ''))}
          </div>
        </div>
      </a>
      <div class="card-actions">
        <button type="button" class="btn light" onclick="event.preventDefault();event.stopPropagation();openWaitlist('${p.id}')">JOIN WAITLIST</button>
      </div>
    </article>
  `;
}

function renderProducts(target, filter = null, limit = 999) {
  const draw = () => {
    let ps = CRStore.products().filter(p => p.active);
    if (filter) ps = ps.filter(filter);
    const el = document.querySelector(target);
    if (el) el.innerHTML = ps.slice(0, limit).map(productCard).join('');
    initScrollAnimations();
  };
  draw();
  if (window.CRCommerce) {
    CRCommerce.syncProducts().then(draw).catch(() => {});
  }
}

// ==========================================
// 5. COUNTDOWN ENGINE
// ==========================================
let _launchTimer = null;
function launchTarget() {
  return new Date(window.CRSiteConfig?.launchAt || '2027-01-02T00:00:00+01:00');
}
function giveawayIsOpen() {
  return Date.now() < launchTarget().getTime();
}
function countdownUnit(value, label) {
  return `<div class="countdown-unit"><b>${String(value).padStart(2, '0')}</b><span>${label}</span></div>`;
}
function startLaunchCountdown() {
  const el = document.getElementById('launchCountdownTime');
  if (!el) return;
  const tick = () => {
    const ms = launchTarget().getTime() - Date.now();
    if (ms <= 0) {
      el.innerHTML = `<div class="countdown-live">THE FIRST COLLECTION IS LIVE</div>`;
      document.getElementById('launchCountdown')?.classList.add('is-live');
      if (_launchTimer) clearInterval(_launchTimer);
      return;
    }
    const total = Math.floor(ms / 1000);
    const days = Math.floor(total / 86400);
    const hours = Math.floor((total % 86400) / 3600);
    const mins = Math.floor((total % 3600) / 60);
    const secs = total % 60;
    el.innerHTML = [
      countdownUnit(days, 'TAGE'),
      countdownUnit(hours, 'STD'),
      countdownUnit(mins, 'MIN'),
      countdownUnit(secs, 'SEK')
    ].join('');
  };
  tick();
  _launchTimer = setInterval(tick, 1000);
}

// ==========================================
// 6. WAITLIST & SET BUILDER MODALS
// ==========================================
let _waitlistProduct = null;
function ensureWaitlistModal() {
  if (document.getElementById('waitlistModal')) return;
  document.body.insertAdjacentHTML('beforeend', `
    <div class="waitlist-modal" id="waitlistModal" role="dialog" aria-modal="true" aria-labelledby="waitTitle">
      <div class="waitlist-box">
        <button class="waitlist-close" onclick="closeWaitlist()" aria-label="Schließen">×</button>
        <div class="eyebrow">CHEVALIER & ROTH · PRIVATKUNDEN</div>
        <h2 id="waitTitle">Join the Waitlist</h2>
        <p class="waitlist-note" id="waitProductLabel" style="font-size:14px;color:var(--cr-gold-dark);margin-bottom:12px;font-weight:600;"></p>
        <div class="form-grid">
          <label class="field full"><span>Name</span><input id="waitName" autocomplete="name" required></label>
          <label class="field full"><span>Email</span><input id="waitEmail" type="email" autocomplete="email" required></label>
          <label class="field"><span>Größe (optional)</span><input id="waitSize" placeholder="S, M, L, XL"></label>
          <label class="field"><span>Farbe (optional)</span><input id="waitColor" placeholder="Beige, Schwarz..."></label>
        </div>
        <p class="waitlist-note" style="margin-top:14px;font-size:12px;color:var(--cr-ink-tertiary)">Kein Konto erforderlich. Sie erhalten bei Verfügbarkeit eine priorisierte Einladung.</p>
        <button class="btn" style="width:100%;margin-top:18px" onclick="submitWaitlist()">EINTRAGEN</button>
        <div class="waitlist-msg" id="waitMsg" style="margin-top:12px;text-align:center;font-size:12px;"></div>
      </div>
    </div>
  `);
}

async function openWaitlist(productId) {
  _waitlistProduct = CRStore.products().find(p => p.id === productId);
  if (!_waitlistProduct) return;
  ensureWaitlistModal();
  document.getElementById('waitProductLabel').textContent = _waitlistProduct.name;
  document.getElementById('waitMsg').textContent = '';
  document.getElementById('waitSize').value = '';
  document.getElementById('waitColor').value = '';
  
  if (window.CRAppwrite) {
    const user = await CRAppwrite.currentUser();
    if (user) {
      document.getElementById('waitName').value = user.name || '';
      document.getElementById('waitEmail').value = user.email || '';
    }
  }
  document.getElementById('waitlistModal').classList.add('open');
}

function closeWaitlist() {
  document.getElementById('waitlistModal')?.classList.remove('open');
}

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
    msg.textContent = '✓ Erfolgreich auf die Warteliste gesetzt.';
    msg.style.color = '#3b7a42';
    setTimeout(closeWaitlist, 1400);
  } catch (e) {
    msg.textContent = e.message || 'Fehler beim Speichern.';
    msg.style.color = '#9a3c3c';
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
        <div class="set-builder-head">
          <div>
            <div class="eyebrow">MAISON ENSEMBLE</div>
            <h2 id="setBuilderTitle">Complete the Look</h2>
          </div>
          <div class="set-builder-price" style="text-align:right">
            <span style="font-size:10px;letter-spacing:0.2em;color:var(--cr-gold-dark);display:block">SET PREIS</span>
            <b id="setBuilderPrice" style="font-family:'Playfair Display',serif;font-size:32px;">—</b>
            <small id="setBuilderVat" style="display:block;color:var(--cr-ink-tertiary);font-size:11px"></small>
          </div>
        </div>
        <p style="color:var(--cr-ink-secondary);margin-bottom:24px">Wählen Sie für jedes Ensemble-Teil Ihre individuelle Größe und Farbe.</p>
        <div id="setBuilderItems" class="set-builder-items"></div>
        <button class="btn" id="setBuilderAdd" style="width:100%;margin-top:24px" onclick="addActiveSetToCart()">SET IN DEN WARENKORB</button>
        <div id="setBuilderMsg" style="margin-top:12px;text-align:center;font-size:13px"></div>
      </div>
    </div>
  `);
}

function closeSetBuilder() {
  document.getElementById('setBuilderModal')?.classList.remove('open');
}

async function openSetBuilder(bundleId) {
  if (!orderingEnabled()) {
    alert('Bestellungen sind vorerst deaktiviert. Die Kollektion startet am 02.01.2027.');
    return;
  }
  ensureSetUI();
  if (window.CRCommerce) { try { await CRCommerce.syncProducts(); } catch (e) {} }
  const bundle = CRStore.bundleById(bundleId);
  if (!bundle) return;
  const ps = CRStore.bundleProducts(bundle);
  if (ps.length !== bundle.componentIds.length) {
    alert('Das Set ist momentan noch nicht vollständig konfiguriert.');
    return;
  }
  _activeSetId = bundle.id;
  document.getElementById('setBuilderTitle').textContent = bundle.name;
  document.getElementById('setBuilderPrice').textContent = CRStore.money(bundle.price);
  document.getElementById('setBuilderVat').textContent = `+ ${CRStore.vatPercent()}% VAT · ${CRStore.money(CRStore.grossFromNet(bundle.price))} total`;
  
  const stock = CRStore.bundleStock(bundle);
  const btn = document.getElementById('setBuilderAdd');
  btn.disabled = stock <= 0;
  btn.textContent = stock <= 0 ? 'SET AUSVERKAUFT' : 'SET IN DEN WARENKORB';
  document.getElementById('setBuilderMsg').textContent = '';

  document.getElementById('setBuilderItems').innerHTML = ps.map((p, idx) => {
    const _cands = CRStore.productImageCandidatesForColor(p, 'Beige/Braun');
    const img = _cands[0] || '';
    return `
      <article class="set-builder-item" data-product-id="${CRStore.esc(p.id)}">
        <div class="set-builder-image">
          ${img ? `<img src="${CRStore.esc(img)}" alt="${CRStore.esc(p.name)}">` : ''}
        </div>
        <div class="set-builder-copy">
          <div class="eyebrow" style="margin-bottom:4px">PIECE ${idx + 1}</div>
          <h3 style="font-size:20px">${CRStore.esc(p.name)}</h3>
          <small style="color:var(--cr-ink-tertiary)">${p.stock > 0 ? p.stock + ' vorrätig' : 'Sold out'}</small>
          <label class="field"><span>Größe</span>
            <select class="set-size set-select">
              <option value="">Auswählen…</option>
              ${(p.sizes || []).map(s => `<option value="${CRStore.esc(s)}">${CRStore.esc(s)}</option>`).join('')}
            </select>
          </label>
          <label class="field"><span>Farbe</span>
            <select class="set-color set-select">
              <option value="">Auswählen…</option>
              ${(p.colors || []).map(c => `<option value="${CRStore.esc(c)}">${CRStore.esc(c)}</option>`).join('')}
            </select>
          </label>
        </div>
      </article>
    `;
  }).join('');

  document.getElementById('setBuilderModal').classList.add('open');
}

function addActiveSetToCart() {
  if (!orderingEnabled()) return;
  const bundle = CRStore.bundleById(_activeSetId);
  if (!bundle) return;
  const rows = [...document.querySelectorAll('#setBuilderItems .set-builder-item')];
  const components = rows.map(row => ({
    id: row.dataset.productId,
    size: row.querySelector('.set-size')?.value || '',
    color: row.querySelector('.set-color')?.value || ''
  }));
  if (components.some(x => !x.size || !x.color)) {
    document.getElementById('setBuilderMsg').textContent = 'Bitte für beide Teile Größe und Farbe auswählen.';
    return;
  }
  const stock = CRStore.bundleStock(bundle);
  if (stock <= 0) {
    document.getElementById('setBuilderMsg').textContent = 'Dieses Set ist leider vergriffen.';
    return;
  }
  const cart = CRStore.cart();
  const key = JSON.stringify(components);
  let item = cart.find(x => x.bundleId === bundle.id && JSON.stringify(x.components || []) === key);
  if (item) {
    if (item.qty >= stock) {
      document.getElementById('setBuilderMsg').textContent = 'Maximal verfügbarer Bestand erreicht.';
      return;
    }
    item.qty++;
  } else {
    cart.push({ id: `bundle:${bundle.id}`, bundleId: bundle.id, components, qty: 1 });
  }
  CRStore.saveCart(cart);
  document.getElementById('setBuilderMsg').textContent = '✓ Set erfolgreich hinzugefügt.';
  setTimeout(closeSetBuilder, 900);
}

function setCard(bundle) {
  const ps = CRStore.bundleProducts(bundle);
  const stock = CRStore.bundleStock(bundle);
  const imgs = ps.map(p => ({ p, c: CRStore.productImageCandidatesForColor(p, 'Beige/Braun') })).filter(x => x.c.length);

  return `
    <article class="set-shop-card">
      <div class="set-shop-images">
        ${imgs.map(({ p, c }) => `<div><img src="${CRStore.esc(c[0])}" alt="${CRStore.esc(p.name)}"></div>`).join('')}
      </div>
      <div class="set-shop-copy">
        <span class="eyebrow">COMPLETE ENSEMBLE</span>
        <h3>${CRStore.esc(bundle.name)}</h3>
        <p>${ps.map(p => CRStore.esc(p.name)).join(' + ')}</p>
        <div class="set-shop-price" style="margin-bottom:20px">
          <b>${CRStore.money(bundle.price)}</b>
          <small style="display:block;color:var(--cr-ink-tertiary)">+ ${CRStore.vatPercent()}% VAT · ${CRStore.money(CRStore.grossFromNet(bundle.price))} total</small>
        </div>
        <button class="btn" ${(!orderingEnabled() || stock <= 0) ? 'disabled' : ''} onclick="openSetBuilder('${bundle.id}')">
          ${!orderingEnabled() ? 'LAUNCH 02.01.2027' : (stock <= 0 ? 'SOLD OUT' : 'ENSEMBLE WÄHLEN')}
        </button>
      </div>
    </article>
  `;
}

function renderSetCards(target) {
  const el = document.querySelector(target);
  if (!el) return;
  el.innerHTML = CRStore.bundles().map(setCard).join('');
}

// ==========================================
// 7. GIVEAWAY SYSTEM (FIRST COLLECTION)
// ==========================================
let _giveawayPrizeId = '';
function ensureGiveawayUI() {
  if (document.getElementById('giveawayIntro')) return;
  document.body.insertAdjacentHTML('beforeend', `
    <div class="giveaway-modal" id="giveawayIntro" role="dialog" aria-modal="true">
      <div class="giveaway-intro-card">
        <button class="giveaway-x" onclick="closeGiveawayIntro()" aria-label="Schließen">×</button>
        <div class="eyebrow" style="color:var(--cr-gold-dark)">THE FIRST COLLECTION GIVEAWAY</div>
        <div class="intro-monogram" style="font-size:72px;margin:10px 0 16px;">CR</div>
        <h2>Gewinnen Sie Ihr Lieblingsstück.</h2>
        <p>Zum feierlichen Debüt von Chevalier & Roth verlosen wir ikonische Designs unserer Première-Kollektion. Folgen Sie uns auf TikTok & Instagram für die Teilnahmeberechtigung.</p>
        <div class="giveaway-actions">
          <button class="btn" style="min-width:240px" onclick="openGiveawayEntry()">JETZT TEILNEHMEN</button>
          <button type="button" class="btn light" style="margin-top:10px;border:0" onclick="closeGiveawayIntro()">Später</button>
        </div>
      </div>
    </div>

    <div class="giveaway-modal" id="giveawayEntry" role="dialog" aria-modal="true">
      <div class="giveaway-entry-card" style="width:min(900px,100%)">
        <button class="giveaway-x" onclick="closeGiveawayEntry()" aria-label="Schließen">×</button>
        <div class="set-builder-head">
          <div>
            <div class="eyebrow">FIRST COLLECTION · 02.01.2027</div>
            <h2>Wählen Sie Ihren Gewinn</h2>
          </div>
          <div style="text-align:right">
            <span style="font-size:9px;letter-spacing:0.2em;color:var(--cr-gold-dark)">ZIEHUNG</span>
            <b style="font-family:'Playfair Display',serif;font-size:24px;display:block">02.01.2027</b>
          </div>
        </div>
        <div id="giveawayPrizeGrid" style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin:20px 0;"></div>
        <form class="giveaway-form form-grid" onsubmit="event.preventDefault();submitGiveawayEntry()">
          <label class="field"><span>Vorname</span><input id="giveawayFirstName" required></label>
          <label class="field"><span>Nachname</span><input id="giveawayLastName" required></label>
          <label class="field full"><span>E-Mail</span><input id="giveawayEmail" type="email" required></label>
          <div class="full" style="background:#fff;border:1px solid var(--cr-line);padding:16px;margin:10px 0">
            <b style="font-size:10px;letter-spacing:0.2em;color:var(--cr-gold-dark);display:block;margin-bottom:8px">TEILNAHMEVORAUSSETZUNG</b>
            <label style="display:flex;gap:10px;align-items:center;font-size:12px;margin-bottom:6px">
              <input type="checkbox" id="giveawayTikTokFollow" required> Ich folge Chevalier & Roth auf TikTok.
            </label>
            <label style="display:flex;gap:10px;align-items:center;font-size:12px">
              <input type="checkbox" id="giveawayInstagramFollow" required> Ich folge Chevalier & Roth auf Instagram.
            </label>
          </div>
          <label class="full" style="display:flex;gap:10px;font-size:11px;color:var(--cr-ink-secondary)">
            <input type="checkbox" id="giveawayConsent" required>
            <span>Ich stimme der Speicherung meiner Daten zur Durchführung des Gewinnspiels gemäß der <a href="datenschutz.html" target="_blank" style="text-decoration:underline">Datenschutzerklärung</a> zu.</span>
          </label>
          <div class="full">
            <button class="btn" id="giveawaySubmitBtn" style="width:100%;margin-top:12px">TEILNAHME BESTÄTIGEN</button>
            <div id="giveawayMsg" style="text-align:center;font-size:12px;margin-top:12px"></div>
          </div>
        </form>
      </div>
    </div>
    <button class="giveaway-fab" id="giveawayFab" onclick="openGiveawayIntro(true)" aria-label="Gewinnspiel öffnen">
      <span>CR</span><b>GIVEAWAY</b>
    </button>
  `);
}

function openGiveawayIntro(force = false) {
  ensureGiveawayUI();
  if (!giveawayIsOpen()) return;
  if (!force && sessionStorage.getItem('cr_giveaway_intro_seen') === '1') return;
  document.getElementById('giveawayIntro')?.classList.add('open');
  if (!force) sessionStorage.setItem('cr_giveaway_intro_seen', '1');
}

function closeGiveawayIntro() { document.getElementById('giveawayIntro')?.classList.remove('open'); }
function closeGiveawayEntry() { document.getElementById('giveawayEntry')?.classList.remove('open'); }

function openGiveawayEntry() {
  closeGiveawayIntro();
  ensureGiveawayUI();
  if (!giveawayIsOpen()) return;
  document.getElementById('giveawayEntry')?.classList.add('open');
  renderGiveawayPrizes();
}

function renderGiveawayPrizes() {
  const grid = document.getElementById('giveawayPrizeGrid');
  if (!grid) return;
  const products = CRStore.products().slice(0, 3);
  grid.innerHTML = products.map(p => {
    const _cands = CRStore.productImageCandidatesForColor(p, 'Beige/Braun');
    const img = _cands[0] || '';
    return `
      <div style="border:1px solid ${_giveawayPrizeId === p.id ? 'var(--cr-gold)' : 'var(--cr-line)'};background:#fff;padding:12px;cursor:pointer;text-align:center" onclick="selectGiveawayPrize('${p.id}')">
        <div style="aspect-ratio:3/4;overflow:hidden;background:var(--cr-parchment);margin-bottom:8px">
          ${img ? `<img src="${img}" style="width:100%;height:100%;object-fit:cover" alt="${p.name}">` : ''}
        </div>
        <b style="font-family:'Playfair Display',serif;font-size:14px;display:block">${p.name}</b>
        <span style="font-size:9px;color:var(--cr-gold-dark);letter-spacing:0.16em">${_giveawayPrizeId === p.id ? '✓ AUSGEWÄHLT' : 'AUSWÄHLEN'}</span>
      </div>
    `;
  }).join('');
}

function selectGiveawayPrize(id) {
  _giveawayPrizeId = id;
  renderGiveawayPrizes();
}

async function submitGiveawayEntry() {
  const msg = document.getElementById('giveawayMsg');
  const btn = document.getElementById('giveawaySubmitBtn');
  if (!_giveawayPrizeId) {
    msg.textContent = 'Bitte wählen Sie zuerst Ihr gewünschtes Kleidungsstück aus.';
    return;
  }
  btn.disabled = true;
  msg.textContent = 'Teilnahme wird gespeichert…';
  try {
    const prize = CRStore.products().find(p => p.id === _giveawayPrizeId);
    await CRCommerce.createGiveawayEntry({
      firstName: document.getElementById('giveawayFirstName').value.trim(),
      lastName: document.getElementById('giveawayLastName').value.trim(),
      email: document.getElementById('giveawayEmail').value.trim(),
      prizeId: prize.id,
      prizeName: prize.name,
      privacyAccepted: document.getElementById('giveawayConsent').checked
    });
    msg.textContent = '✓ Vielen Dank! Ihre Teilnahme wurde erfolgreich registriert.';
    msg.style.color = '#3b7a42';
    setTimeout(closeGiveawayEntry, 1600);
  } catch (err) {
    msg.textContent = err.message || 'Teilnahme fehlgeschlagen.';
    msg.style.color = '#9a3c3c';
  } finally {
    btn.disabled = false;
  }
}

async function refreshAuthChrome() {
  if (!window.CRAppwrite) return;
  const user = await CRAppwrite.currentUser();
  const a = document.getElementById('accountLink');
  const d = document.getElementById('drawerAccountLink');
  const label = user ? (user.name || user.email || 'Account') : 'Account';
  if (a) a.textContent = label;
  if (d) d.textContent = user ? `Account (${label})` : 'Account';
}

// ==========================================
// 8. LIFECYCLE INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  initCRIntroAnimation();
  header();
  footer();
  ensureWaitlistModal();
  ensureSetUI();
  ensureGiveawayUI();
  startLaunchCountdown();
  updateCartCount();
  refreshAuthChrome();
  initScrollAnimations();
  setTimeout(() => openGiveawayIntro(false), 800);
});

window.addEventListener('cartchange', updateCartCount);
