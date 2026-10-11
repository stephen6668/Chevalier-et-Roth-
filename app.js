
function openMenu(){document.getElementById('drawer')?.classList.add('open')}
function closeMenu(){document.getElementById('drawer')?.classList.remove('open')}
function updateCartCount(){const n=CRStore.cart().reduce((s,x)=>s+x.qty,0);document.querySelectorAll('[data-cart-count]').forEach(e=>e.textContent=n)}
function header(){
  document.body.insertAdjacentHTML('afterbegin',`
  <div class="topbar">DESIGNED IN LUXEMBOURG · PRODUCED IN ITALY · CHEVALIER & ROTH</div>
  <div class="launch-countdown" id="launchCountdown"><span class="launch-countdown-label">FIRST COLLECTION · 02.01.2027</span><span class="launch-countdown-time" id="launchCountdownTime">—</span><button type="button" onclick="openGiveawayIntro(true)">GIVEAWAY</button></div>
  <header class="header"><div class="header-inner">
    <nav class="nav"><a href="index.html">Home</a><a href="shop.html">Shop</a><a href="collections.html">Collections</a><a href="about.html">About</a><a href="contact.html">Contact</a></nav>
    <a class="brand" href="index.html"><img src="logo.PNG" alt="Chevalier & Roth logo"><span>CHEVALIER & ROTH</span></a>
    <nav class="nav right"><a href="search.html">Search</a><a href="account.html" id="accountLink">Account</a><a href="cart.html">Bag (<span data-cart-count>0</span>)</a></nav>
    <button class="burger" onclick="openMenu()" aria-label="Open menu">☰</button>
  </div></header>
  <div class="drawer" id="drawer"><button class="drawer-close" onclick="closeMenu()">×</button><nav class="drawer-nav">
    <a href="index.html">Home</a><a href="shop.html">Shop</a><a href="collections.html">Collections</a><a href="about.html">About</a><a href="contact.html">Contact</a><a href="search.html">Search</a><a href="account.html" id="accountLink">Account</a><a href="cart.html">Bag</a>
    <a href="impressum.html">Legal Notice</a><a href="datenschutz.html">Privacy</a><a href="cookies.html">Cookie Policy</a><a href="agb.html">Terms</a><a href="versand.html">Shipping</a><a href="zahlung.html">Payments</a><a href="widerruf.html">Returns</a><a href="admin.html">Admin</a>
  </nav></div>`);
  updateCartCount();
}
function footer(){
 document.body.insertAdjacentHTML('beforeend',`
 <footer class="footer"><div class="footer-grid">
  <div><h3>CHEVALIER & ROTH</h3><p style="color:#8f887f;line-height:1.8">Refined European wardrobe pieces designed in Luxembourg and produced in Italy.</p><small>© 2026 Chevalier & Roth</small></div>
  <div><h4>SHOP</h4><a href="shop.html">Shop</a><a href="collections.html">Collections</a><a href="search.html">Search</a></div>
  <div><h4>SERVICE</h4><a href="contact.html">Contact</a><a href="versand.html">Shipping</a><a href="zahlung.html">Payments</a><a href="widerruf.html">Returns</a><a href="agb.html#guarantee">Legal guarantee</a></div>
  <div><h4>COMPANY</h4><a href="about.html">Our Story</a><a href="account.html">Account</a><a href="giveaway-rules.html">Giveaway</a></div>
  <div><h4>LEGAL</h4><a href="impressum.html">Legal Notice</a><a href="datenschutz.html">Privacy</a><a href="cookies.html">Cookies</a><a href="agb.html">Terms</a></div>
 </div></footer>`);
}
function cookie(){
 if(CRStore.get('consent',null)!==null)return;
 document.body.insertAdjacentHTML('beforeend',`<div class="cookie show" id="cookie"><p>Only necessary local storage is used by default. Optional tracking must be added later and activated only after consent.</p><div><button class="btn light" onclick="consent(false)">DECLINE</button> <button class="btn" onclick="consent(true)">ACCEPT</button></div></div>`);
}
function consent(v){CRStore.set('consent',v);document.getElementById('cookie')?.remove()}
function productCard(p){
  const img=(p.images&&p.images[0])?CRStore.esc(p.images[0]):'';
  const soldOut=Number(p.stock||0)<=0;
  return `<article class="card ${soldOut?'is-sold-out':''}">
    <a href="product.html?id=${encodeURIComponent(p.id)}">
      <div class="card-media">
        ${img?`<img src="${img}" alt="${CRStore.esc(p.name)}" loading="eager" decoding="async" onerror="this.style.display='none';this.nextElementSibling.style.display='grid'"><div class="ph image-fallback" style="display:none">CR</div>`:`<div class="ph">CR</div>`}
        ${soldOut?'<div class="soldout-overlay">SOLD OUT</div>':''}
      </div>
      <div class="card-body">
        <div class="card-title">${CRStore.esc(p.name)}</div>
        <div class="meta"><span>${CRStore.esc(p.category)}</span><span class="price-stack"><b>${CRStore.money(CRStore.price(p))}</b><small>+ ${CRStore.vatPercent()}% VAT · ${CRStore.money(CRStore.grossFromNet(CRStore.price(p)))} total</small></span></div>
        ${soldOut?'<span class="badge soldout-badge">SOLD OUT</span>':(p.badge?`<span class="badge">${CRStore.esc(p.badge)}</span>`:'')}
      </div>
    </a>
    <div class="card-actions"><button class="btn light waitlist-btn" onclick="event.preventDefault();event.stopPropagation();openWaitlist('${p.id}')">JOIN WAITLIST</button></div>
  </article>`;
}
function renderProducts(target, filter=null, limit=999){
  const draw=()=>{
    let ps=CRStore.products().filter(p=>p.active);
    if(filter)ps=ps.filter(filter);
    const el=document.querySelector(target);
    if(el)el.innerHTML=ps.slice(0,limit).map(productCard).join('');
  };
  draw();
  if(window.CRCommerce){
    CRCommerce.syncProducts().then(draw).catch(()=>{});
  }
}
document.addEventListener('DOMContentLoaded',()=>{header();footer();ensureWaitlistModal();ensureGiveawayUI();startLaunchCountdown();updateCartCount();refreshAuthChrome();setTimeout(()=>openGiveawayIntro(false),350)});
window.addEventListener('cartchange',updateCartCount);

