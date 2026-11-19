'use strict';
(() => {
 const $=selector=>document.querySelector(selector), $$=selector=>[...document.querySelectorAll(selector)];
 const products=window.CR_PRODUCTS,colors=window.CR_COLORS,byId=Object.fromEntries(products.map(p=>[p.id,p]));
 const storage=window.CRPrivacy.selectionStorage,sizes=window.CR_SIZES;
 const selectedColors=Object.fromEntries(products.map(p=>[p.id,p.defaultColor]));
 let cart=[],activePanel=null,panelTrigger=null,toastTimer,activeFilter='all';
 const approvedPrice=id=>{const approved=window.CR_STORE_PRICES?.currency==='eur'?window.CR_STORE_PRICES.products?.[id]?.amount:null,example=window.CR_COMMERCE_CONFIG?.demoCheckout?.enabled===true?window.CR_COMMERCE_CONFIG.demoCheckout.productPrices?.[id]:null,value=approved??example;return Number.isSafeInteger(value)&&value>0?value:null;};
 const money=value=>new Intl.NumberFormat(window.CRI18N?.getLanguage()||document.documentElement.lang||'de',{style:'currency',currency:'EUR'}).format(value/100);
 const create=(tag,text,className)=>{const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(className)el.className=className;return el;};
 const url=(id,color=selectedColors[id],size='M')=>'product.html?'+new URLSearchParams({product:id,color,size});
 function loadCart(){try{const saved=storage.getItem('cr-selection-v3');const rows=JSON.parse(saved??storage.getItem('cr-selection-v2')??'[]');cart=Array.isArray(rows)?rows.map(row=>saved===null?{...row,color:'bordeaux'}:row).filter(row=>row&&byId[row.product]?.variants[row.color]&&sizes.includes(row.size)&&Number.isInteger(row.qty)&&row.qty>0&&row.qty<=20).slice(0,60):[];}catch{cart=[];}}
 function toast(message){$('#toast').textContent=message;$('#toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),3200);}
 function closePanels(restore=true){if(!activePanel)return;activePanel.close();activePanel=null;document.body.classList.remove('modal-open');if(restore)panelTrigger?.focus({preventScroll:true});}
 function openPanel(name,trigger){closePanels(false);const panel=$('#'+name+'-panel');if(!panel)return;activePanel=panel;panelTrigger=trigger||document.activeElement;panel.showModal();document.body.classList.add('modal-open');if(name==='search'){$('#search-input').value='';renderSearch('');$('#search-input').focus();}}
 $$('[data-panel]').forEach(button=>button.addEventListener('click',()=>openPanel(button.dataset.panel,button)));
 $$('.close-panel').forEach(button=>button.addEventListener('click',()=>closePanels()));
 $$('[data-cart-continue]').forEach(link=>link.addEventListener('click',()=>closePanels(false)));
 $$('.side-panel').forEach(panel=>{panel.addEventListener('cancel',event=>{event.preventDefault();closePanels();});panel.addEventListener('click',event=>{if(event.target!==panel)return;const rect=panel.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)closePanels();});});
 $$('.menu-links a').forEach(link=>link.addEventListener('click',()=>closePanels(false)));
 function renderProducts(filter='all'){
  activeFilter=filter;
  const grid=$('#product-grid');grid.replaceChildren();
  ['halfzip','body','trousers','trousers-men'].map(id=>byId[id]).filter(product=>filter==='all'||product.id===filter).forEach((product,index)=>{
   const variant=product.variants[selectedColors[product.id]],card=create('article',undefined,'product-card');card.dataset.productId=product.id;
   const imageLink=create('a',undefined,'product-card-image');imageLink.href=url(product.id);imageLink.setAttribute('aria-label',product.name+' ansehen');
   const img=create('img');img.width=600;img.height=750;img.loading='lazy';window.CRPhotos.apply(img,variant,product.name+' in '+variant.name+' — Studiofoto');
   const number=create('span',String(index+1).padStart(2,'0'),'product-card-index'),arrow=create('span','↗','card-arrow');number.setAttribute('aria-hidden','true');arrow.setAttribute('aria-hidden','true');imageLink.append(img,number,arrow);
   const info=create('div',undefined,'product-card-info'),title=create('h3'),titleLink=create('a',product.name);titleLink.href=url(product.id);title.append(titleLink);info.append(title,create('span',approvedPrice(product.id)===null?'Preis folgt':money(approvedPrice(product.id)),'product-card-price'));
   const swatches=create('div',undefined,'card-colors');swatches.setAttribute('role','group');swatches.setAttribute('aria-label',product.name+' – Farbe wählen');
   colors.forEach(color=>{const button=create('button');button.type='button';button.style.setProperty('--swatch',color.swatch);button.setAttribute('aria-label',color.name);button.setAttribute('aria-pressed',String(color.id===variant.id));button.title=color.name;button.append(create('span'));button.addEventListener('click',()=>{selectedColors[product.id]=color.id;window.CRPhotos.apply(img,product.variants[color.id],product.name+' in '+color.name+' — Studiofoto');imageLink.href=titleLink.href=url(product.id);[...swatches.children].forEach(b=>b.setAttribute('aria-pressed',String(b===button)));});swatches.append(button);});
   card.append(imageLink,info,create('p',product.type,'product-card-type'),swatches);grid.append(card);
  });
 }
 $$('[data-filter]').forEach(button=>button.addEventListener('click',()=>{$$('[data-filter]').forEach(b=>{const active=b===button;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});renderProducts(button.dataset.filter);}));
 function renderSearch(query){const target=$('#search-results');target.replaceChildren();const term=query.trim().toLocaleLowerCase();const matches=products.filter(p=>[p.name,p.type,p.category,p.description,p.id.startsWith('trousers')?'trousers pants pantalon hose hosen damen herren frauen männer women men femme homme':p.id==='body'?'bodysuit body':'half zip pullover',...colors.map(c=>c.aliases)].join(' ').toLocaleLowerCase().includes(term));if(!matches.length){target.append(create('p','Keine passenden Stücke gefunden.','search-empty'));return;}matches.forEach(product=>{const link=create('a',undefined,'search-result');link.href=url(product.id);const image=create('img');window.CRPhotos.apply(image,product.variants[selectedColors[product.id]]);image.width=75;image.height=95;image.alt='';const copy=create('div');copy.append(create('h3',product.name),create('p',product.type));link.append(image,copy);target.append(link);});}
 $('#search-input').addEventListener('input',event=>renderSearch(event.target.value));
 function saveCart(){try{storage.setItem('cr-selection-v3',JSON.stringify(cart));}catch{toast('Ihr Warenkorb kann in diesem Browser nicht gespeichert werden.');}renderCart();}
 function renderCart(){
  const container=$('#cart-items');container.replaceChildren();const count=cart.reduce((n,row)=>n+row.qty,0);$('#cart-count').textContent=String(count);$('.cart-trigger').setAttribute('aria-label','Warenkorb öffnen · '+count);$('#cart-summary').hidden=!cart.length;
  if(!cart.length){container.append(create('p','Ihr Warenkorb ist noch leer. Entdecken Sie die Kollektion und wählen Sie Ihr erstes Stück.','cart-empty'));const link=create('a','Die Kollektion entdecken','text-link');link.href='#collection';link.addEventListener('click',()=>closePanels(false));container.append(link);return;}
  let subtotal=0,allPrices=true;
  cart.forEach((row,index)=>{
   const product=byId[row.product],variant=product.variants[row.color],item=create('article',undefined,'cart-item'),image=create('img');window.CRPhotos.apply(image,variant);image.width=85;image.height=110;
   const copy=create('div'),heading=create('div',undefined,'cart-item-heading'),title=create('h3'),link=create('a',product.name);link.href=url(row.product,row.color,row.size);title.append(link);heading.append(title);
   const amount=approvedPrice(product.id);if(amount===null)allPrices=false;else subtotal+=amount*row.qty;
   heading.append(create('strong',amount===null?'Preis folgt':money(amount*row.qty),'cart-item-price'));copy.append(heading,create('p',variant.name+' / '+row.size));
   if(amount!==null){const unit=create('p',undefined,'cart-unit-price');unit.append(create('span',money(amount)),document.createTextNode(' / '),create('span','Stück'));copy.append(unit);}
   const actions=create('div',undefined,'cart-item-actions'),quantity=create('div',undefined,'quantity'),minus=create('button','−'),plus=create('button','+'),quantityLabel=create('span',String(row.qty));minus.type=plus.type='button';minus.setAttribute('aria-label',product.name+' – Menge verringern');plus.setAttribute('aria-label',product.name+' – Menge erhöhen');minus.disabled=row.qty===1;plus.disabled=row.qty===20;
   minus.addEventListener('click',()=>{if(row.qty>1){row.qty--;saveCart();}});plus.addEventListener('click',()=>{if(row.qty<20){row.qty++;saveCart();}});quantity.append(minus,quantityLabel,plus);
   const remove=create('button','Entfernen','remove-item');remove.type='button';remove.setAttribute('aria-label',product.name+' '+variant.name+' '+row.size+' entfernen');remove.addEventListener('click',()=>{cart.splice(index,1);saveCart();toast('Stück aus Ihrem Warenkorb entfernt.');});actions.append(quantity,remove);copy.append(actions);item.append(image,copy);container.append(item);
  });
  $('#cart-subtotal').textContent=allPrices?money(subtotal):'Wird an der Kasse bestätigt';
 }
 window.CRMaison=Object.freeze({selection:()=>cart[0]?{product:cart[0].product,color:cart[0].color,size:cart[0].size}:{product:'halfzip',color:selectedColors.halfzip,size:'M'},closePanels:()=>closePanels(false),syncCatalog:()=>{}});
 loadCart();renderProducts();renderCart();
 window.addEventListener('cr:privacychange',()=>{loadCart();renderCart();});window.addEventListener('pageshow',()=>{loadCart();renderCart();});window.addEventListener('cr:languagechange',()=>{renderProducts(activeFilter);renderCart();});
 const requested=new URL(location.href).searchParams.get('panel');if(['cart','search','menu'].includes(requested))openPanel(requested);
})();
