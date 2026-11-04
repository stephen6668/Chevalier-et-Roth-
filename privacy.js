'use strict';
(() => {
 const RECORD='cr-privacy-v1',VERSION=1,PERIOD=180*24*60*60*1000,KEYS=['cr-selection-v3','cr-selection-v2'];
 const memory={session:new Map(),local:new Map()},unavailable=new Set();
 let decision=null,recordStore='memory',dialog,banner,trigger=null,notice;
 function store(kind){return kind==='local'?window.localStorage:window.sessionStorage;}
 function read(kind,key){if(unavailable.has(kind+':'+key))return memory[kind].get(key)??null;try{const value=store(kind).getItem(key);if(value!==null)memory[kind].set(key,value);else memory[kind].delete(key);return value;}catch{return memory[kind].get(key)??null;}}
 function write(kind,key,value){memory[kind].set(key,String(value));try{store(kind).setItem(key,String(value));unavailable.delete(kind+':'+key);return true;}catch{unavailable.add(kind+':'+key);return false;}}
 function remove(kind,key){memory[kind].delete(key);try{store(kind).removeItem(key);unavailable.delete(kind+':'+key);return true;}catch{unavailable.add(kind+':'+key);return false;}}
 function valid(raw){try{const value=JSON.parse(raw||'null'),now=Date.now();return value&&value.version===VERSION&&typeof value.persistSelection==='boolean'&&Number.isFinite(value.savedAt)&&Number.isFinite(value.expiresAt)&&value.savedAt<=now+300000&&value.expiresAt>now&&value.expiresAt<=value.savedAt+PERIOD+1000?value:null;}catch{return null;}}
 decision=valid(read('local',RECORD));
 if(decision)recordStore='local';else{decision=valid(read('session',RECORD));if(decision)recordStore='session';}
 let persist=decision?.persistSelection===true&&recordStore==='local';
 function allowed(key){return KEYS.includes(String(key));}
 const selectionStorage=Object.freeze({
  getItem(key){if(!allowed(key))return null;return read(persist?'local':'session',String(key));},
  setItem(key,value){if(!allowed(key))throw new Error('Unbekannter Auswahlspeicher.');const kind=persist?'local':'session';if(!write(kind,String(key),String(value)))announce(kind==='local'?'Ihre Auswahl konnte nicht dauerhaft gespeichert werden. Sie bleibt für diesen Besuch im Speicher verfügbar.':'Ihr Browser blockiert den Sitzungsspeicher. Ihre Auswahl bleibt auf dieser geöffneten Seite verfügbar.');},
  removeItem(key){if(!allowed(key))return;remove(persist?'local':'session',String(key));}
 });
 function preferences(){return Object.freeze({necessary:true,persistSelection:persist,hasDecision:!!decision,version:VERSION,savedAt:decision?.savedAt??null,expiresAt:decision?.expiresAt??null,recordStorage:recordStore});}
 function announce(message){if(!notice)return;notice.textContent=message;notice.hidden=!message;}
 function save(wanted){
  const current=Object.fromEntries(KEYS.map(key=>[key,selectionStorage.getItem(key)]));
  const now=Date.now();let next={version:VERSION,persistSelection:wanted===true,savedAt:now,expiresAt:now+PERIOD};
  let stored=write('local',RECORD,JSON.stringify(next));recordStore=stored?'local':'memory';
  let issue='';
  if(wanted===true&&stored){
   for(const key of KEYS)if(current[key]!==null&&!write('local',key,current[key])){stored=false;break;}
   if(stored)persist=true;
  }
  if(wanted!==true||!stored){
   persist=false;
   for(const key of KEYS){if(current[key]!==null)write('session',key,current[key]);if(!remove('local',key))issue='Die dauerhafte Auswahl konnte nicht vollständig aus dem Browserspeicher entfernt werden. Bitte löschen Sie die Websitedaten in Ihren Browsereinstellungen.';}
   if(wanted===true&&!stored)issue='Ihr Browser erlaubt das dauerhafte Speichern gerade nicht. Ihre Auswahl bleibt für diese Sitzung verfügbar.';
   next={...next,persistSelection:false};
   if(!write('local',RECORD,JSON.stringify(next))){recordStore=write('session',RECORD,JSON.stringify(next))?'session':'memory';if(!issue)issue='Ihre Entscheidung konnte nicht dauerhaft gespeichert werden und gilt für diese Sitzung.';}else recordStore='local';
  }
  if(persist){remove('session',RECORD);for(const key of KEYS)remove('session',key);}
  decision=next;
  if(banner)banner.hidden=true;
  if(dialog){const checkbox=dialog.querySelector('[name=persist-selection]');if(checkbox)checkbox.checked=persist;}
  announce(issue);
  window.dispatchEvent(new CustomEvent('cr:privacychange',{detail:preferences()}));
  return {preferences:preferences(),message:issue};
 }
 function element(tag,text,className){const node=document.createElement(tag);if(text!==undefined)node.textContent=text;if(className)node.className=className;return node;}
 function button(text,action,className='privacy-button'){const node=element('button',text,className);node.type='button';node.addEventListener('click',action);return node;}
 function legalLink(text,page){const link=element('a',text);link.href='legal.html?page='+page;return link;}
 function closeSettings(){if(!dialog?.open)return;dialog.close();document.body.classList.toggle('modal-open',!!document.querySelector('dialog[open]'));if(trigger?.isConnected)trigger.focus({preventScroll:true});}
 function openSettings(source=document.activeElement){if(!dialog){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>openSettings(source),{once:true});return;}if(dialog.open)return;trigger=source;dialog.querySelector('[name=persist-selection]').checked=persist;dialog.querySelector('.privacy-settings-message').textContent='';dialog.showModal();document.body.classList.add('modal-open');}
 function apply(wanted,fromDialog=false){const result=save(wanted);if(fromDialog&&result.message){dialog.querySelector('.privacy-settings-message').textContent=result.message;return;}if(fromDialog)closeSettings();}
 function mount(){
  if(document.getElementById('privacy-settings'))return;
  notice=element('p','','privacy-notice');notice.id='privacy-notice';notice.hidden=true;notice.setAttribute('role','status');notice.setAttribute('aria-live','polite');document.body.append(notice);
  banner=element('section',undefined,'privacy-banner');banner.id='privacy-banner';banner.setAttribute('aria-labelledby','privacy-banner-title');banner.hidden=!!decision;
  const copy=element('div',undefined,'privacy-banner-copy');copy.append(element('p','IHRE AUSWAHL. IHRE ENTSCHEIDUNG.','privacy-eyebrow'));
  const heading=element('h2','So speichern wir Ihre Auswahl.');heading.id='privacy-banner-title';copy.append(heading,element('p','Notwendige Speicherfunktionen halten Ihre Auswahl für diese Sitzung bereit. Auf Wunsch merken wir sie auch für spätere Besuche. Wir setzen keine Analyse- oder Marketing-Cookies ein.'));
  const links=element('p',undefined,'privacy-links');links.append(legalLink('Datenschutz','datenschutz'),legalLink('Speicher & Cookies','cookies'));copy.append(links);
  const actions=element('div',undefined,'privacy-banner-actions');actions.append(button('Nur notwendige',()=>apply(false)),button('Auswahl merken',()=>apply(true)),button('Einstellungen',event=>openSettings(event.currentTarget),'privacy-text-button'));banner.append(copy,actions);document.body.append(banner);
  dialog=element('dialog',undefined,'privacy-dialog');dialog.id='privacy-settings';dialog.setAttribute('aria-labelledby','privacy-settings-title');dialog.setAttribute('aria-describedby','privacy-settings-intro');
  const close=button('×',closeSettings,'privacy-close');close.setAttribute('aria-label','Datenschutzeinstellungen schließen');dialog.append(close,element('p','CHEVALIER & ROTH','privacy-eyebrow'));
  const title=element('h2','Ihre Datenschutzeinstellungen.');title.id='privacy-settings-title';dialog.append(title);
  const intro=element('p','Hier entscheiden Sie, ob Ihre Produktauswahl über die aktuelle Sitzung hinaus gespeichert wird. Ihre Entscheidung können Sie jederzeit über den Footer ändern.');intro.id='privacy-settings-intro';dialog.append(intro);
  const necessary=element('div',undefined,'privacy-category');const necessaryTitle=element('div',undefined,'privacy-category-title');necessaryTitle.append(element('h3','Notwendige Funktionen'),element('span','Immer aktiv','privacy-badge'));necessary.append(necessaryTitle,element('p','Sitzungsauswahl, Sicherheitsfunktionen und die Speicherung dieser Entscheidung. Appwrite-Anmeldung und Stripe-Test-Checkout verwenden erforderliche Speicherfunktionen, wenn Sie diese Funktionen aufrufen.'));
  const optional=element('div',undefined,'privacy-category');const label=element('label',undefined,'privacy-check-label');const checkbox=element('input');checkbox.type='checkbox';checkbox.name='persist-selection';checkbox.id='privacy-persist-selection';label.htmlFor=checkbox.id;label.append(element('span','Auswahl für spätere Besuche merken'),checkbox);optional.append(label,element('p','Optional: Ihre gewählten Produkte, Farben, Größen und Stückzahlen bleiben im lokalen Browserspeicher, bis Sie die Auswahl entfernen, diese Option widerrufen oder Websitedaten löschen. Ohne diese Freigabe bleibt die Auswahl in der aktuellen Sitzung verfügbar.'));
  const detail=element('p',undefined,'privacy-detail');detail.append(document.createTextNode('Keine Analyse- oder Marketing-Werkzeuge aktiv. Details zu Anbietern, Speicherzwecken und Ihren Rechten finden Sie in den '),legalLink('Datenschutzhinweisen','datenschutz'),document.createTextNode(' und den '),legalLink('Speicher- und Cookie-Hinweisen','cookies'),document.createTextNode('.'));
  const message=element('p','','privacy-settings-message');message.setAttribute('role','status');message.setAttribute('aria-live','polite');
  const footer=element('div',undefined,'privacy-settings-actions');footer.append(button('Nur notwendige',()=>apply(false,true)),button('Auswahl speichern',()=>apply(checkbox.checked,true)));
  dialog.append(necessary,optional,detail,message,footer);dialog.addEventListener('cancel',event=>{event.preventDefault();closeSettings();});document.body.append(dialog);
  document.addEventListener('click',event=>{const source=event.target.closest?.('[data-cookie-settings]');if(source){event.preventDefault();openSettings(source);}});
 }
 window.CRPrivacy=Object.freeze({selectionStorage,openSettings,getPreferences:preferences});
 addEventListener('storage',event=>{
  if(event.key!==RECORD)return;
  const next=valid(event.newValue);const previous=persist;decision=next;recordStore=next?'local':'memory';persist=next?.persistSelection===true;
  if(previous&&!persist){for(const key of KEYS){const value=memory.local.get(key);if(value!==undefined)write('session',key,value);}}
  if(banner)banner.hidden=!!decision;window.dispatchEvent(new CustomEvent('cr:privacychange',{detail:preferences()}));
 });
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
