'use strict';
(() => {
 const root=document.getElementById('empreinte');
 if(!root)return;
 const canvas=document.getElementById('empreinte-canvas'),input=document.getElementById('empreinte-initials'),download=document.getElementById('empreinte-download'),status=document.getElementById('empreinte-status'),productLink=document.getElementById('empreinte-product'),live=document.getElementById('empreinte-live');
 if(!canvas||!input||!download||!status)return;
 const buttons=[...root.querySelectorAll('[data-empreinte-color]')];
 const palettes=Object.freeze({
  beige:{number:'01',background:'#f2ebdd',ink:'#19283e',accent:'#73543f',mark:'#19283e'},
  navy:{number:'02',background:'#19283e',ink:'#f2ebdd',accent:'#c4aa82',mark:'#c4aa82'},
  bordeaux:{number:'03',background:'#762e3b',ink:'#f2ebdd',accent:'#d8bf98',mark:'#d8bf98'}
 });
 const copy={
  de:{kicker:'L’EMPREINTE · CHEVALIER & ROTH',title:'Drei Farben.',titleEm:'Eine Handschrift.',description:'Wählen Sie Ihre Farbwelt und gestalten Sie Ihre persönliche Maison-Karte.',paletteLabel:'Ihre Farbwelt',initialsLabel:'Ihre Initialen (optional)',initialsHint:'Bis zu drei Buchstaben. Ihre Initialen bleiben auf dieser geöffneten Seite.',save:'Maison-Karte speichern',product:'Die Farbe als Damenhose entdecken',cardNote:'Eine digitale Erinnerung an die Maison. Zum Mitnehmen.',colorBeige:'Beige',colorNavy:'Navyblau',colorBordeaux:'Bordeaux',stepColor:'01 · Farbe wählen',stepInitials:'Initialen ergänzen',loading:'Ihre Karte wird vorbereitet …',saving:'Ihre Karte wird erstellt …',retry:'Erneut versuchen',saved:'Ihre Maison-Karte ist bereit. Der PNG-Download wurde gestartet.',failure:'Die Karte konnte gerade nicht erstellt werden. Bitte versuchen Sie es erneut.',unsupported:'Ihr Browser kann diese digitale Karte nicht erstellen. Die Kollektion können Sie weiterhin entdecken.',selected:color=>`Farbwelt ${color} ausgewählt.`,cardLabel:(color,initials)=>`Maison-Karte von Chevalier & Roth in ${color}${initials?`, mit den Initialen ${initials}`:''}.`,dedication:'IHRE HANDSCHRIFT',origin:'LUXEMBOURG',spirit:'EUROPEAN SPIRIT'},
  en:{kicker:'L’EMPREINTE · CHEVALIER & ROTH',title:'Three colours.',titleEm:'One signature.',description:'Choose your colour palette and create your personal Maison card.',paletteLabel:'Your colour palette',initialsLabel:'Your initials (optional)',initialsHint:'Up to three letters. Your initials stay on this open page.',save:'Save your Maison card',product:'Discover the colour in women’s trousers',cardNote:'A digital memory of the Maison. Yours to keep.',colorBeige:'Beige',colorNavy:'Navy blue',colorBordeaux:'Bordeaux',stepColor:'01 · Choose your colour',stepInitials:'Add your initials',loading:'Preparing your card …',saving:'Creating your card …',retry:'Try again',saved:'Your Maison card is ready. The PNG download has started.',failure:'Your card could not be created right now. Please try again.',unsupported:'Your browser cannot create this digital card. You can still explore the collection.',selected:color=>`${color} colour palette selected.`,cardLabel:(color,initials)=>`Chevalier & Roth Maison card in ${color}${initials?`, with the initials ${initials}`:''}.`,dedication:'YOUR SIGNATURE',origin:'LUXEMBOURG',spirit:'EUROPEAN SPIRIT'},
  fr:{kicker:'L’EMPREINTE · CHEVALIER & ROTH',title:'Trois couleurs.',titleEm:'Une signature.',description:'Choisissez votre univers de couleurs et créez votre carte Maison personnelle.',paletteLabel:'Votre univers de couleurs',initialsLabel:'Vos initiales (facultatif)',initialsHint:'Jusqu’à trois lettres. Vos initiales restent sur cette page ouverte.',save:'Enregistrer ma carte Maison',product:'Découvrir le pantalon femme dans cette couleur',cardNote:'Un souvenir numérique de la Maison. À emporter.',colorBeige:'Beige',colorNavy:'Bleu marine',colorBordeaux:'Bordeaux',stepColor:'01 · Choisir une couleur',stepInitials:'Ajouter ses initiales',loading:'Préparation de votre carte …',saving:'Création de votre carte …',retry:'Réessayer',saved:'Votre carte Maison est prête. Le téléchargement PNG a commencé.',failure:'La carte n’a pas pu être créée pour le moment. Veuillez réessayer.',unsupported:'Votre navigateur ne peut pas créer cette carte numérique. Vous pouvez toujours découvrir la collection.',selected:color=>`Univers ${color} sélectionné.`,cardLabel:(color,initials)=>`Carte Maison Chevalier & Roth en ${color}${initials?`, avec les initiales ${initials}`:''}.`,dedication:'VOTRE EMPREINTE',origin:'LUXEMBOURG',spirit:'EUROPEAN SPIRIT'}
 };
 const colourKeys={beige:'colorBeige',navy:'colorNavy',bordeaux:'colorBordeaux'};
 let state={color:'navy',initials:''},context=null,assets=null,assetPromise=null,loading=false,busy=false,failed=false,pageHidden=false;
 const objectURLs=new Map();
 const language=()=>{const lang=window.CRI18N?.getLanguage()||document.documentElement.lang;return Object.hasOwn(copy,lang)?lang:'de';};
 const words=()=>copy[language()];
 const colourName=()=>words()[colourKeys[state.color]];
 const normalizedInitials=value=>(String(value||'').normalize('NFC').toLocaleUpperCase(language()).match(/\p{L}/gu)||[]).slice(0,3).join('');
 function message(text,error=false){status.textContent=text;status.dataset.state=error?'error':'success';}
 function buttonLabel(){
  const target=download.querySelector('[data-empreinte-text="save"]')||download;
  target.textContent=words()[busy?'saving':loading?'loading':failed?'retry':'save'];
  download.disabled=!context||loading||busy;download.setAttribute('aria-busy',String(loading||busy));
 }
 function labels(){
  const text=words();
  root.querySelectorAll('[data-empreinte-text]').forEach(node=>{const key=node.dataset.empreinteText;if(typeof text[key]==='string')node.textContent=text[key];});
  input.setAttribute('aria-label',text.initialsLabel);
  canvas.setAttribute('role','img');canvas.setAttribute('aria-label',text.cardLabel(colourName(),state.initials));
  if(productLink){productLink.href='product.html?'+new URLSearchParams({product:'trousers',color:state.color,lang:language()});productLink.setAttribute('aria-label','Le Pantalon Femme · '+colourName());}
  buttonLabel();
 }
 function applyPalette(announce=false){
  root.dataset.color=state.color;root.dataset.palette=state.color;
  buttons.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.empreinteColor===state.color)));
  labels();if(assets&&!busy){try{render();}catch{failed=true;message(words().failure,true);buttonLabel();}}
  if(announce&&live)live.textContent=words().selected(colourName());
 }
 function tracked(ctx,text,x,y,spacing){
  const glyphs=Array.from(text),widths=glyphs.map(glyph=>ctx.measureText(glyph).width),width=widths.reduce((sum,value)=>sum+value,0)+Math.max(0,glyphs.length-1)*spacing;
  let left=x-width/2;ctx.textAlign='left';glyphs.forEach((glyph,index)=>{ctx.fillText(glyph,left,y);left+=widths[index]+spacing;});ctx.textAlign='center';
 }
 function fitted(ctx,text,maxSize,maxWidth,font){
  let size=maxSize;ctx.font=font(size);while(size>16&&ctx.measureText(text).width>maxWidth){size--;ctx.font=font(size);}return size;
 }
 function render(){
  if(!context||!assets)return;
  const ctx=context,palette=palettes[state.color],text=words(),W=1080,H=1350;
  canvas.width=W;canvas.height=H;
  ctx.fillStyle=palette.background;ctx.fillRect(0,0,W,H);
  ctx.strokeStyle=palette.accent;ctx.lineWidth=1;ctx.globalAlpha=.58;ctx.strokeRect(60.5,58.5,959,1231);ctx.globalAlpha=.22;ctx.strokeRect(73.5,71.5,933,1205);ctx.globalAlpha=1;
  ctx.fillStyle=palette.ink;ctx.textAlign='center';ctx.textBaseline='alphabetic';
  ctx.font='400 29px Manrope, Arial, sans-serif';tracked(ctx,'CHEVALIER & ROTH',540,140,6);
  ctx.fillStyle=palette.accent;ctx.font='italic 400 66px "Cormorant Garamond", Georgia, serif';ctx.fillText('L’Empreinte',540,226);
  ctx.font='400 16px Manrope, Arial, sans-serif';tracked(ctx,'LUXEMBOURG · THE FIRST EDITION',540,274,3.8);
  // Architectural hairlines frame the mark, rather than redrawing its shape.
  ctx.strokeStyle=palette.accent;ctx.lineWidth=.8;ctx.globalAlpha=.34;
  for(const x of [138.5,154.5,925.5,941.5]){ctx.beginPath();ctx.moveTo(x,352);ctx.lineTo(x,861);ctx.stroke();}
  ctx.beginPath();ctx.moveTo(138,333.5);ctx.lineTo(263,333.5);ctx.moveTo(817,333.5);ctx.lineTo(942,333.5);ctx.moveTo(138,880.5);ctx.lineTo(263,880.5);ctx.moveTo(817,880.5);ctx.lineTo(942,880.5);ctx.stroke();ctx.globalAlpha=1;
  const logo=assets.logo,scale=Math.min(430/logo.naturalWidth,480/logo.naturalHeight),width=logo.naturalWidth*scale,height=logo.naturalHeight*scale;
  const mark=document.createElement('canvas');mark.width=Math.ceil(width);mark.height=Math.ceil(height);const markContext=mark.getContext('2d');
  if(!markContext)throw new Error('Canvas unavailable');
  markContext.drawImage(logo,0,0,mark.width,mark.height);markContext.globalCompositeOperation='source-in';markContext.fillStyle=palette.mark;markContext.fillRect(0,0,mark.width,mark.height);
  ctx.drawImage(mark,(W-width)/2,364+(480-height)/2,width,height);
  ctx.fillStyle=palette.ink;ctx.font='400 66px "Cormorant Garamond", Georgia, serif';ctx.fillText('Designed to Feel',540,949);
  ctx.fillStyle=palette.accent;ctx.font='italic 400 92px "Cormorant Garamond", Georgia, serif';ctx.fillText('Exceptional.',540,1034);
  ctx.strokeStyle=palette.accent;ctx.globalAlpha=.45;ctx.beginPath();ctx.moveTo(103,1080.5);ctx.lineTo(977,1080.5);ctx.stroke();ctx.globalAlpha=1;
  ctx.textAlign='left';ctx.fillStyle=palette.accent;ctx.font='400 17px Manrope, Arial, sans-serif';ctx.fillText('N° '+palette.number,104,1124);
  ctx.fillStyle=palette.ink;fitted(ctx,colourName(),55,530,size=>`400 ${size}px "Cormorant Garamond", Georgia, serif`);ctx.fillText(colourName(),104,1190);
  if(state.initials){
   ctx.strokeStyle=palette.accent;ctx.globalAlpha=.6;ctx.strokeRect(720.5,1106.5,255,105);ctx.globalAlpha=1;
   ctx.fillStyle=palette.accent;ctx.font='400 12px Manrope, Arial, sans-serif';tracked(ctx,text.dedication,848,1094,1.8);
   ctx.fillStyle=palette.ink;ctx.textAlign='center';fitted(ctx,state.initials,76,223,size=>`400 ${size}px "Cormorant Garamond", Georgia, serif`);ctx.fillText(state.initials,848,1185);
  }else{
   ctx.fillStyle=palette.accent;ctx.font='400 16px Manrope, Arial, sans-serif';tracked(ctx,text.origin,846,1150,2.4);ctx.font='400 11px Manrope, Arial, sans-serif';tracked(ctx,text.spirit,846,1179,1.8);
  }
  ctx.fillStyle=palette.accent;ctx.font='400 12px Manrope, Arial, sans-serif';tracked(ctx,'CHEVALIER & ROTH · THE FIRST EDITION',540,1250,2.1);
  canvas.setAttribute('aria-label',text.cardLabel(colourName(),state.initials));
 }
 function image(){
  return new Promise((resolve,reject)=>{
   const logo=new Image(),timer=setTimeout(()=>{logo.onload=null;logo.onerror=null;reject(new Error('Image timeout'));},12000);
   logo.decoding='async';logo.onload=()=>{clearTimeout(timer);if(logo.naturalWidth>0&&logo.naturalHeight>0)resolve(logo);else reject(new Error('Empty image'));};logo.onerror=()=>{clearTimeout(timer);reject(new Error('Image unavailable'));};logo.src='assets/brand/cr-cream.png';
  });
 }
 function loadAssets(){
  if(assets)return Promise.resolve(assets);
  if(assetPromise)return assetPromise;
  const fontReady=document.fonts?.load?Promise.all([document.fonts.load('400 66px "Cormorant Garamond"'),document.fonts.load('italic 400 92px "Cormorant Garamond"'),document.fonts.load('400 29px Manrope')]):Promise.resolve();
  const fonts=new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('Font timeout')),12000);fontReady.then(value=>{clearTimeout(timer);resolve(value);},error=>{clearTimeout(timer);reject(error);});});
  assetPromise=Promise.all([image(),fonts]).then(([logo])=>{assets={logo};return assets;}).catch(error=>{assetPromise=null;throw error;});
  return assetPromise;
 }
 async function prepare(){
  loading=true;failed=false;buttonLabel();
  try{await loadAssets();if(pageHidden)return false;render();message('');return true;}
  catch{failed=true;message(words().failure,true);return false;}
  finally{loading=false;buttonLabel();}
 }
 function enableInputs(value){input.disabled=!value;buttons.forEach(button=>{button.disabled=!value;});}
 function revoke(url){const timer=objectURLs.get(url);clearTimeout(timer);objectURLs.delete(url);try{URL.revokeObjectURL(url);}catch{}}
 async function save(){
  if(busy||loading||!context)return;
  busy=true;failed=false;enableInputs(false);buttonLabel();
  try{
   await loadAssets();if(pageHidden)throw new Error('Page hidden');render();
   const blob=await new Promise((resolve,reject)=>{
    const timeout=setTimeout(()=>reject(new Error('PNG timeout')),15000);
    try{canvas.toBlob(value=>{clearTimeout(timeout);value?resolve(value):reject(new Error('PNG unavailable'));},'image/png');}catch(error){clearTimeout(timeout);reject(error);}
   });
   if(pageHidden)throw new Error('Page hidden');
   const url=URL.createObjectURL(blob);objectURLs.set(url,setTimeout(()=>revoke(url),60000));
   const anchor=document.createElement('a');anchor.href=url;anchor.download='chevalier-roth-'+state.color+(state.initials?'-'+state.initials:'')+'.png';anchor.hidden=true;document.body.append(anchor);
   try{anchor.click();}finally{anchor.remove();}
   message(words().saved);
  }catch{failed=true;message(words().failure,true);}
  finally{busy=false;enableInputs(true);labels();if(assets&&!pageHidden){try{render();}catch{failed=true;message(words().failure,true);buttonLabel();}}}
 }
 try{context=canvas.getContext('2d');}catch{}
 buttons.forEach(button=>button.addEventListener('click',()=>{const color=button.dataset.empreinteColor;if(!busy&&Object.hasOwn(palettes,color)){state.color=color;message('');applyPalette(true);}}));
 input.addEventListener('input',()=>{state.initials=normalizedInitials(input.value);input.value=state.initials;labels();if(assets&&!busy){try{render();}catch{failed=true;message(words().failure,true);buttonLabel();}}});
 download.addEventListener('click',save);
 const card=document.getElementById('empreinte-card'),reduced=typeof matchMedia==='function'?matchMedia('(prefers-reduced-motion: reduce)'):null,fine=typeof matchMedia==='function'?matchMedia('(hover: hover) and (pointer: fine)'):null;
 function resetTilt(){card?.style.setProperty('--empreinte-rx','0deg');card?.style.setProperty('--empreinte-ry','0deg');}
 if(card){
  card.addEventListener('pointermove',event=>{
   if(reduced?.matches||!fine?.matches||event.pointerType==='touch')return;
   const box=card.getBoundingClientRect();if(!box.width||!box.height)return;
   const x=Math.max(-.5,Math.min(.5,(event.clientX-box.left)/box.width-.5)),y=Math.max(-.5,Math.min(.5,(event.clientY-box.top)/box.height-.5));
   card.style.setProperty('--empreinte-rx',(-y*10).toFixed(2)+'deg');card.style.setProperty('--empreinte-ry',(x*10).toFixed(2)+'deg');
  },{passive:true});
  card.addEventListener('pointerleave',resetTilt);reduced?.addEventListener('change',resetTilt);fine?.addEventListener('change',resetTilt);
 }
 addEventListener('cr:languagechange',()=>{labels();if(live)live.textContent=words().selected(colourName());if(assets&&!busy){try{render();}catch{failed=true;message(words().failure,true);buttonLabel();}}});
 addEventListener('pagehide',()=>{pageHidden=true;resetTilt();for(const url of [...objectURLs.keys()])revoke(url);});
 addEventListener('pageshow',()=>{
  const returning=pageHidden;pageHidden=false;if(!returning||!context)return;
  if(assets&&!busy){try{render();failed=false;message('');buttonLabel();}catch{failed=true;message(words().failure,true);buttonLabel();}}
  else if(!loading&&!busy)prepare();
 });
 input.value='';applyPalette();
 if(!context){canvas.hidden=true;message(words().unsupported,true);buttonLabel();return;}
 prepare();
})();