let _waitlistProduct=null;
async function refreshAuthChrome(){
  if(!window.CRAppwrite) return;
  const user=await CRAppwrite.currentUser();
  const a=document.getElementById('accountLink'),d=document.getElementById('drawerAccountLink');
  const label=user?(user.name||user.email||'Account'):'Account';
  if(a){a.textContent=label;a.title=user?user.email:'Login / Register'}
  if(d){d.textContent=user?'Account · '+label:'Account'}
}
function ensureWaitlistModal(){
  if(document.getElementById('waitlistModal')) return;
  document.body.insertAdjacentHTML('beforeend',`<div class="waitlist-modal" id="waitlistModal" role="dialog" aria-modal="true"><div class="waitlist-box"><button class="waitlist-close" onclick="closeWaitlist()">×</button><div class="eyebrow">CHEVALIER & ROTH</div><h2>Join the waitlist</h2><p class="waitlist-note" id="waitProductLabel"></p><div class="form-grid"><label class="field full"><span>Name</span><input id="waitName" autocomplete="name"></label><label class="field full"><span>Email</span><input id="waitEmail" type="email" autocomplete="email"></label><label class="field"><span>Size (optional)</span><input id="waitSize" placeholder="Optional"></label><label class="field"><span>Colour (optional)</span><input id="waitColor" placeholder="Optional"></label></div><p class="waitlist-note">No account is required. Enter your name and email to join. Size and colour are optional.</p><button class="btn" style="width:100%;margin-top:14px" onclick="submitWaitlist()">SAVE TO WAITLIST</button><div class="waitlist-msg" id="waitMsg"></div></div></div>`);
}
async function openWaitlist(productId){
  _waitlistProduct=CRStore.products().find(p=>p.id===productId); if(!_waitlistProduct)return;
  ensureWaitlistModal();
  waitProductLabel.textContent=_waitlistProduct.name;
  waitMsg.textContent='';waitSize.value='';waitColor.value='';
  const user=await CRAppwrite.currentUser();
  if(user){waitName.value=user.name||'';waitEmail.value=user.email||''}
  else {waitName.value='';waitEmail.value='';waitMsg.textContent=''}
  waitlistModal.classList.add('open');
}
function closeWaitlist(){document.getElementById('waitlistModal')?.classList.remove('open')}
async function submitWaitlist(){
  if(!_waitlistProduct)return;
  waitMsg.textContent='Wird gespeichert…';
  try{
    await CRAppwrite.addToWaitlist({productId:_waitlistProduct.id,productName:_waitlistProduct.name,name:waitName.value.trim(),email:waitEmail.value.trim(),size:waitSize.value.trim(),color:waitColor.value.trim()});
    waitMsg.textContent='Erfolgreich zur Warteliste hinzugefügt.';
    setTimeout(closeWaitlist,1200);
  }catch(e){waitMsg.textContent=e.message||'Fehler beim Speichern.'}
}


