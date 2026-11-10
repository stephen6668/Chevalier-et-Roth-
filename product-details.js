'use strict';
(() => {
 const requested=new URL(location.href).searchParams.get('product')||'halfzip';
 const product=window.CR_PRODUCTS?.find(item=>item.id===requested);
 const specs=window.CR_PRODUCT_SPECS?.[requested],container=document.querySelector('.pdp-details');
 if(!product||!specs||!container)return;
 const words={
  de:{material:'Material & Pflege',measurements:'Maße & Größen',composition:'Stoffzusammensetzung',care:'Pflegehinweise',compositionPending:'Die Herstellerangabe zur Zusammensetzung ist noch nicht bestätigt.',carePending:'Die verbindlichen Pflegehinweise des Herstellers stehen noch aus.',sizes:'Verfügbare Größen',size:'Größe',sizeTitle:'Ihre Größe.',sizeIntro:'Wählen Sie Ihre Größe auf der Produktseite. Die aktuelle Auswahl bleibt bei der Farbauswahl erhalten.',measurementsPending:'Die verbindlichen Produktmaße sind noch nicht bestätigt. Eine Größenauswahl ist bereits möglich.',valuePending:'Noch nicht bestätigt',tableCaption:'Produktmaße',unit:'Maße in',note:'Hinweis zu den Maßen'},
  en:{material:'Fabric & care',measurements:'Measurements & sizes',composition:'Fabric composition',care:'Care instructions',compositionPending:'The manufacturer’s composition information has not yet been confirmed.',carePending:'Confirmed care instructions from the manufacturer are still pending.',sizes:'Available sizes',size:'Size',sizeTitle:'Your size.',sizeIntro:'Choose your size on the product page. Your current selection is kept when you change colour.',measurementsPending:'Confirmed garment measurements are not yet available. You can already choose a size.',valuePending:'Not yet confirmed',tableCaption:'Garment measurements',unit:'Measurements in',note:'Measurement note'},
  fr:{material:'Matières et entretien',measurements:'Mesures et tailles',composition:'Composition du tissu',care:'Conseils d’entretien',compositionPending:'La composition indiquée par le fabricant n’a pas encore été confirmée.',carePending:'Les conseils d’entretien définitifs du fabricant restent à confirmer.',sizes:'Tailles proposées',size:'Taille',sizeTitle:'Votre taille.',sizeIntro:'Choisissez votre taille sur la page du produit. Votre sélection est conservée lorsque vous changez de couleur.',measurementsPending:'Les mesures définitives du vêtement ne sont pas encore confirmées. Vous pouvez déjà choisir une taille.',valuePending:'À confirmer',tableCaption:'Mesures du vêtement',unit:'Mesures en',note:'Note sur les mesures'}
 };
 let language='de';
 const localized=value=>typeof value==='string'?value:(value&&typeof value==='object'?String(value[language]||value.de||value.en||''):'');
 const make=(tag,text,className)=>{const element=document.createElement(tag);if(text!==undefined)element.textContent=String(text);if(className)element.className=className;return element;};
 const ignore=element=>{element.dataset.i18nIgnore='';return element;};
 const sizes=Array.isArray(specs.sizes)?specs.sizes.filter(size=>['S','M','L','XL'].includes(size)):['S','M','L','XL'];
 const originalMaterial=[...container.children].filter(element=>element.tagName==='DETAILS')[2];
 if(originalMaterial)originalMaterial.remove();
 const firstDetails=container.querySelector('details');
 const facts=ignore(make('dl',undefined,'cr-product-facts'));facts.id='cr-product-facts';firstDetails?.append(facts);
 function composition(){
  if(typeof specs.composition==='string'||(specs.composition&&!Array.isArray(specs.composition)))return localized(specs.composition);
  if(!Array.isArray(specs.composition)||!specs.composition.length)return '';
  const valid=specs.composition.every(item=>item&&typeof item.percentage==='number'&&Number.isFinite(item.percentage)&&item.percentage>0&&item.percentage<=100&&localized(item.fiber));
  if(!valid||Math.abs(specs.composition.reduce((sum,item)=>sum+item.percentage,0)-100)>.01)return '';
  return specs.composition.map(item=>new Intl.NumberFormat(language,{maximumFractionDigits:2}).format(item.percentage)+' % '+localized(item.fiber)).join(' · ');
 }
 function disclosure(id,title){
  const details=ignore(make('details',undefined,'cr-spec-section'));details.dataset.productSpecSection=id;
  const summary=make('summary',title),plus=make('span','+');plus.setAttribute('aria-hidden','true');summary.append(plus);details.append(summary);return details;
 }
 function sizeList(words){
  const block=make('div',undefined,'cr-spec-sizes'),label=make('p',words.sizes,'cr-spec-label'),list=make('ul');
  sizes.forEach(size=>list.append(make('li',size)));block.append(label,list);return block;
 }
 function measurementContent(words){
  const block=make('div',undefined,'cr-spec-measurements');block.append(sizeList(words));
  const data=specs.measurements;
  const columns=Array.isArray(data?.columns)?data.columns.filter(column=>column&&typeof column.key==='string'&&localized(column.label)):[];
  const rows=Array.isArray(data?.rows)?data.rows.filter(row=>row&&sizes.includes(row.size)):[];
  if(!columns.length||!rows.length){block.append(make('p',words.measurementsPending,'cr-spec-pending'));return block;}
  const scroll=make('div',undefined,'cr-spec-table-wrap'),table=make('table',undefined,'cr-spec-table');
  const caption=make('caption',product.name+' · '+words.tableCaption+' ('+(specs.measurementUnit||'cm')+')');table.append(caption);
  const head=make('thead'),headRow=make('tr'),sizeHead=make('th',words.size);sizeHead.scope='col';headRow.append(sizeHead);
  columns.forEach(column=>{const cell=make('th',localized(column.label));cell.scope='col';headRow.append(cell);});head.append(headRow);table.append(head);
  const body=make('tbody');
  sizes.forEach(size=>{
   const row=rows.find(item=>item.size===size),tr=make('tr'),heading=make('th',size);heading.scope='row';tr.append(heading);
   columns.forEach(column=>{const value=row?.values?.[column.key],confirmed=typeof value==='number'&&Number.isFinite(value)&&value>0;tr.append(make('td',confirmed?new Intl.NumberFormat(language,{maximumFractionDigits:1}).format(value):words.valuePending,confirmed?'':'cr-spec-unconfirmed'));});body.append(tr);
  });table.append(body);scroll.append(table);block.append(scroll);
  const note=localized(data.note);if(note)block.append(make('p',note,'cr-spec-measure-note'));
  return block;
 }
 function render(){
  language=window.CRI18N?.getLanguage()||document.documentElement.lang||'de';if(!words[language])language='de';const text=words[language];
  facts.replaceChildren();
  for(const feature of specs.features||[]){const title=localized(feature.label),value=localized(feature.value);if(title&&value)facts.append(make('dt',title),make('dd',value));}
  const existing=[...container.querySelectorAll('[data-product-spec-section]')],opened=new Map(existing.map(element=>[element.dataset.productSpecSection,element.open]));existing.forEach(element=>element.remove());
  const material=disclosure('material',text.material),definitions=make('dl',undefined,'cr-spec-definitions');
  const content=composition(),care=Array.isArray(specs.care)?specs.care.map(localized).filter(Boolean):[];
  definitions.append(make('dt',text.composition),make('dd',content||text.compositionPending,content?'':'cr-spec-pending'),make('dt',text.care));
  const careCell=make('dd');if(care.length){const list=make('ul',undefined,'cr-spec-care');care.forEach(item=>list.append(make('li',item)));careCell.append(list);}else careCell.append(make('p',text.carePending,'cr-spec-pending'));definitions.append(careCell);material.append(definitions);
  const measurements=disclosure('measurements',text.measurements);measurements.append(measurementContent(text));
  for(const section of [material,measurements]){section.open=opened.get(section.dataset.productSpecSection)||false;container.append(section);}
  const dialog=document.getElementById('pdp-size-dialog');if(!dialog)return;
  const title=document.getElementById('pdp-size-title');if(title){ignore(title);title.textContent=text.sizeTitle;}
  [...dialog.children].filter(element=>element.matches('p:not(.eyebrow),[data-product-size-content]')).forEach(element=>element.remove());
  const contentBlock=ignore(make('div',undefined,'cr-size-content'));contentBlock.dataset.productSizeContent='';contentBlock.append(make('p',text.sizeIntro,'cr-size-intro'),measurementContent(text));dialog.append(contentBlock);
 }
 render();addEventListener('cr:languagechange',render);
})();
