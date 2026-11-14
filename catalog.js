'use strict';
window.CR_COLORS = Object.freeze([
 Object.freeze({id:'bordeaux',name:'Bordeaux',swatch:'#651c30',aliases:'bordeaux bordo rot'}),
 Object.freeze({id:'black',name:'Schwarz',swatch:'#1d1e20',aliases:'schwarz black'}),
 Object.freeze({id:'gray',name:'Grau',swatch:'#858588',aliases:'grau gray grey'}),
 Object.freeze({id:'beige',name:'Beige',swatch:'#d2be9e',aliases:'beige sand'}),
 Object.freeze({id:'navy',name:'Navyblau',swatch:'#182b45',aliases:'navy navyblau blau blue'})
]);
window.CRPhotos = (()=>{
 const available=new Set(['body:bordeaux','body:beige','halfzip:bordeaux','halfzip:black','halfzip:gray','halfzip:beige','trousers:bordeaux','trousers:black','trousers:gray','trousers:beige']);
 const placeholder='assets/studio-photo-pending.svg';
 function variant(product,color){
  const prefix=product==='trousers'?'hose':product;
  const original=product==='halfzip'&&color.id==='bordeaux'?'halfzip_weisser_studiohintergrund.png':prefix+'_'+(color.id==='bordeaux'?'mannequin':color.id)+'_studio.png';
  const known=available.has(product+':'+color.id);
  const sources=Object.freeze([...(known?['assets/gallery/'+product+'-'+color.id+'-studio.webp']:[]),original,placeholder]);
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
 {id:'body',name:'Le Body',type:'Body à col V',category:'Body',description:'Ein tiefer V-Ausschnitt, lange Ärmel und eine körpernahe Silhouette. Fünf Farbwelten treffen auf goldene Akzente.'},
 {id:'halfzip',name:'Le Half-Zip',type:'Half-Zip Signature',category:'Half-Zip',description:'Ein markanter Stehkragen, ein goldener Reißverschluss und eine ruhige Silhouette. Der Half-Zip in fünf Farbwelten.'},
 {id:'trousers',name:'Le Pantalon',type:'Pantalon à jambe large',category:'Hose',description:'Weite Beine, ein fließender Fall und goldene Kordelenden. Eine klare Silhouette in fünf Farbwelten.'}
].map(product=>Object.freeze({...product,color:'Bordeaux',image:window.CRPhotos.variant(product.id,window.CR_COLORS[0]).image,variants:Object.freeze(Object.fromEntries(window.CR_COLORS.map(color=>[color.id,window.CRPhotos.variant(product.id,color)])))})));
