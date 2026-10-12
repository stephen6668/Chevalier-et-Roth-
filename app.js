
function openMenu(){document.getElementById('drawer')?.classList.add('open')}
function closeMenu(){document.getElementById('drawer')?.classList.remove('open')}
function updateCartCount(){const n=CRStore.cart().reduce((s,x)=>s+x.qty,0);document.querySelectorAll('[data-cart-count]').forEach(e=>e.textContent=n)}
function orderingEnabled(){return window.CRSiteConfig?.orderingEnabled===true}
function header(){
  document.body.insertAdjacentHTML('afterbegin',`
  <div class="topbar">DESIGNED IN LUXEMBOURG · PRODUCED IN ITALY · CHEVALIER & ROTH</div>
  <section class="launch-countdown" id="launchCountdown">
    <div class="launch-countdown-inner">
      <div class="launch-countdown-copy">
        <span class="launch-kicker">FIRST COLLECTION · 02.01.2027</span>
        <strong>Collection launch & giveaway ending soon</strong>
        <small>Live countdown until the first collection release and giveaway draw.</small>
      </div>
      <div class="launch-countdown-time" id="launchCountdownTime" aria-live="polite"></div>
      <button type="button" class="launch-countdown-cta" onclick="openGiveawayIntro(true)">JETZT TEILNEHMEN</button>
    </div>
  </section>
  <header class="header"><div class="header-inner">
    <nav class="nav"><a href="index.html">Home</a><a href="shop.html">Shop</a><a href="collections.html">Collections</a><a href="about.html">About</a><a href="contact.html">Contact</a></nav>
    <a class="brand" href="index.html"><img src="logo.PNG" alt="Chevalier & Roth logo"><span>CHEVALIER & ROTH</span></a>
    <nav class="nav right"><a href="search.html">Search</a><a href="account.html" id="accountLink">Account</a>${orderingEnabled()?'<a href="cart.html">Bag (<span data-cart-count>0</span>)</a>':'<span class="nav-launch-note">ORDERS OPEN 02.01.2027</span>'}</nav>
    <button class="burger" onclick="openMenu()" aria-label="Open menu">☰</button>
  </div></header>
  <div class="drawer" id="drawer"><button class="drawer-close" onclick="closeMenu()">×</button><nav class="drawer-nav">
    <a href="index.html">Home</a><a href="shop.html">Shop</a><a href="collections.html">Collections</a><a href="about.html">About</a><a href="contact.html">Contact</a><a href="search.html">Search</a><a href="account.html" id="accountLink">Account</a>
    ${orderingEnabled()?'<a href="cart.html">Bag</a>':'<span class="drawer-launch-note">ORDERS OPEN 02.01.2027</span>'}
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
  const _imgCandidates=CRStore.productImageCandidatesForColor(p,'Beige/Braun');
  const img=CRStore.esc(_imgCandidates[0]||'');
  const imgFallbacks=CRStore.esc(encodeURIComponent(JSON.stringify(_imgCandidates.slice(1))));
  const soldOut=orderingEnabled() && Number(p.stock||0)<=0;
  return `<article class="card ${soldOut?'is-sold-out':''}">
    <a href="product.html?id=${encodeURIComponent(p.id)}">
      <div class="card-media">
        ${img?`<img src="${img}" data-cr-fallbacks="${imgFallbacks}" alt="${CRStore.esc(p.name)}" loading="eager" decoding="async" onerror="if(!CRStore.tryNextImage(this)){this.style.display='none';this.nextElementSibling.style.display='grid'}"><div class="ph image-fallback" style="display:none">CR</div>`:`<div class="ph">CR</div>`}
        ${soldOut?'<div class="soldout-overlay">SOLD OUT</div>':''}
      </div>
      <div class="card-body">
        <div class="card-title">${CRStore.esc(p.name)}</div>
        <div class="meta"><span>${CRStore.esc(p.category)}</span><span class="price-stack"><b>${CRStore.money(CRStore.price(p))}</b><small>+ ${CRStore.vatPercent()}% VAT · ${CRStore.money(CRStore.grossFromNet(CRStore.price(p)))} total</small></span></div>
        ${!orderingEnabled()?'<span class="badge launch-badge">AVAILABLE 02.01.2027</span>':(soldOut?'<span class="badge soldout-badge">SOLD OUT</span>':(p.badge?`<span class="badge">${CRStore.esc(p.badge)}</span>`:''))}
      </div>
    </a>
    <div class="card-actions"><button class="btn light waitlist-btn" onclick="event.preventDefault();event.stopPropagation();openWaitlist('${p.id}')">JOIN WAITLIST</button></div>
  </article>`;
}
function renderProducts(target, filter=null, limit=999){
  const draw=()=>{
    let ps=CRStore.products(); if(!ps.length && CRStore.defaultProducts) ps=CRStore.defaultProducts();
    if(filter)ps=ps.filter(filter);
    const el=document.querySelector(target);
    if(el)el.innerHTML=ps.slice(0,limit).map(productCard).join('');
  };
  draw();
  if(window.CRCommerce){
    CRCommerce.syncProducts().then(draw).catch(()=>{});
  }
}
document.addEventListener('DOMContentLoaded',()=>{header();footer();ensureWaitlistModal();ensureSetUI();ensureGiveawayUI();startLaunchCountdown();updateCartCount();refreshAuthChrome();setTimeout(()=>openGiveawayIntro(false),350)});
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
// SET BUILDER
// =========================
let _activeSetId='';

function ensureSetUI(){
  if(document.getElementById('setBuilderModal'))return;
  document.body.insertAdjacentHTML('beforeend',`
    <div class="set-builder-modal" id="setBuilderModal" role="dialog" aria-modal="true" aria-labelledby="setBuilderTitle">
      <div class="set-builder-card">
        <button class="giveaway-x" onclick="closeSetBuilder()" aria-label="Schließen">×</button>
        <div class="set-builder-head">
          <div><div class="eyebrow">CHEVALIER & ROTH · SET</div><h2 id="setBuilderTitle">Complete the look.</h2></div>
          <div class="set-builder-price"><span>SET PRICE</span><b id="setBuilderPrice">—</b><small id="setBuilderVat"></small></div>
        </div>
        <p class="set-builder-lead">Wähle für beide Teile Größe und Farbe. Danach wird das komplette Set mit einem Klick in den Warenkorb gelegt.</p>
        <div id="setBuilderItems" class="set-builder-items"></div>
        <button class="btn set-builder-add" id="setBuilderAdd" onclick="addActiveSetToCart()">SET IN DEN WARENKORB</button>
        <div id="setBuilderMsg" class="giveaway-msg"></div>
      </div>
    </div>`);
}

function closeSetBuilder(){document.getElementById('setBuilderModal')?.classList.remove('open')}

async function openSetBuilder(bundleId){
  if(!orderingEnabled())return alert('Bestellungen sind vorerst deaktiviert. Die erste Collection startet am 02.01.2027.');
  ensureSetUI();
  if(window.CRCommerce){try{await CRCommerce.syncProducts()}catch(e){}}
  const bundle=CRStore.bundleById(bundleId);
  if(!bundle)return;
  const ps=CRStore.bundleProducts(bundle);
  if(ps.length!==bundle.componentIds.length)return alert('Das Set ist noch nicht vollständig eingerichtet.');
  _activeSetId=bundle.id;
  setBuilderTitle.textContent=bundle.name;
  setBuilderPrice.textContent=CRStore.money(bundle.price);
  setBuilderVat.textContent=`+ ${CRStore.vatPercent()}% VAT · ${CRStore.money(CRStore.grossFromNet(bundle.price))} total`;
  const stock=CRStore.bundleStock(bundle);
  setBuilderAdd.disabled=stock<=0;
  setBuilderAdd.textContent=stock<=0?'SET AUSVERKAUFT':'SET IN DEN WARENKORB';
  setBuilderMsg.textContent='';
  setBuilderItems.innerHTML=ps.map((p,index)=>{
    const _cands=CRStore.productImageCandidatesForColor(p,'Beige/Braun');
    const img=_cands[0]||'';
    const fallbacks=CRStore.esc(encodeURIComponent(JSON.stringify(_cands.slice(1))));
    return `<article class="set-builder-item" data-product-id="${CRStore.esc(p.id)}">
      <div class="set-builder-image">${img?`<img src="${CRStore.esc(img)}" data-cr-fallbacks="${fallbacks}" alt="${CRStore.esc(p.name)}" onerror="if(!CRStore.tryNextImage(this)){this.style.display='none'}">`:''}<span>CR</span></div>
      <div class="set-builder-copy"><div class="eyebrow">PIECE ${index+1}</div><h3>${CRStore.esc(p.name)}</h3><small>${p.stock>0?p.stock+' in stock':'Sold out'}</small>
        <label class="field"><span>Größe</span><select class="set-size set-select"><option value="">Auswählen…</option>${(p.sizes||[]).map(s=>`<option value="${CRStore.esc(s)}">${CRStore.esc(s)}</option>`).join('')}</select></label>
        <label class="field"><span>Farbe</span><select class="set-color set-select"><option value="">Auswählen…</option>${(p.colors||[]).map(c=>`<option value="${CRStore.esc(c)}">${CRStore.esc(c)}</option>`).join('')}</select></label>
      </div>
    </article>`;
  }).join('');
  setBuilderModal.classList.add('open');
}

function addActiveSetToCart(){
  if(!orderingEnabled()){setBuilderMsg.textContent='Bestellungen sind vorerst deaktiviert.';return}
  const bundle=CRStore.bundleById(_activeSetId);
  if(!bundle)return;
  const rows=[...document.querySelectorAll('#setBuilderItems .set-builder-item')];
  const components=rows.map(row=>({
    id:row.dataset.productId,
    size:row.querySelector('.set-size')?.value||'',
    color:row.querySelector('.set-color')?.value||''
  }));
  if(components.some(x=>!x.size||!x.color)){setBuilderMsg.textContent='Bitte für beide Teile Größe und Farbe auswählen.';return}
  const stock=CRStore.bundleStock(bundle);
  if(stock<=0){setBuilderMsg.textContent='Dieses Set ist ausverkauft.';return}
  const cart=CRStore.cart();
  const key=JSON.stringify(components);
  let item=cart.find(x=>x.bundleId===bundle.id&&JSON.stringify(x.components||[])===key);
  if(item){
    if(item.qty>=stock){setBuilderMsg.textContent='Für dieses Set ist kein weiterer Bestand verfügbar.';return}
    item.qty++;
  }else{
    cart.push({id:`bundle:${bundle.id}`,bundleId:bundle.id,components,qty:1});
  }
  CRStore.saveCart(cart);
  setBuilderMsg.textContent='Set wurde zum Warenkorb hinzugefügt.';
  setTimeout(closeSetBuilder,900);
}

function setCard(bundle){
  const ps=CRStore.bundleProducts(bundle);
  const stock=CRStore.bundleStock(bundle);
  const imgs=ps.map(p=>({p,c:CRStore.productImageCandidatesForColor(p,'Beige/Braun')})).filter(x=>x.c.length);
  return `<article class="set-shop-card">
    <div class="set-shop-images">${imgs.map(({p,c})=>`<div><img src="${CRStore.esc(c[0])}" data-cr-fallbacks="${CRStore.esc(encodeURIComponent(JSON.stringify(c.slice(1))))}" alt="${CRStore.esc(p.name||bundle.name)}" onerror="if(!CRStore.tryNextImage(this)){this.style.display='none'}"></div>`).join('')}</div>
    <div class="set-shop-copy"><span class="eyebrow">COMPLETE SET · ${CRStore.esc(bundle.category)}</span><h3>${CRStore.esc(bundle.name)}</h3><p>${ps.map(p=>CRStore.esc(p.name)).join(' + ')}</p>
      <div class="set-shop-price"><b>${CRStore.money(bundle.price)}</b><small>+ ${CRStore.vatPercent()}% VAT · ${CRStore.money(CRStore.grossFromNet(bundle.price))} total</small></div>
      <button class="btn" ${(!orderingEnabled()||stock<=0)?'disabled':''} onclick="openSetBuilder('${bundle.id}')">${!orderingEnabled()?'AVAILABLE 02.01.2027':(stock<=0?'SOLD OUT':'SET AUSWÄHLEN')}</button>
    </div>
  </article>`;
}

function renderSetCards(target){
  const el=document.querySelector(target);if(!el)return;
  el.innerHTML=CRStore.bundles().map(setCard).join('');
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

function countdownUnit(value,label){
  return `<div class="countdown-unit"><b>${String(value).padStart(2,'0')}</b><span>${label}</span></div>`;
}

function startLaunchCountdown(){
  const el=document.getElementById('launchCountdownTime');
  if(!el)return;
  const tick=()=>{
    const ms=launchTarget().getTime()-Date.now();
    if(ms<=0){
      el.innerHTML=`<div class="countdown-live">THE FIRST COLLECTION IS LIVE</div>`;
      document.getElementById('launchCountdown')?.classList.add('is-live');
      if(_launchTimer)clearInterval(_launchTimer);
      return;
    }
    const total=Math.floor(ms/1000);
    const days=Math.floor(total/86400);
    const hours=Math.floor((total%86400)/3600);
    const mins=Math.floor((total%3600)/60);
    const secs=total%60;
    el.innerHTML=[
      countdownUnit(days,'TAGE'),
      countdownUnit(hours,'STD'),
      countdownUnit(mins,'MIN'),
      countdownUnit(secs,'SEK')
    ].join('');
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
        <div class="giveaway-intro-pill">GEWINNSPIEL · FIRST COLLECTION</div>
        <div class="giveaway-monogram">CR</div>
        <h2 id="giveawayIntroTitle">Jetzt teilnehmen & dein Lieblingsstück gewinnen.</h2>
        <p>Zum Launch der ersten Chevalier & Roth Collection verlosen wir ausgewählte Pieces. Die Teilnahme dauert weniger als eine Minute.</p>
        <div class="giveaway-social-banner">
          <b>TEILNAHMEBEDINGUNG</b>
          <span>Folge Chevalier & Roth auf TikTok und Instagram.</span>
          <div class="giveaway-social-actions">
            <a class="social-follow-btn tiktok" data-giveaway-social="tiktok" target="_blank" rel="noopener">TIKTOK FOLGEN</a>
            <a class="social-follow-btn instagram" data-giveaway-social="instagram" target="_blank" rel="noopener">INSTAGRAM FOLGEN</a>
          </div>
        </div>
        <div class="giveaway-steps">
          <div><span>1</span><b>Auf TikTok & Instagram folgen</b><small>Öffne beide Profile über die sichtbaren Buttons.</small></div>
          <div><span>2</span><b>Lieblingsprodukt auswählen</b><small>Wähle eines der drei Pieces, das du gewinnen möchtest.</small></div>
          <div><span>3</span><b>Daten eintragen</b><small>Vorname, Nachname und E-Mail eingeben.</small></div>
          <div><span>4</span><b>Auf die Auslosung warten</b><small>Die Verlosung endet am <strong>02.01.2027</strong>.</small></div>
        </div>
        <div class="giveaway-actions">
          <button class="btn giveaway-primary" onclick="openGiveawayEntry()">JETZT TEILNEHMEN</button>
          <button class="giveaway-text-btn" onclick="closeGiveawayIntro()">Schließen</button>
        </div>
      </div>
    </div>

    <div class="giveaway-modal" id="giveawayEntry" role="dialog" aria-modal="true" aria-labelledby="giveawayEntryTitle">
      <div class="giveaway-entry-card">
        <button class="giveaway-x" onclick="closeGiveawayEntry()" aria-label="Schließen">×</button>
        <div class="giveaway-entry-head">
          <div><div class="eyebrow">THE FIRST COLLECTION · GIVEAWAY</div><h2 id="giveawayEntryTitle">Choose your piece.</h2></div>
          <div class="giveaway-deadline"><span>DRAW</span><b>02.01.2027</b></div>
        </div>
        <p class="giveaway-lead">Wähle eines der drei Pieces aus unserer ersten Collection: Half-Zip, Hose oder Body. Für die Teilnahme musst du Chevalier & Roth außerdem auf TikTok und Instagram folgen.</p>
        <div class="giveaway-social-panel">
          <div><b>1 · SOCIAL FOLLOW</b><span>Öffne unsere Profile und folge uns auf beiden Plattformen.</span></div>
          <div class="giveaway-social-actions">
            <a class="social-follow-btn tiktok" data-giveaway-social="tiktok" target="_blank" rel="noopener">TIKTOK ÖFFNEN</a>
            <a class="social-follow-btn instagram" data-giveaway-social="instagram" target="_blank" rel="noopener">INSTAGRAM ÖFFNEN</a>
          </div>
        </div>
        <div id="giveawayPrizeGrid" class="giveaway-prize-grid"></div>
        <form class="giveaway-form" onsubmit="event.preventDefault();submitGiveawayEntry()">
          <label class="field"><span>Vorname</span><input id="giveawayFirstName" autocomplete="given-name" required></label>
          <label class="field"><span>Nachname</span><input id="giveawayLastName" autocomplete="family-name" required></label>
          <label class="field full"><span>E-Mail</span><input id="giveawayEmail" type="email" autocomplete="email" required></label>
          <div class="giveaway-follow-confirm full">
            <b>TEILNAHMEBEDINGUNGEN BESTÄTIGEN</b>
            <label><input id="giveawayTikTokFollow" type="checkbox" required><span>Ich bestätige, dass ich Chevalier & Roth auf TikTok folge.</span></label>
            <label><input id="giveawayInstagramFollow" type="checkbox" required><span>Ich bestätige, dass ich Chevalier & Roth auf Instagram folge.</span></label>
          </div>
          <label class="giveaway-consent full"><input id="giveawayConsent" type="checkbox" required><span>Ich stimme der Speicherung meiner Angaben für die Durchführung des Gewinnspiels zu und akzeptiere die <a href="giveaway-rules.html" target="_blank">Teilnahmehinweise</a> sowie die <a href="datenschutz.html" target="_blank">Datenschutzhinweise</a>.</span></label>
          <div class="full"><button class="btn giveaway-submit" id="giveawaySubmitBtn">TEILNAHME ABSENDEN</button><div id="giveawayMsg" class="giveaway-msg"></div></div>
        </form>
      </div>
    </div>

    <button class="giveaway-fab" id="giveawayFab" onclick="openGiveawayIntro(true)" aria-label="Gewinnspiel öffnen"><span>CR</span><b>GIVEAWAY</b></button>
  `);
  applyGiveawaySocialLinks();
}