// =========================
// FIRST COLLECTION GIVEAWAY
// =========================
let _giveawayPrizeId='';
let _launchTimer=null;

function launchTarget(){
  return new Date(window.CRSiteConfig?.launchAt || '2027-01-02T00:00:00+01:00');
}

function giveawayIsOpen(){
  return Date.now() < launchTarget().getTime();
}

function startLaunchCountdown(){
  const el=document.getElementById('launchCountdownTime');
  if(!el)return;
  const tick=()=>{
    const ms=launchTarget().getTime()-Date.now();
    if(ms<=0){
      el.textContent='THE FIRST COLLECTION IS LIVE';
      document.getElementById('launchCountdown')?.classList.add('is-live');
      if(_launchTimer)clearInterval(_launchTimer);
      return;
    }
    const total=Math.floor(ms/1000);
    const days=Math.floor(total/86400);
    const hours=Math.floor((total%86400)/3600);
    const mins=Math.floor((total%3600)/60);
    const secs=total%60;
    el.textContent=`${days}D · ${String(hours).padStart(2,'0')}H · ${String(mins).padStart(2,'0')}M · ${String(secs).padStart(2,'0')}S`;
  };
  tick();
  _launchTimer=setInterval(tick,1000);
}

function ensureGiveawayUI(){
  if(document.getElementById('giveawayIntro'))return;
  document.body.insertAdjacentHTML('beforeend',`
    <div class="giveaway-modal giveaway-intro" id="giveawayIntro" role="dialog" aria-modal="true" aria-labelledby="giveawayIntroTitle">
      <div class="giveaway-intro-card">
        <button class="giveaway-x" onclick="closeGiveawayIntro()" aria-label="Schließen">×</button>
        <div class="giveaway-monogram">CR</div>
        <div class="eyebrow">CHEVALIER & ROTH · FIRST COLLECTION</div>
        <h2 id="giveawayIntroTitle">Win your chosen piece.</h2>
        <p>Wähle deinen Favoriten aus der ersten Collection. Die Verlosung wird am <b>02.01.2027</b> aufgelöst.</p>
        <button class="btn giveaway-primary" onclick="openGiveawayEntry()">JETZT TEILNEHMEN</button>
        <button class="giveaway-text-btn" onclick="closeGiveawayIntro()">Später ansehen</button>
      </div>
    </div>

    <div class="giveaway-modal" id="giveawayEntry" role="dialog" aria-modal="true" aria-labelledby="giveawayEntryTitle">
      <div class="giveaway-entry-card">
        <button class="giveaway-x" onclick="closeGiveawayEntry()" aria-label="Schließen">×</button>
        <div class="giveaway-entry-head">
          <div><div class="eyebrow">THE FIRST COLLECTION · GIVEAWAY</div><h2 id="giveawayEntryTitle">Choose your piece.</h2></div>
          <div class="giveaway-deadline"><span>DRAW</span><b>02.01.2027</b></div>
        </div>
        <p class="giveaway-lead">Klicke auf das Kleidungsstück, das du gewinnen möchtest, und trage danach deine Daten ein.</p>
        <div id="giveawayPrizeGrid" class="giveaway-prize-grid"></div>
        <form class="giveaway-form" onsubmit="event.preventDefault();submitGiveawayEntry()">
          <label class="field"><span>Vorname</span><input id="giveawayFirstName" autocomplete="given-name" required></label>
          <label class="field"><span>Nachname</span><input id="giveawayLastName" autocomplete="family-name" required></label>
          <label class="field full"><span>E-Mail</span><input id="giveawayEmail" type="email" autocomplete="email" required></label>
          <label class="giveaway-consent full"><input id="giveawayConsent" type="checkbox" required><span>Ich stimme der Speicherung meiner Angaben für die Durchführung des Gewinnspiels zu und akzeptiere die <a href="giveaway-rules.html" target="_blank">Teilnahmehinweise</a> sowie die <a href="datenschutz.html" target="_blank">Datenschutzhinweise</a>.</span></label>
          <div class="full"><button class="btn giveaway-submit" id="giveawaySubmitBtn">TEILNAHME ABSENDEN</button><div id="giveawayMsg" class="giveaway-msg"></div></div>
        </form>
      </div>
    </div>

    <button class="giveaway-fab" id="giveawayFab" onclick="openGiveawayIntro(true)" aria-label="Gewinnspiel öffnen"><span>CR</span><b>GIVEAWAY</b></button>
  `);
}

