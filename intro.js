'use strict';
(() => {
 const root=document.documentElement,reduce=matchMedia('(prefers-reduced-motion: reduce)');
 let dialog,exitTimer,safetyTimer,closed=false,leaving=false;
 function announceComplete(){
  root.classList.remove('cr-intro-active');root.classList.add('cr-intro-complete');
  window.dispatchEvent(new CustomEvent('cr:introcomplete'));
 }
 function complete(){
  if(closed)return;closed=true;clearTimeout(exitTimer);clearTimeout(safetyTimer);
  if(dialog?.open)dialog.close();dialog?.remove();announceComplete();
 }
 function finish(immediate=false){
  if(closed)return;if(immediate||reduce.matches){complete();return;}
  if(leaving)return;leaving=true;dialog?.classList.add('is-leaving');
  exitTimer=setTimeout(complete,650);
 }
 function internalArrival(){
  const navigation=performance.getEntriesByType?.('navigation')?.[0];
  if(navigation?.type==='back_forward')return true;
  if(navigation?.type==='reload')return false;
  try{return Boolean(document.referrer&&new URL(document.referrer).origin===location.origin);}catch{return false;}
 }
 // The introduction uses no browser storage and never waits for a model or API.
 if(reduce.matches||location.hash||new URL(location.href).searchParams.has('panel')||internalArrival()){
  announceComplete();return;
 }
 root.classList.add('cr-intro-active');
 function start(){
  if(closed)return;
  if(reduce.matches||typeof HTMLDialogElement==='undefined'||!HTMLDialogElement.prototype.showModal){complete();return;}
  dialog=document.createElement('dialog');dialog.id='cr-brand-intro';dialog.className='brand-intro';dialog.setAttribute('aria-label','Chevalier & Roth');
  dialog.innerHTML='<div class="brand-intro-panel brand-intro-panel-left" aria-hidden="true"></div><div class="brand-intro-panel brand-intro-panel-right" aria-hidden="true"></div><div class="brand-intro-frame" aria-hidden="true"></div><div class="brand-intro-corner" aria-hidden="true">LA COLLECTION SIGNATURE</div><div class="brand-intro-edition" aria-hidden="true">EST. 2024</div><div class="brand-intro-center"><div class="brand-intro-emblem" aria-hidden="true"><span class="brand-intro-orbit"></span><span class="brand-intro-monogram"></span></div><p class="brand-intro-name">CHEVALIER <span>&amp;</span> ROTH</p><p class="brand-intro-motto">Une allure. Une signature.</p><span class="brand-intro-line" aria-hidden="true"></span></div><button type="button" class="brand-intro-skip" data-intro-skip data-i18n-ignore><span></span><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6"/></svg></button>';
  const button=dialog.querySelector('[data-intro-skip]');
  function label(){const lang=window.CRI18N?.getLanguage()||root.lang;button.querySelector('span').textContent={de:'Intro überspringen',en:'Skip intro',fr:'Passer l’introduction'}[lang]||'Intro überspringen';}
  label();window.addEventListener('cr:languagechange',label);
  button.addEventListener('click',()=>finish(true));
  dialog.addEventListener('cancel',event=>{event.preventDefault();finish(true);});
  dialog.addEventListener('close',()=>{window.removeEventListener('cr:languagechange',label);complete();},{once:true});
  document.body.append(dialog);
  try{dialog.showModal();button.focus({preventScroll:true});}catch{complete();return;}
  exitTimer=setTimeout(()=>finish(),1750);
  safetyTimer=setTimeout(complete,3500);
 }
 reduce.addEventListener('change',event=>{if(event.matches)finish(true);});
 addEventListener('pageshow',event=>{if(event.persisted)finish(true);});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)finish(true);});
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