function applyGiveawaySocialLinks(){
  const tiktok=window.CRSiteConfig?.tiktokUrl||'';
  const instagram=window.CRSiteConfig?.instagramUrl||'';
  document.querySelectorAll('[data-giveaway-social="tiktok"]').forEach(a=>a.href=tiktok||'https://www.tiktok.com/');
  document.querySelectorAll('[data-giveaway-social="instagram"]').forEach(a=>a.href=instagram||'https://www.instagram.com/');
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

function giveawayDesigns(){
  const live=CRStore.products();
  const defaults=CRStore.defaultProducts();
  const merged=[];
  for(let i=1;i<=3;i++){
    const id='p'+i;
    const found=live.find(p=>p.id===id)||defaults.find(p=>p.id===id);
    if(found)merged.push(found);
  }
  return merged;
}

function renderGiveawayPrizes(){
  const grid=document.getElementById('giveawayPrizeGrid');if(!grid)return;
  const products=giveawayDesigns();
  grid.innerHTML=products.length?products.map(p=>{
    const _cands=CRStore.productImageCandidatesForColor(p,'Beige/Braun');
    const img=_cands[0]||'';
    const fallbacks=CRStore.esc(encodeURIComponent(JSON.stringify(_cands.slice(1))));
    return `<button type="button" class="giveaway-prize ${_giveawayPrizeId===p.id?'selected':''}" onclick="selectGiveawayPrize('${CRStore.esc(p.id)}')">
      <div class="giveaway-prize-media">${img?`<img src="${CRStore.esc(img)}" data-cr-fallbacks="${fallbacks}" alt="${CRStore.esc(p.name)}" onerror="if(!CRStore.tryNextImage(this)){this.style.display='none'}">`:'<div class="giveaway-prize-placeholder">CR</div>'}<span>SELECT</span></div>
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

  const prize=giveawayDesigns().find(p=>p.id===_giveawayPrizeId);
  if(!prize){if(msg)msg.textContent='Bitte zuerst einen Gewinn auswählen.';return}

  const tiktokOk=!!document.getElementById('giveawayTikTokFollow')?.checked;
  const instagramOk=!!document.getElementById('giveawayInstagramFollow')?.checked;
  const privacyOk=!!document.getElementById('giveawayConsent')?.checked;
  if(!tiktokOk || !instagramOk){
    if(msg)msg.textContent='Bitte bestätige zuerst, dass du uns auf TikTok und Instagram folgst.';
    return;
  }
  if(!privacyOk){
    if(msg)msg.textContent='Bitte die Teilnahme- und Datenschutzhinweise akzeptieren.';
    return;
  }

  const firstName=String(document.getElementById('giveawayFirstName')?.value||'').trim();
  const lastName=String(document.getElementById('giveawayLastName')?.value||'').trim();
  const email=String(document.getElementById('giveawayEmail')?.value||'').trim().toLowerCase();

  if(!firstName || !lastName){if(msg)msg.textContent='Bitte Vor- und Nachname eingeben.';return}
  if(!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)){if(msg)msg.textContent='Bitte eine gültige E-Mail-Adresse eingeben.';return}

  btn.disabled=true;
  if(msg)msg.textContent='Teilnahme wird in Appwrite gespeichert…';

  try{
    if(!window.Appwrite || typeof Appwrite.Client!=='function' || typeof Appwrite.TablesDB!=='function'){
      throw new Error('Appwrite SDK konnte nicht geladen werden. Bitte Seite neu laden.');
    }

    const endpoint=window.CRSiteConfig?.appwriteEndpoint || 'https://fra.cloud.appwrite.io/v1';
    const projectId=window.CRSiteConfig?.appwriteProjectId || '6ac779cc001f0d093856';
    const databaseId=window.CRSiteConfig?.commerceDatabaseId || '6ac7d6740035408079f7';
    const tableId=window.CRSiteConfig?.giveawayTableId || 'cr_giveaway';

    const client=new Appwrite.Client().setEndpoint(endpoint).setProject(projectId);
    const tables=new Appwrite.TablesDB(client);

    const row=await Promise.race([
      tables.createRow({
        databaseId,
        tableId,
        rowId:Appwrite.ID.unique(),
        data:{
          firstName:firstName.slice(0,120),
          lastName:lastName.slice(0,120),
          email:email.slice(0,320),
          prizeId:String(prize.id||'').slice(0,255),
          prizeName:String(prize.name||'').slice(0,255),
          status:'entered',
          source:'website-giveaway-2027',
          privacyAccepted:true
        }
      }),
      new Promise((_,reject)=>setTimeout(()=>reject(new Error('Appwrite antwortet nicht. Bitte erneut versuchen.')),15000))
    ]);

    localStorage.setItem('cr_giveaway_entered','1');
    if(row?.$id)localStorage.setItem('cr_giveaway_entry_id',row.$id);

    if(msg)msg.textContent='Erfolgreich in Appwrite gespeichert. Du bist dabei – viel Glück!';
    document.getElementById('giveawayFirstName').disabled=true;
    document.getElementById('giveawayLastName').disabled=true;
    document.getElementById('giveawayEmail').disabled=true;
    document.getElementById('giveawayConsent').disabled=true;
    document.getElementById('giveawayTikTokFollow').disabled=true;
    document.getElementById('giveawayInstagramFollow').disabled=true;
    setTimeout(()=>closeGiveawayEntry(),1800);
  }catch(e){
    console.error('[Giveaway/Appwrite]',e);
    const code=e?.code??e?.status;
    let message=e?.message||'Die Teilnahme konnte nicht gespeichert werden.';
    if(code===404) message='Appwrite findet die Tabelle cr_giveaway nicht.';
    else if(code===401 || code===403) message='Appwrite blockiert das Speichern. In cr_giveaway muss Any die Berechtigung CREATE haben.';
    else if(code===400 && /column|attribute|schema/i.test(String(message))) message='Die Tabelle cr_giveaway hat nicht alle benötigten Spalten.';
    if(msg)msg.textContent=message;
  }finally{
    btn.disabled=false;
  }
}
