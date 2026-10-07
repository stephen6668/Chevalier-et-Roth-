
function openMenu(){document.getElementById('drawer')?.classList.add('open')}
function closeMenu(){document.getElementById('drawer')?.classList.remove('open')}
function updateCartCount(){const n=CRStore.cart().reduce((s,x)=>s+x.qty,0);document.querySelectorAll('[data-cart-count]').forEach(e=>e.textContent=n)}
function header(){
  document.body.insertAdjacentHTML('afterbegin',`
  <div class="topbar">LUXEMBOURG · TIMELESS ELEGANCE · CHEVALIER & ROTH</div>
  <header class="header"><div class="header-inner">
    <nav class="nav"><a href="index.html">Home</a><a href="shop.html">Shop</a><a href="collections.html">Collections</a><a href="about.html">About</a><a href="contact.html">Contact</a></nav>
    <a class="brand" href="index.html"><img src="logo.PNG" alt="Chevalier & Roth logo"><span>CHEVALIER & ROTH</span></a>
    <nav class="nav right"><a href="search.html">Search</a><a href="account.html">Account</a><a href="cart.html">Bag (<span data-cart-count>0</span>)</a></nav>
    <button class="burger" onclick="openMenu()" aria-label="Open menu">☰</button>
  </div></header>
  <div class="drawer" id="drawer"><button class="drawer-close" onclick="closeMenu()">×</button><nav class="drawer-nav">
    <a href="index.html">Home</a><a href="shop.html">Shop</a><a href="collections.html">Collections</a><a href="about.html">About</a><a href="contact.html">Contact</a><a href="search.html">Search</a><a href="account.html">Account</a><a href="cart.html">Bag</a>
    <a href="impressum.html">Legal Notice</a><a href="datenschutz.html">Privacy</a><a href="cookies.html">Cookie Policy</a><a href="agb.html">Terms</a><a href="versand.html">Shipping</a><a href="zahlung.html">Payments</a><a href="widerruf.html">Returns</a><a href="admin.html">Admin</a>
  </nav></div>`);
  updateCartCount();
}
function footer(){
 document.body.insertAdjacentHTML('beforeend',`
 <footer class="footer"><div class="footer-grid">
  <div><h3>CHEVALIER & ROTH</h3><p style="color:#8f887f;line-height:1.8">Modern heritage, quiet luxury and timeless wardrobe pieces from Luxembourg.</p><small>© 2026 Chevalier & Roth</small></div>
  <div><h4>SHOP</h4><a href="shop.html">Shop</a><a href="collections.html">Collections</a><a href="search.html">Search</a></div>
  <div><h4>SERVICE</h4><a href="contact.html">Contact</a><a href="versand.html">Shipping</a><a href="zahlung.html">Payments</a><a href="widerruf.html">Returns</a></div>
  <div><h4>COMPANY</h4><a href="about.html">Our Story</a><a href="account.html">Account</a></div>
  <div><h4>LEGAL</h4><a href="impressum.html">Legal Notice</a><a href="datenschutz.html">Privacy</a><a href="cookies.html">Cookies</a><a href="agb.html">Terms</a></div>
 </div></footer>`);
}
function cookie(){
 if(CRStore.get('consent',null)!==null)return;
 document.body.insertAdjacentHTML('beforeend',`<div class="cookie show" id="cookie"><p>Only necessary local storage is used by default. Optional tracking must be added later and activated only after consent.</p><div><button class="btn light" onclick="consent(false)">DECLINE</button> <button class="btn" onclick="consent(true)">ACCEPT</button></div></div>`);
}
function consent(v){CRStore.set('consent',v);document.getElementById('cookie')?.remove()}
function productCard(p){return `<article class="card"><a href="product.html?id=${encodeURIComponent(p.id)}"><div class="card-media">${p.images&&p.images[0]?`<img src="${CRStore.esc(p.images[0])}" alt="${CRStore.esc(p.name)}">`:`<div class="ph">CR</div>`}</div><div class="card-body"><div class="card-title">${CRStore.esc(p.name)}</div><div class="meta"><span>${CRStore.esc(p.category)}</span><span>${CRStore.money(CRStore.price(p))}</span></div>${p.badge?`<span class="badge">${CRStore.esc(p.badge)}</span>`:''}</div></a></article>`}
function renderProducts(target, filter=null, limit=999){let ps=CRStore.products().filter(p=>p.active);if(filter)ps=ps.filter(filter);document.querySelector(target).innerHTML=ps.slice(0,limit).map(productCard).join('')}
document.addEventListener('DOMContentLoaded',()=>{header();footer();cookie();updateCartCount()});
window.addEventListener('cartchange',updateCartCount);
