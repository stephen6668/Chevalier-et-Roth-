'use strict';
(() => {
 const requested=new URL(location.href).searchParams.get('product')||'halfzip';
 const product=window.CR_PRODUCTS?.find(item=>item.id===requested);
 const specs=window.CR_PRODUCT_SPECS?.[requested],container=document.querySelector('.pdp-details');
 if(!product||!specs||!container)return;
 const words={
  de:{material:'Material & Pflege',measurements:'Größentabelle',composition:'Stoffzusammensetzung',care:'Pflegehinweise',compositionPending:'Die Herstellerangabe zur Zusammensetzung ist noch nicht bestätigt.',carePending:'Die verbindlichen Pflegehinweise des Herstellers stehen noch aus.',sizes:'Verfügbare Größen',size:'Größe',measure:'Maß',sizeTitle:'Ihre Größentabelle.',sizeIntro:'Vergleichen Sie die Maße für S, M und L. Ihre aktuelle Auswahl bleibt beim Wechsel der Farbe erhalten.',measurementsPending:'Die Maße sind noch nicht hinterlegt. Eine Größenauswahl ist bereits möglich.',valuePending:'Noch nicht bestätigt',tableCaption:'Größentabelle',unit:'Maße in',note:'Hinweis zu den Maßen'},
  en:{material:'Fabric & care',measurements:'Size chart',composition:'Fabric composition',care:'Care instructions',compositionPending:'The manufacturer’s composition information has not yet been confirmed.',carePending:'Confirmed care instructions from the manufacturer are still pending.',sizes:'Available sizes',size:'Size',measure:'Measurement',sizeTitle:'Your size chart.',sizeIntro:'Compare the measurements for S, M and L. Your current selection is kept when you change colour.',measurementsPending:'Measurements have not been added yet. You can already choose a size.',valuePending:'Not yet confirmed',tableCaption:'Size chart',unit:'Measurements in',note:'Measurement note'},
  fr:{material:'Matières et entretien',measurements:'Guide des tailles',composition:'Composition du tissu',care:'Conseils d’entretien',compositionPending:'La composition indiquée par le fabricant n’a pas encore été confirmée.',carePending:'Les conseils d’entretien définitifs du fabricant restent à confirmer.',sizes:'Tailles proposées',size:'Taille',measure:'Mesure',sizeTitle:'Votre guide des tailles.',sizeIntro:'Comparez les mesures pour S, M et L. Votre sélection est conservée lorsque vous changez de couleur.',measurementsPending:'Les mesures n’ont pas encore été ajoutées. Vous pouvez déjà choisir une taille.',valuePending:'À confirmer',tableCaption:'Guide des tailles',unit:'Mesures en',note:'Note sur les mesures'}
 };
 let language='de';
 const localized=value=>typeof value==='string'?value:(value&&typeof value==='object'?String(value[language]||value.de||value.en||''):'');
 const make=(tag,text,className)=>{const element=document.createElement(tag);if(text!==undefined)element.textContent=String(text);if(className)element.className=className;return element;};
 const ignore=element=>{element.dataset.i18nIgnore='';return element;};
 const allowedSizes=window.CR_SIZES||['S','M','L'];
 const sizes=Array.isArray(specs.sizes)?allowedSizes.filter(size=>specs.sizes.includes(size)):allowedSizes;
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
 function measurementData(){
  const data=specs.measurements;
  return {
   data,
   columns:Array.isArray(data?.columns)?data.columns.filter(column=>column&&typeof column.key==='string'&&localized(column.label)):[],
   rows:Array.isArray(data?.rows)?data.rows.filter(row=>row&&sizes.includes(row.size)):[]
  };
 }
 function measurementValue(value){
  if(typeof value==='number'&&Number.isFinite(value)&&value>=0)return new Intl.NumberFormat(language,{maximumFractionDigits:2}).format(value);
  if(typeof value==='string'&&value.trim())return value;
  return null;
 }
 function measurementContent(words){
  const block=make('div',undefined,'cr-spec-measurements');
  const {data,columns,rows}=measurementData();
  if(!columns.length||!rows.length){block.append(sizeList(words),make('p',words.measurementsPending,'cr-spec-pending'));return block;}
  const scroll=make('div',undefined,'cr-spec-table-wrap'),table=make('table',undefined,'cr-spec-table');
  const unit=localized(specs.measurementUnit),captionText=localized(data.title)||product.name+' · '+words.tableCaption;
  const caption=make('caption',captionText+(unit?' ('+unit+')':''));table.append(caption);
  const head=make('thead'),headRow=make('tr'),measureHead=make('th',words.measure);measureHead.scope='col';headRow.append(measureHead);
  sizes.forEach(size=>{const cell=make('th',size);cell.scope='col';headRow.append(cell);});head.append(headRow);table.append(head);
  const body=make('tbody');
  columns.forEach(column=>{
   const tr=make('tr'),heading=make('th',localized(column.label));heading.scope='row';tr.append(heading);
   sizes.forEach(size=>{const row=rows.find(item=>item.size===size),value=measurementValue(row?.values?.[column.key]);tr.append(make('td',value===null?words.valuePending:value,value===null?'cr-spec-unconfirmed':''));});body.append(tr);
  });table.append(body);scroll.append(table);block.append(scroll);
  const notes=[localized(data.note),...(Array.isArray(data.notes)?data.notes.map(localized):[])].filter(Boolean);
  notes.forEach(note=>block.append(make('p',note,'cr-spec-measure-note')));
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
  const currentMeasurements=measurementData(),hasMeasurements=currentMeasurements.columns.length>0&&currentMeasurements.rows.length>0;
  for(const section of [material,measurements]){section.open=opened.get(section.dataset.productSpecSection)??(section===measurements&&hasMeasurements);container.append(section);}
  const dialog=document.getElementById('pdp-size-dialog');if(!dialog)return;
  const title=document.getElementById('pdp-size-title');if(title){ignore(title);title.textContent=text.sizeTitle;}
  [...dialog.children].filter(element=>element.matches('p:not(.eyebrow),[data-product-size-content]')).forEach(element=>element.remove());
  const contentBlock=ignore(make('div',undefined,'cr-size-content'));contentBlock.dataset.productSizeContent='';contentBlock.append(make('p',text.sizeIntro,'cr-size-intro'),measurementContent(text));dialog.append(contentBlock);
 }
 render();addEventListener('cr:languagechange',render);
})();
