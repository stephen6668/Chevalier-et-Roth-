'use strict';
(() => {
 const get=id=>document.getElementById(id),products=window.CR_PRODUCTS||[],colors=window.CR_COLORS||[],api=window.CRBackend;
 const validSizes=['S','M','L','XL'],params=new URLSearchParams(location.search),rawProduct=params.get('product');
 const product=products.find(p=>p.id===(rawProduct||'halfzip'));
 get('pdp-year').textContent=String(new Date().getFullYear());
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
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'),viewer=get('pdp-model'),modelStage=get('pdp-model-stage');
 let color=colors.some(c=>c.id===params.get('color'))?params.get('color'):'bordeaux',size=validSizes.includes(params.get('size'))?params.get('size'):'M';
 let gallery=[],imageIndex=0,view='images',modelStarted=false,modelReady=false,requestedModel='',lastSuccessfulModel='',rotation=false,submitting=false;
 const descriptions={
  body:{subtitle:'Col V · La pièce essentielle',silhouette:'Un V profond, une ligne près du corps. Ein tiefer V-Ausschnitt und lange Ärmel prägen die körpernahe Silhouette des Body.',details:'Das goldfarbene CR-Monogramm setzt einen ruhigen Akzent. Wählen Sie Bordeaux, Schwarz, Grau, Beige oder Navyblau und entdecken Sie die Silhouette aus jeder Perspektive.'},
  halfzip:{subtitle:'Signature · L’allure moderne',silhouette:'Ein markanter Stehkragen, ein kurzer Reißverschluss und lange Ärmel. Die klare Silhouette des Half-Zip verbindet eine sportliche Form mit dem Ausdruck der Maison.',details:'Ein goldfarbener Reißverschluss und das CR-Monogramm setzen Akzente. Fünf Farbwelten – Bordeaux, Schwarz, Grau, Beige und Navyblau – geben der Silhouette ihren eigenen Charakter.'},
  trousers:{subtitle:'Jambe large · Une ligne libre',silhouette:'Eine weite Beinform mit fließender Linie. Bund, Kordelzug und die großzügige Silhouette geben der Hose ihren entspannten, klaren Ausdruck.',details:'Goldfarbene Kordelenden und das CR-Monogramm verbinden die Hose mit der Signature-Kollektion. Entdecken Sie das weite Bein in Bordeaux, Schwarz, Grau, Beige oder Navyblau.'}
 };
 const variant=()=>product.variants[color],absolute=url=>new URL(url,document.baseURI).href;
 function updateURL(){const url=new URL(location.href);url.searchParams.set('product',product.id);url.searchParams.set('color',color);url.searchParams.set('size',size);history.replaceState(null,'',url);}
 function productURL(id){const query=new URLSearchParams({product:id,color,size});return 'product.html?'+query;}
 function getGallery(){const entries=window.CR_PRODUCT_GALLERIES?.[product.id]?.[color],fallback={src:variant().image,alt:product.name+' in '+variant().name,label:'Produktansicht'};if(!Array.isArray(entries)||!entries.length)return [fallback];return entries.filter(entry=>entry&&typeof entry.src==='string'&&entry.src).map(entry=>({src:entry.src,alt:entry.alt||fallback.alt,label:entry.label||'Produktansicht'}));}
 function setImage(index){
  imageIndex=(index+gallery.length)%gallery.length;const image=gallery[imageIndex],main=get('pdp-main-image');main.src=image.src;main.alt=image.alt;
  get('pdp-gallery-count').textContent=String(imageIndex+1).padStart(2,'0')+' / '+String(gallery.length).padStart(2,'0');
  get('pdp-image-caption').textContent=image.label+' · '+variant().name;
  [...get('pdp-thumbnails').children].forEach((button,i)=>button.setAttribute('aria-pressed',String(i===imageIndex)));
  for(const id of ['pdp-gallery-previous','pdp-gallery-next','pdp-zoom-previous','pdp-zoom-next'])get(id).disabled=gallery.length<2;
  get('pdp-zoom-image').src=image.src;get('pdp-zoom-image').alt=image.alt;get('pdp-zoom-caption').textContent=product.name+' · '+variant().name+' · '+(imageIndex+1)+' / '+gallery.length;
 }
 function renderGallery(){
  gallery=getGallery();if(!gallery.length)gallery=[{src:variant().image,alt:product.name+' in '+variant().name,label:'Produktansicht'}];
  const thumbnails=get('pdp-thumbnails');thumbnails.replaceChildren();
  gallery.forEach((image,i)=>{const button=node('button');button.type='button';button.dataset.pdpImage=String(i);button.setAttribute('aria-label',image.label+' – Bild '+(i+1));button.setAttribute('aria-pressed',String(i===0));const thumb=node('img');thumb.src=image.src;thumb.alt='';thumb.width=66;thumb.height=83;thumb.loading='lazy';button.append(thumb);button.addEventListener('click',()=>{setView('images');setImage(i);});thumbnails.append(button);});
  setImage(0);
 }
 function updateRotation(){viewer.toggleAttribute('auto-rotate',view==='model'&&modelReady&&rotation&&!reduced.matches);const button=get('pdp-model-rotation');button.setAttribute('aria-pressed',String(rotation));button.setAttribute('aria-label',rotation?'Automatische Drehung pausieren':'Automatische Drehung starten');button.textContent=rotation?'Ⅱ':'▷';}
 function markModelReady(url){
  if(!url||url!==requestedModel||absolute(viewer.getAttribute('src'))!==requestedModel)return;
  modelReady=true;lastSuccessfulModel=url;viewer.dataset.readyModel=url;modelStage.classList.add('is-ready');
  viewer.resetTurntableRotation?.(0);viewer.jumpCameraToGoal?.();viewer.dismissPoster?.();get('pdp-model-status').textContent='3D-Ansicht · '+variant().name+' · Zum Drehen ziehen';updateRotation();
 }
 async function recoverCachedModel(url){
  // A rapid A → B → A can keep the already loaded A without another load event.
  // Wait for the viewer's reactive src update before inspecting its loaded state.
  try{await viewer.updateComplete;}catch{return;}
  if(url===requestedModel&&viewer.loaded&&lastSuccessfulModel===url&&viewer.dataset.readyModel===url)markModelReady(url);
 }
 function loadModel(){
  modelStarted=true;const selected=variant(),url=absolute(selected.model);if(requestedModel===url)return;
  requestedModel=url;modelReady=false;modelStage.classList.remove('is-ready');viewer.removeAttribute('auto-rotate');viewer.setAttribute('poster',selected.image);viewer.setAttribute('alt','Drehbare 3D-Ansicht: '+product.name+' in '+selected.name);
  get('pdp-model-poster').src=selected.image;get('pdp-model-overlay').src=selected.image;get('pdp-model-status').textContent='3D-Ansicht in '+selected.name+' wird geladen …';
  viewer.showPoster?.();viewer.setAttribute('src',selected.model);viewer.dataset.requestedModel=url;viewer.dataset.variantColor=color;updateRotation();
  recoverCachedModel(url);
 }
 function setView(next){view=next;get('pdp-image-stage').hidden=view!=='images';modelStage.hidden=view!=='model';get('pdp-view-images').setAttribute('aria-pressed',String(view==='images'));get('pdp-view-model').setAttribute('aria-pressed',String(view==='model'));get('pdp-thumbnails').hidden=view!=='images';get('pdp-image-caption').hidden=view!=='images';if(view==='model')loadModel();updateRotation();}
 function setColor(next){if(!product.variants[next])return;color=next;get('pdp-color-name').textContent=variant().name;document.querySelectorAll('[data-pdp-color]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.pdpColor===color)));renderGallery();if(modelStarted)loadModel();updateWaitlistSummary();renderRelated();updateURL();}
 function setSize(next){if(!validSizes.includes(next))return;size=next;document.querySelectorAll('[data-pdp-size]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.pdpSize===size)));updateWaitlistSummary();renderRelated();updateURL();}
 function updateWaitlistSummary(){get('pdp-waitlist-image').src=variant().image;get('pdp-waitlist-product').textContent=product.name;get('pdp-waitlist-variant').textContent=variant().name+' / '+size+' · Goldene Details';}
 function renderRelated(){const container=get('pdp-related-grid');container.replaceChildren();products.filter(p=>p.id!==product.id).forEach(p=>{const card=node('a',undefined,'pdp-related-card');card.href=productURL(p.id);card.dataset.pdpRelated=p.id;const frame=node('div',undefined,'pdp-related-image'),image=node('img');const photos=window.CR_PRODUCT_GALLERIES?.[p.id]?.[color];image.src=photos?.[0]?.src||p.variants[color].image;image.alt=p.name+' in '+variant().name;image.loading='lazy';const label=node('span'),type=node('span',p.category),arrow=node('span','↗');arrow.setAttribute('aria-hidden','true');label.append(type,arrow);frame.append(image,label);card.append(frame,node('h3',p.name),node('p',variant().name+' / Gold'));container.append(card);});}
 document.title=product.name+' — Chevalier & Roth';get('pdp-breadcrumb-name').textContent=product.name;get('pdp-title').textContent=product.name;get('pdp-subtitle').textContent=descriptions[product.id].subtitle;get('pdp-description').textContent=product.description;get('pdp-silhouette').textContent=descriptions[product.id].silhouette;get('pdp-details-copy').textContent=descriptions[product.id].details;get('pdp-number').textContent='PIÈCE N° '+String(products.findIndex(p=>p.id===product.id)+1).padStart(2,'0');
 colors.forEach(entry=>{const button=node('button');button.type='button';button.dataset.pdpColor=entry.id;button.style.setProperty('--swatch',entry.swatch);button.setAttribute('aria-label',entry.name);button.title=entry.name;button.setAttribute('aria-pressed','false');const swatch=node('span');swatch.setAttribute('aria-hidden','true');button.append(swatch);button.addEventListener('click',()=>setColor(entry.id));get('pdp-colors').append(button);});
 validSizes.forEach(entry=>{const button=node('button',entry);button.type='button';button.dataset.pdpSize=entry;button.setAttribute('aria-pressed','false');button.addEventListener('click',()=>setSize(entry));get('pdp-sizes').append(button);});
 get('pdp-view-images').addEventListener('click',()=>setView('images'));get('pdp-view-model').addEventListener('click',()=>setView('model'));
 get('pdp-gallery-previous').addEventListener('click',()=>setImage(imageIndex-1));get('pdp-gallery-next').addEventListener('click',()=>setImage(imageIndex+1));get('pdp-image-zoom').addEventListener('click',()=>openDialog(zoom));get('pdp-zoom-previous').addEventListener('click',()=>setImage(imageIndex-1));get('pdp-zoom-next').addEventListener('click',()=>setImage(imageIndex+1));
 zoom.addEventListener('keydown',event=>{if(event.key==='ArrowLeft'){event.preventDefault();setImage(imageIndex-1);}if(event.key==='ArrowRight'){event.preventDefault();setImage(imageIndex+1);}});
 get('pdp-size-guide').addEventListener('click',()=>openDialog(sizeDialog));
 viewer.addEventListener('load',event=>{if(event.detail?.url)markModelReady(absolute(event.detail.url));});
 viewer.addEventListener('error',event=>{const url=event.detail?.sourceError?.url;if(url&&absolute(url)!==requestedModel)return;if(modelReady)return;modelStage.classList.remove('is-ready');get('pdp-model-status').textContent='3D ist gerade nicht verfügbar. Das passende Produktbild bleibt sichtbar.';updateRotation();});
 viewer.addEventListener('progress',event=>viewer.style.setProperty('--progress',String((event.detail?.totalProgress||0)*100)+'%'));
 function pauseRotation(){rotation=false;updateRotation();}
 viewer.addEventListener('camera-change',event=>{if(event.detail?.source==='user-interaction')pauseRotation();});
 function rotate(delta){if(!modelReady)return;pauseRotation();const orbit=viewer.getCameraOrbit?.();if(!orbit)return;viewer.cameraOrbit=String(orbit.theta*180/Math.PI+delta)+'deg '+String(orbit.phi*180/Math.PI)+'deg '+String(orbit.radius)+'m';}
 get('pdp-model-left').addEventListener('click',()=>rotate(-35));get('pdp-model-right').addEventListener('click',()=>rotate(35));get('pdp-model-rotation').addEventListener('click',()=>{rotation=!rotation;updateRotation();});get('pdp-model-reset').addEventListener('click',()=>{pauseRotation();viewer.resetTurntableRotation?.(0);viewer.setAttribute('camera-orbit','0deg 80deg 105%');viewer.jumpCameraToGoal?.();});reduced.addEventListener('change',()=>{if(reduced.matches)pauseRotation();});
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
  try{const v3=localStorage.getItem('cr-selection-v3'),saved=JSON.parse(v3===null?(localStorage.getItem('cr-selection-v2')||'[]'):v3);if(!Array.isArray(saved))return [];return saved.map(entry=>v3===null?{...entry,color:'bordeaux'}:entry).filter(entry=>entry&&products.find(p=>p.id===entry.product)?.variants[entry.color]&&validSizes.includes(entry.size)&&Number.isInteger(entry.qty)&&entry.qty>0&&entry.qty<=20).slice(0,60);}catch{return [];}
 }
 function selectionCount(){get('pdp-selection-count').textContent=String(readSelection().reduce((sum,item)=>sum+item.qty,0));}
 get('pdp-selection-add').addEventListener('click',()=>{
  const selection=readSelection(),existing=selection.find(entry=>entry.product===product.id&&entry.color===color&&entry.size===size),status=get('pdp-selection-message');
  if(existing?.qty>=20){status.textContent='Maximal 20 Stück pro Variante.';return;}if(!existing&&selection.length>=60){status.textContent='Ihre Auswahl enthält bereits 60 Varianten. Bitte entfernen Sie zunächst ein Stück.';return;}
  if(existing)existing.qty++;else selection.push({product:product.id,color,size,qty:1});
  try{localStorage.setItem('cr-selection-v3',JSON.stringify(selection));selectionCount();status.textContent=product.name+' · '+variant().name+' / '+size+' wurde Ihrer Auswahl hinzugefügt.';}catch{status.textContent='Die Auswahl konnte auf diesem Gerät nicht gespeichert werden. Sie können sich direkt auf der Warteliste vormerken.';}
 });
 addEventListener('storage',event=>{if(event.key==='cr-selection-v3'||event.key==='cr-selection-v2')selectionCount();});
 setColor(color);setSize(size);selectionCount();get('pdp-content').hidden=false;
 if(api?.publicProducts)api.publicProducts().then(rows=>{const row=rows.find(item=>item.$id===api.productIds[product.id]);if(!row)return;const raw=Number(row.salePrice)>0&&Number(row.salePrice)<=Number(row.price)?Number(row.salePrice):Number(row.price);if(!Number.isFinite(raw)||raw<=0)return;const config=api.config,price=raw*(config.pricesIncludeVat?1:1+config.vatRate);get('pdp-price').textContent=new Intl.NumberFormat('de-DE',{style:'currency',currency:config.currency||'EUR'}).format(price);get('pdp-price-note').textContent='Vorläufig · inkl. '+String(Math.round(config.vatRate*100))+' % MwSt. · Kein Verkauf';}).catch(()=>{get('pdp-catalogue-message').textContent='Aktuelle Preisangaben sind gerade nicht erreichbar. Ihre Farb- und Größenauswahl bleibt verfügbar.';});
})();
