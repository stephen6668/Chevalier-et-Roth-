'use strict';
document.documentElement.classList.add('js');
const $ = (s, parent = document) => parent.querySelector(s);
const $$ = (s, parent = document) => [...parent.querySelectorAll(s)];
const colors = {ivory: {name:'Elfenbein', image:'assets/halfzip.webp'}, burgundy: {name:'Bordeaux', image:'assets/halfzip-burgundy.webp'}, noir: {name:'Noir', image:'assets/halfzip-noir.webp'}};
const validSizes = ['S','M','L','XL'];
const currency = new Intl.NumberFormat('de-DE', {style:'currency',currency:'EUR'});
let currentColor = 'ivory', currentSize = 'M', activePanel = null, panelTrigger = null, toastTimer;
let cart = [];
try { const stored = JSON.parse(localStorage.getItem('cr-selection-v1') || '[]'); if (Array.isArray(stored)) cart = stored.filter(x => colors[x.color] && validSizes.includes(x.size) && Number.isInteger(x.qty) && x.qty > 0 && x.qty <= 20).slice(0,30); } catch {}
function scrollBehavior() { return matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'; }
function restoreCartFocus(index, delta) { const nextIndex = Math.min(index, cart.length-1); const control = nextIndex >= 0 ? $(`[data-index="${nextIndex}"][data-quantity="${delta}"]`) : $('#browse-collection'); control?.focus({preventScroll:true}); }
function toast(message) { const el = $('#toast'); el.textContent = message; el.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), 3200); }
function saveCart() { try {localStorage.setItem('cr-selection-v1', JSON.stringify(cart));} catch {} renderCart(); }
function openPanel(name, trigger) {
  closePanel(false); const panel = $(`#${name}-panel`); if (!panel) return;
  activePanel = panel; panelTrigger = trigger || document.activeElement;
  panel.showModal(); document.body.classList.add('modal-open');
  if (name === 'search') { renderSearch(''); setTimeout(() => $('#search-input').focus(),80); }
}
function closePanel(restore = true) { if (!activePanel) return; const panel = activePanel; activePanel = null; panel.close(); document.body.classList.remove('modal-open'); if (restore && panelTrigger) panelTrigger.focus({preventScroll:true}); }
$$('[data-panel]').forEach(btn => btn.addEventListener('click', () => openPanel(btn.dataset.panel, btn)));
$$('.close-panel').forEach(btn => btn.addEventListener('click', () => closePanel()));
$$('.side-panel').forEach(panel => {
  panel.addEventListener('cancel', e => {e.preventDefault(); closePanel();});
  panel.addEventListener('click', e => { if (e.target === panel) { const b = panel.getBoundingClientRect(); if (e.clientX < b.left || e.clientX > b.right || e.clientY < b.top || e.clientY > b.bottom) closePanel(); }});
});
$$('.menu-links a').forEach(a => a.addEventListener('click', () => closePanel(false)));
function selectColor(color) {
  if (!colors[color]) return; currentColor = color;
  $('#color-name').textContent = colors[color].name;
  const heroImg = $('.hero-product-image'); heroImg.src = colors[color].image; heroImg.alt = `Entwurf Le Signature Half-Zip in ${colors[color].name}`;
  $$('[data-color]').forEach(btn => {const active = btn.dataset.color === color; btn.classList.toggle('active', active); btn.setAttribute('aria-pressed',String(active));});
  $$('[data-slide]').forEach(btn => {const active = btn.dataset.slide === color; btn.classList.toggle('active', active); btn.setAttribute('aria-pressed',String(active));});
  $('.hero-caption>span:first-child').textContent = `${String(Object.keys(colors).indexOf(color)+1).padStart(2,'0')} — 03`;
}
$$('[data-color]').forEach(btn => btn.addEventListener('click', () => selectColor(btn.dataset.color)));
$$('[data-slide]').forEach(btn => btn.addEventListener('click', () => selectColor(btn.dataset.slide)));
$$('[data-size]').forEach(btn => btn.addEventListener('click', () => {currentSize = btn.dataset.size; $$('[data-size]').forEach(b => {const active=b===btn; b.classList.toggle('active',active); b.setAttribute('aria-pressed',String(active));});}));
$('#hero-add').addEventListener('click', () => {const item = cart.find(x=>x.color===currentColor && x.size===currentSize); if (item) {if(item.qty>=20) return toast('Maximal 20 Stück pro Variante.'); item.qty++;} else cart.push({color:currentColor,size:currentSize,qty:1}); saveCart(); openPanel('cart',$('#hero-add'));});
function showProduct(color) { closePanel(false); selectColor(color); $('.hero').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'}); setTimeout(() => $('.sizes button.active').focus({preventScroll:true}),450); }
$$('[data-quickview]').forEach(btn => btn.addEventListener('click', () => showProduct(btn.dataset.quickview)));
$$('[data-filter]').forEach(btn => btn.addEventListener('click', () => {
  const filter=btn.dataset.filter;
  $$('[data-filter]').forEach(b => {b.classList.toggle('active',b===btn); b.setAttribute('aria-pressed',String(b===btn));});
  $('.product-grid').classList.toggle('filtered',filter!=='all');
  $$('.product-card').forEach(card => {card.hidden=filter!=='all' && card.dataset.productColor!==filter; if(!card.hidden) card.classList.add('visible');});
}));
function renderCart() {
 const count=cart.reduce((sum,x)=>sum+x.qty,0); $('#cart-count').textContent=count; $('#panel-count').textContent=`(${count})`;
 $('.cart-trigger').setAttribute('aria-label',`Warenkorb öffnen, ${count} Stück`);
 if(!count) {$('#cart-items').innerHTML='<div class="empty-cart"><svg><use href="#i-bag"/></svg><h3>Raum für Ihre Favoriten.</h3><p>Entdecken Sie Le Signature in drei Farbwelten.</p><button class="button" id="browse-collection">Kollektion entdecken <svg><use href="#i-arrow"/></svg></button></div>'; $('#cart-summary').innerHTML=''; $('#browse-collection').addEventListener('click',()=>{closePanel(false); $('#collection').scrollIntoView({behavior:scrollBehavior()});}); return;}
 $('#cart-items').innerHTML=cart.map((item,index)=>`<article class="cart-item"><div class="cart-item-image"><img src="${colors[item.color].image}" alt="Half-Zip in ${colors[item.color].name}"></div><div><h3>Le Signature</h3><p class="variant">${colors[item.color].name} / ${item.size}</p><p class="cart-item-price">${currency.format(189)}</p><div class="quantity-controls"><button data-quantity="-1" data-index="${index}" aria-label="Anzahl ${colors[item.color].name} ${item.size} verringern">−</button><span>${item.qty}</span><button data-quantity="1" data-index="${index}" aria-label="Anzahl ${colors[item.color].name} ${item.size} erhöhen">+</button><button class="remove-item" data-remove="${index}" aria-label="${colors[item.color].name} ${item.size} entfernen">Entfernen</button></div></div></article>`).join('');
 $('#cart-summary').innerHTML=`<div class="cart-total"><span>Zwischensumme</span><strong>${currency.format(count*189)}</strong></div><div class="cart-preview-message"><strong>Ihre Auswahl ist eine Designvorschau.</strong>Produkte und Preise sind vorläufig. Ihre Auswahl wird nur auf diesem Gerät gespeichert. Eine Bestellung oder Zahlung ist noch nicht möglich.</div>`;
 $$('[data-quantity]').forEach(btn=>btn.addEventListener('click',()=>{const i=Number(btn.dataset.index),delta=Number(btn.dataset.quantity); if(cart[i].qty+delta>20)return toast('Maximal 20 Stück pro Variante.'); cart[i].qty+=delta; if(cart[i].qty<=0)cart.splice(i,1); saveCart();restoreCartFocus(i,delta);}));
 $$('[data-remove]').forEach(btn=>btn.addEventListener('click',()=>{const i=Number(btn.dataset.remove);cart.splice(i,1);saveCart();restoreCartFocus(i,1);}));
}
function renderSearch(query) {
 const term=query.trim().toLocaleLowerCase('de');
 const results=Object.entries(colors).filter(([key,color])=>!term || `le signature half-zip halfzip pullover strick ${color.name} ${key}`.toLocaleLowerCase('de').includes(term));
 $('#search-results').innerHTML=results.length ? `<p class="search-hint">${term?`${results.length} Ergebnis${results.length!==1?'se':''}`:'Die Signature-Kollektion'}</p>`+results.map(([key,color])=>`<button class="search-result" data-result="${key}"><img src="${color.image}" alt="Half-Zip ${color.name}"><div><h3>Le Signature</h3><p>Half-Zip · ${color.name} · 189,00 €</p></div><svg><use href="#i-arrow"/></svg></button>`).join('') : '<p class="search-hint">Keine Stücke gefunden. Versuchen Sie „Signature“, „Elfenbein“, „Bordeaux“ oder „Noir“.</p>';
 $$('[data-result]').forEach(btn=>btn.addEventListener('click',()=>showProduct(btn.dataset.result)));
}
$('#search-form').addEventListener('submit',e=>{e.preventDefault();renderSearch($('#search-input').value);});
$('#search-input').addEventListener('input',e=>renderSearch(e.target.value));
function showInfo(content) {$('#info-content').innerHTML=content.replace('<h2>', '<h2 id="info-title">'); $('#info-dialog').showModal(); document.body.classList.add('modal-open');}
function closeInfo() {$('#info-dialog').close(); if(!activePanel)document.body.classList.remove('modal-open');}
$('.close-info').addEventListener('click',closeInfo); $('#info-dialog').addEventListener('cancel',e=>{e.preventDefault();closeInfo();});
$('#info-dialog').addEventListener('click',e=>{if(e.target===$('#info-dialog')){const b=e.target.getBoundingClientRect();if(e.clientX<b.left||e.clientX>b.right||e.clientY<b.top||e.clientY>b.bottom)closeInfo();}});
$('.size-guide').addEventListener('click',()=>showInfo('<p class="eyebrow">LE SIGNATURE</p><h2>Ihre Größe.</h2><p>Für diese Designvorschau sind die Größen S, M, L und XL vorgesehen. Die verbindlichen Maße und Passformhinweise ergänzen wir mit der finalen Kollektion.</p><p>Wählen Sie zunächst Ihre übliche Größe, um die Produktauswahl auszuprobieren.</p>'));
$('#detail-trigger').addEventListener('click',()=>$('#details').scrollIntoView({behavior:scrollBehavior()}));
$('#privacy-trigger').addEventListener('click',()=>showInfo('<p class="eyebrow">DESIGNVORSCHAU</p><h2>Datenschutz.</h2><p>Diese Vorschau verwendet keinen Analyse- oder Marketingcode. Die Produktauswahl wird im lokalen Speicher Ihres Browsers gespeichert und kann durch Entfernen der Stücke oder Löschen der Websitedaten zurückgesetzt werden.</p><p>Zur Darstellung der Schriften werden Google Fonts geladen. Dabei wird eine Verbindung zu Google hergestellt. Das Hosting kann technisch erforderliche Zugriffsdaten verarbeiten.</p><p>Die rechtlichen Pflichtangaben der Marke werden vor dem öffentlichen Shopstart ergänzt.</p>'));
const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('visible');observer.unobserve(entry.target);}});},{threshold:.12});
$$('.reveal').forEach(el=>observer.observe(el));
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)'); let ticking=false;
function updateScroll(){const y=window.scrollY; if(!reducedMotion.matches && innerWidth>800 && y<1000){$('.hero-scene').style.transform=`translateY(${y*.16}px) scale(1.035)`; $('.hero-product-area').style.transform=`translateY(${y*.065}px)`;}ticking=false;}
addEventListener('scroll',()=>{if(!ticking){requestAnimationFrame(updateScroll);ticking=true;}},{passive:true});
renderCart();
