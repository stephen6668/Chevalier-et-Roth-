'use strict';
const selectionStorage=window.CRPrivacy.selectionStorage;
(() => {
 const get=id=>document.getElementById(id),products=window.CR_PRODUCTS||[],colors=window.CR_COLORS||[],api=window.CRBackend;
 const validSizes=window.CR_SIZES||['S','M','L'],params=new URLSearchParams(location.search),rawProduct=params.get('product');
 const product=products.find(p=>p.id===(rawProduct||'halfzip'));

 function node(tag,text,className){const element=document.createElement(tag);if(text!==undefined)element.textContent=String(text);if(className)element.className=className;return element;}
 function closeDialog(dialog){dialog.close();document.body.classList.toggle('modal-open',!!document.querySelector('dialog[open]'));}
 function openDialog(dialog){dialog.showModal();document.body.classList.add('modal-open');}
 const privacy=get('pdp-privacy-dialog'),sizeDialog=get('pdp-size-dialog'),zoom=get('pdp-zoom-dialog');
 document.querySelectorAll('[data-pdp-privacy]').forEach(button=>button.addEventListener('click',()=>openDialog(privacy)));
 for(const [dialog,button] of [[privacy,'pdp-privacy-close'],[sizeDialog,'pdp-size-close'],[zoom,'pdp-zoom-close']]){
  get(button).addEventListener('click',()=>closeDialog(dialog));
  dialog.addEventListener('cancel',event=>{event.preventDefault();closeDialog(dialog);});
 }
 if(!product){get('pdp-not-found').hidden=false;document.title='Produkt nicht gefunden — Chevalier & Roth';return;}
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let color=colors.some(c=>c.id===params.get('color'))?params.get('color'):'bordeaux',size=validSizes.includes(params.get('size'))?params.get('size'):'M';
 let gallery=[],imageIndex=0,submitting=false;
 const descriptions={
  body:{subtitle:'Col V · La pièce essentielle',silhouette:'Un V profond, une ligne près du corps. Ein tiefer V-Ausschnitt und lange Ärmel prägen die körpernahe Silhouette des Body.',details:'Das goldfarbene CR-Monogramm setzt einen ruhigen Akzent. Wählen Sie Beige, Navyblau oder Bordeaux und entdecken Sie die Silhouette aus jeder Perspektive.'},
  halfzip:{subtitle:'Signature · L’allure moderne',silhouette:'Ein markanter Stehkragen, ein kurzer Reißverschluss und lange Ärmel. Die klare Silhouette des Half-Zip verbindet eine sportliche Form mit dem Ausdruck der Maison.',details:'Ein goldfarbener Reißverschluss und das CR-Monogramm setzen Akzente. Drei Farbwelten – Beige, Navyblau und Bordeaux – geben der Silhouette ihren eigenen Charakter.'},
  trousers:{subtitle:'Femme · Palazzo',silhouette:'Eine Palazzohose für Damen mit weitem Bein und klaren Bundfalten. Die großzügige Silhouette fällt vom Bund bis zum Saum weit und fließend.',details:'Ein goldfarbener Knopf am Bund und das CR-Monogramm setzen feine Akzente. Entdecken Sie die Damenhose in Beige, Navyblau und Bordeaux.'},
  'trousers-men':{subtitle:'Homme · Ligne droite',silhouette:'Eine Herrenhose mit gerader, schmalerer Beinform und klaren Bundfalten. Der Schnitt führt das Bein ruhiger und weniger weit als bei der Damen-Palazzohose.',details:'Ein goldfarbener Knopf am Bund und das CR-Monogramm prägen die Herrenhose. Wählen Sie Beige, Navyblau oder Bordeaux.'}
 };
 const variant=()=>product.variants[color];
 function updateURL(){const url=new URL(location.href);url.searchParams.set('product',product.id);url.searchParams.set('color',color);url.searchParams.set('size',size);history.replaceState(null,'',url);}
 function productURL(id){const query=new URLSearchParams({product:id,color,size});return 'product.html?'+query;}
 function getGallery(){const entries=window.CR_PRODUCT_GALLERIES?.[product.id]?.[color],fallback={src:'assets/studio-photo-pending.svg',alt:product.name+' in '+variant().name+' – Studiofoto folgt',label:'Studiofoto folgt'};if(!Array.isArray(entries)||!entries.length)return [fallback];return entries.filter(entry=>entry&&typeof entry.src==='string'&&entry.src).map(entry=>({...entry,src:entry.src,alt:entry.alt||fallback.alt,label:entry.label||'Studioansicht'}));}
 function photoImage(element,image,onFallback){
  const requested=image.src;
  element.onerror=()=>{
   if(element.getAttribute('src')!==requested||requested===image.placeholderSrc)return;
   const next=requested!==image.fallbackSrc?image.fallbackSrc:image.placeholderSrc;
   if(!next||next===requested)return;
   const placeholder=next===image.placeholderSrc;
   const replacement={src:next,alt:placeholder?image.placeholderAlt:image.fallbackAlt,label:placeholder?image.placeholderLabel:image.fallbackLabel};
   if(onFallback)onFallback(replacement);else photoImage(element,{...image,...replacement});
  };
  element.src=requested;element.alt=image.alt||'';
 }
 function setImage(index){
  imageIndex=(index+gallery.length)%gallery.length;const image=gallery[imageIndex],main=get('pdp-main-image');
  photoImage(main,image,replacement=>{
   if(gallery[imageIndex]!==image)return;
   Object.assign(image,replacement);
   const thumb=get('pdp-thumbnails').children[imageIndex];
   if(thumb){thumb.querySelector('img').src=image.src;thumb.setAttribute('aria-label',image.label+' – Bild '+(imageIndex+1));}
   setImage(imageIndex);updateWaitlistSummary();
  });
  get('pdp-gallery-count').textContent=String(imageIndex+1).padStart(2,'0')+' / '+String(gallery.length).padStart(2,'0');
  get('pdp-image-caption').textContent=image.label+' · '+variant().name;
  const pending=image.src==='assets/studio-photo-pending.svg';get('pdp-image-zoom').disabled=pending;get('pdp-photo-retry').hidden=!pending;get('pdp-image-stage').classList.toggle('photo-pending',pending);
  [...get('pdp-thumbnails').children].forEach((button,i)=>button.setAttribute('aria-pressed',String(i===imageIndex)));
  for(const id of ['pdp-gallery-previous','pdp-gallery-next','pdp-zoom-previous','pdp-zoom-next'])get(id).disabled=gallery.length<2;
  photoImage(get('pdp-zoom-image'),image);get('pdp-zoom-caption').textContent=product.name+' · '+variant().name+' · '+(imageIndex+1)+' / '+gallery.length;
 }
 function renderGallery(retry=false){
  gallery=getGallery();if(retry)gallery.forEach(image=>{if(!image.src.endsWith('.svg'))image.src+=(image.src.includes('?')?'&':'?')+'photo_retry='+Date.now();});
  const thumbnails=get('pdp-thumbnails');thumbnails.replaceChildren();
  gallery.forEach((image,i)=>{const button=node('button');button.type='button';button.dataset.pdpImage=String(i);button.setAttribute('aria-label',image.label+' – Bild '+(i+1));button.setAttribute('aria-pressed',String(i===0));const thumb=node('img');photoImage(thumb,{...image,alt:'',fallbackAlt:''});thumb.width=66;thumb.height=83;thumb.loading='lazy';button.append(thumb);button.addEventListener('click',()=>setImage(i));thumbnails.append(button);});
  setImage(0);
 }
 function setColor(next){if(!product.variants[next])return;color=next;get('pdp-color-name').textContent=variant().name;document.querySelectorAll('[data-pdp-color]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.pdpColor===color)));renderGallery();updateWaitlistSummary();renderRelated();updateURL();}
 function setSize(next){if(!validSizes.includes(next))return;size=next;document.querySelectorAll('[data-pdp-size]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.pdpSize===size)));updateWaitlistSummary();renderRelated();updateURL();}
 function updateWaitlistSummary(){photoImage(get('pdp-waitlist-image'),gallery[0]||getGallery()[0]);get('pdp-waitlist-product').textContent=product.name;get('pdp-waitlist-variant').textContent=variant().name+' / '+size+' · Goldene Details';}
 function renderRelated(){get('pdp-checkout').href='checkout.html?'+new URLSearchParams({product:product.id,color,size});const container=get('pdp-related-grid');container.replaceChildren();products.filter(p=>p.id!==product.id).forEach(p=>{const card=node('a',undefined,'pdp-related-card');card.href=productURL(p.id);card.dataset.pdpRelated=p.id;const frame=node('div',undefined,'pdp-related-image'),image=node('img');const photos=window.CR_PRODUCT_GALLERIES?.[p.id]?.[color];photoImage(image,photos?.[0]||{src:'assets/studio-photo-pending.svg',alt:p.name+' – Studiofoto folgt'});image.loading='lazy';const label=node('span'),type=node('span',p.category),arrow=node('span','↗');arrow.setAttribute('aria-hidden','true');label.append(type,arrow);frame.append(image,label);card.append(frame,node('h3',p.name),node('p',variant().name+' / Gold'));container.append(card);});}
 document.title=product.name+' — Chevalier & Roth';get('pdp-breadcrumb-name').textContent=product.name;get('pdp-title').textContent=product.name;get('pdp-subtitle').textContent=descriptions[product.id].subtitle;get('pdp-description').textContent=product.description;get('pdp-silhouette').textContent=descriptions[product.id].silhouette;get('pdp-details-copy').textContent=descriptions[product.id].details;get('pdp-number').textContent='PIÈCE N° '+String(products.findIndex(p=>p.id===product.id)+1).padStart(2,'0');
 colors.forEach(entry=>{const button=node('button');button.type='button';button.dataset.pdpColor=entry.id;button.style.setProperty('--swatch',entry.swatch);button.setAttribute('aria-label',entry.name);button.title=entry.name;button.setAttribute('aria-pressed','false');const swatch=node('span');swatch.setAttribute('aria-hidden','true');button.append(swatch);button.addEventListener('click',()=>setColor(entry.id));get('pdp-colors').append(button);});
 validSizes.forEach(entry=>{const button=node('button',entry);button.type='button';button.dataset.pdpSize=entry;button.setAttribute('aria-pressed','false');button.addEventListener('click',()=>setSize(entry));get('pdp-sizes').append(button);});
 get('pdp-photo-retry').addEventListener('click',()=>{renderGallery(true);updateWaitlistSummary();});
 get('pdp-gallery-previous').addEventListener('click',()=>setImage(imageIndex-1));get('pdp-gallery-next').addEventListener('click',()=>setImage(imageIndex+1));get('pdp-image-zoom').addEventListener('click',()=>openDialog(zoom));get('pdp-zoom-previous').addEventListener('click',()=>setImage(imageIndex-1));get('pdp-zoom-next').addEventListener('click',()=>setImage(imageIndex+1));
 zoom.addEventListener('keydown',event=>{if(event.key==='ArrowLeft'){event.preventDefault();setImage(imageIndex-1);}if(event.key==='ArrowRight'){event.preventDefault();setImage(imageIndex+1);}});
 get('pdp-size-guide').addEventListener('click',()=>openDialog(sizeDialog));
 get('pdp-waitlist-open').addEventListener('click',()=>{get('pdp-waitlist').scrollIntoView({behavior:reduced.matches?'instant':'smooth',block:'start'});get('pdp-waitlist-name').focus({preventScroll:true});});
 get('pdp-waitlist-form').addEventListener('submit',async event=>{
  event.preventDefault();const form=event.currentTarget;if(submitting||!form.reportValidity())return;
  const selected={productId:product.id,productName:product.name,color:variant().name,size,name:get('pdp-waitlist-name').value,email:get('pdp-waitlist-email').value,privacyAccepted:get('pdp-waitlist-consent').checked};
  submitting=true;form.setAttribute('aria-busy','true');const controls=[...form.elements],status=get('pdp-waitlist-message');controls.forEach(control=>control.disabled=true);status.dataset.state='pending';status.textContent='Ihre Auswahl wird gespeichert …';
  try{if(!api)throw new Error('Die Verbindung konnte nicht geladen werden. Bitte laden Sie die Seite neu.');const row=await api.addWaitlist(selected);if(!row?.$id)throw new Error('Die Speicherung wurde nicht bestätigt. Bitte prüfen Sie den Eintrag vor einem erneuten Versuch.');status.dataset.state='success';status.textContent=product.name+' in '+selected.color+' / '+selected.size+' ist vorgemerkt. Wir melden uns zum Start.';form.reset();}
  catch(error){status.dataset.state='error';status.textContent=api?.errorMessage?api.errorMessage(error):error.message;}
  finally{submitting=false;form.setAttribute('aria-busy','false');controls.forEach(control=>control.disabled=false);}
 });
 function readSelection(){
  try{const v3=selectionStorage.getItem('cr-selection-v3'),saved=JSON.parse(v3===null?(selectionStorage.getItem('cr-selection-v2')||'[]'):v3);if(!Array.isArray(saved))return [];return saved.map(entry=>v3===null?{...entry,color:'bordeaux'}:entry).filter(entry=>entry&&products.find(p=>p.id===entry.product)?.variants[entry.color]&&validSizes.includes(entry.size)&&Number.isInteger(entry.qty)&&entry.qty>0&&entry.qty<=20).slice(0,60);}catch{return [];}
 }
 function selectionCount(){const count=readSelection().reduce((sum,item)=>sum+item.qty,0);get('pdp-selection-count').textContent=String(count);get('pdp-selection-count').closest('a').setAttribute('aria-label','Warenkorb öffnen · '+count);}
 get('pdp-selection-add').addEventListener('click',()=>{
  const selection=readSelection(),existing=selection.find(entry=>entry.product===product.id&&entry.color===color&&entry.size===size),status=get('pdp-selection-message');
  get('pdp-cart-feedback').hidden=false;
  if(existing?.qty>=20){status.textContent='Maximal 20 Stück pro Variante.';return;}if(!existing&&selection.length>=60){status.textContent='Ihr Warenkorb enthält bereits 60 Varianten. Bitte entfernen Sie zunächst ein Stück.';return;}
  if(existing)existing.qty++;else selection.push({product:product.id,color,size,qty:1});
  try{selectionStorage.setItem('cr-selection-v3',JSON.stringify(selection));selectionCount();status.textContent=product.name+' · '+variant().name+' / '+size+' wurde Ihrem Warenkorb hinzugefügt.';}catch{status.textContent='Der Warenkorb konnte auf diesem Gerät nicht gespeichert werden. Sie können über „Direkt zur Kasse“ fortfahren.';}
 });
 addEventListener('storage',event=>{if(event.key==='cr-selection-v3'||event.key==='cr-selection-v2')selectionCount();});
 addEventListener('cr:privacychange',selectionCount);
 addEventListener('pageshow',selectionCount);
 setColor(color);setSize(size);selectionCount();get('pdp-content').hidden=false;
 const listed=window.CR_STORE_PRICES?.products?.[product.id],example=window.CR_COMMERCE_CONFIG?.demoCheckout?.enabled===true?window.CR_COMMERCE_CONFIG.demoCheckout.productPrices?.[product.id]:null;
 const approved=listed||(Number.isSafeInteger(example)&&example>0?{amount:example,demo:true}:null);
 function renderApprovedPrice(){if(Number.isSafeInteger(approved?.amount)&&approved.amount>0){get('pdp-price').textContent=new Intl.NumberFormat(window.CRI18N?.getLanguage()||document.documentElement.lang||'de',{style:'currency',currency:'EUR'}).format(approved.amount/100);get('pdp-price-note').textContent=approved.demo?'Demopreis · keine echte Bestellung':'Zuzüglich Versand';}}
 renderApprovedPrice();addEventListener('cr:languagechange',renderApprovedPrice);
 if(api?.publicProducts)api.publicProducts().then(rows=>{if(approved)return;const row=rows.find(item=>item.$id===api.productIds[product.id]);if(!row)return;const raw=Number(row.salePrice)>0&&Number(row.salePrice)<=Number(row.price)?Number(row.salePrice):Number(row.price);if(!Number.isFinite(raw)||raw<=0)return;const config=api.config,price=raw*(config.pricesIncludeVat?1:1+config.vatRate);get('pdp-price').textContent=new Intl.NumberFormat('de-DE',{style:'currency',currency:config.currency||'EUR'}).format(price);get('pdp-price-note').textContent='Vorläufig · inkl. '+String(Math.round(config.vatRate*100))+' % MwSt. · Kein Verkauf';}).catch(()=>{if(!approved)get('pdp-catalogue-message').textContent='Aktuelle Preisangaben sind gerade nicht erreichbar. Ihre Farb- und Größenauswahl bleibt verfügbar.';});
})();
