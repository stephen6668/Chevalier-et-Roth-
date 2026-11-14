'use strict';
window.CR_SIZES = Object.freeze(['S','M','L']);
window.CR_COLORS = Object.freeze([
 Object.freeze({id:'beige',name:'Beige',swatch:'#d2be9e',aliases:'beige sand'}),
 Object.freeze({id:'navy',name:'Navyblau',swatch:'#182b45',aliases:'navy navyblau marineblau blau blue'}),
 Object.freeze({id:'bordeaux',name:'Bordeaux',swatch:'#762e3b',aliases:'bordeaux bordo rot burgunder red'})
]);
window.CRPhotos = (()=>{
 const available=new Set(['body:bordeaux','body:beige','halfzip:bordeaux','halfzip:beige','trousers:bordeaux','trousers:beige','trousers:navy','trousers-men:bordeaux','trousers-men:beige']);
 const placeholder='assets/studio-photo-pending.svg';
 function variant(product,color){
  const known=available.has(product+':'+color.id),pants=product.startsWith('trousers');
  const photo='assets/gallery/'+product+'-'+color.id+'-studio.webp?v=range-20261114';
  const original=product==='halfzip'&&color.id==='bordeaux'?'halfzip_weisser_studiohintergrund.png':product+'_'+(color.id==='bordeaux'?'mannequin':color.id)+'_studio.png';
  // New trouser photos never fall back to the superseded drawstring model.
  const sources=Object.freeze([...(known?[photo]:[]),...(!pants?[original]:[]),placeholder]);
  return Object.freeze({...color,image:sources[0],photoSources:sources,photoAvailable:known});
 }
 function apply(image,variant,alt=''){
  const sources=variant.photoSources||[variant.image,placeholder];let index=0;
  image.alt=alt;
  image.onerror=()=>{if(index+1<sources.length){index++;image.src=sources[index];}else image.onerror=null;};
  image.src=sources[0];
 }
 return Object.freeze({variant,apply,placeholder});
})();
window.CR_PRODUCTS = Object.freeze([
 {id:'body',name:'Le Body',type:'Body à col V',category:'Body',description:'Ein tiefer V-Ausschnitt, lange Ärmel und eine körpernahe Silhouette. In Beige, Navyblau und Bordeaux.'},
 {id:'halfzip',name:'Le Half-Zip',type:'Half-Zip Signature',category:'Half-Zip',description:'Ein markanter Stehkragen, ein goldfarbener Reißverschluss und eine ruhige Silhouette. In Beige, Navyblau und Bordeaux.'},
 {id:'trousers',name:'Le Pantalon Femme',type:'Damen · Weites Bein',category:'Damenhose',gender:'Damen',description:'Palazzohose für Damen mit weitem Bein, Bundfalten, goldfarbenem Knopf und CR-Monogramm. In Beige, Navyblau und Bordeaux.'},
 {id:'trousers-men',name:'Le Pantalon Homme',type:'Herren · Gerades Bein',category:'Herrenhose',gender:'Herren',description:'Hose für Herren mit geradem, schmalerem Bein, Bundfalten, goldfarbenem Knopf und CR-Monogramm. In Beige, Navyblau und Bordeaux.'}
].map(product=>{
 const variants=Object.freeze(Object.fromEntries(window.CR_COLORS.map(color=>[color.id,window.CRPhotos.variant(product.id,color)])));
 const defaultColor=product.id.startsWith('trousers')?'beige':'bordeaux';
 return Object.freeze({...product,defaultColor,color:variants[defaultColor].name,image:variants[defaultColor].image,variants});
}));
