'use strict';
(() => {
 const get=id=>document.getElementById(id),backend=window.CRBackend;
 const form=get('waitlist-form'),productSelect=get('waitlist-product'),colorSelect=get('waitlist-color'),sizeSelect=get('waitlist-size');
 const option=(value,label)=>{const item=document.createElement('option');item.value=value;item.textContent=label;return item;};
 window.CR_PRODUCTS.forEach(product=>productSelect.append(option(product.id,product.name)));window.CR_COLORS.forEach(color=>colorSelect.append(option(color.id,color.name)));
 productSelect.value='halfzip';colorSelect.value='bordeaux';
 document.addEventListener('click',event=>{const trigger=event.target.closest('[data-waitlist]');if(!trigger)return;event.preventDefault();const chosen=window.CRMaison.selection();productSelect.value=chosen.product;colorSelect.value=chosen.color;sizeSelect.value=chosen.size;window.CRMaison.closePanels();get('waitlist').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});get('waitlist-title').focus({preventScroll:true});});
 form.addEventListener('submit',async event=>{event.preventDefault();if(form.getAttribute('aria-busy')==='true'||!form.reportValidity())return;
  const product=window.CR_PRODUCTS.find(p=>p.id===productSelect.value),color=window.CR_COLORS.find(c=>c.id===colorSelect.value);
  const entry={productId:product.id,productName:product.name,name:get('waitlist-name').value,email:get('waitlist-email').value,size:sizeSelect.value,color:color.name,privacyAccepted:get('waitlist-consent').checked};
  const controls=[...form.elements],status=get('waitlist-message');form.setAttribute('aria-busy','true');controls.forEach(el=>el.disabled=true);status.dataset.state='pending';status.textContent='Ihre Vormerkung wird gespeichert …';
  try{const row=await backend.addWaitlist(entry);if(!row?.$id)throw new Error('Die Speicherung wurde nicht bestätigt. Bitte prüfen Sie Ihren Eintrag vor einem erneuten Versuch.');status.dataset.state='success';status.textContent='Ihre Vormerkung ist bestätigt. Wir melden uns mit Neuigkeiten zu Ihrer Auswahl.';form.reset();productSelect.value='halfzip';colorSelect.value='bordeaux';}
  catch(error){status.dataset.state='error';status.textContent=backend.errorMessage(error);}
  finally{controls.forEach(el=>el.disabled=false);form.setAttribute('aria-busy','false');}
 });
 const privacy=get('launch-privacy');let privacyTrigger;
 const openPrivacy=()=>{privacyTrigger=document.activeElement;privacy.showModal();document.body.classList.add('modal-open');};
 const closePrivacy=()=>{privacy.close();document.body.classList.toggle('modal-open',!!document.querySelector('dialog[open]'));privacyTrigger?.focus({preventScroll:true});};
 document.querySelectorAll('[data-launch-privacy]').forEach(button=>button.addEventListener('click',openPrivacy));document.addEventListener('cr:privacy',openPrivacy);get('launch-privacy-close').addEventListener('click',closePrivacy);privacy.addEventListener('cancel',event=>{event.preventDefault();closePrivacy();});
})();