function openGiveawayIntro(force=false){
  ensureGiveawayUI();
  if(!giveawayIsOpen())return;
  if(!force && sessionStorage.getItem('cr_giveaway_intro_seen')==='1')return;
  document.getElementById('giveawayIntro')?.classList.add('open');
  if(!force)sessionStorage.setItem('cr_giveaway_intro_seen','1');
}
function closeGiveawayIntro(){document.getElementById('giveawayIntro')?.classList.remove('open')}
function closeGiveawayEntry(){document.getElementById('giveawayEntry')?.classList.remove('open')}

async function openGiveawayEntry(){
  closeGiveawayIntro();
  ensureGiveawayUI();
  if(!giveawayIsOpen())return;
  document.getElementById('giveawayEntry')?.classList.add('open');
  _giveawayPrizeId='';
  const msg=document.getElementById('giveawayMsg');if(msg)msg.textContent='';
  renderGiveawayPrizes();
  try{
    if(window.CRCommerce){await CRCommerce.syncProducts();renderGiveawayPrizes()}
  }catch(e){console.warn(e)}
  try{
    const user=window.CRAppwrite?await CRAppwrite.currentUser():null;
    if(user){
      const parts=String(user.name||'').trim().split(/\s+/);
      if(document.getElementById('giveawayFirstName') && !giveawayFirstName.value)giveawayFirstName.value=parts.shift()||'';
      if(document.getElementById('giveawayLastName') && !giveawayLastName.value)giveawayLastName.value=parts.join(' ');
      if(document.getElementById('giveawayEmail') && !giveawayEmail.value)giveawayEmail.value=user.email||'';
    }
  }catch(e){}
}

function renderGiveawayPrizes(){
  const grid=document.getElementById('giveawayPrizeGrid');if(!grid)return;
  const products=CRStore.products().filter(p=>p.active).slice(0,8);
  grid.innerHTML=products.length?products.map(p=>{
    const img=p.images?.[0]||'';
    return `<button type="button" class="giveaway-prize ${_giveawayPrizeId===p.id?'selected':''}" onclick="selectGiveawayPrize('${CRStore.esc(p.id)}')">
      <div class="giveaway-prize-media">${img?`<img src="${CRStore.esc(img)}" alt="${CRStore.esc(p.name)}">`:'<div class="giveaway-prize-placeholder">CR</div>'}<span>SELECT</span></div>
      <div class="giveaway-prize-copy"><b>${CRStore.esc(p.name)}</b><small>${CRStore.esc(p.category||'')}</small></div>
    </button>`;
  }).join(''):'<div class="giveaway-empty">Die Gewinn-Auswahl wird gerade vorbereitet.</div>';
}

function selectGiveawayPrize(id){
  _giveawayPrizeId=id;
  renderGiveawayPrizes();
}

async function submitGiveawayEntry(){
  const msg=document.getElementById('giveawayMsg');
  const btn=document.getElementById('giveawaySubmitBtn');
  if(!giveawayIsOpen()){if(msg)msg.textContent='Das Gewinnspiel ist bereits beendet.';return}
  const prize=CRStore.products().find(p=>p.id===_giveawayPrizeId);
  if(!prize){if(msg)msg.textContent='Bitte zuerst einen Gewinn auswählen.';return}
  if(!window.CRCommerce){if(msg)msg.textContent='Appwrite ist auf dieser Seite noch nicht verbunden.';return}
  btn.disabled=true;if(msg)msg.textContent='Teilnahme wird gespeichert…';
  try{
    await CRCommerce.createGiveawayEntry({
      firstName:giveawayFirstName.value,
      lastName:giveawayLastName.value,
      email:giveawayEmail.value,
      prizeId:prize.id,
      prizeName:prize.name,
      privacyAccepted:giveawayConsent.checked
    });
    if(msg)msg.textContent='Du bist dabei. Viel Glück!';
    localStorage.setItem('cr_giveaway_entered','1');
    giveawayFirstName.disabled=true;giveawayLastName.disabled=true;giveawayEmail.disabled=true;giveawayConsent.disabled=true;
    setTimeout(()=>{closeGiveawayEntry();},1800);
  }catch(e){
    console.error(e);
    if(msg)msg.textContent=e?.message||'Die Teilnahme konnte nicht gespeichert werden.';
  }finally{btn.disabled=false}
}
