'use strict';
(() => {
 const root=document.documentElement,reduce=matchMedia('(prefers-reduced-motion: reduce)');
 const heroAction=document.querySelector('.hero-action');
 if(!heroAction||typeof HTMLDialogElement==='undefined'||!HTMLDialogElement.prototype.showModal)return;
 const words={
  de:{skip:'Direkt zur Website',enter:'Die Maison betreten',replay:'La Signature noch einmal erleben',hint:'Bewegen Sie die Fäden.',touch:'Berühren Sie die Fäden.',title:'Willkommen bei Chevalier & Roth'},
  en:{skip:'Go straight to the website',enter:'Enter the Maison',replay:'Experience La Signature again',hint:'Move through the threads.',touch:'Touch the threads.',title:'Welcome to Chevalier & Roth'},
  fr:{skip:'Accéder au site',enter:'Entrer dans la Maison',replay:'Revivre La Signature',hint:'Faites danser les fils.',touch:'Touchez les fils.',title:'Bienvenue chez Chevalier & Roth'}
 };
 const replay=document.createElement('button');replay.type='button';replay.className='signature-replay';replay.dataset.i18nIgnore='';heroAction.append(replay);
 let dialog=null,timer=0,safety=0,closeTimer=0,frame=0,leaving=false,returnTo=null,resizeObserver=null,stopDrawing=()=>{};
 function labels(){
  const lang=window.CRI18N?.getLanguage()||root.lang,copy=words[lang]||words.de;
  replay.textContent=copy.replay;
  if(!dialog)return;
  dialog.setAttribute('aria-label',copy.title);
  dialog.querySelector('[data-signature-skip]').textContent=copy.skip;
  dialog.querySelector('[data-signature-enter-label]').textContent=copy.enter;
  dialog.querySelector('[data-signature-hint]').textContent=matchMedia('(pointer:coarse)').matches?copy.touch:copy.hint;
 }
 function complete(restoreFocus=false){
  clearTimeout(timer);clearTimeout(safety);clearTimeout(closeTimer);cancelAnimationFrame(frame);frame=0;stopDrawing();resizeObserver?.disconnect();resizeObserver=null;
  const old=dialog;dialog=null;leaving=false;root.classList.remove('signature-open');
  if(old?.open)old.close();old?.remove();
  if(restoreFocus&&returnTo?.isConnected)returnTo.focus({preventScroll:true});
  returnTo=null;
 }
 function finish(immediate=false,restoreFocus=false){
  if(!dialog)return;
  if(immediate||reduce.matches){complete(restoreFocus);return;}
  if(leaving)return;leaving=true;clearTimeout(timer);cancelAnimationFrame(frame);frame=0;resizeObserver?.disconnect();stopDrawing();dialog.classList.add('is-leaving');
  closeTimer=setTimeout(()=>complete(restoreFocus),1100);
 }
 function silk(canvas){
  let context;try{context=canvas.getContext('2d',{alpha:true});}catch{return;}
  if(!context)return;
  let width=0,height=0,time=0,last=0,px=.5,py=.48,tx=.5,ty=.48,energy=0;
  const coarse=matchMedia('(pointer:coarse)').matches;
  function resize(){
   if(!dialog||!canvas)return;const box=dialog.getBoundingClientRect();width=box.width;height=box.height;
   const dpr=Math.min(devicePixelRatio||1,1.5);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);context.setTransform(dpr,0,0,dpr,0,0);
  }
  function pointer(event){const box=canvas.getBoundingClientRect();tx=Math.max(0,Math.min(1,(event.clientX-box.left)/box.width));ty=Math.max(0,Math.min(1,(event.clientY-box.top)/box.height));energy=1;}
  dialog.addEventListener('pointermove',pointer,{passive:true});dialog.addEventListener('pointerdown',pointer,{passive:true});
  stopDrawing=()=>{dialog?.removeEventListener('pointermove',pointer);dialog?.removeEventListener('pointerdown',pointer);canvas=null;};
  resizeObserver=new ResizeObserver(resize);resizeObserver.observe(dialog);resize();
  const count=coarse?44:68,points=coarse?44:64;
  function draw(now){
   if(!canvas||!dialog||leaving||reduce.matches)return;
   // Limit the decorative field to 30 frames per second on high-refresh screens.
   if(now-last<32){frame=requestAnimationFrame(draw);return;}
   const dt=Math.min((now-last)/1000,.05);last=now;time+=dt;px+=(tx-px)*.09;py+=(ty-py)*.09;energy*=.965;
   context.clearRect(0,0,width,height);
   const mobile=width<600,cx=width*.5,cy=height*(mobile?.45:.46),span=width*(mobile?.78:.67),heightScale=height*(mobile?.23:.34);
   for(let line=0;line<count;line++){
    const n=line/(count-1),phase=n*Math.PI*2;
    context.beginPath();
    for(let step=0;step<=points;step++){
     const u=step/points,angle=(u-.5)*Math.PI*2;
     let x=cx+Math.sin(angle)*span*(.64+n*.34);
     let y=cy+Math.cos(angle)*heightScale*(.38+n*.72);
     // The asymmetric wave reads as flowing filaments, rather than a loading ring.
     y+=Math.sin(u*Math.PI*4+time*.42+phase*.52)*height*.035;
     x+=Math.cos(u*Math.PI*2+time*.23+phase)*width*.025;
     const dx=x-px*width,dy=y-py*height,distance=Math.hypot(dx,dy),radius=Math.min(width,height)*.43;
     if(distance<radius){const force=(1-distance/radius)**2*energy*42;x+=dx/(distance||1)*force;y+=dy/(distance||1)*force;}
     if(step===0)context.moveTo(x,y);else context.lineTo(x,y);
    }
    const shimmer=.5+.5*Math.sin(phase+time*.55);
    context.strokeStyle=line%9===0?'rgba(196,170,130,.64)':`rgba(196,170,130,${.075+shimmer*.22})`;
    context.lineWidth=line%9===0?.8:.45;context.stroke();
   }
   frame=requestAnimationFrame(draw);
  }
  if(!reduce.matches)frame=requestAnimationFrame(draw);
 }
 function open(isReplay=false){
  if(dialog)return;returnTo=isReplay?replay:heroAction.querySelector('a');
  dialog=document.createElement('dialog');dialog.className='signature-entry is-arriving'+(isReplay?' is-replay':'');dialog.id='signature-entry';dialog.dataset.i18nIgnore='';
  dialog.innerHTML='<div class="signature-shutter signature-shutter-left" aria-hidden="true"></div><div class="signature-shutter signature-shutter-right" aria-hidden="true"></div><canvas class="signature-canvas" aria-hidden="true"></canvas><div class="signature-frame" aria-hidden="true"></div><div class="signature-top"><span translate="no">LA SIGNATURE · 01</span><button class="signature-skip" type="button" data-signature-skip></button></div><div class="signature-content"><p class="signature-kicker" translate="no">LUXEMBOURG · THE FIRST EDITION</p><span class="signature-mark" aria-hidden="true"></span><h2 class="signature-title" translate="no">Designed to Feel<em>Exceptional.</em></h2><p class="signature-name" translate="no">CHEVALIER &amp; ROTH</p><button class="signature-enter" type="button" data-signature-enter><span data-signature-enter-label></span><span class="signature-arrow" aria-hidden="true"></span></button></div><div class="signature-bottom"><span class="signature-hint" data-signature-hint></span><div><span translate="no">UN INSTANT. UNE SIGNATURE.</span><div class="signature-progress" aria-hidden="true"></div></div></div>';
  document.body.append(dialog);labels();
  dialog.querySelector('[data-signature-enter]').addEventListener('click',()=>finish(false,true));
  dialog.querySelector('[data-signature-skip]').addEventListener('click',()=>finish(true,true));
  dialog.addEventListener('cancel',event=>{event.preventDefault();finish(true,true);});
  const currentDialog=dialog;
  dialog.addEventListener('close',()=>{if(dialog===currentDialog)complete(false);},{once:true});
  try{dialog.showModal();root.classList.add('signature-open');silk(dialog.querySelector('canvas'));dialog.querySelector('[data-signature-enter]').focus({preventScroll:true});}catch{complete(false);return;}
  if(!isReplay){timer=setTimeout(()=>finish(),3800);safety=setTimeout(()=>complete(false),5400);}
 }
 function internalArrival(){
  const type=performance.getEntriesByType?.('navigation')?.[0]?.type;
  if(type==='back_forward')return true;
  if(type==='reload')return false;
  try{return Boolean(document.referrer&&new URL(document.referrer).origin===location.origin);}catch{return false;}
 }
 labels();window.addEventListener('cr:languagechange',labels);
 replay.addEventListener('click',()=>open(true));
 reduce.addEventListener('change',event=>{if(event.matches)finish(true,false);});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)finish(true,false);});
 addEventListener('pagehide',()=>finish(true,false));
 if(!reduce.matches&&!location.hash&&!new URL(location.href).searchParams.has('panel')&&!internalArrival())open();
})();
