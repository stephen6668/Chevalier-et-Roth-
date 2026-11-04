'use strict';
(() => {
 const languages=new Set(['de','en','fr']),key='cr-language-v1',period=180*24*60*60*1000;
 const textRecords=new WeakMap(),attributeRecords=new WeakMap();
 const skip='script,style,textarea,code,pre,svg,template,noscript,[translate="no"],[data-i18n-ignore],[data-user-content],.record-card h3,#admin-identity';
 let language='de',observer,scheduled=false,mounted=false,storageIssue=false;
 const normalize=value=>String(value).replace(/\s+/g,' ').trim();
 const labels={de:'Sprache',en:'Language',fr:'Langue'};
 function savedLanguage(){try{const value=JSON.parse(localStorage.getItem(key)||'null');return value&&value.version===1&&languages.has(value.language)&&Number.isFinite(value.savedAt)&&value.savedAt<=Date.now()+300000&&Number.isFinite(value.expiresAt)&&value.expiresAt>Date.now()&&value.expiresAt<=value.savedAt+period+1000?value.language:null;}catch{return null;}}
 const queried=new URL(location.href).searchParams.get('lang');
 language=languages.has(queried)?queried:(savedLanguage()||'de');
 function translated(value){
  const original=String(value??'');if(language==='de'||!original.trim())return original;
  const source=normalize(original),dictionary=window.CR_TRANSLATIONS?.[language]||{};
  let result=Object.hasOwn(dictionary,source)?dictionary[source]:undefined;
  if(typeof result!=='string'&&source.endsWith(' — Chevalier & Roth')){const prefix=source.slice(0,-' — Chevalier & Roth'.length),label=dictionary[prefix]||dictionary[prefix+'.'];if(typeof label==='string')result=label.replace(/\.$/,'')+' — Chevalier & Roth';}
  if(typeof result!=='string'){
   for(const rule of window.CR_I18N_PATTERNS||[]){
    if(!(rule?.re instanceof RegExp)||typeof rule[language]!=='function')continue;
    rule.re.lastIndex=0;const match=source.match(rule.re);if(!match)continue;
    try{const candidate=rule[language](match);if(typeof candidate==='string'){result=candidate;break;}}catch{}
   }
  }
  if(typeof result!=='string')result=source;
  // Prices remain numeric data in application code; only their visible format changes.
  result=result.replace(/(?:\d{1,3}(?:\.\d{3})+|\d+),\d{2}\s*€/g,amount=>{
   const number=Number(amount.replace(/\s|€/g,'').replace(/\./g,'').replace(',','.'));
   return Number.isFinite(number)?new Intl.NumberFormat(language==='fr'?'fr-FR':'en-GB',{style:'currency',currency:'EUR'}).format(number):amount;
  });
  const leading=original.match(/^\s*/)[0],trailing=original.match(/\s*$/)[0];
  return leading+result+trailing;
 }
 function ignored(element){return !element||!!element.closest(skip);}
 function processText(node){
  if(!node.nodeValue?.trim()||ignored(node.parentElement))return;
  let record=textRecords.get(node);
  if(!record||node.nodeValue!==record.rendered)record={source:node.nodeValue,rendered:node.nodeValue};
  const value=translated(record.source);record.rendered=value;textRecords.set(node,record);
  if(node.nodeValue!==value)node.nodeValue=value;
 }
 function localizeURL(value){
  const raw=String(value||'');if(!raw||raw.startsWith('#'))return raw;
  let url;try{url=new URL(raw,document.baseURI);}catch{return raw;}
  if(url.origin!==location.origin||!['http:','https:'].includes(url.protocol)||!(/\.html$/.test(url.pathname)||url.pathname.endsWith('/')))return raw;
  url.searchParams.set('lang',language);return url.pathname+url.search+url.hash;
 }
 function processElement(element){
  if(ignored(element))return;
  let records=attributeRecords.get(element);if(!records){records={};attributeRecords.set(element,records);}
  for(const name of ['aria-label','title','alt','placeholder']){
   if(!element.hasAttribute(name))continue;
   const current=element.getAttribute(name);let record=records[name];
   if(!record||current!==record.rendered)record={source:current,rendered:current};
   const value=translated(record.source);record.rendered=value;records[name]=record;
   if(current!==value)element.setAttribute(name,value);
  }
  if(element.tagName==='A'&&element.hasAttribute('href')){
   const current=element.getAttribute('href'),value=localizeURL(current);
   if(current!==value)element.setAttribute('href',value);
  }
 }
 function selector(where){
  const label=document.createElement('label');label.className='cr-language cr-language-'+where;label.dataset.i18nIgnore='';
  const title=document.createElement('span');title.className='cr-language-label';label.append(title);
  const select=document.createElement('select');select.dataset.languageSelector='';select.name='site-language';
  for(const [value,name]of [['de','DE · Deutsch'],['en','EN · English'],['fr','FR · Français']]){const option=document.createElement('option');option.value=value;option.textContent=name;select.append(option);}
  select.addEventListener('change',()=>setLanguage(select.value));label.append(select);return label;
 }
 function ensureSelectors(){
  if(!document.body)return;
  let announcement=document.querySelector('.announcement,.pdp-announcement,.checkout-announcement');
  if(announcement){announcement.classList.add('cr-language-host');if(!announcement.querySelector('.cr-language-header'))announcement.append(selector('header'));}
  else if(!document.querySelector('.cr-language-bar')){const bar=document.createElement('div');bar.className='cr-language-bar';bar.append(selector('header'));const header=document.querySelector('header');if(header)header.before(bar);else document.body.prepend(bar);}
  const footer=document.querySelector('.cr-footer-bottom');if(footer&&!footer.querySelector('.cr-language-footer'))footer.append(selector('footer'));
  for(const control of document.querySelectorAll('.cr-language')){const title=control.querySelector('.cr-language-label');if(title.textContent!==labels[language])title.textContent=labels[language];const select=control.querySelector('select');if(select.value!==language)select.value=language;if(select.getAttribute('aria-label')!==labels[language])select.setAttribute('aria-label',labels[language]);}
  let notice=document.getElementById('cr-language-status');
  if(storageIssue&&!notice){notice=document.createElement('p');notice.id='cr-language-status';notice.className='cr-language-status';notice.dataset.i18nIgnore='';notice.setAttribute('role','status');(footer||document.body).append(notice);}
  if(notice){const message=storageIssue?{de:'Die Sprache gilt für diese Seite. Ihr Browser hat das dauerhafte Speichern verhindert.',en:'The language applies to this page. Your browser prevented saving this preference.',fr:'La langue est appliquée à cette page. Votre navigateur a empêché l’enregistrement de cette préférence.'}[language]:'';if(notice.textContent!==message)notice.textContent=message;notice.hidden=!storageIssue;}
 }
 function render(){
  scheduled=false;if(!document.body)return;document.documentElement.lang=language;ensureSelectors();
  const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let node;while((node=walker.nextNode()))processText(node);
  document.body.querySelectorAll('[aria-label],[title],[alt],[placeholder],a[href]').forEach(processElement);
  const title=document.querySelector('title');if(title?.firstChild)processText(title.firstChild);
 }
 function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(render);}
 function setLanguage(next){
  if(!languages.has(next))return;language=next;
  try{localStorage.setItem(key,JSON.stringify({version:1,language,savedAt:Date.now(),expiresAt:Date.now()+period}));storageIssue=false;}catch{storageIssue=true;}
  const url=new URL(location.href);url.searchParams.set('lang',language);history.replaceState(history.state,'',url);
  render();window.dispatchEvent(new CustomEvent('cr:languagechange',{detail:{language}}));
 }
 function mount(){if(mounted||!document.body)return;mounted=true;render();observer=new MutationObserver(schedule);observer.observe(document.documentElement,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['aria-label','title','alt','placeholder','href']});}
 window.CRI18N=Object.freeze({getLanguage:()=>language,setLanguage,t:translated,localizeURL});
 addEventListener('storage',event=>{if(event.key!==key)return;const queried=new URL(location.href).searchParams.get('lang');language=languages.has(queried)?queried:(savedLanguage()||'de');render();window.dispatchEvent(new CustomEvent('cr:languagechange',{detail:{language}}));});
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
