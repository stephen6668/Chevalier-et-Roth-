'use strict';
(() => {
 const area=document.querySelector('.hero-product-area');
 if(!area||area.querySelector('.cr-product-light'))return;
 const root=document.documentElement,reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const beam=document.createElement('div');beam.className='cr-product-light';beam.setAttribute('aria-hidden','true');
 area.prepend(beam);area.classList.add('cr-light-prepared');area.dataset.lightState='waiting';
 let started=false,completed=false,gateTimer,finishTimer;
 function finish(){
  completed=true;clearTimeout(gateTimer);clearTimeout(finishTimer);
  area.classList.add('cr-light-lit');area.dataset.lightState='lit';
 }
 function start(){
  if(started||completed)return;started=true;clearTimeout(gateTimer);
  if(reduced.matches){finish();return;}
  area.dataset.lightState='lighting';
  // Commit the quiet initial state before bringing the overhead light up.
  finishTimer=setTimeout(finish,4500);
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
   if(completed)return;area.classList.add('cr-light-lit');
  }));
 }
 beam.addEventListener('transitionend',event=>{if(event.target===beam&&event.propertyName==='opacity'&&started)finish();});
 reduced.addEventListener('change',event=>{if(event.matches)finish();});
 addEventListener('pageshow',event=>{if(event.persisted)finish();});
 if(reduced.matches){finish();return;}
 if(root.classList.contains('cr-intro-active')&&!root.classList.contains('cr-intro-complete')){
  addEventListener('cr:introcomplete',start,{once:true});
  // An unavailable introduction must never hold the stage in its initial state.
  gateTimer=setTimeout(start,4500);
 }else start();
})();
