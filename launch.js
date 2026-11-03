'use strict';
(() => {
 const backend=window.CRBackend,config=backend.config,products=window.CR_PRODUCTS,colors=window.CR_COLORS;
 const get=id=>document.getElementById(id),form=get('waitlist-form'),giveaway=get('giveaway-form'),dialog=get('giveaway-dialog');
 const productSelect=get('waitlist-product'),colorSelect=get('waitlist-color'),sizeSelect=get('waitlist-size');
 function option(value,label){const el=document.createElement('option');el.value=value;el.textContent=label;return el;}
 products.forEach(p=>{productSelect.append(option(p.id,p.name));get('giveaway-prize').append(option(p.id,p.name));});
 colors.forEach(c=>colorSelect.append(option(c.id,c.name)));
 productSelect.value='halfzip';colorSelect.value='bordeaux';
 function prepareWaitlist(selection){
  const chosen=selection||window.CRMaison.selection();
  productSelect.value=chosen.product; colorSelect.value=chosen.color; sizeSelect.value=chosen.size;
  window.CRMaison.closePanels();get('waitlist').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});
  get('waitlist-title').focus({preventScroll:true});
 }
 document.addEventListener('click',event=>{
  const trigger=event.target.closest('[data-waitlist]');if(!trigger)return;
  event.preventDefault();
  const chosen=trigger.dataset.waitlistProduct?{product:trigger.dataset.waitlistProduct,color:trigger.dataset.waitlistColor,size:trigger.dataset.waitlistSize}:null;
  prepareWaitlist(chosen);
 });
 async function send(target,status,operation,success){
  if(target.getAttribute('aria-busy')==='true')return;
  const controls=[...target.elements],button=target.querySelector('[type=submit]');
  target.setAttribute('aria-busy','true');controls.forEach(el=>el.disabled=true);status.dataset.state='pending';status.textContent='Wird gespeichert …';
  try{const row=await operation();if(!row?.$id)throw new Error('Die Speicherung wurde nicht bestätigt. Bitte prüfe den Eintrag vor einem erneuten Versuch.');status.dataset.state='success';status.textContent=success;target.reset();if(target===form){productSelect.value='halfzip';colorSelect.value='bordeaux';}}
  catch(error){status.dataset.state='error';status.textContent=backend.errorMessage(error);}
  finally{controls.forEach(el=>el.disabled=false);target.setAttribute('aria-busy','false');button.disabled=false;}
 }
 form.addEventListener('submit',event=>{
  event.preventDefault();if(!form.reportValidity())return;
  const selected=products.find(p=>p.id===productSelect.value),color=colors.find(c=>c.id===colorSelect.value);
  const entry={productId:selected.id,productName:selected.name,name:get('waitlist-name').value,email:get('waitlist-email').value,size:sizeSelect.value,color:color.name,privacyAccepted:get('waitlist-consent').checked};
  send(form,get('waitlist-message'),()=>backend.addWaitlist(entry),'Du stehst auf der Warteliste. Wir melden uns zum Start deiner Auswahl.');
 });
 document.querySelectorAll('[data-giveaway-open]').forEach(button=>button.addEventListener('click',()=>{
  get('giveaway-prize').value=window.CRMaison.selection().product;
  dialog.showModal();document.body.classList.add('modal-open');
 }));
 function closeGiveaway(){dialog.close();document.body.classList.toggle('modal-open',!!document.querySelector('dialog[open]'));}
 get('giveaway-close').addEventListener('click',closeGiveaway);
 dialog.addEventListener('cancel',event=>{event.preventDefault();closeGiveaway();});
 giveaway.addEventListener('submit',event=>{
  event.preventDefault();if(!giveaway.reportValidity())return;
  const prize=products.find(p=>p.id===get('giveaway-prize').value);
  const entry={firstName:get('giveaway-first').value,lastName:get('giveaway-last').value,email:get('giveaway-email').value,prizeId:prize.id,prizeName:prize.name,socialConfirmed:get('giveaway-tiktok').checked&&get('giveaway-instagram').checked,privacyAccepted:get('giveaway-consent').checked};
  send(giveaway,get('giveaway-message'),()=>backend.enterGiveaway(entry),'Deine Teilnahme wurde gespeichert. Viel Glück!');
 });
 const deadline=new Intl.DateTimeFormat('de-DE',{timeZone:'Europe/Luxembourg',dateStyle:'long',timeStyle:'short'}).format(new Date(config.launchAt));
 get('giveaway-deadline').textContent=deadline+' Uhr (Luxemburger Zeit)';
 get('giveaway-tiktok-link').href=config.tiktokUrl;get('giveaway-instagram-link').href=config.instagramUrl;
 const privacy=get('launch-privacy');
 function openPrivacy(){privacy.showModal();document.body.classList.add('modal-open');}
 function closePrivacy(){privacy.close();document.body.classList.toggle('modal-open',!!document.querySelector('dialog[open]'));}
 document.querySelectorAll('[data-launch-privacy]').forEach(button=>button.addEventListener('click',openPrivacy));
 document.addEventListener('cr:privacy',openPrivacy);
 get('launch-privacy-close').addEventListener('click',closePrivacy);
 privacy.addEventListener('cancel',event=>{event.preventDefault();closePrivacy();});
 if(Date.now()>=new Date(config.launchAt).getTime()){
  get('giveaway-message').textContent='Das Gewinnspiel ist beendet.';
  [...giveaway.elements].forEach(el=>el.disabled=true);
 }
 // Catalogue reads do not read waitlist, giveaway, coupon or customer data.
 backend.publicProducts().then(rows=>window.CRMaison.syncCatalog(rows)).catch(error=>{
  get('catalogue-connection').textContent=error.type==='general_unknown_origin'?'Die Verbindung wird für diese Webadresse noch freigegeben.': 'Produktdaten sind gerade nicht erreichbar. Die 3D-Kollektion bleibt sichtbar.';
 });
})();
