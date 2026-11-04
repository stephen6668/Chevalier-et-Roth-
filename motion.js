'use strict';
(() => {
 const root=document.documentElement;
 const home=!!document.querySelector('.hero-copy'),product=document.body.classList.contains('pdp-page');
 if(!home&&!product)return;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const prepared=new WeakSet(),targets=new Set(),heroTargets=new Set();
 const rules=home?[
  ['.hero-copy>.eyebrow','left',0,true],
  ['#hero-title .line>span,#hero-title .line>em','left',90,true],
  ['.hero-description','left',330,true],
  ['.hero-caption','left',420,true],
  ['.hero-shop>.edition-label,.hero-shop>h2','right',150,true],
  ['.intro>.eyebrow,.section-heading .eyebrow,.editorial-copy>.eyebrow,.launch-copy>.eyebrow,.closing>.eyebrow','left',0],
  ['.intro>.statement,.section-heading h2,.launch-copy>h2','left',80],
  ['.intro-bottom>p,.editorial-copy>h2,.editorial-copy>p:not(.eyebrow)','right',120],
  ['.launch-copy>p:not(.eyebrow),.launch-giveaway>h3,.launch-giveaway>p:not(.eyebrow)','left',160],
  ['.product-card-info h3,.product-card-info p','left',80],
  ['.collection-footnote,.closing>h2','right',100]
 ]:[
  ['.pdp-info>.eyebrow,#pdp-number','right',0],
  ['#pdp-title','right',80],
  ['#pdp-subtitle','right',150],
  ['#pdp-description','right',220],
  ['.pdp-waitlist>div>.eyebrow,.pdp-related-heading .eyebrow','left',0],
  ['.pdp-waitlist>div>h2,.pdp-related-heading h2','left',80],
  ['.pdp-waitlist>div>p:not(.eyebrow)','right',150],
  ['.pdp-related-card h3,.pdp-related-card>p','left',80]
 ];
 let observer,mutationObserver,heroTimer,frame,stopped=false;
 const heroWaiting=()=>home&&root.classList.contains('cr-intro-active')&&!root.classList.contains('cr-intro-complete');
 function show(element,immediate=false){
  if(!targets.has(element))return;
  if(immediate)element.style.setProperty('--cr-motion-delay','0ms');
  element.dataset.crMotionState='visible';observer?.unobserve(element);
 }
 function failOpen(){
  stopped=true;clearTimeout(heroTimer);cancelAnimationFrame(frame);observer?.disconnect();mutationObserver?.disconnect();
  targets.forEach(element=>show(element,true));root.classList.remove('cr-motion-enabled');
 }
 function observe(element){
  if(stopped||reduced.matches||!observer){show(element,true);return;}
  if(heroTargets.has(element)&&heroWaiting())return;
  observer.observe(element);
 }
 function prepare(element,direction,delay,hero,index){
  if(prepared.has(element)||!element.textContent.trim()||element.closest('dialog,[hidden],[data-user-content]'))return;
  prepared.add(element);targets.add(element);
  element.classList.add('cr-motion');element.dataset.crMotion=direction;
  // Short offsets and a restrained stagger keep long translated headings readable.
  if(element.closest('#hero-title'))delay=80+index*100;
  else if(element.closest('.product-card,.pdp-related-card'))delay+=Math.min(index,3)*45;
  element.style.setProperty('--cr-motion-delay',delay+'ms');
  element.dataset.crMotionState=reduced.matches?'visible':'pending';
  if(hero)heroTargets.add(element);
  observe(element);
 }
 function scan(scope=document){
  if(stopped)return;
  rules.forEach(([selector,direction,delay,hero])=>{
   const elements=[...(scope.matches?.(selector)?[scope]:[]),...scope.querySelectorAll(selector)];
   elements.forEach((element,index)=>prepare(element,direction,delay,hero,index));
  });
 }
 function releaseHero(){
  clearTimeout(heroTimer);
  heroTargets.forEach(element=>{
   if(reduced.matches)show(element,true);else observer?.observe(element);
  });
 }
 try{
  // Without IntersectionObserver every text remains available; old .reveal styles
  // are deliberately visible in motion.css even when this script cannot run.
  if(!('IntersectionObserver' in window))return;
  observer=new IntersectionObserver(entries=>{
   try{entries.forEach(entry=>{if(entry.isIntersecting)show(entry.target);});}catch{failOpen();}
  },{threshold:.12,rootMargin:'0px 0px -4% 0px'});
  root.classList.add('cr-motion-enabled');scan();
  addEventListener('cr:introcomplete',releaseHero,{once:true});
  // The short brand introduction has its own safety timeout. A missed event
  // must never leave the first screen's copy hidden.
  if(heroWaiting())heroTimer=setTimeout(releaseHero,3600);
  document.addEventListener('focusin',event=>{
   const target=event.target.closest?.('.cr-motion');if(target)show(target,true);
  });
  reduced.addEventListener('change',()=>{
   if(reduced.matches)targets.forEach(element=>show(element,true));
  });
  addEventListener('pageshow',event=>{if(event.persisted)targets.forEach(element=>show(element,true));});
  const scopes=new Set();
  mutationObserver=new MutationObserver(records=>{
   for(const record of records){
    if(record.target instanceof Element)scopes.add(record.target);
    for(const node of record.addedNodes)if(node instanceof Element)scopes.add(node);
   }
   if(frame||!scopes.size)return;
   frame=requestAnimationFrame(()=>{
    frame=0;try{for(const scope of scopes)if(scope.isConnected)scan(scope);scopes.clear();}catch{failOpen();}
   });
  });
  const main=document.querySelector('main');if(main)mutationObserver.observe(main,{subtree:true,childList:true});
 }catch{failOpen();}
})();
