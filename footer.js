'use strict';
(() => {
 const config=window.CRLegalConfig||{},site=window.CRSiteConfig||{};
 const make=(tag,text,className)=>{const element=document.createElement(tag);if(text!==undefined)element.textContent=String(text);if(className)element.className=className;return element;};
 const link=(text,href,className)=>{const element=make('a',text,className);element.href=href;return element;};
 function navigation(title,entries){
  const nav=make('nav',undefined,'cr-footer-nav');nav.setAttribute('aria-label',title+' im Footer');
  nav.append(make('h2',title,'cr-footer-heading'));const list=make('ul');
  entries.forEach(([text,href])=>{const item=make('li');item.append(link(text,href));list.append(item);});nav.append(list);return nav;
 }
 function socialLink(label,value,fallback){
  let url;try{url=new URL(value||fallback);}catch{url=new URL(fallback);}
  if(url.protocol!=='https:')url=new URL(fallback);
  const element=link(label,url.href);element.target='_blank';element.rel='noopener noreferrer';
  element.setAttribute('aria-label',label+' – externe Website, öffnet in einem neuen Tab');return element;
 }
 function render(footer){
  if(footer.dataset.footerReady==='true')return;
  footer.dataset.footerReady='true';footer.classList.add('cr-footer');
  if(footer.tagName!=='FOOTER')footer.setAttribute('role','contentinfo');
  footer.setAttribute('aria-label','Chevalier & Roth – Service und Rechtliches');
  const grid=make('div',undefined,'cr-footer-grid'),identity=make('div',undefined,'cr-footer-identity');
  const brand=link('','./','cr-footer-brand');brand.setAttribute('aria-label','Chevalier & Roth – Startseite');
  const monogram=make('img');monogram.src='assets/brand-monogram.webp';monogram.width=46;monogram.height=58;monogram.loading='lazy';monogram.alt='';
  const lockup=make('span','CHEVALIER & ROTH','cr-footer-wordmark');lockup.append(make('small','EST. 2024','cr-footer-established'));brand.append(monogram,lockup);
  identity.append(brand,make('p','Une allure. Une signature.','cr-footer-motto'),make('p','Zeitlose Linien. Fünf Farbwelten.','cr-footer-description'));
  const company=make('div',undefined,'cr-footer-company');company.append(make('p',config.operatorName||'Chevalier & Roth'),make('p',config.country||'Luxemburg'));
  const phone=typeof config.phone==='string'?config.phone.trim():'';
  if(/^\+?[0-9 ()-]{6,30}$/.test(phone))company.append(link(config.phoneDisplay||phone,'tel:'+phone.replace(/[^+0-9]/g,''),'cr-footer-phone'));
  if(typeof config.email==='string'&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(config.email))company.append(link(config.email,'mailto:'+config.email,'cr-footer-email'));
  identity.append(company);
  const social=make('nav',undefined,'cr-footer-social');social.setAttribute('aria-label','Chevalier & Roth auf Social Media');social.append(socialLink('Instagram',site.instagramUrl,'https://www.instagram.com/chevalierandroth/'),socialLink('TikTok',site.tiktokUrl,'https://www.tiktok.com/@chevalierandroth'));identity.append(social);
  grid.append(identity,navigation('Die Kollektion',[
   ['Alle Stücke','./#collection'],['Le Body','product.html?product=body'],['Le Half-Zip','product.html?product=halfzip'],['Le Pantalon','product.html?product=trousers']
  ]),navigation('Service',[
   ['Auf die Warteliste','./#waitlist'],['Kontakt','legal.html?page=impressum'],['Versand & Rückgabe','legal.html?page=versand'],['Barrierefreiheit','legal.html?page=barrierefreiheit'],['Teilnahmebedingungen','legal.html?page=giveaway']
  ]),navigation('Rechtliches',[
   ['Impressum','legal.html?page=impressum'],['Datenschutz','legal.html?page=datenschutz'],['Cookies & Speicher','legal.html?page=cookies'],['AGB / Nutzung','legal.html?page=agb'],['Widerruf','legal.html?page=widerruf']
  ]));
  const bottom=make('div',undefined,'cr-footer-bottom'),copyright=make('p','© '+new Date().getFullYear()+' Chevalier & Roth','cr-footer-copyright');
  const status=make('p','Kollektionsvorschau · Stripe-Testmodus','cr-footer-status');
  const preferences=make('button','Cookie-Einstellungen','cr-footer-preferences');preferences.type='button';preferences.dataset.cookieSettings='';
  bottom.append(copyright,status,preferences);footer.replaceChildren(grid,bottom);
 }
 function init(){document.querySelectorAll('[data-shared-footer]').forEach(render);}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
