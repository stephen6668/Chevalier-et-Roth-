'use strict';
document.documentElement.classList.add('js');
const $=(s,p=document)=>p.querySelector(s), $$=(s,p=document)=>[...p.querySelectorAll(s)];
const products=window.CR_PRODUCTS, colors=window.CR_COLORS, byId=Object.fromEntries(products.map(p=>[p.id,p]));
const validSizes=['S','M','L','XL'], reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
const heroModels=$$('[data-hero-model]'),selectedColors=Object.fromEntries(products.map(p=>[p.id,'bordeaux']));
let model=$('#hero-model'),autoRotationEnabled=!reducedMotion.matches;
let currentProduct='halfzip',currentSize='M',activePanel=null,panelTrigger=null,toastTimer,cart=[];
const variantFor=(id,color=selectedColors[id])=>byId[id].variants[color];
const absoluteModel=url=>new URL(url,document.baseURI).href;
const requestedModel=viewer=>viewer.dataset.requestedModel||absoluteModel(viewer.getAttribute('src'));
const viewerReady=viewer=>Boolean(viewer.loaded)&&viewer.dataset.readyModel===requestedModel(viewer);
try{
 const savedV3=localStorage.getItem('cr-selection-v3');
 const saved=JSON.parse(savedV3===null?(localStorage.getItem('cr-selection-v2')||'[]'):savedV3);
 if(Array.isArray(saved))cart=saved.map(x=>savedV3===null?{...x,color:'bordeaux'}:x).filter(x=>x&&byId[x.product]?.variants[x.color]&&validSizes.includes(x.size)&&Number.isInteger(x.qty)&&x.qty>0&&x.qty<=20).slice(0,60);
 if(savedV3===null&&cart.length)localStorage.setItem('cr-selection-v3',JSON.stringify(cart));
}catch{}
const scrollBehavior=()=>reducedMotion.matches?'instant':'smooth';
function toast(message){$('#toast').textContent=message;$('#toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),3200);}
function saveCart(){try{localStorage.setItem('cr-selection-v3',JSON.stringify(cart));}catch{}renderCart();}
function openPanel(name,trigger){closePanel(false);const panel=$(`#${name}-panel`);if(!panel)return;activePanel=panel;panelTrigger=trigger||document.activeElement;panel.showModal();document.body.classList.add('modal-open');if(name==='search'){renderSearch('');setTimeout(()=>$('#search-input').focus(),80);}}
function closePanel(restore=true){if(!activePanel)return;const panel=activePanel;activePanel=null;panel.close();document.body.classList.remove('modal-open');if(restore&&panelTrigger)panelTrigger.focus({preventScroll:true});}
$$('[data-panel]').forEach(b=>b.addEventListener('click',()=>openPanel(b.dataset.panel,b)));
$$('.close-panel').forEach(b=>b.addEventListener('click',()=>closePanel()));
$$('.side-panel').forEach(panel=>{panel.addEventListener('cancel',e=>{e.preventDefault();closePanel();});panel.addEventListener('click',e=>{if(e.target===panel){const b=panel.getBoundingClientRect();if(e.clientX<b.left||e.clientX>b.right||e.clientY<b.top||e.clientY>b.bottom)closePanel();}});});
$$('.menu-links a').forEach(a=>a.addEventListener('click',()=>closePanel(false)));
function replacePoster(viewer,variant){
 const fresh=document.createElement('img');fresh.slot='poster';fresh.className='model-poster';fresh.src=variant.image;fresh.alt='';
 $('.model-poster',viewer)?.replaceWith(fresh);viewer.setAttribute('poster',variant.image);
}
function externalPoster(parent,variant,card=false){
 const old=$(card?'.variant-card-poster':'.variant-loading-poster',parent),fresh=document.createElement('img');
 fresh.className=card?'variant-card-poster':'variant-loading-poster';fresh.src=variant.image;fresh.alt='';fresh.setAttribute('aria-hidden','true');
 if(old)old.replaceWith(fresh);else parent.appendChild(fresh);
}
function resetImageControl(){
 $('#image-view').textContent='Bild';$('#image-view').setAttribute('aria-pressed','false');$('#image-view').setAttribute('aria-label','Zum Produktbild wechseln');
}
function refreshColorControls(){
 const variant=variantFor(currentProduct);$('#color-name').textContent=variant.name;
 $$('button[data-color]').forEach(b=>{const active=b.dataset.color===variant.id;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
 $('.color-selected-detail').textContent=`${variant.name} / Gold`;
 $('#hero-product').dataset.selectedColor=variant.id;
}
function refreshCurrentStatus(){
 const variant=variantFor(currentProduct);$('#hero-product').classList.toggle('is-loaded',viewerReady(model));
 if(viewerReady(model))$('#model-state').textContent=`3D-Produktansicht · ${variant.name} · frei drehbar`;
 else if(model.dataset.failed==='true')$('#model-state').textContent=`Produktbild · ${variant.name} · 3D auf diesem Gerät nicht verfügbar`;
 else $('#model-state').textContent=`3D-Ansicht in ${variant.name} wird geladen`;
}
function updateHeroSlots(){
 const index=products.findIndex(p=>p.id===currentProduct),previous=products[(index+products.length-1)%products.length],next=products[(index+1)%products.length];
 heroModels.forEach(viewer=>{
  const id=viewer.dataset.heroModel,active=id===currentProduct,slide=viewer.closest('.hero-slide'),variant=variantFor(id);
  viewer.id=active?'hero-model':`hero-model-${id}`;viewer.inert=!active;viewer.toggleAttribute('camera-controls',active);viewer.setAttribute('aria-hidden',String(!active));viewer.removeAttribute('auto-rotate');
  slide.classList.toggle('is-active',active);slide.classList.toggle('is-previous',id===previous.id);slide.classList.toggle('is-next',id===next.id);slide.setAttribute('aria-hidden',String(!active));
  slide.setAttribute('aria-label',`${byId[id].name} in ${variant.name}, Produkt ${products.findIndex(p=>p.id===id)+1} von ${products.length}`);
  viewer.setAttribute('camera-orbit',active?'0deg 80deg 105%':id===previous.id?'22deg 82deg 105%':'-22deg 82deg 105%');viewer.resetTurntableRotation?.(0);viewer.jumpCameraToGoal?.();if(viewerReady(viewer))viewer.dismissPoster?.();
 });
 model=heroModels.find(viewer=>viewer.dataset.heroModel===currentProduct);$('.product-note>span:last-child').textContent=String(index+1).padStart(2,'0');
 for(const [selector,p] of [['#preview-previous',previous],['#preview-next',next]]){const b=$(selector);b.dataset.carouselSelect=p.id;b.setAttribute('aria-label',`${p.category} in ${variantFor(p.id).name} in den Vordergrund holen`);$('span',b).textContent=p.category;}
}
function updateRotation(){
 heroModels.forEach(viewer=>viewer.toggleAttribute('auto-rotate',viewer===model&&autoRotationEnabled&&viewerReady(viewer)));
 $('#rotation-toggle').setAttribute('aria-pressed',String(autoRotationEnabled));$('#rotation-toggle').setAttribute('aria-label',autoRotationEnabled?'Automatische Drehung pausieren':'Automatische Drehung starten');$('#rotation-toggle').textContent=autoRotationEnabled?'II':'▷';
}
function announceSelection(){const p=byId[currentProduct],index=products.findIndex(x=>x.id===currentProduct);$('#carousel-announcement').textContent=`${p.category} in ${variantFor(currentProduct).name}, Produkt ${index+1} von ${products.length} ausgewählt`;}
function selectProduct(id){
 const p=byId[id];if(!p)return;currentProduct=id;updateHeroSlots();
 $('#hero-product-title').innerHTML=`${p.name}<br><em>${p.id==='halfzip'?'Signature':p.id==='body'?'Col V':'Jambe large'}</em>`;
 resetImageControl();$('#hero-product').dataset.product=id;
 $$('button[data-product],button[data-slide]').forEach(b=>{const active=(b.dataset.product||b.dataset.slide)===id;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
 const index=products.findIndex(x=>x.id===id);$('.hero-caption>span:first-child').textContent=`${String(index+1).padStart(2,'0')} — 03`;
 refreshColorControls();announceSelection();refreshCurrentStatus();updateRotation();if(viewerReady(model))modelReady(model);
}
function modelReady(viewer=model,eventURL=null){
 if(eventURL&&absoluteModel(eventURL)!==requestedModel(viewer))return;
 if(absoluteModel(viewer.getAttribute('src'))!==requestedModel(viewer))return;
 viewer.dataset.readyModel=requestedModel(viewer);delete viewer.dataset.failed;
 const slide=viewer.closest('.hero-slide');slide.classList.add('has-model');slide.classList.remove('is-variant-loading');
 if(viewer!==model){viewer.dismissPoster?.();return;}
 viewer.resetTurntableRotation?.(0);viewer.jumpCameraToGoal?.();refreshCurrentStatus();
 if($('#image-view').getAttribute('aria-pressed')!=='true')viewer.dismissPoster?.();updateRotation();
}
function updateCardVariant(id){
 const p=byId[id],v=variantFor(id),card=$(`[data-product-id="${id}"]`);if(!card)return;
 const viewer=$('.card-model',card),container=$('.product-card-image',card);
 $('.card-variant-description',card).textContent=`${p.category} · ${v.name} / Gold`;
 $('.card-color-name',card).textContent=v.name;$('.card-color-dot',card).style.background=v.swatch;
 viewer.setAttribute('alt',`Drehbare 3D-Ansicht ${p.name} in ${v.name}`);
 const uri=absoluteModel(v.model);if(viewer.getAttribute('src')===v.model)return;
 viewer.dataset.requestedModel=uri;delete viewer.dataset.readyModel;delete viewer.dataset.failed;
 externalPoster(container,v,true);container.classList.add('is-variant-loading');replacePoster(viewer,v);viewer.showPoster?.();viewer.setAttribute('src',v.model);
}
function selectColor(color){
 const p=byId[currentProduct],v=p.variants[color];if(!v)return;
 if(selectedColors[currentProduct]===color){refreshColorControls();return;}
 selectedColors[currentProduct]=color;resetImageControl();refreshColorControls();announceSelection();
 const viewer=heroModels.find(x=>x.dataset.heroModel===currentProduct),slide=viewer.closest('.hero-slide');
 viewer.dataset.variantColor=color;viewer.dataset.requestedModel=absoluteModel(v.model);delete viewer.dataset.readyModel;delete viewer.dataset.failed;
 slide.classList.remove('has-model');slide.classList.add('is-variant-loading');externalPoster(slide,v);
 replacePoster(viewer,v);viewer.setAttribute('alt',`Drehbare 3D-Ansicht: ${p.name} in ${v.name}`);viewer.showPoster?.();viewer.setAttribute('src',v.model);
 refreshCurrentStatus();updateRotation();updateCardVariant(p.id);updateHeroSlots();
 if(activePanel?.id==='search-panel')renderSearch($('#search-input').value);
}
function stepProduct(direction){const index=products.findIndex(p=>p.id===currentProduct);selectProduct(products[(index+direction+products.length)%products.length].id);}
$('#previous-product').addEventListener('click',()=>stepProduct(-1));$('#next-product').addEventListener('click',()=>stepProduct(1));
$$('[data-carousel-select]').forEach(b=>b.addEventListener('click',()=>selectProduct(b.dataset.carouselSelect)));
$$('button[data-product]').forEach(b=>b.addEventListener('click',()=>selectProduct(b.dataset.product)));
$$('button[data-slide]').forEach(b=>b.addEventListener('click',()=>selectProduct(b.dataset.slide)));
$$('button[data-color]').forEach(b=>b.addEventListener('click',()=>selectColor(b.dataset.color)));
$$('[data-size]').forEach(b=>b.addEventListener('click',()=>{currentSize=b.dataset.size;$$('[data-size]').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-pressed',String(x===b));});}));
function addToSelection(id,trigger){const color=selectedColors[id],item=cart.find(x=>x.product===id&&x.color===color&&x.size===currentSize);if(item){if(item.qty>=20)return toast('Maximal 20 Stück pro Variante.');item.qty++;}else cart.push({product:id,color,size:currentSize,qty:1});saveCart();openPanel('cart',trigger);}
$('#hero-add').addEventListener('click',()=>addToSelection(currentProduct,$('#hero-add')));
function showProduct(id,color=null){closePanel(false);selectProduct(id);if(color)selectColor(color);$('.hero').scrollIntoView({behavior:scrollBehavior(),block:'start'});setTimeout(()=>$('#hero-model').focus({preventScroll:true}),450);}
function viewerMarkup(p){const v=variantFor(p.id);return `<model-viewer class="card-model" data-card-model="${p.id}" src="${v.model}" poster="${v.image}" alt="Drehbare 3D-Ansicht ${p.name} in ${v.name}" camera-controls disable-zoom disable-pan interaction-prompt="none" camera-orbit="0deg 80deg 105%" min-camera-orbit="auto 60deg 80%" max-camera-orbit="auto 110deg 150%" field-of-view="30deg" environment-image="neutral" exposure="1.08" shadow-intensity="0.3" loading="lazy"><img slot="poster" class="model-poster" src="${v.image}" alt=""></model-viewer>`;}
$('#product-grid').innerHTML=products.map((p,i)=>{const v=variantFor(p.id);return `<article class="product-card reveal" data-product-id="${p.id}" style="--reveal-delay:${i*.1}s"><div class="product-card-image product-card-3d"><span class="product-tag">LA COLLECTION SIGNATURE</span><span class="card-3d-label">360°</span>${viewerMarkup(p)}<button class="quick-add" data-quickview="${p.id}" aria-label="${p.name} im großen 3D-Viewer ansehen">In 3D entdecken <svg><use href="#i-arrow"/></svg></button></div><div class="product-card-info"><div><h3>${p.name}</h3><p class="card-variant-description">${p.category} · ${v.name} / Gold</p></div><span>Preis folgt</span></div><span class="card-color-note"><i class="card-color-dot" style="background:${v.swatch}"></i><span class="card-color-name">${v.name}</span><span class="card-view-label">360°-Produktansicht</span></span></article>`;}).join('');
$$('.card-model').forEach(viewer=>{
 viewer.dataset.requestedModel=absoluteModel(viewer.getAttribute('src'));
 viewer.addEventListener('load',e=>{if(absoluteModel(e.detail.url)!==requestedModel(viewer))return;viewer.dataset.readyModel=requestedModel(viewer);viewer.closest('.product-card-image').classList.remove('is-variant-loading');viewer.dismissPoster?.();});
 viewer.addEventListener('error',()=>{if(viewerReady(viewer))return;viewer.dataset.failed='true';const p=byId[viewer.dataset.cardModel],v=variantFor(p.id);externalPoster(viewer.closest('.product-card-image'),v,true);viewer.closest('.product-card-image').classList.add('is-variant-loading');});
});
$$('[data-quickview]').forEach(b=>b.addEventListener('click',()=>showProduct(b.dataset.quickview)));
$$('[data-filter]').forEach(b=>b.addEventListener('click',()=>{const f=b.dataset.filter;$$('[data-filter]').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-pressed',String(x===b));});$('.product-grid').classList.toggle('filtered',f!=='all');$$('.product-card').forEach(card=>{card.hidden=f!=='all'&&card.dataset.productId!==f;if(!card.hidden)card.classList.add('visible');});}));
function restoreCartFocus(i,delta){const index=Math.min(i,cart.length-1);const control=index>=0?$(`[data-index="${index}"][data-quantity="${delta}"]`):$('#browse-collection');control?.focus({preventScroll:true});}
function renderCart(){
 const count=cart.reduce((sum,x)=>sum+x.qty,0);$('#cart-count').textContent=count;$('#panel-count').textContent=`(${count})`;$('.cart-trigger').setAttribute('aria-label',`Warenkorb öffnen, ${count} Stück`);
 if(!count){$('#cart-items').innerHTML='<div class="empty-cart"><svg><use href="#i-bag"/></svg><h3>Raum für Ihre Favoriten.</h3><p>Body, Half-Zip und weite Hose. Entdecken Sie Ihre Farbwelt.</p><button class="button" id="browse-collection">Kollektion entdecken <svg><use href="#i-arrow"/></svg></button></div>';$('#cart-summary').innerHTML='';$('#browse-collection').addEventListener('click',()=>{closePanel(false);$('#collection').scrollIntoView({behavior:scrollBehavior()});});return;}
 $('#cart-items').innerHTML=cart.map((item,index)=>{const p=byId[item.product],v=variantFor(item.product,item.color);return `<article class="cart-item"><div class="cart-item-image"><img src="${v.image}" alt="${p.name} in ${v.name}"></div><div><h3>${p.name}</h3><p class="variant">${v.name} / ${item.size}</p><p class="cart-item-price">Preis folgt</p><div class="quantity-controls"><button data-quantity="-1" data-index="${index}" aria-label="Anzahl ${p.name} ${v.name} ${item.size} verringern">−</button><span>${item.qty}</span><button data-quantity="1" data-index="${index}" aria-label="Anzahl ${p.name} ${v.name} ${item.size} erhöhen">+</button><button class="remove-item" data-remove="${index}" aria-label="${p.name} ${v.name} ${item.size} entfernen">Entfernen</button></div></div></article>`;}).join('');
 $('#cart-summary').innerHTML='<div class="cart-preview-message"><strong>Ihre persönliche Kollektionsvorschau.</strong>Die Preise werden mit der finalen Kollektion ergänzt. Ihre Auswahl wird nur auf diesem Gerät gespeichert. Eine Bestellung oder Zahlung ist noch nicht möglich.</div>';
 $$('[data-quantity]').forEach(b=>b.addEventListener('click',()=>{const i=Number(b.dataset.index),d=Number(b.dataset.quantity);if(cart[i].qty+d>20)return toast('Maximal 20 Stück pro Variante.');cart[i].qty+=d;if(cart[i].qty<=0)cart.splice(i,1);saveCart();restoreCartFocus(i,d);}));
 $$('[data-remove]').forEach(b=>b.addEventListener('click',()=>{const i=Number(b.dataset.remove);cart.splice(i,1);saveCart();restoreCartFocus(i,1);}));
}
function renderSearch(query){
 const term=query.trim().toLocaleLowerCase('de'),tokens=term.split(/\s+/).filter(Boolean),matchingColor=colors.find(c=>c.aliases.split(' ').some(alias=>tokens.includes(alias)));
 const found=products.filter(p=>tokens.every(token=>`${p.name} ${p.type} ${p.category} ${p.id} ${colors.map(c=>c.aliases).join(' ')} gold`.toLocaleLowerCase('de').includes(token)));
 $('#search-results').innerHTML=found.length?`<p class="search-hint">${term?`${found.length} Ergebnis${found.length===1?'':'se'}`:'Die Signature-Kollektion'}</p>`+found.map(p=>{const v=variantFor(p.id,matchingColor?.id||selectedColors[p.id]);return `<button class="search-result" data-result="${p.id}" data-result-color="${v.id}"><img src="${v.image}" alt="${p.name} in ${v.name}"><div><h3>${p.name}</h3><p>${p.category} · ${v.name} · Preis folgt</p></div><svg><use href="#i-arrow"/></svg></button>`;}).join(''):'<p class="search-hint">Keine Stücke gefunden. Suchen Sie nach „Body“, „Half-Zip“, „Hose“ oder einer Farbe.</p>';
 $$('[data-result]').forEach(b=>b.addEventListener('click',()=>showProduct(b.dataset.result,b.dataset.resultColor)));
}
$('#search-form').addEventListener('submit',e=>{e.preventDefault();renderSearch($('#search-input').value);});$('#search-input').addEventListener('input',e=>renderSearch(e.target.value));
function showInfo(content){$('#info-content').innerHTML=content.replace('<h2>','<h2 id="info-title">');$('#info-dialog').showModal();document.body.classList.add('modal-open');}
function closeInfo(){$('#info-dialog').close();if(!activePanel)document.body.classList.remove('modal-open');}
$('.close-info').addEventListener('click',closeInfo);$('#info-dialog').addEventListener('cancel',e=>{e.preventDefault();closeInfo();});$('#info-dialog').addEventListener('click',e=>{if(e.target===$('#info-dialog')){const b=e.target.getBoundingClientRect();if(e.clientX<b.left||e.clientX>b.right||e.clientY<b.top||e.clientY>b.bottom)closeInfo();}});
$('.size-guide').addEventListener('click',()=>showInfo(`<p class="eyebrow">LA COLLECTION SIGNATURE</p><h2>Ihre Größe.</h2><p>Für ${byId[currentProduct].name} in ${variantFor(currentProduct).name} sind in dieser Vorschau S, M, L und XL auswählbar. Verbindliche Maße und Passformhinweise folgen mit der finalen Kollektion.</p>`));
$('#privacy-trigger').addEventListener('click',()=>showInfo('<p class="eyebrow">DESIGNVORSCHAU</p><h2>Datenschutz.</h2><p>Diese Vorschau verwendet keinen Analyse- oder Marketingcode. Die Produktauswahl wird im lokalen Speicher Ihres Browsers gespeichert. Sie können sie durch Entfernen der Stücke oder Löschen der Websitedaten zurücksetzen.</p><p>Die 3D-Dateien und der Viewer werden direkt mit der Website geladen. Für die Schriften wird eine Verbindung zu Google Fonts hergestellt. Das Hosting kann technisch erforderliche Zugriffsdaten verarbeiten.</p><p>Rechtliche Pflichtangaben folgen vor dem öffentlichen Shopstart.</p>'));
heroModels.forEach(viewer=>{
 viewer.dataset.variantColor=selectedColors[viewer.dataset.heroModel];viewer.dataset.requestedModel=absoluteModel(viewer.getAttribute('src'));
 viewer.addEventListener('load',e=>modelReady(viewer,e.detail.url));
 viewer.addEventListener('error',e=>{if(viewerReady(viewer))return;const url=e.detail?.sourceError?.url;if(url&&absoluteModel(url)!==requestedModel(viewer))return;viewer.dataset.failed='true';viewer.showPoster?.();if(viewer===model)refreshCurrentStatus();});
 viewer.addEventListener('progress',e=>{$('.model-progress',viewer).style.setProperty('--progress',`${(e.detail.totalProgress||0)*100}%`);});
 viewer.addEventListener('camera-change',e=>{if(viewer===model&&e.detail.source==='user-interaction')pauseRotation();});
});
updateHeroSlots();refreshColorControls();refreshCurrentStatus();updateRotation();
customElements.whenDefined('model-viewer').then(()=>{customElements.get('model-viewer').minimumRenderScale=.75;heroModels.forEach(viewer=>{if(viewer.loaded&&!viewer.dataset.readyModel)modelReady(viewer,viewer.getAttribute('src'));});});
function pauseRotation(){autoRotationEnabled=false;updateRotation();}
function rotate(delta){if(!viewerReady(model))return;model.dismissPoster?.();resetImageControl();pauseRotation();const orbit=model.getCameraOrbit();model.cameraOrbit=`${orbit.theta*180/Math.PI+delta}deg ${orbit.phi*180/Math.PI}deg ${orbit.radius}m`;}
$('#image-view').addEventListener('click',()=>{const image=$('#image-view').getAttribute('aria-pressed')!=='true';$('#image-view').setAttribute('aria-pressed',String(image));$('#image-view').textContent=image?'3D':'Bild';$('#image-view').setAttribute('aria-label',image?'Zur 3D-Ansicht wechseln':'Zum Produktbild wechseln');if(image){pauseRotation();model.showPoster?.();$('#model-state').textContent=`Produktbild · ${variantFor(currentProduct).name} / Gold`;}else if(viewerReady(model)){modelReady();}});
$('#rotate-left').addEventListener('click',()=>rotate(-35));$('#rotate-right').addEventListener('click',()=>rotate(35));
$('#reset-view').addEventListener('click',()=>{pauseRotation();model.resetTurntableRotation?.(0);model.setAttribute('camera-orbit','0deg 80deg 105%');model.jumpCameraToGoal?.();});
$('#rotation-toggle').addEventListener('click',()=>{autoRotationEnabled=!autoRotationEnabled;updateRotation();});
if(reducedMotion.matches)pauseRotation();reducedMotion.addEventListener('change',()=>{if(reducedMotion.matches)pauseRotation();});
const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');observer.unobserve(e.target);}}),{threshold:.1});$$('.reveal').forEach(el=>observer.observe(el));
let ticking=false;function updateScroll(){const y=scrollY;if(!reducedMotion.matches&&innerWidth>800&&y<1000){$('.hero-scene').style.transform=`translateY(${y*.16}px) scale(1.035)`;}ticking=false;}
addEventListener('scroll',()=>{if(!ticking){requestAnimationFrame(updateScroll);ticking=true;}},{passive:true});
renderCart();
