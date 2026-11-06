'use strict';
// Original uploads are root files so these URLs work on both GitHub Pages
// and the hosted Worker. A photograph never falls back to a rendered garment.
const crStudioPrefixes=Object.freeze({body:'body',halfzip:'halfzip',trousers:'hose'});
const crStudioAvailable=new Set(['body:bordeaux','body:beige','halfzip:bordeaux','halfzip:black','halfzip:gray','halfzip:beige','trousers:bordeaux','trousers:black','trousers:gray','trousers:beige']);
const crStudioPlaceholder='assets/studio-photo-pending.svg';
window.CR_PRODUCT_GALLERIES=Object.freeze(Object.fromEntries(window.CR_PRODUCTS.map(product=>[
 product.id,Object.freeze(Object.fromEntries(window.CR_COLORS.map(color=>{
  const sourceFile=product.id==='halfzip'&&color.id==='bordeaux'?'halfzip_weisser_studiohintergrund.png':`${crStudioPrefixes[product.id]}_${color.id==='bordeaux'?'mannequin':color.id}_studio.png`;
  const known=crStudioAvailable.has(product.id+':'+color.id),alt=`${product.name} in ${color.name} – Studioansicht`,pendingAlt=`${product.name} in ${color.name} – Studiofoto folgt`;
  return [color.id,Object.freeze([Object.freeze({src:sourceFile,sourceFile,alt,label:'Studioansicht',
   fallbackSrc:known?`assets/gallery/${product.id}-${color.id}-studio.webp`:crStudioPlaceholder,
   fallbackAlt:known?alt:pendingAlt,fallbackLabel:known?'Studioansicht':'Studiofoto folgt',
   placeholderSrc:crStudioPlaceholder,placeholderAlt:pendingAlt,placeholderLabel:'Studiofoto folgt'
  })])];
 })))
])));
